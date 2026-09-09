import { supabase } from "../database/supabaseClient";
import { getActiveUserId } from "../database/persistence";
import type { Account, Category, ExchangeRate, Goal, RecurringTransaction, Transaction } from "../database/db";

function userId(): string {
  const value = getActiveUserId();
  if (!value) throw new Error("No hay una sesión activa.");
  return value;
}

function record(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function accountFromCloud(value: unknown): Account {
  const row = record(value);
  return {
    id: String(row.id), name: String(row.name), institutionId: typeof row.institution_id === "string" ? row.institution_id : undefined,
    type: row.type as Account["type"], currency: row.currency as Account["currency"], initialBalance: Number(row.initial_balance ?? 0),
    active: Boolean(row.active), nature: row.nature as Account["nature"], creditLimit: row.credit_limit == null ? undefined : Number(row.credit_limit),
  };
}

function accountToCloud(value: Account, owner: string) {
  return { id: value.id, user_id: owner, name: value.name, institution_id: value.institutionId ?? null, type: value.type, currency: value.currency, initial_balance: value.initialBalance, active: value.active, nature: value.nature ?? "asset", credit_limit: value.creditLimit ?? null };
}

function categoryFromCloud(value: unknown): Category {
  const row = record(value);
  return { id: String(row.id), name: String(row.name), type: row.type as Category["type"], icon: typeof row.icon === "string" ? row.icon : undefined };
}

function categoryToCloud(value: Category, owner: string) {
  return { id: value.id, user_id: owner, name: value.name, type: value.type, icon: value.icon ?? null };
}

function goalFromCloud(value: unknown): Goal {
  const row = record(value);
  return { id: String(row.id), name: String(row.name), targetAmount: Number(row.target_amount ?? 0), currency: row.currency as Goal["currency"], backingAccountId: String(row.backing_account_id), category: row.category as Goal["category"], deadline: typeof row.deadline === "string" ? row.deadline : undefined, active: Boolean(row.active), createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

function goalToCloud(value: Goal, owner: string) {
  return { id: value.id, user_id: owner, name: value.name, target_amount: value.targetAmount, currency: value.currency, backing_account_id: value.backingAccountId, category: value.category, deadline: value.deadline ?? null, active: value.active, created_at: value.createdAt, updated_at: value.updatedAt };
}

function transactionFromCloud(value: unknown): Transaction {
  const row = record(value);
  return { id: String(row.id), type: row.type as Transaction["type"], amount: row.amount == null ? undefined : Number(row.amount), currency: row.currency as Transaction["currency"], accountId: row.account_id as string | undefined, categoryId: row.category_id as string | undefined, goalId: row.goal_id as string | undefined, fromAccountId: row.from_account_id as string | undefined, toAccountId: row.to_account_id as string | undefined, fromAmount: row.from_amount == null ? undefined : Number(row.from_amount), fromCurrency: row.from_currency as Transaction["fromCurrency"], toAmount: row.to_amount == null ? undefined : Number(row.to_amount), toCurrency: row.to_currency as Transaction["toCurrency"], exchangeRate: row.exchange_rate == null ? undefined : Number(row.exchange_rate), description: row.description as string | undefined, date: String(row.date), createdAt: String(row.created_at) };
}

function transactionToCloud(value: Transaction, owner: string) {
  return { id: value.id, user_id: owner, type: value.type, amount: value.amount ?? null, currency: value.currency ?? null, account_id: value.accountId ?? null, category_id: value.categoryId ?? null, goal_id: value.goalId ?? null, from_account_id: value.fromAccountId ?? null, to_account_id: value.toAccountId ?? null, from_amount: value.fromAmount ?? null, from_currency: value.fromCurrency ?? null, to_amount: value.toAmount ?? null, to_currency: value.toCurrency ?? null, exchange_rate: value.exchangeRate ?? null, description: value.description ?? null, date: value.date, created_at: value.createdAt };
}

function exchangeRateFromCloud(value: unknown): ExchangeRate {
  const row = record(value);
  return { id: String(row.id), source: row.source as ExchangeRate["source"], baseCurrency: row.base_currency as ExchangeRate["baseCurrency"], quoteCurrency: row.quote_currency as ExchangeRate["quoteCurrency"], rate: Number(row.rate), timestamp: String(row.timestamp) };
}

function exchangeRateToCloud(value: ExchangeRate, owner: string) {
  return { id: value.id, user_id: owner, source: value.source, base_currency: value.baseCurrency, quote_currency: value.quoteCurrency, rate: value.rate, timestamp: value.timestamp };
}

function recurringFromCloud(value: unknown): RecurringTransaction {
  const row = record(value);
  return { id: String(row.id), type: row.type as RecurringTransaction["type"], accountId: row.account_id as string | undefined, fromAccountId: row.from_account_id as string | undefined, toAccountId: row.to_account_id as string | undefined, categoryId: row.category_id as string | undefined, amount: row.amount == null ? undefined : Number(row.amount), currency: row.currency as RecurringTransaction["currency"], fromAmount: row.from_amount == null ? undefined : Number(row.from_amount), fromCurrency: row.from_currency as RecurringTransaction["fromCurrency"], toAmount: row.to_amount == null ? undefined : Number(row.to_amount), toCurrency: row.to_currency as RecurringTransaction["toCurrency"], exchangeRate: row.exchange_rate == null ? undefined : Number(row.exchange_rate), description: row.description as string | undefined, frequency: row.frequency as RecurringTransaction["frequency"], nextDate: String(row.next_date), endDate: row.end_date as string | undefined, active: Boolean(row.active), lastGeneratedDate: row.last_generated_date as string | undefined };
}

function recurringToCloud(value: RecurringTransaction, owner: string) {
  return { id: value.id, user_id: owner, type: value.type, account_id: value.accountId ?? null, from_account_id: value.fromAccountId ?? null, to_account_id: value.toAccountId ?? null, category_id: value.categoryId ?? null, amount: value.amount ?? null, currency: value.currency ?? null, from_amount: value.fromAmount ?? null, from_currency: value.fromCurrency ?? null, to_amount: value.toAmount ?? null, to_currency: value.toCurrency ?? null, exchange_rate: value.exchangeRate ?? null, description: value.description ?? null, frequency: value.frequency, next_date: value.nextDate, end_date: value.endDate ?? null, active: value.active, last_generated_date: value.lastGeneratedDate ?? null };
}

async function read(table: string, order?: string) {
  let query = supabase.from(table).select("*").eq("user_id", userId());
  if (order) query = query.order(order, { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function write(table: string, value: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.from(table).upsert(value, { onConflict: "id" }).select("id").single();
  if (error) throw error;
  return String(record(data).id);
}

async function patch(table: string, id: string, changes: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(table).update(changes).eq("id", id).eq("user_id", userId());
  if (error) throw error;
}

async function remove(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId());
  if (error) throw error;
}

export async function getCloudAccounts() { return (await read("accounts", "created_at")).map(accountFromCloud); }
export async function getCloudAccount(id: string) { const rows = (await read("accounts")).filter((row) => String(record(row).id) === id); return rows[0] ? accountFromCloud(rows[0]) : undefined; }
export async function createCloudAccount(value: Account) { return write("accounts", accountToCloud(value, userId())); }
export async function updateCloudAccount(id: string, changes: Partial<Account>) { const mapped: Record<string, unknown> = {}; if (changes.name !== undefined) mapped.name = changes.name; if (changes.type !== undefined) mapped.type = changes.type; if (changes.currency !== undefined) mapped.currency = changes.currency; if (changes.initialBalance !== undefined) mapped.initial_balance = changes.initialBalance; if (changes.active !== undefined) mapped.active = changes.active; if (changes.institutionId !== undefined) mapped.institution_id = changes.institutionId; if (changes.nature !== undefined) mapped.nature = changes.nature; if (changes.creditLimit !== undefined) mapped.credit_limit = changes.creditLimit; await patch("accounts", id, mapped); }
export async function deleteCloudAccount(id: string) { return remove("accounts", id); }

export async function getCloudCategories() { return (await read("categories", "created_at")).map(categoryFromCloud); }
export async function getCloudCategory(id: string) { const rows = (await read("categories")).filter((row) => String(record(row).id) === id); return rows[0] ? categoryFromCloud(rows[0]) : undefined; }
export async function createCloudCategory(value: Category) { return write("categories", categoryToCloud(value, userId())); }
export async function updateCloudCategory(id: string, changes: Partial<Category>) { const mapped: Record<string, unknown> = {}; if (changes.name !== undefined) mapped.name = changes.name; if (changes.type !== undefined) mapped.type = changes.type; if (changes.icon !== undefined) mapped.icon = changes.icon; await patch("categories", id, mapped); }
export async function deleteCloudCategory(id: string) { return remove("categories", id); }

export async function getCloudGoals() { return (await read("goals", "updated_at")).map(goalFromCloud); }
export async function getCloudGoal(id: string) { const rows = (await read("goals")).filter((row) => String(record(row).id) === id); return rows[0] ? goalFromCloud(rows[0]) : undefined; }
export async function createCloudGoal(value: Goal) { return write("goals", goalToCloud(value, userId())); }
export async function updateCloudGoal(id: string, changes: Partial<Goal>) { const mapped: Record<string, unknown> = {}; if (changes.name !== undefined) mapped.name = changes.name; if (changes.targetAmount !== undefined) mapped.target_amount = changes.targetAmount; if (changes.currency !== undefined) mapped.currency = changes.currency; if (changes.backingAccountId !== undefined) mapped.backing_account_id = changes.backingAccountId; if (changes.category !== undefined) mapped.category = changes.category; if (changes.deadline !== undefined) mapped.deadline = changes.deadline; if (changes.active !== undefined) mapped.active = changes.active; if (changes.updatedAt !== undefined) mapped.updated_at = changes.updatedAt; await patch("goals", id, mapped); }
export async function deleteCloudGoal(id: string) { return remove("goals", id); }

export async function getCloudTransactions() { return (await read("transactions", "date")).map(transactionFromCloud); }
export async function getCloudTransaction(id: string) { const rows = (await read("transactions")).filter((row) => String(record(row).id) === id); return rows[0] ? transactionFromCloud(rows[0]) : undefined; }
export async function createCloudTransaction(value: Transaction) { return write("transactions", transactionToCloud(value, userId())); }
export async function updateCloudTransaction(id: string, changes: Partial<Transaction>) { const mapped = transactionToCloud({ ...({ id, type: "income", date: new Date().toISOString(), createdAt: new Date().toISOString() } as Transaction), ...changes }, userId()); const { id: ignoredId, user_id: ignoredUserId, ...updates } = mapped; void ignoredId; void ignoredUserId; await patch("transactions", id, updates); }
export async function deleteCloudTransaction(id: string) { return remove("transactions", id); }

export async function getCloudExchangeRates() { return (await read("exchange_rates", "timestamp")).map(exchangeRateFromCloud); }
export async function createCloudExchangeRate(value: ExchangeRate) { return write("exchange_rates", exchangeRateToCloud(value, userId())); }
export async function updateCloudExchangeRate(value: ExchangeRate) { await write("exchange_rates", exchangeRateToCloud(value, userId())); }
export async function deleteCloudExchangeRate(id: string) { return remove("exchange_rates", id); }

export async function getCloudRecurringTransactions() { return (await read("recurring_transactions", "next_date")).map(recurringFromCloud); }
export async function createCloudRecurringTransaction(value: RecurringTransaction) { return write("recurring_transactions", recurringToCloud(value, userId())); }
export async function updateCloudRecurringTransaction(id: string, changes: Partial<RecurringTransaction>) { const current = (await getCloudRecurringTransactions()).find((item) => item.id === id); if (!current) throw new Error("Movimiento recurrente no encontrado."); const mapped = recurringToCloud({ ...current, ...changes }, userId()); const { id: ignoredId, user_id: ignoredUserId, ...updates } = mapped; void ignoredId; void ignoredUserId; await patch("recurring_transactions", id, updates); }
export async function deleteCloudRecurringTransaction(id: string) { return remove("recurring_transactions", id); }
