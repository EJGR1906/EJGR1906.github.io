import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

import type { CurrencyCode } from "../../database/db";
import type { ExpenseCategoryPoint } from "../../services/dashboardService";

interface ExpenseChartProps {
    data: ExpenseCategoryPoint[];
    currency: CurrencyCode;
}

function ExpenseChart({ data, currency }: ExpenseChartProps) {
    const total = data.reduce(
        (sum, item) => sum + item.amount,
        0,
    );
    const currencySymbol =
        currency === "VES" ? "Bs. " : currency === "USDT" ? "USDT " : "$";

    const formatAmount = (amount: number) =>
        `${currencySymbol}${amount.toLocaleString("es-VE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    return (
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div>
                <p className="text-sm font-medium text-primary">
                    Distribución de gastos
                </p>

                <h2 className="mt-1 text-lg font-bold text-primary-dark">
                    ¿En qué estás gastando?
                </h2>

                <p className="mt-1 text-sm text-primary-dark/60">
                    Gastos agrupados por categoría.
                </p>
            </div>

            {data.length === 0 ? (
                <div className="flex h-72 items-center justify-center">
                    <p className="text-sm text-primary-dark/50">
                        No hay gastos en este período.
                    </p>
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="amount"
                                    nameKey="categoryName"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    strokeWidth={0}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={entry.categoryId}
                                            fill={
                                                [
                                                    "var(--color-primary)",
                                                    "var(--color-success)",
                                                    "var(--color-sky)",
                                                    "var(--color-primary-dark)",
                                                    "var(--color-chart-cyan)",
                                                    "var(--color-chart-slate)",
                                                ][index % 6]
                                            }
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value) => [
                                        formatAmount(Number(value)),
                                        "Gastos",
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div
                                key={item.categoryId}
                                className="flex items-center justify-between gap-4"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: [
                                                "var(--color-primary)",
                                                "var(--color-success)",
                                                "var(--color-sky)",
                                                "var(--color-primary-dark)",
                                                "var(--color-chart-cyan)",
                                                "var(--color-chart-slate)",
                                            ][index % 6],
                                        }}
                                    />

                                    <span className="truncate text-sm text-primary-dark">
                                        {item.categoryName}
                                    </span>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold text-primary-dark">
                                        {formatAmount(item.amount)}
                                    </p>

                                    <p className="text-xs text-primary-dark/50">
                                        {item.percentage.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div className="border-t border-primary-dark/10 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-primary-dark/60">
                                    Total
                                </span>

                                <span className="text-sm font-bold text-primary-dark">
                                    {formatAmount(total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default ExpenseChart;