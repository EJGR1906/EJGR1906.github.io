import { createRecurringTransaction, deleteRecurringTransaction, getRecurringTransactions, updateRecurringTransaction } from "../repositories/recurringRepository";
import { createTransaction } from "../repositories/transactionRepository";
import { db, type RecurringTransaction, type Transaction } from "../database/db";
import { generateId } from "../utils/id";
import { nowISO } from "../utils/date";

function advanceDate(date: string, frequency: RecurringTransaction["frequency"]): string {
    const next = new Date(`${date}T12:00:00`);
    if (frequency === "daily") next.setDate(next.getDate() + 1);
    else if (frequency === "weekly") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    return next.toISOString().slice(0, 10);
}

export async function createRecurring(input: Omit<RecurringTransaction, "id" | "active">): Promise<RecurringTransaction> {
    if (!input.nextDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.nextDate)) throw new Error("La próxima fecha no es válida.");
    if (input.type !== "transfer" && (!input.amount || input.amount <= 0)) throw new Error("El monto debe ser mayor que cero.");
    const item = { ...input, id: generateId("recurring"), active: true };
    await createRecurringTransaction(item);
    return item;
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
    await updateRecurringTransaction(id, { active });
}

export async function removeRecurring(id: string): Promise<void> {
    await deleteRecurringTransaction(id);
}

function toTransaction(item: RecurringTransaction, date: string): Transaction {
    return {
        id: generateId("transaction"),
        type: item.type,
        accountId: item.accountId,
        fromAccountId: item.fromAccountId,
        toAccountId: item.toAccountId,
        categoryId: item.categoryId,
        amount: item.amount,
        currency: item.currency,
        fromAmount: item.fromAmount,
        fromCurrency: item.fromCurrency,
        toAmount: item.toAmount,
        toCurrency: item.toCurrency,
        exchangeRate: item.exchangeRate,
        description: item.description,
        date,
        createdAt: nowISO(),
    };
}

export async function generatePendingRecurring(referenceDate = new Date()): Promise<number> {
    const today = referenceDate.toISOString().slice(0, 10);
    const items = await getRecurringTransactions();
    let generated = 0;

    for (const item of items) {
        if (!item.active || item.nextDate > today) continue;
        await db.transaction("rw", db.recurringTransactions, db.transactions, async () => {
            let date = item.nextDate;
            let lastGeneratedDate = item.lastGeneratedDate;
            while (date <= today && (!item.endDate || date <= item.endDate)) {
                if (date !== lastGeneratedDate) {
                    await createTransaction(toTransaction(item, date));
                    generated += 1;
                    lastGeneratedDate = date;
                }
                date = advanceDate(date, item.frequency);
            }
            await updateRecurringTransaction(item.id, { nextDate: date, lastGeneratedDate });
        });
    }
    return generated;
}