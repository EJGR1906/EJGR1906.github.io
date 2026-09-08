import { Check, Moon, RefreshCw, Settings as SettingsIcon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import type { CurrencyCode, ExchangeRate } from "../database/db";
import { getAllExchangeRates } from "../repositories/exchangeRateRepository";
import { refreshExchangeRates } from "../services/exchangeRateService";
import { getBaseCurrency, getTheme, setBaseCurrency, setTheme, type AppTheme } from "../services/settingsService";

interface SettingsProps { onNavigate: (label: string) => void; }

function Settings({ onNavigate }: SettingsProps) {
    const [baseCurrency, setBaseCurrencyState] = useState<CurrencyCode>(getBaseCurrency());
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState("");
    const [theme, setThemeState] = useState<AppTheme>(getTheme());

    const loadRates = async () => setRates(await getAllExchangeRates());
    useEffect(() => {
        // IndexedDB must be loaded after the screen mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadRates();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        const result = await refreshExchangeRates();
        await loadRates();
        setMessage(result.errors.length ? result.errors.join(" ") : "Tasas actualizadas correctamente.");
        setRefreshing(false);
    };

    return (
        <AppShell activeItem="Configuración" onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-4xl">
                <header className="mb-6"><p className="text-sm font-medium text-primary">Preferencias</p><h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Configuración</h1><p className="mt-1 text-sm text-primary-dark/60">Define cómo quieres consultar tus finanzas.</p></header>
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6"><div className="flex items-center gap-2"><SettingsIcon size={19} className="text-primary" /><h2 className="font-bold text-primary-dark">Moneda base</h2></div><p className="mt-2 text-sm text-primary-dark/60">Se usa para el patrimonio y los gráficos convertidos.</p><select value={baseCurrency} onChange={(event) => { const value = event.target.value as CurrencyCode; setBaseCurrencyState(value); setBaseCurrency(value); }} className="field mt-4"><option value="USD">USD · Dólar</option><option value="VES">VES · Bolívar</option><option value="USDT">USDT · Tether</option></select><div className="mt-5 flex flex-wrap gap-4"><button type="button" onClick={() => onNavigate("Cuentas")} className="text-sm font-semibold text-primary hover:text-primary-dark">Administrar cuentas</button><button type="button" onClick={() => onNavigate("Categorías")} className="text-sm font-semibold text-primary hover:text-primary-dark">Administrar categorías</button></div></section>
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6"><div className="flex items-center gap-2"><Sun size={19} className="text-primary" /><h2 className="font-bold text-primary-dark">Apariencia</h2></div><p className="mt-2 text-sm text-primary-dark/60">Elige el contraste de toda la aplicación.</p><div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-primary-dark/5 p-1"><button type="button" onClick={() => { setThemeState("light"); setTheme("light"); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${theme === "light" ? "bg-white text-primary shadow-sm" : "text-primary-dark/60"}`}><Sun size={16} /> Claro</button><button type="button" onClick={() => { setThemeState("dark"); setTheme("dark"); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${theme === "dark" ? "bg-primary-dark text-white shadow-sm" : "text-primary-dark/60"}`}><Moon size={16} /> Oscuro</button></div></section>
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-primary-dark">Tasas de cambio</h2><p className="mt-1 text-sm text-primary-dark/60">Último dato guardado por fuente.</p></div><button type="button" onClick={() => void handleRefresh()} disabled={refreshing} title="Actualizar tasas" className="flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-sky/30 disabled:opacity-50"><RefreshCw size={18} className={refreshing ? "animate-spin" : ""} /></button></div><div className="mt-4 divide-y divide-primary-dark/5">{rates.slice(0, 6).map((rate) => <div key={rate.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-semibold text-primary-dark">{rate.baseCurrency}/{rate.quoteCurrency}</p><p className="text-xs text-primary-dark/50">{rate.source} · {new Date(rate.timestamp).toLocaleString("es-VE")}</p></div><span className="font-semibold text-primary-dark">{rate.rate.toLocaleString("es-VE", { maximumFractionDigits: 4 })}</span></div>)}</div>{message && <p className="mt-4 rounded-xl bg-background p-3 text-sm text-primary-dark/70"><Check size={15} className="mr-1 inline text-success" />{message}</p>}</section>
                </div>
            </div></div>
        </AppShell>
    );
}

export default Settings;