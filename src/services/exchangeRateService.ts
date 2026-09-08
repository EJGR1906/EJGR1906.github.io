import {
    upsertExchangeRate
} from "../repositories/exchangeRateRepository";

import type {
    ExchangeRate,
} from "../database/db";


const DOLAR_API_URL =
    "https://ve.dolarapi.com/v1/dolares/oficial";

const BINANCE_P2P_QUOTE_URL =
    "https://www.binance.com/bapi/c2c/v1/public/c2c/agent/quote-price";

interface DolarApiResponse {
    moneda: string;
    fuente: string;
    nombre: string;
    compra: number | null;
    venta: number | null;
    promedio: number;
    fechaActualizacion: string;
}

interface BinanceQuoteResponse {
    data?: unknown;
    success?: boolean;
    code?: string;
    message?: string;
}

/**
 * Obtiene la tasa oficial USD/VES desde DólarAPI.
 */
export async function getOfficialUsdRate(): Promise<ExchangeRate> {
    const response = await fetch(DOLAR_API_URL);

    if (!response.ok) {
        throw new Error(
            `Error obteniendo tasa BCV: HTTP ${response.status}`
        );
    }

    const data =
        (await response.json()) as DolarApiResponse;

    if (
        typeof data.promedio !== "number" ||
        data.promedio <= 0
    ) {
        throw new Error(
            "La respuesta de DólarAPI no contiene una tasa válida."
        );
    }

    return {
        id: "rate_bcv_usd_ves",
        source: "BCV",
        baseCurrency: "USD",
        quoteCurrency: "VES",
        rate: data.promedio,
        timestamp:
            data.fechaActualizacion ||
            new Date().toISOString(),
    };
}

/**
 * Extrae una tasa numérica de la respuesta de Binance.
 *
 * Binance puede modificar la estructura interna de la
 * respuesta, por eso mantenemos el parser aislado aquí.
 */
function extractBinanceRate(
    response: BinanceQuoteResponse
): number {
    const data = response.data;

    if (typeof data === "number") {
        return data;
    }

    if (
        data &&
        typeof data === "object"
    ) {
        const object =
            data as Record<string, unknown>;

        const possibleKeys = [
            "price",
            "quotePrice",
            "buyPrice",
            "sellPrice",
        ];

        for (const key of possibleKeys) {
            const value = object[key];

            if (
                typeof value === "number" &&
                value > 0
            ) {
                return value;
            }

            if (
                typeof value === "string" &&
                Number(value) > 0
            ) {
                return Number(value);
            }
        }
    }

    throw new Error(
        "No se pudo encontrar una tasa USDT/VES válida en la respuesta de Binance."
    );
}

/**
 * Obtiene la cotización P2P para comprar USDT
 * utilizando VES.
 *
 * BUY significa:
 *
 * VES → USDT
 *
 * Es decir, cuánto VES necesitamos para
 * comprar 1 USDT.
 */
export async function getBinanceUsdtRate(): Promise<ExchangeRate> {
    const url =
        `${BINANCE_P2P_QUOTE_URL}` +
        `?fiat=VES` +
        `&asset=USDT` +
        `&tradeType=BUY`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Error obteniendo tasa Binance: HTTP ${response.status}`
        );
    }

    const data =
        (await response.json()) as BinanceQuoteResponse;

    const rate =
        extractBinanceRate(data);

    return {
        id: "rate_binance_usdt_ves",
        source: "BINANCE_P2P",
        baseCurrency: "USDT",
        quoteCurrency: "VES",
        rate,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Guarda una tasa en IndexedDB.
 *
 * Si existe una tasa con el mismo ID,
 * la reemplaza.
 */


/**
 * Actualiza todas las tasas externas.
 */
export async function refreshExchangeRates() {
    const results = {
        usd: null as ExchangeRate | null,
        usdt: null as ExchangeRate | null,
        errors: [] as string[],
    };

    // ==============================
    // USD / VES
    // ==============================

    try {
        const usdRate =
            await getOfficialUsdRate();

        await upsertExchangeRate(usdRate);

        results.usd = usdRate;
    } catch (error) {
        console.error(
            "❌ Error actualizando USD/VES:",
            error
        );

        results.errors.push(
            "No se pudo actualizar la tasa oficial USD/VES."
        );
    }

    // ==============================
    // USDT / VES
    // ==============================

    try {
        const usdtRate =
            await getBinanceUsdtRate();

        await upsertExchangeRate(usdtRate);

        results.usdt = usdtRate;
    } catch (error) {
        console.error(
            "❌ Error actualizando USDT/VES:",
            error
        );

        results.errors.push(
            "No se pudo actualizar la tasa USDT/VES de Binance."
        );
    }

    return results;
}

