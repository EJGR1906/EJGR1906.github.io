import { db, type RecurringTransaction } from "../database/db";
import { isCloudPersistenceEnabled } from "../database/persistence";
import { createCloudRecurringTransaction, deleteCloudRecurringTransaction, getCloudRecurringTransactions, updateCloudRecurringTransaction } from "./supabaseRepositories";

export const getRecurringTransactions = () => isCloudPersistenceEnabled() ? getCloudRecurringTransactions() : db.recurringTransactions.orderBy("nextDate").toArray();
export const createRecurringTransaction = (item: RecurringTransaction) => isCloudPersistenceEnabled() ? createCloudRecurringTransaction(item) : db.recurringTransactions.add(item);
export const updateRecurringTransaction = (id: string, changes: Partial<RecurringTransaction>) => isCloudPersistenceEnabled() ? updateCloudRecurringTransaction(id, changes) : db.recurringTransactions.update(id, changes);
export const deleteRecurringTransaction = (id: string) => isCloudPersistenceEnabled() ? deleteCloudRecurringTransaction(id) : db.recurringTransactions.delete(id);