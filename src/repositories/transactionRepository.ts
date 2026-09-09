import { db } from "../database/db";
import type { Transaction } from "../database/db";
import { isCloudPersistenceEnabled } from "../database/persistence";
import { createCloudTransaction, deleteCloudTransaction, getCloudTransaction, getCloudTransactions, updateCloudTransaction } from "./supabaseRepositories";

export async function getAllTransactions(): Promise<Transaction[]> {
  if (isCloudPersistenceEnabled()) return getCloudTransactions();
  return db.transactions
    .orderBy("date")
    .reverse()
    .toArray();
}

export async function getTransactionById(
  id: string
): Promise<Transaction | undefined> {
  if (isCloudPersistenceEnabled()) return getCloudTransaction(id);
  return db.transactions.get(id);
}

export async function getTransactionsByAccount(
  accountId: string
): Promise<Transaction[]> {
  if (isCloudPersistenceEnabled()) return (await getCloudTransactions()).filter((transaction) => transaction.accountId === accountId || transaction.fromAccountId === accountId || transaction.toAccountId === accountId);
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
  if (isCloudPersistenceEnabled()) return (await getCloudTransactions()).filter((transaction) => transaction.date >= startDate && transaction.date <= endDate);
  return db.transactions
    .where("date")
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function createTransaction(
  transaction: Transaction
): Promise<string> {
  if (isCloudPersistenceEnabled()) return createCloudTransaction(transaction);
  return db.transactions.add(transaction);
}

export async function updateTransaction(
  id: string,
  changes: Partial<Transaction>
): Promise<void> {
  if (isCloudPersistenceEnabled()) return updateCloudTransaction(id, changes);
  await db.transactions.update(id, changes);
}

export async function deleteTransaction(
  id: string
): Promise<void> {
  if (isCloudPersistenceEnabled()) return deleteCloudTransaction(id);
  await db.transactions.delete(id);
}