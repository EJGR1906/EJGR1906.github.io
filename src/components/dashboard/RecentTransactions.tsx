import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import type { Transaction } from "../../database/db";

interface RecentTransactionsProps {
    transactions: Transaction[];
    onNavigate?: (label: string) => void;
}

function RecentTransactions({
    transactions,
    onNavigate,
}: RecentTransactionsProps) {
    const formatAmount = (amount: number | undefined, currency?: string) => {
        const safeAmount = amount ?? 0;
        const safeCurrency = currency ?? "VES";

        return `${safeAmount.toLocaleString("es-VE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ${safeCurrency}`;
    };

    const formatDate = (date?: string | null) => {
        if (!date) return "Sin fecha";

        return new Date(date).toLocaleDateString("es-VE", {
            day: "2-digit",
            month: "short",
        });
    };

    return (
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-primary">
                        Actividad reciente
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-primary-dark">
                        Últimas transacciones
                    </h2>
                    <p className="mt-1 text-sm text-primary-dark/60">
                        Tus movimientos financieros más recientes.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onNavigate?.("Movimientos")}
                    className="hidden rounded-xl px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 sm:block"
                >
                    Ver todas
                </button>
            </div>

            {transactions.length === 0 ? (
                <div className="mt-5 flex flex-col items-center justify-center rounded-2xl bg-background px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky text-primary-dark">
                        <Receipt size={22} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-primary-dark">
                        No hay transacciones todavía
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-primary-dark/50">
                        Cuando registres ingresos o gastos, aparecerán aquí.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mt-5 divide-y divide-primary-dark/5">
                        {transactions.map((transaction) => {
                            const isIncome = transaction.type === "income";

                            return (
                                <div
                                    key={transaction.id}
                                    className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isIncome ? "bg-success/10 text-success" : "bg-primary/5 text-primary"}`}
                                    >
                                        {isIncome ? (
                                            <ArrowDownLeft size={19} />
                                        ) : (
                                            <ArrowUpRight size={19} />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-primary-dark">
                                            {transaction.description ||
                                                (isIncome ? "Ingreso" : "Gasto")}
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <span className="text-xs text-primary-dark/50">
                                                {formatDate(transaction.date)}
                                            </span>
                                            <span className="text-primary-dark/20">•</span>
                                            <span className="text-xs text-primary-dark/50">
                                                {transaction.currency}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p
                                            className={`text-sm font-bold ${isIncome ? "text-success" : "text-primary-dark"}`}
                                        >
                                            {isIncome ? "+" : "-"}{" "}
                                            {formatAmount(transaction.amount, transaction.currency)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => onNavigate?.("Movimientos")}
                        className="mt-5 w-full rounded-xl border border-primary/10 py-2.5 text-sm font-medium text-primary transition hover:border-primary/20 hover:bg-primary/5 sm:hidden"
                    >
                        Ver todas las transacciones
                    </button>
                </>
            )}
        </section>
    );
}

export default RecentTransactions;