import { db } from "../database/db";
import { supabase } from "../database/supabaseClient";

const MIGRATION_PREFIX = "finanzas:cloud-migrated:";

export async function migrateLocalDataToCloud(userId: string): Promise<void> {
  const migrationKey = `${MIGRATION_PREFIX}${userId}`;
  if (localStorage.getItem(migrationKey) === "1") return;

  const [accounts, categories, goals, transactions, exchangeRates, recurringTransactions] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
    db.goals.toArray(),
    db.transactions.toArray(),
    db.exchangeRates.toArray(),
    db.recurringTransactions.toArray(),
  ]);

  const results = await Promise.all([
    supabase.from("accounts").upsert(accounts.map((row) => ({
      id: row.id,
      user_id: userId,
      name: row.name,
      institution_id: row.institutionId ?? null,
      type: row.type,
      currency: row.currency,
      initial_balance: row.initialBalance,
      active: row.active,
      nature: row.nature ?? "asset",
      credit_limit: row.creditLimit ?? null,
    })), { onConflict: "id" }),
    supabase.from("categories").upsert(categories.map((row) => ({
      id: row.id,
      user_id: userId,
      name: row.name,
      type: row.type,
      icon: row.icon ?? null,
    })), { onConflict: "id" }),
    supabase.from("goals").upsert(goals.map((row) => ({
      id: row.id,
      user_id: userId,
      name: row.name,
      target_amount: row.targetAmount,
      currency: row.currency,
      backing_account_id: row.backingAccountId,
      category: row.category,
      deadline: row.deadline ?? null,
      active: row.active,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    })), { onConflict: "id" }),
    supabase.from("transactions").upsert(transactions.map((row) => ({
      id: row.id,
      user_id: userId,
      type: row.type,
      amount: row.amount ?? null,
      currency: row.currency ?? null,
      account_id: row.accountId ?? null,
      category_id: row.categoryId ?? null,
      goal_id: row.goalId ?? null,
      from_account_id: row.fromAccountId ?? null,
      to_account_id: row.toAccountId ?? null,
      from_amount: row.fromAmount ?? null,
      from_currency: row.fromCurrency ?? null,
      to_amount: row.toAmount ?? null,
      to_currency: row.toCurrency ?? null,
      exchange_rate: row.exchangeRate ?? null,
      description: row.description ?? null,
      date: row.date,
      created_at: row.createdAt,
    })), { onConflict: "id" }),
    supabase.from("exchange_rates").upsert(exchangeRates.map((row) => ({
      id: row.id,
      user_id: userId,
      source: row.source,
      base_currency: row.baseCurrency,
      quote_currency: row.quoteCurrency,
      rate: row.rate,
      timestamp: row.timestamp,
    })), { onConflict: "id" }),
    supabase.from("recurring_transactions").upsert(recurringTransactions.map((row) => ({
      id: row.id,
      user_id: userId,
      type: row.type,
      account_id: row.accountId ?? null,
      from_account_id: row.fromAccountId ?? null,
      to_account_id: row.toAccountId ?? null,
      category_id: row.categoryId ?? null,
      amount: row.amount ?? null,
      currency: row.currency ?? null,
      from_amount: row.fromAmount ?? null,
      from_currency: row.fromCurrency ?? null,
      to_amount: row.toAmount ?? null,
      to_currency: row.toCurrency ?? null,
      exchange_rate: row.exchangeRate ?? null,
      description: row.description ?? null,
      frequency: row.frequency,
      next_date: row.nextDate,
      end_date: row.endDate ?? null,
      active: row.active,
      last_generated_date: row.lastGeneratedDate ?? null,
    })), { onConflict: "id" }),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  localStorage.setItem(migrationKey, "1");
}
