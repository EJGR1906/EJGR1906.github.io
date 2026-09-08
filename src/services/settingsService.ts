import type { CurrencyCode } from "../database/db";

const BASE_CURRENCY_KEY = "finanzas:baseCurrency";
const THEME_KEY = "finanzas:theme";

export type AppTheme = "light" | "dark";

export function getBaseCurrency(): CurrencyCode {
    const value = localStorage.getItem(BASE_CURRENCY_KEY);
    return value === "VES" || value === "USDT" ? value : "USD";
}

export function setBaseCurrency(currency: CurrencyCode): void {
    localStorage.setItem(BASE_CURRENCY_KEY, currency);
}

export function getTheme(): AppTheme {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme: AppTheme): void {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: AppTheme): void {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}
