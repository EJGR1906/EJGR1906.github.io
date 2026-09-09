import type { CurrencyCode } from "../../database/db";

export const currencies: CurrencyCode[] = [
    "VES",
    "USD",
    "USDT",
];

export function getValidTargetCurrency(
    fromCurrency: CurrencyCode,
    preferredTarget: CurrencyCode,
) {
    return preferredTarget !== fromCurrency
        ? preferredTarget
        : currencies.find((currency) => currency !== fromCurrency) ?? "USD";
}

export function formatConvertedAmount(
    value: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
) {
    const decimalPlaces = fromCurrency === "VES" && (toCurrency === "USD" || toCurrency === "USDT")
        ? 2
        : toCurrency === "VES"
            ? 2
            : 6;

    return new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimalPlaces,
    }).format(value);
}
