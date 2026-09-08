import { db } from "./db";

export async function seedDatabase() {
  const accountsCount = await db.accounts.count();

  await db.exchangeRates.where("source").equals("PARALLEL").delete();

  if (accountsCount === 0) {
    await db.accounts.bulkAdd([
      {
        id: "acc_cash_usd",
        name: "Efectivo USD",
        type: "cash",
        currency: "USD",
        initialBalance: 350,
        active: true,
      },
      {
        id: "acc_bank_ves",
        name: "Banco Venezuela",
        type: "bank",
        currency: "VES",
        initialBalance: 18500,
        active: true,
      },
      {
        id: "acc_binance_usdt",
        name: "Binance",
        type: "crypto",
        currency: "USDT",
        initialBalance: 420,
        active: true,
      },
    ]);

    await db.categories.bulkAdd([
      {
        id: "cat_food",
        name: "Alimentos",
        type: "expense",
        icon: "utensils",
      },
      {
        id: "cat_services",
        name: "Servicios",
        type: "expense",
        icon: "zap",
      },
      {
        id: "cat_transport",
        name: "Transporte",
        type: "expense",
        icon: "car",
      },
      {
        id: "cat_entertainment",
        name: "Entretenimiento",
        type: "expense",
        icon: "gamepad",
      },
      {
        id: "cat_housing",
        name: "Vivienda",
        type: "expense",
        icon: "house",
      },
      {
        id: "cat_shopping",
        name: "Compras",
        type: "expense",
        icon: "shopping-cart",
      },
      {
        id: "cat_salary",
        name: "Salario",
        type: "income",
        icon: "briefcase",
      },
      {
        id: "cat_other_income",
        name: "Otros ingresos",
        type: "income",
        icon: "plus-circle",
      },
    ]);
  }

  const bcvRate = await db.exchangeRates.get("rate_bcv_usd_ves");
  const manualRate = await db.exchangeRates.get("rate_manual_usd_ves");

  if (!bcvRate) {
    await db.exchangeRates.put({
      id: "rate_bcv_usd_ves",
      source: "BCV",
      baseCurrency: "USD",
      quoteCurrency: "VES",
      rate: 150,
      timestamp: new Date().toISOString(),
    });
  }

  if (!manualRate) {
    await db.exchangeRates.put({
      id: "rate_manual_usd_ves",
      source: "MANUAL",
      baseCurrency: "USD",
      quoteCurrency: "VES",
      rate: bcvRate?.rate ?? 150,
      timestamp: new Date().toISOString(),
    });
  }

  const binanceRate = await db.exchangeRates.get("rate_binance_usdt_ves");
  if (!binanceRate) {
    await db.exchangeRates.put({
      id: "rate_binance_usdt_ves",
      source: "BINANCE_P2P",
      baseCurrency: "USDT",
      quoteCurrency: "VES",
      rate: 156,
      timestamp: new Date().toISOString(),
    });
  }

  const testTransactionExists =
    await db.transactions.get("transaction_test_salary");

  if (!testTransactionExists) {
    await db.transactions.bulkAdd([
      {
        id: "transaction_test_salary",
        type: "income",
        amount: 1200,
        currency: "USD",
        accountId: "acc_cash_usd",
        categoryId: "cat_salary",
        description: "Salario de prueba",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: "transaction_test_food",
        type: "expense",
        amount: 80,
        currency: "USD",
        accountId: "acc_cash_usd",
        categoryId: "cat_food",
        description: "Compra de alimentos de prueba",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: "transaction_test_transport",
        type: "expense",
        amount: 3000,
        currency: "VES",
        accountId: "acc_bank_ves",
        categoryId: "cat_transport",
        description: "Transporte de prueba",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]);

    console.log("✅ Transacciones de prueba creadas");
  }
}