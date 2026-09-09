import Decimal from "decimal.js";

import type {
  CurrencyCode,
  Transaction,
} from "../database/db";

import {
  getActiveAccounts,
} from "../repositories/accountRepository";

import {
  getAllTransactions,
} from "../repositories/transactionRepository";

import {
  getAllCategories,
} from "../repositories/categoryRepository";

import {
  getAccountBalance,
} from "./financialService";

import {
  convertCurrency,
} from "./currencyService";

import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
  endOfWeek,
  endOfMonth,
  endOfYear,
  addMonths,
} from "date-fns";

export interface DashboardAccount {
  id: string;
  name: string;
  type: "cash" | "bank" | "crypto" | "wallet" | "other";
  currency: CurrencyCode;
  balance: number;
  balanceInBaseCurrency: number | null;
}


export interface DashboardCategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  amountInBaseCurrency: number;
  percentage: number;
}


export interface DashboardSummary {
  baseCurrency: CurrencyCode;

  totalBalance: number;

  totalIncome: number;

  totalExpenses: number;

  savings: number;

  savingsRate: number;

  accounts: DashboardAccount[];

  expensesByCategory: DashboardCategoryExpense[];

  recentTransactions: Transaction[];
}

export interface CashFlowPoint {
  date: string;
  income: number;
  expense: number;

}
export interface ExpenseCategoryPoint {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}
export type DashboardPeriod =
  | "all"
  | "week"
  | "month"
  | "year";

export async function getDashboardSummary(
  baseCurrency: CurrencyCode,
  period: DashboardPeriod = "month",
) {

  const accounts = await getActiveAccounts();

  const transactions = await getAllTransactions();

  const now = new Date();

  let periodStart: Date | null = null;

  if (period === "week") {
    periodStart = startOfWeek(now, { weekStartsOn: 1 });
  }

  if (period === "month") {
    periodStart = startOfMonth(now);
  }

  if (period === "year") {
    periodStart = startOfYear(now);
  }

  const filteredTransactions = periodStart
    ? transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= periodStart!;
    })
    : transactions;

  const categories = await getAllCategories();


  // ==========================================
  // BALANCES
  // ==========================================

  const dashboardAccounts: DashboardAccount[] = [];

  let totalBalance = new Decimal(0);

  for (const account of accounts) {

    const balance =
      await getAccountBalance(account);

    const conversion =
      await convertCurrency(
        balance,
        account.currency,
        baseCurrency
      );

    dashboardAccounts.push({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance,

      balanceInBaseCurrency: conversion?.amount ?? null,
    });

    if (conversion) {
      totalBalance =
        totalBalance.plus(
          conversion.amount
        );
    }
  }


  // ==========================================
  // INGRESOS / GASTOS
  // ==========================================

  let totalIncome =
    new Decimal(0);

  let totalExpenses =
    new Decimal(0);

  for (const transaction of filteredTransactions) {

    if (
      transaction.type !== "income" &&
      transaction.type !== "expense"
    ) {
      continue;
    }

    if (
      transaction.amount === undefined ||
      transaction.currency === undefined
    ) {
      continue;
    }

    const conversion =
      await convertCurrency(
        transaction.amount,
        transaction.currency,
        baseCurrency
      );

    if (!conversion) {
      continue;
    }

    if (transaction.type === "income") {
      totalIncome =
        totalIncome.plus(
          conversion.amount
        );
    }

    if (transaction.type === "expense") {
      totalExpenses =
        totalExpenses.plus(
          conversion.amount
        );
    }
  }


  // ==========================================
  // AHORRO
  // ==========================================

  const savings =
    totalIncome.minus(
      totalExpenses
    );

  const savingsRate =
    totalIncome.isZero()
      ? new Decimal(0)
      : savings
        .div(totalIncome)
        .mul(100);


  // ==========================================
  // GASTOS POR CATEGORÍA
  // ==========================================

  const expenseTransactions =
    filteredTransactions.filter(
      (transaction) =>
        transaction.type === "expense"
    );

  const categoryTotals =
    new Map<string, Decimal>();


  for (const transaction of expenseTransactions) {

    if (
      !transaction.categoryId ||
      transaction.amount === undefined ||
      !transaction.currency
    ) {
      continue;
    }

    const conversion =
      await convertCurrency(
        transaction.amount,
        transaction.currency,
        baseCurrency
      );

    if (!conversion) {
      continue;
    }

    const current =
      categoryTotals.get(
        transaction.categoryId
      ) ?? new Decimal(0);

    categoryTotals.set(
      transaction.categoryId,

      current.plus(
        conversion.amount
      )
    );
  }


  const expensesByCategory:
    DashboardCategoryExpense[] = [];


  for (
    const [categoryId, amount]
    of categoryTotals
  ) {

    const category =
      categories.find(
        (item) =>
          item.id === categoryId
      );

    if (!category) {
      continue;
    }

    const percentage =
      totalExpenses.isZero()
        ? new Decimal(0)
        : amount
          .div(totalExpenses)
          .times(100);

    expensesByCategory.push({
      categoryId,

      categoryName:
        category.name,

      amount:
        amount
          .toDecimalPlaces(2)
          .toNumber(),

      amountInBaseCurrency:
        amount
          .toDecimalPlaces(2)
          .toNumber(),

      percentage:
        percentage
          .toDecimalPlaces(2)
          .toNumber(),
    });
  }


  expensesByCategory.sort(
    (a, b) =>
      b.amountInBaseCurrency -
      a.amountInBaseCurrency
  );


  // ==========================================
  // TRANSACCIONES RECIENTES
  // ==========================================

  const recentTransactions =
    [...filteredTransactions]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 5);


  // ==========================================
  // RESULTADO FINAL
  // ==========================================

  return {

    baseCurrency,

    totalBalance:
      totalBalance
        .toDecimalPlaces(2)
        .toNumber(),

    totalIncome:
      totalIncome
        .toDecimalPlaces(2)
        .toNumber(),

    totalExpenses:
      totalExpenses
        .toDecimalPlaces(2)
        .toNumber(),

    savings:
      savings
        .toDecimalPlaces(2)
        .toNumber(),

    savingsRate:
      savingsRate
        .toDecimalPlaces(2)
        .toNumber(),

    accounts:
      dashboardAccounts,

    expensesByCategory,

    recentTransactions,
  };
}

