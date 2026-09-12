import Decimal from "decimal.js";
import {
  getLatestExchangeRate,
} from "../repositories/exchangeRateRepository";
import type { CurrencyCode } from "../database/db";

// In-memory cache for conversion rates to avoid redundant DB queries during batch ops (e.g., dashboard summary calculation)
const CACHE_TTL_MS = 5000;
interface CacheEntry {
  rate: number | null;
  timestamp: number;
}
const rateCache = new Map<string, CacheEntry>();

/**
 * Clears the conversion rate cache. Useful for tests and when exchange rates are updated.
 */
export function clearConversionRateCache(): void {
  rateCache.clear();
}

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

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const now = Date.now();
  const cached = rateCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.rate;
  }

  // Intentar conversión directa
  const directRate = await getDirectRate(
    fromCurrency,
    toCurrency
  );

  if (directRate !== null) {
    rateCache.set(cacheKey, { rate: directRate, timestamp: now });
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
    const rate = new Decimal(fromToVES)
      .mul(vesToTarget)
      .toNumber();
    rateCache.set(cacheKey, { rate, timestamp: now });
    return rate;
  }

  rateCache.set(cacheKey, { rate: null, timestamp: now });
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
