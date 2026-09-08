import { db } from "../database/db";
import type { Account } from "../database/db";

export async function getAllAccounts(): Promise<Account[]> {
  return db.accounts.toArray();
}

export async function getActiveAccounts(): Promise<Account[]> {
  const accounts = await db.accounts.toArray();

  return accounts.filter(
    (account) => account.active === true
  );
}

export async function getAccountById(
  id: string
): Promise<Account | undefined> {
  return db.accounts.get(id);
}

export async function createAccount(
  account: Account
): Promise<string> {
  return db.accounts.add(account);
}

export async function updateAccount(
  id: string,
  changes: Partial<Account>
): Promise<void> {
  await db.accounts.update(id, changes);
}

export async function deleteAccount(
  id: string
): Promise<void> {
  await db.accounts.delete(id);
}