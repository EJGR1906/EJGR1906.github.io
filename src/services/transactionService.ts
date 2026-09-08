import {
  createTransaction,
  getTransactionById,
  updateTransaction,
} from "../repositories/transactionRepository";
import { getAccountById } from "../repositories/accountRepository";
import { getAccountBalance } from "./financialService";

import {
  generateId,
} from "../utils/id";

import {
  nowISO,
} from "../utils/date";

import type {
  CurrencyCode,
  Transaction,
} from "../database/db";

import {
  getAccountAvailability,
  validateGoalContribution,
  validateGoalWithdrawal,
} from "./goalService";

export interface CreateIncomeInput {
  accountId: string;
  categoryId: string;
  amount: number;
  currency: CurrencyCode;
  description?: string;
  date: string;
}

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  fromAmount: number;
  fromCurrency: CurrencyCode;
  toAmount: number;
  toCurrency: CurrencyCode;
  exchangeRate?: number;
  description?: string;
  date: string;
}

function createBaseTransaction(
  transaction: Omit<Transaction, "id" | "createdAt">
) {
  return createTransaction({
    ...transaction,
    id: generateId("transaction"),
    createdAt: nowISO(),
  });
}

async function validateAccountTransaction(
  accountId: string,
  currency: CurrencyCode,
  amount: number,
  requireAvailableBalance: boolean,
  excludedTransactionId?: string,
): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto debe ser mayor que cero.");
  }

  const account = await getAccountById(accountId);
  if (!account?.active) throw new Error("La cuenta no existe o está inactiva.");
  if (account.currency !== currency) throw new Error("La moneda no coincide con la cuenta.");

  if (requireAvailableBalance) {
    const availability = await getAccountAvailability(account, excludedTransactionId);
    if (amount > availability.availableBalance) {
      throw new Error("El gasto supera el saldo disponible de la cuenta.");
    }
  }
}

export interface CreateExpenseInput {
  accountId: string;
  categoryId: string;
  amount: number;
  currency: CurrencyCode;
  description?: string;
  date: string;
}

export async function createExpense(
  input: CreateExpenseInput
) {
  await validateAccountTransaction(input.accountId, input.currency, input.amount, true);

  return createBaseTransaction({
    type: "expense",

    amount: input.amount,

    currency: input.currency,

    accountId: input.accountId,

    categoryId: input.categoryId,

    description: input.description,

    date: input.date,

  });
}

export async function createIncome(input: CreateIncomeInput) {
  await validateAccountTransaction(input.accountId, input.currency, input.amount, false);

  return createBaseTransaction({
    type: "income",
    amount: input.amount,
    currency: input.currency,
    accountId: input.accountId,
    categoryId: input.categoryId,
    description: input.description,
    date: input.date,
  });
}

export async function createTransfer(input: CreateTransferInput) {
  if (!Number.isFinite(input.fromAmount) || input.fromAmount <= 0 || !Number.isFinite(input.toAmount) || input.toAmount <= 0) {
    throw new Error("Los montos de la transferencia deben ser mayores que cero.");
  }

  const fromAccount = await getAccountById(input.fromAccountId);
  const toAccount = await getAccountById(input.toAccountId);
  if (!fromAccount?.active || !toAccount?.active) throw new Error("Las cuentas deben existir y estar activas.");
  if (fromAccount.currency !== input.fromCurrency || toAccount.currency !== input.toCurrency) {
    throw new Error("Las monedas no coinciden con las cuentas seleccionadas.");
  }
  const availability = await getAccountAvailability(fromAccount);
  if (input.fromAmount > availability.availableBalance) {
    throw new Error("La transferencia supera el saldo disponible de la cuenta origen.");
  }

  return createBaseTransaction({
    type: "transfer",
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    fromAmount: input.fromAmount,
    fromCurrency: input.fromCurrency,
    toAmount: input.toAmount,
    toCurrency: input.toCurrency,
    exchangeRate: input.exchangeRate,
    description: input.description,
    date: input.date,
  });
}

