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
import { calculateAccountBalance } from "./financialDomain";

export async function getAccountBalance(
  account: Account,
  excludedTransactionId?: string,
): Promise<number> {
  return calculateAccountBalance(account, await getAllTransactions(), excludedTransactionId);
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

export interface AccountPortfolioSummary {
  baseCurrency: CurrencyCode;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  unconvertedAccounts: string[];
}

export async function getAccountPortfolioSummary(baseCurrency: CurrencyCode): Promise<AccountPortfolioSummary> {
  const accounts = await getActiveAccounts();
  let totalAssets = new Decimal(0);
  let totalLiabilities = new Decimal(0);
  const unconvertedAccounts: string[] = [];

  for (const account of accounts) {
    const balance = await getAccountBalance(account);
    const conversion = await convertCurrency(Math.abs(balance), account.currency, baseCurrency);
    if (!conversion) {
      unconvertedAccounts.push(account.name);
      continue;
    }

    if (account.nature === "liability") totalLiabilities = totalLiabilities.plus(conversion.amount);
    else totalAssets = totalAssets.plus(conversion.amount);
  }

  return {
    baseCurrency,
    totalAssets: totalAssets.toDecimalPlaces(8).toNumber(),
    totalLiabilities: totalLiabilities.toDecimalPlaces(8).toNumber(),
    netWorth: totalAssets.minus(totalLiabilities).toDecimalPlaces(8).toNumber(),
    unconvertedAccounts,
  };
}