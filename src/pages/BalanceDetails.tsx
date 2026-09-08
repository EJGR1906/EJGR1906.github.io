import { ArrowLeft, Banknote, Bitcoin, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import type { CurrencyCode } from "../database/db";
import { getDashboardSummary, type DashboardAccount } from "../services/dashboardService";

interface BalanceDetailsProps {
    currency: CurrencyCode;
    onNavigate: (label: string) => void;
}

const labels: Record<CurrencyCode, string> = { VES: "Bolívares", USD: "Dólares", USDT: "Tether" };

function BalanceDetails({ currency, onNavigate }: BalanceDetailsProps) {
    const [accounts, setAccounts] = useState<DashboardAccount[]>([]);

    useEffect(() => {
        void getDashboardSummary("USD", "all").then((summary) => {
            setAccounts(summary.accounts.filter((account) => account.currency === currency));
        });
    }, [currency]);

    const total = accounts.reduce((sum, account) => sum + account.balance, 0);
    const Icon = currency === "USDT" ? Bitcoin : currency === "USD" ? Wallet : Banknote;

    return (
        <AppShell activeItem="Inicio" onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-4xl">
                    <button type="button" onClick={() => onNavigate("Inicio")} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"><ArrowLeft size={17} /> Volver al inicio</button>
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky text-primary-dark"><Icon size={23} /></div>
                            <div>
                                <p className="text-sm font-medium text-primary">Balance por moneda</p>
                                <h1 className="mt-1 text-2xl font-bold text-primary-dark">{labels[currency]}</h1>
                                <p className="mt-2 text-2xl font-bold text-primary-dark">{total.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</p>
                            </div>
                        </div>
                        <div className="mt-6 divide-y divide-primary-dark/5">
                            {accounts.length === 0 ? <p className="rounded-2xl bg-background p-5 text-sm text-primary-dark/60">No hay cuentas activas en esta moneda.</p> : accounts.map((account) => (
                                <div key={account.id} className="flex items-center justify-between gap-4 py-4 first:pt-0">
                                    <div><p className="font-semibold text-primary-dark">{account.name}</p><p className="mt-1 text-sm text-primary-dark/55">{account.type}</p></div>
                                    <p className="font-bold text-primary-dark">{account.balance.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}

export default BalanceDetails;