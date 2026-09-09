import Decimal from "decimal.js";
import type { Account, Transaction } from "../database/db";

export function calculateAccountBalance(
    account: Account,
    transactions: Transaction[],
    excludedTransactionId?: string,
): number {
    let balance = new Decimal(account.initialBalance);

    for (const transaction of transactions) {
        if (transaction.id === excludedTransactionId) continue;

        if (transaction.type === "income" && transaction.accountId === account.id && transaction.currency === account.currency) {
            balance = account.nature === "liability"
                ? balance.minus(transaction.amount ?? 0)
                : balance.plus(transaction.amount ?? 0);
        }

        if (transaction.type === "expense" && transaction.accountId === account.id && transaction.currency === account.currency) {
            balance = account.nature === "liability"
                ? balance.plus(transaction.amount ?? 0)
                : balance.minus(transaction.amount ?? 0);
        }

        if (transaction.type === "transfer" && transaction.fromAccountId === account.id) {
            balance = account.nature === "liability"
                ? balance.plus(transaction.fromAmount ?? 0)
                : balance.minus(transaction.fromAmount ?? 0);
        }

        if (transaction.type === "transfer" && transaction.toAccountId === account.id) {
            balance = account.nature === "liability"
                ? balance.minus(transaction.toAmount ?? 0)
                : balance.plus(transaction.toAmount ?? 0);
        }
    }

    return balance.toDecimalPlaces(8).toNumber();
}

export function calculateCommittedAmount(
    accountId: string,
    currency: Account["currency"],
    transactions: Transaction[],
    excludedTransactionId?: string,
): number {
    return transactions.reduce((total, transaction) => {
        if (transaction.id === excludedTransactionId) return total;
        if (transaction.accountId !== accountId || transaction.currency !== currency) return total;
        if (transaction.type === "goal_contribution") return total + (transaction.amount ?? 0);
        if (transaction.type === "goal_withdrawal") return total - (transaction.amount ?? 0);
        return total;
    }, 0);
}

export function calculateAvailableBalance(physicalBalance: number, committedAmount: number): number {
    return Math.max(physicalBalance - committedAmount, 0);
}