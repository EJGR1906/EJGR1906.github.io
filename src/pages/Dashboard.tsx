import BalanceCard from "../components/dashboard/BalanceCard";
import FinancialOverview from "../components/dashboard/FinancialOverview";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import AccountsOverview from "../components/dashboard/AccountsOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import AppShell from "../components/layout/AppShell";
import { useEffect, useState } from "react";
import {
    getDashboardSummary,
    getCashFlowSeries,
    getExpensesByCategory,
    type DashboardPeriod,
    type DashboardSummary,
    type CashFlowPoint,
    type ExpenseCategoryPoint,
} from "../services/dashboardService";
import ExpenseChart from "../components/dashboard/ExpenseChart";

import { getBaseCurrency } from "../services/settingsService";

interface DashboardProps {
    onNavigate?: (label: string) => void;
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

        void loadDashboard();
    }, [baseCurrency, period]);

    if (!summary) {
        return (
            <main className="min-h-screen bg-background p-6">
                <div className="mx-auto max-w-6xl">
                    <p className="text-primary-dark">
                        No se pudo cargar la información financiera.
                    </p>
                </div>
            </main>
        );
    }

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
                        <CashFlowChart data={cashFlow} currency={baseCurrency} />

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
                        <ExpenseChart data={expensesByCategory} currency={baseCurrency} />
                    </div>
                    <RecentTransactions transactions={summary.recentTransactions} onNavigate={onNavigate} />
                </div>
            </div>
        </AppShell>
    );
}

export default Dashboard;
