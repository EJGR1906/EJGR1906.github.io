import Dexie, { type EntityTable } from "dexie";

export interface Account {
  id: string;
  name: string;
  institutionId?: string;

  type:
  | "cash"
  | "bank"
  | "crypto"
  | "wallet"
  | "other";

  currency: CurrencyCode;

  initialBalance: number;

  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
}

export type CurrencyCode = "VES" | "USD" | "USDT";

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "goal_contribution"
  | "goal_withdrawal";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currency: CurrencyCode;
  backingAccountId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;

  type: TransactionType;

  // ==========================================
  // INGRESOS / GASTOS
  // ==========================================

  amount?: number;
  currency?: CurrencyCode;

  accountId?: string;
  categoryId?: string;
  goalId?: string;

  // ==========================================
  // TRANSFERENCIAS
  // ==========================================

  fromAccountId?: string;
  toAccountId?: string;

  fromAmount?: number;
  fromCurrency?: CurrencyCode;

  toAmount?: number;
  toCurrency?: CurrencyCode;

  // Tasa utilizada en la transferencia
  exchangeRate?: number;

  // ==========================================
  // INFORMACIÓN GENERAL
  // ==========================================

  description?: string;

  date: string;

  createdAt: string;
}


export interface ExchangeRate {
  id: string;
  source: "BCV" | "BINANCE_P2P" | "MANUAL";
  baseCurrency: "USD" | "USDT";
  quoteCurrency: "VES";
  rate: number;
  timestamp: string;
}

export const db = new Dexie("FinanzasDB") as Dexie & {
  accounts: EntityTable<Account, "id">;
  categories: EntityTable<Category, "id">;
  goals: EntityTable<Goal, "id">;
  transactions: EntityTable<Transaction, "id">;
  exchangeRates: EntityTable<ExchangeRate, "id">;
};

db.version(1).stores({
  accounts: "id, currency, type, active",

  categories: "id, type",

  goals: "id, backingAccountId, active, currency, updatedAt",

  transactions:
    "id, type, currency, accountId, categoryId, goalId, date, createdAt",

  exchangeRates:
    "id, source, baseCurrency, quoteCurrency, timestamp, [baseCurrency+quoteCurrency]",
});

db.version(2)
  .stores({
    accounts: "id, currency, type, active",
    categories: "id, type",
    goals: "id, backingAccountId, active, currency, updatedAt",
    transactions:
      "id, type, currency, accountId, categoryId, goalId, date, createdAt",
    exchangeRates:
      "id, source, baseCurrency, quoteCurrency, timestamp, [baseCurrency+quoteCurrency]",
  })
  .upgrade(async (transaction) => {
    const exchangeRates = transaction.table("exchangeRates");

    await exchangeRates.where("source").equals("PARALLEL").delete();

    const manualRate = await exchangeRates.get("rate_manual_usd_ves");
    if (!manualRate) {
      const bcvRate = await exchangeRates.get("rate_bcv_usd_ves");
      if (bcvRate) {
        await exchangeRates.put({
          id: "rate_manual_usd_ves",
          source: "MANUAL",
          baseCurrency: "USD",
          quoteCurrency: "VES",
          rate: bcvRate.rate,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });

db.version(3)
  .stores({
    accounts: "id, currency, type, active, institutionId",
    categories: "id, type",
    goals: "id, backingAccountId, active, currency, updatedAt",
    transactions:
      "id, type, currency, accountId, categoryId, goalId, date, createdAt",
    exchangeRates:
      "id, source, baseCurrency, quoteCurrency, timestamp, [baseCurrency+quoteCurrency]",
  });