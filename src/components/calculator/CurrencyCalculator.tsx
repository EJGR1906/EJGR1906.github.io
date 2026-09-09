import { useEffect, useState } from "react";
import { ArrowDownUp, RefreshCw, Save } from "lucide-react";

import type { CurrencyCode } from "../../database/db";
import { convertCurrency } from "../../services/currencyService";
import {
    getLatestExchangeRate,
    upsertExchangeRate,
    deleteExchangeRate,
} from "../../repositories/exchangeRateRepository";
import {
    refreshExchangeRates,
} from "../../services/exchangeRateService";
import {
    currencies,
    formatConvertedAmount,
    getValidTargetCurrency,
} from "./calculatorUtils";

interface CurrencyCalculatorProps {
    defaultFrom?: CurrencyCode;
    defaultTo?: CurrencyCode;
}

const currencyLabels: Record<
    CurrencyCode,
    string
> = {
    VES: "VES",
    USD: "USD",
    USDT: "USDT",
};

const currencyNames: Record<
    CurrencyCode,
    string
> = {
    VES: "Bolívares",
    USD: "Dólares",
    USDT: "Tether",
};

function formatNumber(
    value: number,
    currency: CurrencyCode
) {
    return new Intl.NumberFormat(
        "es-VE",
        {
            minimumFractionDigits:
                currency === "VES" ? 2 : 2,
            maximumFractionDigits:
                currency === "VES" ? 2 : 6,
        }
    ).format(value);
}

