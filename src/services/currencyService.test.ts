import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearConversionRateCache, convertCurrency, getConversionRate } from "./currencyService";
import * as exchangeRateRepository from "../repositories/exchangeRateRepository";

describe("currencyService caching", () => {
  beforeEach(() => {
    clearConversionRateCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearConversionRateCache();
    vi.restoreAllMocks();
  });

  it("returns 1 for conversion to same currency", async () => {
    const rate = await getConversionRate("USD", "USD");
    expect(rate).toBe(1);
  });

  it("caches rate lookups and reuses them on subsequent calls", async () => {
    const spy = vi.spyOn(exchangeRateRepository, "getLatestExchangeRate").mockResolvedValue({
      id: "rate_usd_ves",
      source: "BCV",
      baseCurrency: "USD",
      quoteCurrency: "VES",
      rate: 40.0,
      timestamp: new Date().toISOString(),
    });

    const result1 = await convertCurrency(10, "USD", "VES");
    expect(result1).toEqual({
      amount: 400,
      fromCurrency: "USD",
      toCurrency: "VES",
      rate: 40.0,
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // Second call should use cached rate without calling repository again
    const result2 = await convertCurrency(20, "USD", "VES");
    expect(result2).toEqual({
      amount: 800,
      fromCurrency: "USD",
      toCurrency: "VES",
      rate: 40.0,
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("fetches new rate after clearConversionRateCache is called", async () => {
    const spy = vi.spyOn(exchangeRateRepository, "getLatestExchangeRate").mockResolvedValue({
      id: "rate_usd_ves",
      source: "BCV",
      baseCurrency: "USD",
      quoteCurrency: "VES",
      rate: 40.0,
      timestamp: new Date().toISOString(),
    });

    await convertCurrency(10, "USD", "VES");
    expect(spy).toHaveBeenCalledTimes(1);

    clearConversionRateCache();

    await convertCurrency(10, "USD", "VES");
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
