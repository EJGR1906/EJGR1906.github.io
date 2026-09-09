import { db, type RecurringTransaction } from "../database/db";

export const getRecurringTransactions = () => db.recurringTransactions.orderBy("nextDate").toArray();
export const createRecurringTransaction = (item: RecurringTransaction) => db.recurringTransactions.add(item);
export const updateRecurringTransaction = (id: string, changes: Partial<RecurringTransaction>) => db.recurringTransactions.update(id, changes);
export const deleteRecurringTransaction = (id: string) => db.recurringTransactions.delete(id);