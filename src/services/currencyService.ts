import Decimal from "decimal.js";
import {
  getLatestExchangeRate,
} from "../repositories/exchangeRateRepository";
import type { CurrencyCode } from "../database/db";

function normalizeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  record: { baseCurrency: CurrencyCode; quoteCurrency: CurrencyCode; rate: number }
): number {
  if (record.baseCurrency === fromCurrency && record.quoteCurrency === toCurrency) {
    return record.rate;
  }

  if (record.baseCurrency === toCurrency && record.quoteCurrency === fromCurrency) {
    return new Decimal(1)
      .div(record.rate)
      .toNumber();
  }

  return record.rate;
}

async function getDirectRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number | null> {

  if (fromCurrency === toCurrency) {
    return 1;
  }

  const directRate =
    await getLatestExchangeRate(
      fromCurrency,
      toCurrency
    );

  if (directRate) {
    return normalizeRate(
      fromCurrency,
      toCurrency,
      directRate,
    );
  }

  const inverseRate =
    await getLatestExchangeRate(
      toCurrency,
      fromCurrency
    );

  if (inverseRate) {
    return normalizeRate(
      fromCurrency,
      toCurrency,
      inverseRate,
    );
  }

  return null;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
}

export async function getConversionRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number | null> {
  // Misma moneda
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Intentar conversión directa
  const directRate = await getDirectRate(
    fromCurrency,
    toCurrency
  );

  if (directRate !== null) {
    return directRate;
  }

  // -----------------------------------------
  // Conversión indirecta a través de VES
  // -----------------------------------------

  const fromToVES = await getDirectRate(
    fromCurrency,
    "VES"
  );

  const vesToTarget = await getDirectRate(
    "VES",
    toCurrency
  );

  if (
    fromToVES !== null &&
    vesToTarget !== null
  ) {
    return new Decimal(fromToVES)
      .mul(vesToTarget)
      .toNumber();
  }

  return null;
}

export async function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<ConversionResult | null> {
  const rate = await getConversionRate(
    fromCurrency,
    toCurrency
  );

  if (rate === null) {
    return null;
  }

  const convertedAmount = new Decimal(amount)
    .mul(rate)
    .toDecimalPlaces(8)
    .toNumber();

  return {
    amount: convertedAmount,
    fromCurrency,
    toCurrency,
    rate,
  };
}