export interface GoalTransactionInput {
  goalId: string;
  accountId: string;
  amount: number;
  currency: CurrencyCode;
  description?: string;
  date: string;
}

export async function createGoalContribution(input: GoalTransactionInput) {
  await validateGoalContribution(input.goalId, input.accountId, input.amount, input.currency);

  return createBaseTransaction({
    type: "goal_contribution",
    amount: input.amount,
    currency: input.currency,
    accountId: input.accountId,
    goalId: input.goalId,
    description: input.description,
    date: input.date,
  });
}

export async function createGoalWithdrawal(input: GoalTransactionInput) {
  await validateGoalWithdrawal(input.goalId, input.accountId, input.amount, input.currency);

  return createBaseTransaction({
    type: "goal_withdrawal",
    amount: input.amount,
    currency: input.currency,
    accountId: input.accountId,
    goalId: input.goalId,
    description: input.description,
    date: input.date,
  });
}

export async function adjustAccountBalance(
  accountId: string,
  targetBalance: number,
  date: string,
  description = "Ajuste manual de saldo"
): Promise<void> {
  if (!Number.isFinite(targetBalance) || targetBalance < 0) {
    throw new Error("El saldo debe ser un número mayor o igual a cero.");
  }

  const account = await getAccountById(accountId);
  if (!account) throw new Error("La cuenta no existe.");

  const currentBalance = await getAccountBalance(account);
  const difference = targetBalance - currentBalance;
  if (Math.abs(difference) < 0.00000001) return;

  await createBaseTransaction({
    type: difference > 0 ? "income" : "expense",
    amount: Math.abs(difference),
    currency: account.currency,
    accountId,
    description,
    date,
  });
}

export type UpdateTransactionInput =
  | ({ type: "income" } & CreateIncomeInput)
  | ({ type: "expense" } & CreateExpenseInput)
  | ({ type: "transfer" } & CreateTransferInput);

export async function editTransaction(id: string, input: UpdateTransactionInput): Promise<void> {
  const existing = await getTransactionById(id);
  if (!existing) throw new Error("El movimiento no existe.");
  if (existing.type !== input.type) throw new Error("No se puede cambiar el tipo del movimiento.");

  if (input.type === "income") {
    await validateAccountTransaction(input.accountId, input.currency, input.amount, false, id);
    await updateTransaction(id, {
      amount: input.amount,
      currency: input.currency,
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      date: input.date,
    });
    return;
  }

  if (input.type === "expense") {
    await validateAccountTransaction(input.accountId, input.currency, input.amount, true, id);
    await updateTransaction(id, {
      amount: input.amount,
      currency: input.currency,
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      date: input.date,
    });
    return;
  }

  if (!Number.isFinite(input.fromAmount) || input.fromAmount <= 0 || !Number.isFinite(input.toAmount) || input.toAmount <= 0) {
    throw new Error("Los montos de la transferencia deben ser mayores que cero.");
  }

  const fromAccount = await getAccountById(input.fromAccountId);
  const toAccount = await getAccountById(input.toAccountId);
  if (!fromAccount?.active || !toAccount?.active) throw new Error("Las cuentas deben existir y estar activas.");
  if (fromAccount.currency !== input.fromCurrency || toAccount.currency !== input.toCurrency) {
    throw new Error("Las monedas no coinciden con las cuentas seleccionadas.");
  }
  const availability = await getAccountAvailability(fromAccount, id);
  if (input.fromAmount > availability.availableBalance) {
    throw new Error("La transferencia supera el saldo disponible de la cuenta origen.");
  }

  await updateTransaction(id, {
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    fromAmount: input.fromAmount,
    fromCurrency: input.fromCurrency,
    toAmount: input.toAmount,
    toCurrency: input.toCurrency,
    exchangeRate: input.exchangeRate,
    description: input.description,
    date: input.date,
  });
}