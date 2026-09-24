const {
  calculateVolatility,
  deriveRiskLevel,
  calculateAIScore,
  buildScoreReasons,
  clamp,
  normalize,
} = require("../services/stockService/scoring");

describe("clamp", () => {
  it("keeps values within [0, 100] by default", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-10)).toBe(0);
    expect(clamp(50)).toBe(50);
  });

  it("respects custom bounds", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, -3, 3)).toBe(-3);
  });
});

describe("normalize", () => {
  it("maps a value in [min, max] to [0, 100]", () => {
    expect(normalize(0, -20, 60)).toBeCloseTo(25);
    expect(normalize(60, -20, 60)).toBe(100);
    expect(normalize(-20, -20, 60)).toBe(0);
  });

  it("returns 0 for null/undefined/NaN input", () => {
    expect(normalize(null, 0, 100)).toBe(0);
    expect(normalize(undefined, 0, 100)).toBe(0);
    expect(normalize(NaN, 0, 100)).toBe(0);
  });
});

describe("calculateVolatility", () => {
  it("returns 0 for a flat (no price movement) series", () => {
    const series = Array.from({ length: 30 }, () => ({ close: 100 }));
    expect(calculateVolatility(series)).toBe(0);
  });

  it("returns 0 for fewer than 2 data points", () => {
    expect(calculateVolatility([{ close: 100 }])).toBe(0);
    expect(calculateVolatility([])).toBe(0);
  });

  it("returns a higher volatility for a more erratic series", () => {
    const stable = [100, 101, 100, 101, 100, 101, 100, 101].map((close) => ({ close }));
    const volatile = [100, 130, 90, 140, 80, 150, 70, 160].map((close) => ({ close }));
    expect(calculateVolatility(volatile)).toBeGreaterThan(calculateVolatility(stable));
  });
});

describe("deriveRiskLevel", () => {
  it("classifies low volatility as Low risk", () => {
    expect(deriveRiskLevel(5)).toBe("Low");
  });
  it("classifies mid-range volatility as Medium risk", () => {
    expect(deriveRiskLevel(25)).toBe("Medium");
  });
  it("classifies high volatility as High risk", () => {
    expect(deriveRiskLevel(45)).toBe("High");
  });
});

describe("calculateAIScore", () => {
  it("scores a strong, stable, profitable stock highly", () => {
    const { aiScore } = calculateAIScore({
      oneYearReturn: 40,
      roe: 30,
      roce: 30,
      debt: 1000,
      revenue: 100000,
      dividendYield: 3,
      volatility: 10,
    });
    expect(aiScore).toBeGreaterThanOrEqual(70);
  });

  it("scores a weak, volatile, unprofitable stock lower", () => {
    const { aiScore } = calculateAIScore({
      oneYearReturn: -15,
      roe: 2,
      roce: 2,
      debt: 90000,
      revenue: 100000,
      dividendYield: 0,
      volatility: 45,
    });
    expect(aiScore).toBeLessThan(50);
  });

  it("always returns a score within [0, 100]", () => {
    const { aiScore } = calculateAIScore({
      oneYearReturn: 500,
      roe: 999,
      roce: 999,
      debt: 0,
      revenue: 100,
      dividendYield: 50,
      volatility: 0,
    });
    expect(aiScore).toBeLessThanOrEqual(100);
    expect(aiScore).toBeGreaterThanOrEqual(0);
  });

  it("handles missing/null fundamentals without throwing", () => {
    expect(() =>
      calculateAIScore({ oneYearReturn: null, roe: null, roce: null, debt: null, revenue: 0, dividendYield: null, volatility: 0 })
    ).not.toThrow();
  });
});

describe("buildScoreReasons", () => {
  it("returns at most 4 reasons", () => {
    const { subscores } = calculateAIScore({
      oneYearReturn: 40,
      roe: 30,
      roce: 30,
      debt: 1000,
      revenue: 100000,
      dividendYield: 5,
      volatility: 10,
    });
    const reasons = buildScoreReasons(
      { oneYearReturn: 40, roe: 30, roce: 30, dividendYield: 5, volatility: 10, riskLevel: "Low" },
      subscores
    );
    expect(reasons.length).toBeLessThanOrEqual(4);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it("never claims a guaranteed return", () => {
    const { subscores } = calculateAIScore({
      oneYearReturn: 40,
      roe: 30,
      roce: 30,
      debt: 1000,
      revenue: 100000,
      dividendYield: 5,
      volatility: 10,
    });
    const reasons = buildScoreReasons(
      { oneYearReturn: 40, roe: 30, roce: 30, dividendYield: 5, volatility: 10, riskLevel: "Low" },
      subscores
    );
    reasons.forEach((r) => {
      expect(r.toLowerCase()).not.toMatch(/guarantee/);
    });
  });
});