export async function getCashFlowSeries(
  baseCurrency: CurrencyCode,
  period: DashboardPeriod = "month",
): Promise<CashFlowPoint[]> {
  const transactions = await getAllTransactions();

  const now = new Date();

  let periodStart: Date | null = null;

  if (period === "week") {
    periodStart = startOfWeek(now, {
      weekStartsOn: 1,
    });
  }

  if (period === "month") {
    periodStart = addMonths(startOfMonth(now), -11);
  }

  if (period === "year") {
    periodStart = startOfYear(now);
  }

  const filteredTransactions = periodStart
    ? transactions.filter((transaction) => {
      const transactionDate = new Date(
        transaction.date,
      );

      return transactionDate >= periodStart!;
    })
    : transactions;

  const monthlyTotals = new Map<
    string,
    {
      date: Date;
      income: Decimal;
      expense: Decimal;
    }
  >();

  for (const transaction of filteredTransactions) {
    if (
      transaction.type !== "income" &&
      transaction.type !== "expense"
    ) {
      continue;
    }

    if (
      transaction.amount === undefined ||
      transaction.currency === undefined
    ) {
      continue;
    }

    const conversion = await convertCurrency(
      transaction.amount,
      transaction.currency,
      baseCurrency,
    );

    if (!conversion) {
      continue;
    }

    const transactionDate = startOfMonth(
      new Date(transaction.date),
    );

    const dateKey = format(
      transactionDate,
      "yyyy-MM",
    );

    const current = monthlyTotals.get(dateKey);

    if (current) {
      if (transaction.type === "income") {
        current.income = current.income.plus(
          conversion.amount,
        );
      }

      if (transaction.type === "expense") {
        current.expense = current.expense.plus(
          conversion.amount,
        );
      }

      continue;
    }

    monthlyTotals.set(dateKey, {
      date: transactionDate,
      income:
        transaction.type === "income"
          ? new Decimal(conversion.amount)
          : new Decimal(0),
      expense:
        transaction.type === "expense"
          ? new Decimal(conversion.amount)
          : new Decimal(0),
    });
  }

  let chartStart: Date;
  let chartEnd: Date;

  if (period === "week") {
    chartStart = startOfWeek(now, { weekStartsOn: 1 });
    chartEnd = endOfWeek(now, { weekStartsOn: 1 });
  } else if (period === "month") {
    chartStart = addMonths(startOfMonth(now), -11);
    chartEnd = endOfMonth(now);
  } else if (period === "year") {
    chartStart = startOfYear(now);
    chartEnd = endOfYear(now);
  } else {
    const sortedDates = Array.from(monthlyTotals.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    if (sortedDates.length === 0) {
      return [];
    }

    chartStart = startOfMonth(sortedDates[0].date);
    chartEnd = startOfMonth(
      sortedDates[sortedDates.length - 1].date,
    );
  }

  const result: CashFlowPoint[] = [];

  let currentDate = startOfMonth(chartStart);

  while (currentDate <= startOfMonth(chartEnd)) {
    const dateKey = format(currentDate, "yyyy-MM");
    const monthlyData = monthlyTotals.get(dateKey);

    result.push({
      date: format(currentDate, "MMM yyyy"),
      income: monthlyData
        ? monthlyData.income.toDecimalPlaces(2).toNumber()
        : 0,
      expense: monthlyData
        ? monthlyData.expense.toDecimalPlaces(2).toNumber()
        : 0,
    });

    currentDate = addMonths(currentDate, 1);
  }

  return result;
}

export async function getExpensesByCategory(
  baseCurrency: CurrencyCode,
  period: DashboardPeriod = "month",
): Promise<ExpenseCategoryPoint[]> {
  const transactions = await getAllTransactions();
  const categories = await getAllCategories();

  const now = new Date();

  let periodStart: Date | null = null;

  if (period === "week") {
    periodStart = startOfWeek(now, { weekStartsOn: 1 });
  }

  if (period === "month") {
    periodStart = startOfMonth(now);
  }

  if (period === "year") {
    periodStart = startOfYear(now);
  }

  const filteredTransactions = transactions.filter(
    (transaction) => {
      if (transaction.type !== "expense") {
        return false;
      }

      if (!periodStart) {
        return true;
      }

      const transactionDate = new Date(
        transaction.date,
      );

      return transactionDate >= periodStart;
    },
  );

  const categoryTotals = new Map<
    string,
    Decimal
  >();

  for (const transaction of filteredTransactions) {
    if (
      !transaction.categoryId ||
      transaction.amount === undefined ||
      !transaction.currency
    ) {
      continue;
    }

    const conversion = await convertCurrency(
      transaction.amount,
      transaction.currency,
      baseCurrency,
    );

    if (!conversion) {
      continue;
    }

    const current =
      categoryTotals.get(transaction.categoryId) ??
      new Decimal(0);

    categoryTotals.set(
      transaction.categoryId,
      current.plus(conversion.amount),
    );
  }

  const totalExpenses = Array.from(
    categoryTotals.values(),
  ).reduce(
    (total, amount) => total.plus(amount),
    new Decimal(0),
  );

  return Array.from(categoryTotals.entries())
    .map(([categoryId, amount]) => {
      const category = categories.find(
        (item) => item.id === categoryId,
      );

      const percentage =
        totalExpenses.isZero()
          ? new Decimal(0)
          : amount
            .div(totalExpenses)
            .times(100);

      return {
        categoryId,
        categoryName:
          category?.name ?? "Sin categoría",

        amount: amount
          .toDecimalPlaces(2)
          .toNumber(),

        percentage: percentage
          .toDecimalPlaces(2)
          .toNumber(),
      };
    })
    .sort(
      (a, b) => b.amount - a.amount,
    );
}
