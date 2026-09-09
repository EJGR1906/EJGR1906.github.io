import { describe, expect, it } from "vitest";
import { formatConvertedAmount, getValidTargetCurrency } from "./calculatorUtils";
import { getSuggestedMonthlyContribution } from "../../services/goalService";

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

    it("calculates a monthly contribution from the remaining amount and deadline", () => {
        const referenceDate = new Date(2026, 8, 8);

        expect(getSuggestedMonthlyContribution(900, "2026-12-31", referenceDate)).toBe(300);
        expect(getSuggestedMonthlyContribution(900, "2026-09-30", referenceDate)).toBe(900);
        expect(getSuggestedMonthlyContribution(900, undefined, referenceDate)).toBeNull();
    });
});
