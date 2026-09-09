import { supabase } from "../database/supabaseClient";
import { getActiveUserId } from "../database/persistence";
import type { AppTheme } from "../services/settingsService";
import type { CurrencyCode } from "../database/db";

export interface UserSettings {
    baseCurrency: CurrencyCode;
    theme: AppTheme;
    birthDate: string;
    phone: string;
}

function userId(): string {
    const value = getActiveUserId();
    if (!value) throw new Error("No hay una sesión activa.");
    return value;
}

export async function getUserSettings(): Promise<UserSettings | null> {
    const { data, error } = await supabase.from("user_settings").select("base_currency, theme, birth_date, phone").eq("user_id", userId()).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { baseCurrency: data.base_currency as CurrencyCode, theme: data.theme as AppTheme, birthDate: data.birth_date ?? "", phone: data.phone ?? "" };
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
    const { error } = await supabase.from("user_settings").upsert({ user_id: userId(), base_currency: settings.baseCurrency, theme: settings.theme, birth_date: settings.birthDate || null, phone: settings.phone || null, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
}
