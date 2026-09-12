import { z } from "zod";
import { db, type Account, type Category, type ExchangeRate, type Goal, type Transaction } from "../database/db";

const backupSchema = z.object({
    format: z.literal("finanzas-app-backup"),
    version: z.literal(1),
    exportedAt: z.string(),
    accounts: z.array(z.unknown()),
    categories: z.array(z.unknown()),
    goals: z.array(z.unknown()),
    transactions: z.array(z.unknown()),
    exchangeRates: z.array(z.unknown()),
});

export interface BackupData {
    format: "finanzas-app-backup";
    version: 1;
    exportedAt: string;
    accounts: Account[];
    categories: Category[];
    goals: Goal[];
    transactions: Transaction[];
    exchangeRates: ExchangeRate[];
}

export async function exportDatabase(): Promise<BackupData> {
    const [accounts, categories, goals, transactions, exchangeRates] = await Promise.all([
        db.accounts.toArray(),
        db.categories.toArray(),
        db.goals.toArray(),
        db.transactions.toArray(),
        db.exchangeRates.toArray(),
    ]);

    return {
        format: "finanzas-app-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        accounts,
        categories,
        goals,
        transactions,
        exchangeRates,
    };
}

function validateReferences(data: BackupData): void {
    const accountIds = new Set(data.accounts.map((account) => account.id));
    const categoryIds = new Set(data.categories.map((category) => category.id));
    const goalIds = new Set(data.goals.map((goal) => goal.id));

    for (const goal of data.goals) {
        if (goal.backingAccountId && !accountIds.has(goal.backingAccountId)) {
            throw new Error(`La meta "${goal.name}" referencia una cuenta inexistente.`);
        }
    }

    for (const transaction of data.transactions) {
        for (const accountId of [transaction.accountId, transaction.fromAccountId, transaction.toAccountId]) {
            if (accountId && !accountIds.has(accountId)) throw new Error("Un movimiento referencia una cuenta inexistente.");
        }
        if (transaction.categoryId && !categoryIds.has(transaction.categoryId)) throw new Error("Un movimiento referencia una categoría inexistente.");
        if (transaction.goalId && !goalIds.has(transaction.goalId)) throw new Error("Un movimiento referencia una meta inexistente.");
    }
}

export function parseBackup(raw: string): BackupData {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("El archivo no contiene JSON válido.");
    }

    const result = backupSchema.safeParse(parsed);
    if (!result.success) throw new Error("El archivo no tiene el formato de respaldo de Finanzas App.");

    const data = result.data as BackupData;
    validateReferences(data);
    return data;
}

export async function importDatabase(data: BackupData, mode: "replace" | "merge"): Promise<void> {
    validateReferences(data);

    await db.transaction("rw", db.accounts, db.categories, db.goals, db.transactions, db.exchangeRates, async () => {
        if (mode === "replace") {
            await Promise.all([
                db.accounts.clear(),
                db.categories.clear(),
                db.goals.clear(),
                db.transactions.clear(),
                db.exchangeRates.clear(),
            ]);
        }

        await db.accounts.bulkPut(data.accounts);
        await db.categories.bulkPut(data.categories);
        await db.goals.bulkPut(data.goals);
        await db.transactions.bulkPut(data.transactions);
        await db.exchangeRates.bulkPut(data.exchangeRates);
    });
}

function csvEscape(value: unknown): string {
    let text = value === undefined || value === null ? "" : String(value);
    // Prevent CSV / Formula Injection attacks while preserving valid numbers (e.g. -100 or +50)
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text) && isNaN(Number(text))) {
        text = `'${text}`;
    }
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
    if (rows.length === 0) return "";
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    return [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
}