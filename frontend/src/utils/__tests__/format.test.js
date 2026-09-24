import { describe, it, expect } from "vitest";
import { formatCurrency, formatMarketCap, formatPercent, changeColorClass } from "../format";

describe("formatCurrency", () => {
  it("formats a number as Indian Rupees with the en-IN grouping", () => {
    expect(formatCurrency(385000)).toBe("₹3,85,000.00");
  });

  it("returns an em dash for null/undefined/NaN", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(NaN)).toBe("—");
  });
});

describe("formatMarketCap", () => {
  it("formats values >= 1 crore in Cr", () => {
    expect(formatMarketCap(1234567890)).toBe("₹123.46 Cr");
  });

  it("formats values >= 1 lakh but < 1 crore in L", () => {
    expect(formatMarketCap(250000)).toBe("₹2.50 L");
  });

  it("returns an em dash for null/undefined", () => {
    expect(formatMarketCap(null)).toBe("—");
    expect(formatMarketCap(undefined)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("prefixes positive values with a plus sign", () => {
    expect(formatPercent(5.5)).toBe("+5.50%");
  });

  it("does not double-prefix negative values", () => {
    expect(formatPercent(-3.2)).toBe("-3.20%");
  });

  it("returns an em dash for null/undefined/NaN", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });
});

describe("changeColorClass", () => {
  it("returns a gain class for positive values", () => {
    expect(changeColorClass(5)).toContain("gain");
  });

  it("returns a loss class for negative values", () => {
    expect(changeColorClass(-5)).toContain("loss");
  });

  it("returns a neutral class for zero, null, or undefined", () => {
    expect(changeColorClass(0)).toContain("slate");
    expect(changeColorClass(null)).toContain("slate");
    expect(changeColorClass(undefined)).toContain("slate");
  });
});
