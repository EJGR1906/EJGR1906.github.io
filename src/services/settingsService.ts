import type { CurrencyCode } from "../database/db";
import { isCloudPersistenceEnabled } from "../database/persistence";
import { saveUserSettings } from "../repositories/userSettingsRepository";
import { getUserSettings } from "../repositories/userSettingsRepository";

const BASE_CURRENCY_KEY = "finanzas:baseCurrency";
const THEME_KEY = "finanzas:theme";
const BIRTH_DATE_KEY = "finanzas:birthDate";

export type AppTheme = "light" | "dark";

export function getBaseCurrency(): CurrencyCode {
    const value = localStorage.getItem(BASE_CURRENCY_KEY);
    return value === "VES" || value === "USDT" ? value : "USD";
}

export function setBaseCurrency(currency: CurrencyCode): void {
    localStorage.setItem(BASE_CURRENCY_KEY, currency);
    if (isCloudPersistenceEnabled()) void saveUserSettings({ baseCurrency: currency, theme: getTheme(), birthDate: getBirthDate(), phone: getPhone() });
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
    if (isCloudPersistenceEnabled()) void saveUserSettings({ baseCurrency: getBaseCurrency(), theme, birthDate: getBirthDate(), phone: getPhone() });
}

export function getBirthDate(): string {
    return localStorage.getItem(BIRTH_DATE_KEY) || "";
}

export function setBirthDate(birthDate: string): void {
    localStorage.setItem(BIRTH_DATE_KEY, birthDate);
    if (isCloudPersistenceEnabled()) void saveUserSettings({ baseCurrency: getBaseCurrency(), theme: getTheme(), birthDate, phone: getPhone() });
}

export function getPhone(): string {
    return localStorage.getItem("finanzas:phone") || "";
}

export async function syncUserSettingsFromCloud(): Promise<void> {
    if (!isCloudPersistenceEnabled()) return;
    const settings = await getUserSettings();
    if (!settings) return;
    localStorage.setItem(BASE_CURRENCY_KEY, settings.baseCurrency);
    localStorage.setItem(THEME_KEY, settings.theme);
    if (settings.birthDate) localStorage.setItem(BIRTH_DATE_KEY, settings.birthDate);
    if (settings.phone) localStorage.setItem("finanzas:phone", settings.phone);
    applyTheme(settings.theme);
}

export function getUserAge(): number {
    const birthDateStr = getBirthDate();
    if (!birthDateStr) return 30;
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 30;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age : 30;
}
