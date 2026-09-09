import { afterEach, describe, expect, it, vi } from "vitest";
import { getBinanceUsdtRate, getOfficialUsdRate } from "./exchangeRateService";

afterEach(() => vi.restoreAllMocks());

describe("exchange rate sources", () => {
    it("normalizes the official USD/VES rate as BCV", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ promedio: 123.45, fechaActualizacion: "2026-09-08T12:00:00.000Z" }) }));
        await expect(getOfficialUsdRate()).resolves.toMatchObject({ id: "rate_bcv_usd_ves", source: "BCV", rate: 123.45 });
    });

    it("normalizes the Binance quote as USDT/VES", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { quotePrice: "130.5" } }) }));
        await expect(getBinanceUsdtRate()).resolves.toMatchObject({ id: "rate_binance_usdt_ves", source: "BINANCE_P2P", rate: 130.5 });
    });
});