import Decimal from "decimal.js";

import {
  getActiveAccounts,
} from "../repositories/accountRepository";

import {
  getAllTransactions,
} from "../repositories/transactionRepository";
import {
  convertCurrency,
} from "./currencyService";

import type {
  Account,
  CurrencyCode,
} from "../database/db";

export async function getAccountBalance(
  account: Account,
  excludedTransactionId?: string,
): Promise<number> {

  const transactions =
    await getAllTransactions();

  let balance =
    new Decimal(account.initialBalance);

  for (const transaction of transactions) {
    if (transaction.id === excludedTransactionId) {
      continue;
    }

    if (
      transaction.type === "income" &&
      transaction.accountId === account.id &&
      transaction.currency === account.currency
    ) {
      balance = balance.plus(
        transaction.amount ?? 0
      );
    }

    if (
      transaction.type === "expense" &&
      transaction.accountId === account.id &&
      transaction.currency === account.currency
    ) {
      balance = balance.minus(
        transaction.amount ?? 0
      );
    }

    if (
      transaction.type === "transfer" &&
      transaction.fromAccountId === account.id
    ) {
      balance = balance.minus(
        transaction.fromAmount ?? 0
      );
    }

    if (
      transaction.type === "transfer" &&
      transaction.toAccountId === account.id
    ) {
      balance = balance.plus(
        transaction.toAmount ?? 0
      );
    }
  }

  return balance
    .toDecimalPlaces(8)
    .toNumber();
}

export interface ConsolidatedBalance {
  baseCurrency: CurrencyCode;
  total: number;

  accounts: Array<{
    accountId: string;
    accountName: string;
    currency: CurrencyCode;
    originalBalance: number;
    convertedBalance: number;
    exchangeRate: number;
  }>;
}
export async function getConsolidatedBalance(
  baseCurrency: CurrencyCode
): Promise<ConsolidatedBalance> {

  const accounts = await getActiveAccounts();

  let total = new Decimal(0);

  const accountBalances = [];

  for (const account of accounts) {

    const originalBalance =
      await getAccountBalance(account);

    const conversion =
      await convertCurrency(
        originalBalance,
        account.currency,
        baseCurrency
      );

    if (!conversion) {
      continue;
    }

    total = total.plus(
      conversion.amount
    );

    accountBalances.push({
      accountId: account.id,
      accountName: account.name,
      currency: account.currency,
      originalBalance,
      convertedBalance: conversion.amount,
      exchangeRate: conversion.rate,
    });
  }

  return {
    baseCurrency,
    total: total
      .toDecimalPlaces(8)
      .toNumber(),

    accounts: accountBalances,
  };
}