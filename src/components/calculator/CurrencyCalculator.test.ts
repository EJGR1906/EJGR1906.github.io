import { describe, expect, it } from "vitest";
import { formatConvertedAmount, getValidTargetCurrency } from "./calculatorUtils";

describe("CurrencyCalculator", () => {
    it("selects a different target currency when the preferred target matches the source", () => {
        expect(getValidTargetCurrency("VES", "VES")).toBe("USD");
        expect(getValidTargetCurrency("USD", "USD")).toBe("VES");
        expect(getValidTargetCurrency("USDT", "USD")).toBe("USD");
    });

    it("formats VES outputs to USD and USDT with two decimals", () => {
        expect(formatConvertedAmount(1.234567, "VES", "USD")).toBe("1,23");
        expect(formatConvertedAmount(1.234567, "VES", "USDT")).toBe("1,23");
        expect(formatConvertedAmount(1.234567, "USD", "VES")).toBe("1,23");
        expect(formatConvertedAmount(1.234567, "USD", "USDT")).toBe("1,234567");
    });
});
