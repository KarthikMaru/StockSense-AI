import { describe, it, expect } from "vitest";
import { computePeriodReturns, filterHistoryByRange } from "../performance";

function buildHistory(days, startPrice = 100, dailyIncrement = 0.5) {
  const history = [];
  const start = new Date("2024-01-01");
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    history.push({ date: d.toISOString(), close: startPrice + i * dailyIncrement });
  }
  return history;
}

describe("computePeriodReturns", () => {
  it("returns an empty object for an empty or missing history", () => {
    expect(computePeriodReturns([])).toEqual({});
    expect(computePeriodReturns(null)).toEqual({});
  });

  it("computes a positive return for a steadily rising price series", () => {
    const history = buildHistory(400);
    const returns = computePeriodReturns(history);
    expect(returns["1M"]).toBeGreaterThan(0);
    expect(returns["1Y"]).toBeGreaterThan(returns["1M"]);
  });

  it("falls back to the earliest point when a range exceeds available history", () => {
    const history = buildHistory(400); // less than 5Y (1825 days) of data
    const returns = computePeriodReturns(history);
    // 3Y and 5Y both fall back to the same earliest point, so they should be equal
    expect(returns["3Y"]).toBe(returns["5Y"]);
  });

  it("does not depend on input order (sorts internally)", () => {
    const history = buildHistory(60);
    const shuffled = [...history].reverse();
    expect(computePeriodReturns(shuffled)).toEqual(computePeriodReturns(history));
  });
});

describe("filterHistoryByRange", () => {
  it("returns an empty array for an empty or missing history", () => {
    expect(filterHistoryByRange([], "1M")).toEqual([]);
    expect(filterHistoryByRange(null, "1M")).toEqual([]);
  });

  it("returns only points within the requested range", () => {
    const history = buildHistory(400);
    const filtered = filterHistoryByRange(history, "1M");
    expect(filtered.length).toBeLessThan(history.length);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("returns the full series when the range exceeds available history", () => {
    const history = buildHistory(400); // well under 1825 days (5Y)
    const filtered = filterHistoryByRange(history, "5Y");
    expect(filtered.length).toBe(history.length);
  });

  it("defaults to a 1-month range for an unrecognized label", () => {
    const history = buildHistory(400);
    expect(filterHistoryByRange(history, "BOGUS")).toEqual(filterHistoryByRange(history, "1M"));
  });
});
