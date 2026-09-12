import BalanceCard from "../components/dashboard/BalanceCard";
import FinancialOverview from "../components/dashboard/FinancialOverview";
import AccountsOverview from "../components/dashboard/AccountsOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import AppShell from "../components/layout/AppShell";
import { useEffect, useState, lazy, Suspense } from "react";
import {
    getDashboardSummary,
    getCashFlowSeries,
    getExpensesByCategory,
    type DashboardPeriod,
    type DashboardSummary,
    type CashFlowPoint,
    type ExpenseCategoryPoint,
} from "../services/dashboardService";
import type { CurrencyCode } from "../database/db";
import { getBaseCurrency } from "../services/settingsService";

const CashFlowChart = lazy(() => import("../components/dashboard/CashFlowChart"));
const ExpenseChart = lazy(() => import("../components/dashboard/ExpenseChart"));

interface DashboardProps {
    onNavigate?: (label: string) => void;
}

function ChartSkeleton({ title }: { title: string }) {
    return (
        <div className="flex h-[320px] w-full flex-col justify-between rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
            <div>
                <p className="h-5 w-40 animate-pulse rounded bg-slate-200 text-sm font-semibold">{title}</p>
                <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="flex h-44 w-full items-end gap-3 pt-6">
                {[40, 65, 30, 85, 55, 75, 45].map((val, idx) => (
                    <div
                        key={idx}
                        className="flex-1 animate-pulse rounded-t bg-slate-100"
                        style={{ height: `${val}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

function DashboardSkeleton({ onNavigate }: { onNavigate?: (label: string) => void }) {
    return (
        <AppShell onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Header */}
                    <div>
                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-8 w-64 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
                    </div>

                    {/* Period selector */}
                    <div className="flex h-10 w-72 animate-pulse rounded-xl bg-slate-200/60" />

                    {/* Balance card */}
                    <div className="h-40 w-full animate-pulse rounded-3xl bg-primary-dark/80" />

                    {/* Overview */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-primary/5" />
                        <div className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-primary/5" />
                    </div>

                    {/* Accounts */}
                    <div className="h-32 w-full animate-pulse rounded-3xl bg-white ring-1 ring-primary/5" />

                    {/* Charts */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <ChartSkeleton title="Flujo de caja" />
                        <div className="h-[320px] animate-pulse rounded-3xl bg-white ring-1 ring-primary/5" />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

function createEmptySummary(currency: CurrencyCode): DashboardSummary {
    return {
        baseCurrency: currency,
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        savingsRate: 0,
        accounts: [],
        expensesByCategory: [],
        recentTransactions: [],
    };
}

function Dashboard({ onNavigate }: DashboardProps) {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [cashFlow, setCashFlow] =
        useState<CashFlowPoint[]>([]);
    const [expensesByCategory, setExpensesByCategory] =
        useState<ExpenseCategoryPoint[]>([]);
    const [period, setPeriod] = useState<DashboardPeriod>("month");
    const baseCurrency = getBaseCurrency();

    useEffect(() => {
        const loadDashboard = async () => {
            const data = await getDashboardSummary(
                baseCurrency,
                period,
            );

            const cashFlowData = await getCashFlowSeries(
                baseCurrency,
                period,
            );

            const expenseData = await getExpensesByCategory(
                baseCurrency,
                period,
            );

            setSummary(data);
            setCashFlow(cashFlowData);
            setExpensesByCategory(expenseData);
        };

        void loadDashboard().catch((error: unknown) => {
            console.error("No se pudo cargar el resumen financiero", error);
            setSummary(createEmptySummary(baseCurrency));
            setCashFlow([]);
            setExpensesByCategory([]);
        });
    }, [baseCurrency, period]);

    if (!summary) return <DashboardSkeleton onNavigate={onNavigate} />;

    return (

        <AppShell onNavigate={onNavigate}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl">

                    {/* Encabezado */}
                    <header className="mb-6 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-primary">
                                Resumen financiero
                            </p>

                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary-dark sm:text-3xl">
                                Tu dinero, bajo control.
                            </h1>

                            <p className="mt-1 text-sm text-primary-dark/60">
                                Consulta el estado de tus finanzas y toma mejores decisiones.
                            </p>
                        </div>

                    </header>

                    {/* Selector de perÃ­odo */}
                    <div className="mb-6 flex overflow-x-auto rounded-xl bg-primary-dark/5 p-1">
                        <button
                            onClick={() => setPeriod("week")}
                            className={period === "week"
                                ? "whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm"
                                : "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-primary-dark/60 transition hover:text-primary-dark"
                            }
                        >
                            Esta semana
                        </button>

                        <button
                            onClick={() => setPeriod("month")}
                            className={period === "month"
                                ? "whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm"
                                : "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-primary-dark/60 transition hover:text-primary-dark"
                            }
                        >
                            Este mes
                        </button>

                        <button
                            onClick={() => setPeriod("year")}
                            className={period === "year"
                                ? "whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm"
                                : "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-primary-dark/60 transition hover:text-primary-dark"
                            }
                        >
                            Este año
                        </button>

                        <button
                            onClick={() => setPeriod("all")}
                            className={period === "all"
                                ? "whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm"
                                : "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-primary-dark/60 transition hover:text-primary-dark"
                            }
                        >
                            Todo
                        </button>
                    </div>

                    {/* Patrimonio */}
                    <BalanceCard
                        totalBalance={summary.totalBalance}
                        currency={baseCurrency}
                    />

                    {/* Resumen financiero */}
                    <FinancialOverview
                        totalIncome={summary.totalIncome}
                        totalExpenses={summary.totalExpenses}
                        currency={baseCurrency}
                    />
                    <AccountsOverview
                        accounts={summary.accounts}
                        onNavigate={onNavigate}
                    />
                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <Suspense fallback={<ChartSkeleton title="Flujo de caja" />}>
                            <CashFlowChart data={cashFlow} currency={baseCurrency} />
                        </Suspense>

                        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
                            <h2 className="font-bold text-primary-dark">
                                Resumen del período
                            </h2>

                            <p className="mt-1 text-xs text-primary-dark/50">
                                Una vista rápida de tu actividad financiera.
                            </p>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-primary-dark/60">
                                        Ingresos
                                    </span>

                                    <span className="font-semibold text-success">
                                        +${summary.totalIncome.toFixed(2)}
                                    </span>
                                </div>

                                <div className="h-px bg-primary/10" />

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-primary-dark/60">
                                        Gastos
                                    </span>

                                    <span className="font-semibold text-primary-dark">
                                        ${summary.totalExpenses.toFixed(2)}
                                    </span>
                                </div>

                                <div className="h-px bg-primary/10" />

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-primary-dark/60">
                                        Resultado neto
                                    </span>

                                    <span className="font-semibold text-primary">
                                        ${summary.savings.toFixed(2)}
                                    </span>
                                </div>

                                <div className="rounded-2xl bg-sky/30 p-4">
                                    <p className="text-xs text-primary-dark/60">
                                        Tasa de ahorro
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-primary-dark">
                                        {summary.savingsRate.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div className="mt-6">
                        <Suspense fallback={<ChartSkeleton title="Gastos por categoría" />}>
                            <ExpenseChart data={expensesByCategory} currency={baseCurrency} />
                        </Suspense>
                    </div>
                    <RecentTransactions transactions={summary.recentTransactions} onNavigate={onNavigate} />
                </div>
            </div>
        </AppShell>
    );
}

export default Dashboard;