export function CurrencyCalculator({
    defaultFrom = "USD",
    defaultTo = "VES",
}: CurrencyCalculatorProps) {
    const [fromCurrency, setFromCurrency] =
        useState<CurrencyCode>(defaultFrom);

    const [toCurrency, setToCurrency] =
        useState<CurrencyCode>(() =>
            getValidTargetCurrency(defaultFrom, defaultTo)
        );

    const [amount, setAmount] =
        useState("1");

    const [convertedAmount, setConvertedAmount] =
        useState<number | null>(null);

    const [rate, setRate] =
        useState<number | null>(null);

    const [source, setSource] =
        useState<string | null>(null);

    const [timestamp, setTimestamp] =
        useState<string | null>(null);

    const [manualRateInput, setManualRateInput] =
        useState("150");

    const [savingManualRate, setSavingManualRate] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [refreshKey, setRefreshKey] =
        useState(0);

    const isUsdVesPair =
        (fromCurrency === "USD" && toCurrency === "VES") ||
        (fromCurrency === "VES" && toCurrency === "USD");
    const targetCurrencies = currencies.filter(
        (currency) => currency !== fromCurrency,
    );

    useEffect(() => {
        let cancelled = false;

        const initializeRates = async () => {
            const result = await refreshExchangeRates();
            const officialRate = result.usd ?? await getLatestExchangeRate("USD", "VES", "BCV");

            await deleteExchangeRate("rate_manual_usd_ves");

            if (officialRate) {
                await upsertExchangeRate({
                    id: "rate_manual_usd_ves",
                    source: "MANUAL",
                    baseCurrency: "USD",
                    quoteCurrency: "VES",
                    rate: officialRate.rate,
                    timestamp: new Date().toISOString(),
                });
            }

            if (!cancelled) {
                setRefreshKey((current) => current + 1);
            }
        };

        void initializeRates();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadCalculatorData = async () => {
            const numericAmount =
                Number(amount.replace(",", "."));

            if (isUsdVesPair) {
                const manualRate = await getLatestExchangeRate(
                    "USD",
                    "VES",
                    "MANUAL"
                );
                const officialRate = manualRate
                    ? undefined
                    : await getLatestExchangeRate("USD", "VES", "BCV");

                const effectiveRate = manualRate?.rate ?? officialRate?.rate ?? null;

                if (cancelled) {
                    return;
                }

                setRate(effectiveRate);
                setSource(
                    manualRate ? "MANUAL" : officialRate ? "BCV" : null
                );
                setTimestamp(
                    manualRate?.timestamp ?? officialRate?.timestamp ?? null
                );
                setManualRateInput(
                    effectiveRate !== null
                        ? String(effectiveRate)
                        : "150"
                );

                if (
                    Number.isFinite(numericAmount) &&
                    numericAmount >= 0 &&
                    effectiveRate !== null
                ) {
                    const converted =
                        fromCurrency === "USD"
                            ? numericAmount * effectiveRate
                            : numericAmount / effectiveRate;

                    setConvertedAmount(converted);
                } else {
                    setConvertedAmount(null);
                }

                setLoading(false);
                return;
            }

            const [exchangeRate, result] =
                await Promise.all([
                    getLatestExchangeRate(
                        fromCurrency,
                        toCurrency
                    ),
                    Number.isFinite(numericAmount) &&
                        numericAmount >= 0
                        ? convertCurrency(
                            numericAmount,
                            fromCurrency,
                            toCurrency
                        )
                        : Promise.resolve(null),
                ]);

            if (cancelled) {
                return;
            }

            setRate(
                exchangeRate?.rate ??
                result?.rate ??
                null
            );
            setSource(
                exchangeRate?.source ?? null
            );
            setTimestamp(
                exchangeRate?.timestamp ?? null
            );
            setConvertedAmount(
                result?.amount ?? null
            );
            setLoading(false);
        };

        void loadCalculatorData();

        return () => {
            cancelled = true;
        };
    }, [
        amount,
        fromCurrency,
        toCurrency,
        refreshKey,
        isUsdVesPair,
    ]);

    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const handleRefreshRates =
        async () => {
            setRefreshing(true);

            try {
                await refreshExchangeRates();
                await deleteExchangeRate("rate_manual_usd_ves");
                setRefreshKey((current) => current + 1);
            } finally {
                setRefreshing(false);
            }
        };

    const handleSaveManualRate = async () => {
        const nextValue = Number(manualRateInput.replace(",", "."));

        if (!Number.isFinite(nextValue) || nextValue <= 0) {
            return;
        }

        setSavingManualRate(true);

        try {
            await upsertExchangeRate({
                id: "rate_manual_usd_ves",
                source: "MANUAL",
                baseCurrency: "USD",
                quoteCurrency: "VES",
                rate: nextValue,
                timestamp: new Date().toISOString(),
            });

            setRefreshKey((current) => current + 1);
        } finally {
            setSavingManualRate(false);
        }
    };

    return (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-slate-200">
            {/* Header */}

            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-primary-dark">
                        Calculadora
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Convierte entre VES, USD y USDT
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRefreshRates}
                    disabled={refreshing}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-sky-50 hover:text-primary disabled:opacity-50"
                    title="Actualizar tasas"
                >
                    <RefreshCw
                        size={17}
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />
                </button>
            </div>

            {/* From */}

            <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    De
                </label>

                <div className="flex gap-2">
                    <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) =>
                            setAmount(event.target.value)
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-primary-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />

                    <select
                        value={fromCurrency}
                        onChange={(event) => {
                            const nextFromCurrency = event.target.value as CurrencyCode;
                            setFromCurrency(nextFromCurrency);
                            setToCurrency((currentToCurrency) =>
                                getValidTargetCurrency(nextFromCurrency, currentToCurrency)
                            );
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold text-primary-dark outline-none focus:border-primary"
                    >
                        {currencies.map(
                            (currency) => (
                                <option
                                    key={currency}
                                    value={currency}
                                >
                                    {currency}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                    {currencyNames[fromCurrency]}
                </p>
            </div>

            {/* Swap */}

            <div className="my-4 flex justify-center">
                <button
                    type="button"
                    onClick={swapCurrencies}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary transition hover:bg-sky-50"
                    title="Intercambiar monedas"
                >
                    <ArrowDownUp size={17} />
                </button>
            </div>

            {/* To */}

            <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    A
                </label>

                <div className="flex gap-2">
                    <div className="min-w-0 flex-1 rounded-xl bg-sky-50 px-4 py-3">
                        <span className="block truncate text-lg font-semibold text-primary-dark">
                            {loading
                                ? "Calculando..."
                                : convertedAmount !== null
                                    ? formatConvertedAmount(
                                        convertedAmount,
                                        fromCurrency,
                                        toCurrency
                                    )
                                    : "—"}
                        </span>
                    </div>

                    <select
                        value={toCurrency}
                        onChange={(event) =>
                            setToCurrency(
                                event.target.value as CurrencyCode
                            )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold text-primary-dark outline-none focus:border-primary"
                    >
                        {targetCurrencies.map(
                            (currency) => (
                                <option
                                    key={currency}
                                    value={currency}
                                >
                                    {currency}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                    {currencyNames[toCurrency]}
                </p>
            </div>

            {/* Rate information */}

            <div className="mt-5 border-t border-slate-100 pt-4">
                {rate !== null ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                                Tasa
                            </span>

                            <span className="font-medium text-primary-dark">
                                1 {currencyLabels[fromCurrency]}
                                {" = "}
                                {formatNumber(
                                    rate,
                                    toCurrency
                                )}{" "}
                                {currencyLabels[toCurrency]}
                            </span>
                        </div>

                        {isUsdVesPair && (
                            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Tasa manual USD/VES
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={manualRateInput}
                                        onChange={(event) =>
                                            setManualRateInput(
                                                event.target.value
                                            )
                                        }
                                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-primary-dark outline-none focus:border-primary"
                                    />

                                    <button
                                        type="button"
                                        onClick={handleSaveManualRate}
                                        disabled={savingManualRate}
                                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-sky transition hover:bg-primary-dark disabled:opacity-60"
                                    >
                                        <Save size={14} />
                                        {savingManualRate ? "Guardando..." : "Guardar"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {source && (
                            <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-slate-400">
                                    Fuente
                                </span>

                                <span className="text-slate-500">
                                    {source}
                                </span>
                            </div>
                        )}

                        {timestamp && (
                            <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-slate-400">
                                    Actualizado
                                </span>

                                <span className="text-slate-500">
                                    {new Date(
                                        timestamp
                                    ).toLocaleString(
                                        "es-VE",
                                        {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        }
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">
                        No hay una tasa disponible para esta conversión.
                    </p>
                )}
            </div>
        </section>
    );
}