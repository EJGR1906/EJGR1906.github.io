import { Check, Moon, RefreshCw, Settings as SettingsIcon, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import type { CurrencyCode, ExchangeRate } from "../database/db";
import { getAllExchangeRates } from "../repositories/exchangeRateRepository";
import { refreshExchangeRates } from "../services/exchangeRateService";
import {
    getBaseCurrency,
    getBirthDate,
    getTheme,
    getUserAge,
    setBaseCurrency,
    setBirthDate,
    setTheme,
    type AppTheme,
} from "../services/settingsService";
import { exportDatabase, importDatabase, parseBackup, toCsv } from "../services/backupService";
import { useAuth } from "../context/useAuth";
import PwaInstallButton from "../components/layout/PwaInstallButton";

interface SettingsProps {
    onNavigate: (label: string) => void;
}

function Settings({ onNavigate }: SettingsProps) {
    const { configured, user, signOut } = useAuth();
    const [baseCurrency, setBaseCurrencyState] = useState<CurrencyCode>(getBaseCurrency());
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState("");
    const [theme, setThemeState] = useState<AppTheme>(getTheme());
    const [birthDate, setBirthDateState] = useState<string>(getBirthDate());
    const [userAge, setUserAgeState] = useState<number>(getUserAge());

    const loadRates = async () => setRates(await getAllExchangeRates());
    useEffect(() => {
        void getAllExchangeRates().then(setRates);
    }, []);

    const handleBirthDateChange = (date: string) => {
        setBirthDateState(date);
        setBirthDate(date);
        setUserAgeState(getUserAge());
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        const result = await refreshExchangeRates();
        await loadRates();
        setMessage(result.errors.length ? result.errors.join(" ") : "Tasas actualizadas correctamente.");
        setRefreshing(false);
    };

    const download = (content: string, filename: string, type: string) => {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        const backup = await exportDatabase();
        download(JSON.stringify(backup, null, 2), `finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    };

    const handleCsvExport = async () => {
        const backup = await exportDatabase();
        download(toCsv(backup.transactions as unknown as Record<string, unknown>[]), "finanzas-transacciones.csv", "text/csv;charset=utf-8");
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        try {
            const data = parseBackup(await file.text());
            const replace = window.confirm("¿Reemplazar todos los datos locales con este respaldo? Esta acción no se puede deshacer.");
            if (!replace) return;
            await importDatabase(data, "replace");
            setMessage("Respaldo importado correctamente. Recarga la aplicación para actualizar todas las pantallas.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "No se pudo importar el respaldo.");
        }
    };

    return (
        <AppShell activeItem="Configuración" onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-4xl">
                    <header className="mb-6">
                        <p className="text-sm font-medium text-primary">Preferencias</p>
                        <h1 className="mt-1 text-2xl font-bold text-primary-dark sm:text-3xl">Configuración</h1>
                        <p className="mt-1 text-sm text-primary-dark/60">Define cómo quieres consultar tus finanzas.</p>
                    </header>
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Perfil del Usuario */}
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center gap-2">
                                <User size={19} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">Perfil del Usuario</h2>
                            </div>
                            <label className="block text-sm font-medium text-primary-dark mt-4">
                                Fecha de Nacimiento
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => handleBirthDateChange(e.target.value)}
                                    className="field mt-1"
                                />
                            </label>
                            {birthDate && (
                                <p className="mt-2 text-xs font-semibold text-primary">
                                    Edad calculada: {userAge} años
                                </p>
                            )}
                        </section>

                        {/* Moneda Base */}
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center gap-2">
                                <SettingsIcon size={19} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">Moneda base</h2>
                            </div>
                            <select
                                value={baseCurrency}
                                onChange={(event) => {
                                    const value = event.target.value as CurrencyCode;
                                    setBaseCurrencyState(value);
                                    setBaseCurrency(value);
                                }}
                                className="field mt-4"
                            >
                                <option value="USD">USD · Dólar</option>
                                <option value="VES">VES · Bolívar</option>
                                <option value="USDT">USDT · Tether</option>
                            </select>
                            <div className="mt-5 flex flex-wrap gap-4">
                                <button type="button" onClick={() => onNavigate("Cuentas")} className="text-sm font-semibold text-primary hover:text-primary-dark">Administrar cuentas</button>
                                <button type="button" onClick={() => onNavigate("Categorías")} className="text-sm font-semibold text-primary hover:text-primary-dark">Administrar categorías</button>
                            </div>
                        </section>

                        {configured && user && <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center gap-2">
                                <User size={19} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">Cuenta sincronizada</h2>
                            </div>
                            <p className="mt-2 truncate text-sm text-primary-dark/60">{user.email}</p>
                            <button type="button" onClick={() => void signOut()} className="mt-4 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/15">Cerrar sesión</button>
                        </section>}

                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-bold text-primary-dark">Aplicación</h2>
                                    <p className="mt-1 text-sm text-primary-dark/60">Instala Cronos en tu dispositivo para abrirla como una aplicación.</p>
                                </div>
                                <PwaInstallButton />
                            </div>
                        </section>

                        {/* Apariencia */}
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center gap-2">
                                <Sun size={19} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">Apariencia</h2>
                            </div>
                            <p className="mt-2 text-sm text-primary-dark/60">Elige el contraste de toda la aplicación.</p>
                            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-primary-dark/5 p-1">
                                <button type="button" onClick={() => { setThemeState("light"); setTheme("light"); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${theme === "light" ? "bg-white text-primary shadow-sm" : "text-primary-dark/60"}`}><Sun size={16} /> Claro</button>
                                <button type="button" onClick={() => { setThemeState("dark"); setTheme("dark"); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${theme === "dark" ? "bg-primary-dark text-white shadow-sm" : "text-primary-dark/60"}`}><Moon size={16} /> Oscuro</button>
                            </div>
                        </section>

                        {/* Tasas de Cambio */}
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-bold text-primary-dark">Tasas de cambio</h2>
                                    <p className="mt-1 text-sm text-primary-dark/60">Último dato guardado por fuente.</p>
                                </div>
                                <button type="button" onClick={() => void handleRefresh()} disabled={refreshing} title="Actualizar tasas" aria-label="Actualizar tasas" className="flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-sky/30 disabled:opacity-50">
                                    <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                                </button>
                            </div>
                            <div className="mt-4 divide-y divide-primary-dark/5">
                                {rates.slice(0, 6).map((rate) => (
                                    <div key={rate.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-primary-dark">{rate.baseCurrency}/{rate.quoteCurrency}</p>
                                            <p className="text-xs text-primary-dark/50">{rate.source} · {new Date(rate.timestamp).toLocaleString("es-VE")}</p>
                                        </div>
                                        <span className="font-semibold text-primary-dark">{rate.rate.toLocaleString("es-VE", { maximumFractionDigits: 4 })}</span>
                                    </div>
                                ))}
                            </div>
                            {message && <p className="mt-4 rounded-xl bg-background p-3 text-sm text-primary-dark/70"><Check size={15} className="mr-1 inline text-success" />{message}</p>}
                        </section>

                        {/* Respaldo Local */}
                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6 lg:col-span-2">
                            <div className="flex items-center gap-2">
                                <SettingsIcon size={19} className="text-primary" />
                                <h2 className="font-bold text-primary-dark">Respaldo local</h2>
                            </div>
                            <p className="mt-2 text-sm text-primary-dark/60">Exporta tus tablas para conservar una copia o restaurarlas en este dispositivo.</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button type="button" onClick={() => void handleExport()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-sm transition hover:opacity-95">Exportar JSON</button>
                                <button type="button" onClick={() => void handleCsvExport()} className="rounded-xl border border-primary/15 px-4 py-2.5 text-sm font-semibold text-primary-dark">Exportar movimientos CSV</button>
                                <label className="cursor-pointer rounded-xl border border-primary/15 px-4 py-2.5 text-sm font-semibold text-primary-dark">Importar JSON<input type="file" accept="application/json,.json" onChange={(event) => void handleImport(event)} className="sr-only" /></label>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

export default Settings;