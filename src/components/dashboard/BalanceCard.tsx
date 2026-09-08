import type { CurrencyCode } from "../../database/db";

interface BalanceCardProps {
  totalBalance: number;
  savings: number;
  savingsRate: number;
  currency: CurrencyCode;
}

function BalanceCard({
  totalBalance,
  savings,
  savingsRate,
  currency,
}: BalanceCardProps) {
  const savingsIsPositive = savings >= 0;
  const currencySymbol =
    currency === "VES" ? "Bs. " : currency === "USDT" ? "USDT " : "$";

  const formatAmount = (amount: number) =>
    `${currencySymbol}${Math.abs(amount).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="overflow-hidden rounded-3xl bg-primary-dark p-6 text-white shadow-sm sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-sky">
            Patrimonio total
          </p>

          <p className="mt-1 text-xs text-white/50">
            Todas tus cuentas
          </p>
        </div>

        <div className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky">
          {currency}
        </div>
      </div>

      <p className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
        {formatAmount(totalBalance)}
      </p>

      <div className="my-6 h-px bg-white/10" />

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-white/50">
            Ahorro del período
          </p>

          <p
            className={`mt-1 text-xl font-bold ${savingsIsPositive
              ? "text-success"
              : "text-red-300"
              }`}
          >
            {savingsIsPositive ? "+" : "-"}
            {formatAmount(savings)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-white/50">
            Tasa de ahorro
          </p>

          <p
            className={`mt-1 text-xl font-bold ${savingsIsPositive
              ? "text-success"
              : "text-red-300"
              }`}
          >
            {savingsRate.toFixed(2)}%
          </p>
        </div>
      </div>
    </section>
  );
}

export default BalanceCard;