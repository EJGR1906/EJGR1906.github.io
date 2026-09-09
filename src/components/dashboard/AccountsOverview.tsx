import {
    Banknote,
    Wallet,
} from "lucide-react";

import type { DashboardAccount } from "../../services/dashboardService";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";

interface AccountsOverviewProps {
    accounts: DashboardAccount[];
    onNavigate?: (label: string) => void;
}

function UsdtIcon({ size = 20 }: { size?: number; strokeWidth?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="16" cy="16" r="16" fill="#26A17B" />
            <path
                fill="#FFFFFF"
                d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
            />
        </svg>
    );
}

function AccountsOverview({
    accounts,
    onNavigate,
}: AccountsOverviewProps) {
    const getAccountIcon = (currency: string) => {
        if (currency === "USDT") {
            return UsdtIcon;
        }

        if (currency === "USD") {
            return Wallet;
        }

        return Banknote;
    };

    const formatAmount = (
        amount: number,
        currency: string,
    ) => {
        return `${amount.toLocaleString("es-VE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ${currency}`;
    };

    const groupedAccounts = useMemo(() => {
        const currencies = ["VES", "USD", "USDT"] as const;

        return currencies.map((currency) => ({
            currency,
            accounts: accounts.filter((account) => account.currency === currency),
            total: accounts
                .filter((account) => account.currency === currency)
                .reduce((sum, account) => sum + account.balance, 0),
        }));
    }, [accounts]);

    return (
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-primary/5 sm:p-6">
            <div className="mb-5">
                <p className="text-sm font-medium text-primary">
                    Tus cuentas
                </p>

                <h2 className="mt-1 text-lg font-bold text-primary-dark">
                    Dinero disponible
                </h2>

                <p className="mt-1 text-sm text-primary-dark/60">
                    Saldo actual de tus cuentas activas.
                </p>
            </div>

            {accounts.length === 0 ? (
                <div className="rounded-2xl bg-background p-6 text-center">
                    <p className="text-sm text-primary-dark/60">
                        No tienes cuentas activas.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {groupedAccounts.map((group) => {
                        const Icon = getAccountIcon(
                            group.currency,
                        );

                        return (
                            <div
                                key={group.currency}
                                className="rounded-2xl border border-primary/10 bg-background/60 p-5 transition hover:border-primary/20 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky text-primary-dark">
                                        <Icon size={20} strokeWidth={2} />
                                    </div>

                                    <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                                        {group.currency}
                                    </span>
                                </div>

                                <div className="mt-5">
                                    <p className="text-sm font-medium text-primary-dark/60">
                                        Balance agrupado
                                    </p>

                                    <p className="mt-1 text-xl font-bold tracking-tight text-primary-dark">
                                        {formatAmount(
                                            group.total,
                                            group.currency,
                                        )}
                                    </p>

                                    <p className="mt-2 text-xs text-primary-dark/50">
                                        {group.accounts.length} {group.accounts.length === 1 ? "cuenta activa" : "cuentas activas"}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => onNavigate?.(`Balances:${group.currency}`)}
                                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
                                    >
                                        Detalles <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default AccountsOverview;

