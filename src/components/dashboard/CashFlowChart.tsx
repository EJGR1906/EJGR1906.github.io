import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import type { CurrencyCode } from "../../database/db";
import type { CashFlowPoint } from "../../services/dashboardService";

interface CashFlowChartProps {
    data: CashFlowPoint[];
    currency: CurrencyCode;
}

function CashFlowChart({ data, currency }: CashFlowChartProps) {
    const currencySymbol =
        currency === "VES" ? "Bs. " : currency === "USDT" ? "USDT " : "$";

    return (
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div>
                <p className="text-sm font-medium text-primary">
                    Flujo de caja
                </p>

                <h2 className="mt-1 text-lg font-bold text-primary-dark">
                    Ingresos vs. gastos
                </h2>

                <p className="mt-1 text-sm text-primary-dark/60">
                    Comparación mensual de los últimos 12 meses.
                </p>
            </div>

            <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                        />

                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${currencySymbol}${value}`}
                        />

                        <Tooltip
                            formatter={(value, name) => [
                                `${currencySymbol}${Number(value).toLocaleString("es-VE", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}`,
                                name === "income" ? "Ingresos" : "Gastos",
                            ]}
                        />

                        <Area
                            type="monotone"
                            dataKey="income"
                            name="income"
                            stroke="var(--color-success)"
                            fill="var(--color-success)"
                            fillOpacity={0.12}
                            strokeWidth={2}
                        />

                        <Area
                            type="monotone"
                            dataKey="expense"
                            name="expense"
                            stroke="var(--color-expense)"
                            fill="var(--color-expense)"
                            fillOpacity={0.10}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    <span className="text-primary-dark/60">
                        Ingresos
                    </span>
                </div>

                <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-expense)" }} />
                    <span className="text-primary-dark/60">
                        Gastos
                    </span>
                </div>
            </div>
        </section>
    );
}

export default CashFlowChart;