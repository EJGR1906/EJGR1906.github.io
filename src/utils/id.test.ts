import { describe, expect, it } from "vitest";
import { generateId } from "./id";

describe("generateId", () => {
    it("creates a stable prefix and UUID-shaped identifier", () => {
        const id = generateId("transaction");

        expect(id.startsWith("transaction_")).toBe(true);
        expect(id).toMatch(/^transaction_[0-9a-f-]{36}$/i);
    });
});
