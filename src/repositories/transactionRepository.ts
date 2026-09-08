import { db } from "../database/db";
import type { Transaction } from "../database/db";

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions
    .orderBy("date")
    .reverse()
    .toArray();
}

export async function getTransactionById(
  id: string
): Promise<Transaction | undefined> {
  return db.transactions.get(id);
}

export async function getTransactionsByAccount(
  accountId: string
): Promise<Transaction[]> {
  const transactions = await db.transactions.toArray();

  return transactions.filter(
    (transaction) =>
      transaction.accountId === accountId ||
      transaction.fromAccountId === accountId ||
      transaction.toAccountId === accountId
  );
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  return db.transactions
    .where("date")
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function createTransaction(
  transaction: Transaction
): Promise<string> {
  return db.transactions.add(transaction);
}

export async function updateTransaction(
  id: string,
  changes: Partial<Transaction>
): Promise<void> {
  await db.transactions.update(id, changes);
}

export async function deleteTransaction(
  id: string
): Promise<void> {
  await db.transactions.delete(id);
}