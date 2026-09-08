import { getAllGoals, getGoalById, createGoal as persistGoal, updateGoal } from "../repositories/goalRepository";
import { getAccountById } from "../repositories/accountRepository";
import { getAllTransactions } from "../repositories/transactionRepository";
import { getAccountBalance } from "./financialService";
import { generateId } from "../utils/id";
import type { Account, CurrencyCode, Goal } from "../database/db";

export interface GoalProgress {
    goal: Goal;
    savedAmount: number;
    remainingAmount: number;
    progressPercent: number;
    committedAmount: number;
    availableBalance: number;
}

export interface AccountAvailability {
    physicalBalance: number;
    committedAmount: number;
    availableBalance: number;
}

function assertPositiveAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("El monto debe ser mayor que cero.");
    }
}

async function getCommittedAmount(accountId: string, currency: CurrencyCode, excludedTransactionId?: string): Promise<number> {
    const transactions = await getAllTransactions();

    return transactions.reduce((total, transaction) => {
        if (transaction.id === excludedTransactionId) return total;
        if (transaction.accountId !== accountId || transaction.currency !== currency) {
            return total;
        }

        if (transaction.type === "goal_contribution") {
            return total + (transaction.amount ?? 0);
        }

        if (transaction.type === "goal_withdrawal") {
            return total - (transaction.amount ?? 0);
        }

        return total;
    }, 0);
}

export async function getAccountAvailability(account: Account, excludedTransactionId?: string): Promise<AccountAvailability> {
    const physicalBalance = await getAccountBalance(account, excludedTransactionId);
    const committedAmount = await getCommittedAmount(account.id, account.currency, excludedTransactionId);

    return {
        physicalBalance,
        committedAmount,
        availableBalance: Math.max(physicalBalance - committedAmount, 0),
    };
}

export async function createGoal(input: Omit<Goal, "id" | "createdAt" | "updatedAt">): Promise<Goal> {
    if (!input.name.trim()) throw new Error("El nombre de la meta es obligatorio.");
    if (!Number.isFinite(input.targetAmount) || input.targetAmount <= 0) {
        throw new Error("El objetivo debe ser mayor que cero.");
    }

    const account = await getAccountById(input.backingAccountId);
    if (!account?.active || account.currency !== input.currency) {
        throw new Error("La meta necesita una cuenta activa de la misma moneda.");
    }

    const now = new Date().toISOString();
    const goal: Goal = {
        ...input,
        id: generateId("goal"),
        name: input.name.trim(),
        createdAt: now,
        updatedAt: now,
    };

    await persistGoal(goal);
    return goal;
}

export async function validateGoalContribution(
    goalId: string,
    accountId: string,
    amount: number,
    currency: CurrencyCode,
): Promise<Goal> {
    assertPositiveAmount(amount);

    const goal = await getGoalById(goalId);
    const account = await getAccountById(accountId);
    if (!goal?.active || !account?.active) throw new Error("La meta y la cuenta deben estar activas.");
    if (goal.backingAccountId !== accountId || goal.currency !== currency || account.currency !== currency) {
        throw new Error("La cuenta, la meta y la moneda no son compatibles.");
    }

    const progress = await getGoalsWithProgress();
    const current = progress.find((item) => item.goal.id === goalId)?.savedAmount ?? 0;
    if (current + amount > goal.targetAmount) throw new Error("El aporte supera el objetivo de la meta.");

    const availability = await getAccountAvailability(account);
    if (amount > availability.availableBalance) throw new Error("El aporte supera el saldo disponible de la cuenta.");

    return goal;
}

export async function validateGoalWithdrawal(
    goalId: string,
    accountId: string,
    amount: number,
    currency: CurrencyCode,
): Promise<Goal> {
    assertPositiveAmount(amount);

    const goal = await getGoalById(goalId);
    const account = await getAccountById(accountId);
    if (!goal?.active || !account?.active) throw new Error("La meta y la cuenta deben estar activas.");
    if (goal.backingAccountId !== accountId || goal.currency !== currency || account.currency !== currency) {
        throw new Error("La cuenta, la meta y la moneda no son compatibles.");
    }

    const progress = await getGoalsWithProgress();
    const current = progress.find((item) => item.goal.id === goalId)?.savedAmount ?? 0;
    if (amount > current) throw new Error("El retiro supera el monto aportado a la meta.");

    return goal;
}

export async function getGoalsWithProgress(): Promise<GoalProgress[]> {
    const goals = await getAllGoals();
    const transactions = await getAllTransactions();

    return Promise.all(goals.map(async (goal) => {
        const contributions = transactions.filter(
            (transaction) =>
                transaction.goalId === goal.id &&
                (transaction.type === "goal_contribution" || transaction.type === "goal_withdrawal")
        );

        const savedAmount = contributions.reduce((sum, transaction) => {
            if (transaction.type === "goal_contribution") {
                return sum + (transaction.amount ?? 0);
            }

            return sum - (transaction.amount ?? 0);
        }, 0);

        const remainingAmount = Math.max(goal.targetAmount - savedAmount, 0);
        const progressPercent = goal.targetAmount > 0 ? Math.min((savedAmount / goal.targetAmount) * 100, 100) : 0;

        const account = await getAccountById(goal.backingAccountId);
        const availability = account
            ? await getAccountAvailability(account)
            : { physicalBalance: 0, committedAmount: 0, availableBalance: 0 };

        return {
            goal,
            savedAmount,
            remainingAmount,
            progressPercent,
            committedAmount: account ? availability.committedAmount : savedAmount,
            availableBalance: account ? availability.availableBalance : 0,
        };
    }));
}

export async function updateGoalProgress(id: string, delta: number): Promise<void> {
    const goal = await getGoalById(id);
    if (!goal) {
        throw new Error("Meta no encontrada.");
    }

    const nextTarget = Math.max(0, goal.targetAmount + delta);
    await updateGoal(id, { targetAmount: nextTarget, updatedAt: new Date().toISOString() });
}
