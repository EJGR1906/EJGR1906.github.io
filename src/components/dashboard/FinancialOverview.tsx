import type { CurrencyCode } from "../../database/db";

interface FinancialOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  currency: CurrencyCode;
}

function FinancialOverview({
  totalIncome,
  totalExpenses,
  savings,
  currency,
}: FinancialOverviewProps) {
  const symbol = currency === "VES" ? "Bs. " : currency === "USDT" ? "USDT " : "$";

  const formatAmount = (amount: number) =>
    `${symbol}${amount.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-primary-dark/60">
          Ingresos
        </p>

        <p className="mt-2 text-2xl font-bold text-success">
          +{formatAmount(totalIncome)}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-primary-dark/60">
          Gastos
        </p>

        <p className="mt-2 text-2xl font-bold text-primary-dark">
          {formatAmount(totalExpenses)}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-primary-dark/60">
          Ahorro
        </p>

        <p className="mt-2 text-2xl font-bold text-primary">
          {formatAmount(savings)}
        </p>
      </div>
    </section>
  );
}

export default FinancialOverview;