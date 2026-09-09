import { describe, expect, it } from "vitest";
import { parseBackup, toCsv } from "./backupService";

describe("backupService", () => {
    it("parses a versioned backup and validates references", () => {
        const backup = parseBackup(JSON.stringify({ format: "finanzas-app-backup", version: 1, exportedAt: "2026-09-08T12:00:00.000Z", accounts: [{ id: "account_1" }], categories: [], goals: [], transactions: [{ id: "transaction_1", accountId: "account_1" }], exchangeRates: [] }));
        expect(backup.accounts).toHaveLength(1);
    });

    it("rejects a movement with a missing account reference", () => {
        expect(() => parseBackup(JSON.stringify({ format: "finanzas-app-backup", version: 1, exportedAt: "2026-09-08T12:00:00.000Z", accounts: [], categories: [], goals: [], transactions: [{ id: "transaction_1", accountId: "missing" }], exchangeRates: [] }))).toThrow("cuenta inexistente");
    });

    it("escapes CSV values", () => {
        expect(toCsv([{ id: "1", description: "Pago, mensual" }])).toBe("id,description\n1,\"Pago, mensual\"");
    });
});