import { db } from "../database/db";
import type {
  CurrencyCode,
  ExchangeRate,
} from "../database/db";
import { isCloudPersistenceEnabled } from "../database/persistence";
import { createCloudExchangeRate, deleteCloudExchangeRate, getCloudExchangeRates, updateCloudExchangeRate } from "./supabaseRepositories";

export async function getAllExchangeRates(): Promise<
  ExchangeRate[]
> {
  if (isCloudPersistenceEnabled()) return getCloudExchangeRates();
  return db.exchangeRates
    .orderBy("timestamp")
    .reverse()
    .toArray();
}

export async function getLatestExchangeRate(
  baseCurrency: CurrencyCode,
  quoteCurrency: CurrencyCode,
  source?: ExchangeRate["source"]
): Promise<ExchangeRate | undefined> {
  if (isCloudPersistenceEnabled()) {
    const rates = await getCloudExchangeRates();
    const directRates = rates.filter((rate) => rate.baseCurrency === baseCurrency && rate.quoteCurrency === quoteCurrency);
    const inverseRates = rates.filter((rate) => rate.baseCurrency === quoteCurrency && rate.quoteCurrency === baseCurrency);
    const isUsdVesPair = (baseCurrency === "USD" && quoteCurrency === "VES") || (baseCurrency === "VES" && quoteCurrency === "USD");
    const isUsdtVesPair = (baseCurrency === "USDT" && quoteCurrency === "VES") || (baseCurrency === "VES" && quoteCurrency === "USDT");
    const preferredSource = source ?? (isUsdVesPair ? "BCV" : isUsdtVesPair ? "BINANCE_P2P" : undefined);
    return [...directRates, ...inverseRates].filter((rate) => !preferredSource || rate.source === preferredSource).filter((rate) => source !== "MANUAL" || rate.source === "MANUAL").sort((left, right) => right.timestamp.localeCompare(left.timestamp)).at(0);
  }
  const directRates = await db.exchangeRates
    .where("[baseCurrency+quoteCurrency]")
    .equals([baseCurrency, quoteCurrency])
    .toArray();

  const inverseRates =
    baseCurrency !== quoteCurrency
      ? await db.exchangeRates
        .where("[baseCurrency+quoteCurrency]")
        .equals([quoteCurrency, baseCurrency])
        .toArray()
      : [];

  const isUsdVesPair =
    (baseCurrency === "USD" && quoteCurrency === "VES") ||
    (baseCurrency === "VES" && quoteCurrency === "USD");
  const isUsdtVesPair =
    (baseCurrency === "USDT" && quoteCurrency === "VES") ||
    (baseCurrency === "VES" && quoteCurrency === "USDT");

  const preferredSource =
    source ??
    (isUsdVesPair
      ? "BCV"
      : isUsdtVesPair
        ? "BINANCE_P2P"
        : undefined);

  const eligibleRates = (
    preferredSource
      ? [...directRates, ...inverseRates].filter(
        (rate) => rate.source === preferredSource
      )
      : [...directRates, ...inverseRates]
  )
    .sort((left, right) =>
      right.timestamp.localeCompare(left.timestamp)
    )
    .filter((rate) => {
      if (source === "MANUAL") {
        return rate.source === "MANUAL";
      }

      return true;
    });

  return eligibleRates.at(0);
}

export async function createExchangeRate(
  rate: ExchangeRate
): Promise<string> {
  if (isCloudPersistenceEnabled()) return createCloudExchangeRate(rate);
  return db.exchangeRates.add(rate);
}

export async function deleteExchangeRate(
  id: string
): Promise<void> {
  if (isCloudPersistenceEnabled()) return deleteCloudExchangeRate(id);
  await db.exchangeRates.delete(id);
}

export async function upsertExchangeRate(
  rate: ExchangeRate
): Promise<void> {
  if (isCloudPersistenceEnabled()) return updateCloudExchangeRate(rate);
  await db.exchangeRates.put(rate);
}