import type { CurrencyCode } from "../../database/db";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface FinancialOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  currency: CurrencyCode;
}

function FinancialOverview({
  totalIncome,
  totalExpenses,
  currency,
}: FinancialOverviewProps) {
  const symbol = currency === "VES" ? "Bs. " : currency === "USDT" ? "USDT " : "$";

  const formatAmount = (amount: number) =>
    `${symbol}${amount.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-fg">
            <ArrowDownLeft size={19} />
          </div>
          <p className="text-sm text-primary-dark/60">Ingresos</p>
        </div>

        <p className="mt-2 text-2xl font-bold text-success">
          +{formatAmount(totalIncome)}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger text-danger-fg">
            <ArrowUpRight size={19} />
          </div>
          <p className="text-sm text-primary-dark/60">Gastos</p>
        </div>

        <p className="mt-2 text-2xl font-bold text-primary-dark">
          {formatAmount(totalExpenses)}
        </p>
      </div>

    </section>
  );
}

export default FinancialOverview;