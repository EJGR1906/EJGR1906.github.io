import { db } from "../database/db";
import type { Account } from "../database/db";
import { isCloudPersistenceEnabled } from "../database/persistence";
import {
  createCloudAccount,
  deleteCloudAccount,
  getCloudAccount,
  getCloudAccounts,
  updateCloudAccount,
} from "./supabaseRepositories";

export async function getAllAccounts(): Promise<Account[]> {
  if (isCloudPersistenceEnabled()) return getCloudAccounts();
  return db.accounts.toArray();
}

export async function getActiveAccounts(): Promise<Account[]> {
  if (isCloudPersistenceEnabled()) return (await getCloudAccounts()).filter((account) => account.active);
  const accounts = await db.accounts.toArray();

  return accounts.filter(
    (account) => account.active === true
  );
}

export async function getAccountById(
  id: string
): Promise<Account | undefined> {
  if (isCloudPersistenceEnabled()) return getCloudAccount(id);
  return db.accounts.get(id);
}

export async function createAccount(
  account: Account
): Promise<string> {
  if (isCloudPersistenceEnabled()) return createCloudAccount(account);
  return db.accounts.add(account);
}

export async function updateAccount(
  id: string,
  changes: Partial<Account>
): Promise<void> {
  if (isCloudPersistenceEnabled()) return updateCloudAccount(id, changes);
  await db.accounts.update(id, changes);
}

export async function deleteAccount(
  id: string
): Promise<void> {
  if (isCloudPersistenceEnabled()) return deleteCloudAccount(id);
  await db.accounts.delete(id);
}