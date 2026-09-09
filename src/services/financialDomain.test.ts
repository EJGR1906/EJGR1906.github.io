import { describe, expect, it } from "vitest";
import type { Account, Transaction } from "../database/db";
import {
    calculateAccountBalance,
    calculateAvailableBalance,
    calculateCommittedAmount,
} from "./financialDomain";

const asset: Account = {
    id: "cash",
    name: "Efectivo",
    type: "cash",
    currency: "USD",
    initialBalance: 100,
    active: true,
    nature: "asset",
};

const liability: Account = {
    ...asset,
    id: "card",
    name: "Tarjeta",
    nature: "liability",
    creditLimit: 500,
};

function transaction(overrides: Partial<Transaction>): Transaction {
    return { id: crypto.randomUUID(), type: "income", date: "2026-09-08", createdAt: "2026-09-08T12:00:00.000Z", ...overrides };
}

describe("financial domain", () => {
    it("reconstructs an asset balance from income, expense and transfers", () => {
        const transactions = [
            transaction({ type: "income", accountId: "cash", amount: 50, currency: "USD" }),
            transaction({ type: "expense", accountId: "cash", amount: 20, currency: "USD" }),
            transaction({ type: "transfer", fromAccountId: "cash", fromAmount: 10, fromCurrency: "USD", toAccountId: "other", toAmount: 10, toCurrency: "USD" }),
        ];

        expect(calculateAccountBalance(asset, transactions)).toBe(120);
    });

    it("treats liability income as debt reduction and expenses as debt", () => {
        const transactions = [
            transaction({ type: "expense", accountId: "card", amount: 80, currency: "USD" }),
            transaction({ type: "income", accountId: "card", amount: 30, currency: "USD" }),
        ];

        expect(calculateAccountBalance(liability, transactions)).toBe(150);
    });

    it("keeps goal commitments separate from physical balance", () => {
        const transactions = [
            transaction({ type: "goal_contribution", accountId: "cash", goalId: "goal", amount: 35, currency: "USD" }),
            transaction({ type: "goal_withdrawal", accountId: "cash", goalId: "goal", amount: 5, currency: "USD" }),
        ];

        expect(calculateAccountBalance(asset, transactions)).toBe(100);
        expect(calculateCommittedAmount("cash", "USD", transactions)).toBe(30);
        expect(calculateAvailableBalance(100, 30)).toBe(70);
    });

    it("excludes the edited transaction from the reconstruction", () => {
        const current = transaction({ id: "current", type: "expense", accountId: "cash", amount: 25, currency: "USD" });

        expect(calculateAccountBalance(asset, [current], "current")).toBe(100);
    });
});