import { db } from "../database/db";
import { supabase } from "../database/supabaseClient";

const MIGRATION_PREFIX = "finanzas:cloud-migrated-categories-v2:";

const SAMPLE_ACCOUNT_IDS = ["acc_cash_usd", "acc_bank_ves", "acc_binance_usdt"];
const SAMPLE_TRANSACTION_IDS = ["transaction_test_salary", "transaction_test_food", "transaction_test_transport"];

export async function migrateLocalDataToCloud(userId: string): Promise<void> {
    const migrationKey = `${MIGRATION_PREFIX}${userId}`;
    if (localStorage.getItem(migrationKey) === "1") return;

    const categories = await db.categories.toArray();

    const cleanup = [
        supabase.from("accounts").delete().eq("user_id", userId).in("id", SAMPLE_ACCOUNT_IDS),
        supabase.from("transactions").delete().eq("user_id", userId).in("id", SAMPLE_TRANSACTION_IDS),
    ];

    const results = await Promise.all([
        ...cleanup,
        supabase.from("categories").upsert(categories.map((row) => ({
            id: row.id,
            user_id: userId,
            name: row.name,
            type: row.type,
            icon: row.icon ?? null,
        })), { onConflict: "id" }),
    ]);

    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    localStorage.setItem(migrationKey, "1");
}
