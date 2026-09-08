import { db } from "../database/db";
import type {
  CurrencyCode,
  ExchangeRate,
} from "../database/db";

export async function getAllExchangeRates(): Promise<
  ExchangeRate[]
> {
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
  return db.exchangeRates.add(rate);
}

export async function deleteExchangeRate(
  id: string
): Promise<void> {
  await db.exchangeRates.delete(id);
}

export async function upsertExchangeRate(
  rate: ExchangeRate
): Promise<void> {
  await db.exchangeRates.put(rate);
}