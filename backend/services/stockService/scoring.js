const { RISK_LEVELS } = require("../../utils/constants");

/**
 * ==========================================================================
 * Stock Scoring Engine
 * ==========================================================================
 * This computes an OBJECTIVE, rule-based "Investment Score" (0-100) and a
 * risk classification for every stock, from its own fundamentals and price
 * history alone — no user profile, no external AI provider call.
 *
 * This is intentionally NOT the personalized recommendation engine (that's
 * Phase 6, which additionally factors in a user's risk tolerance, goal, and
 * preferred sectors, and may call the configured AI provider for natural-
 * language rationale). This score answers "how strong does this stock look
 * on its own merits?", not "is this a good fit for you?".
 * ==========================================================================
 */

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalizes `value` from the range [min, max] to a 0-100 scale, clamped.
 */
function normalize(value, min, max) {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return clamp(((value - min) / (max - min)) * 100);
}

/**
 * Computes annualized volatility (%) from a daily OHLCV series, using the
 * standard deviation of daily log returns scaled to a 252-trading-day year.
 * This is a standard, widely-used volatility estimate — not a guarantee of
 * future price behavior.
 */
function calculateVolatility(series) {
  if (!series || series.length < 2) return 0;

  const logReturns = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].close;
    const curr = series[i].close;
    if (prev > 0 && curr > 0) {
      logReturns.push(Math.log(curr / prev));
    }
  }

  if (logReturns.length === 0) return 0;

  const mean = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length;
  const variance =
    logReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / logReturns.length;
  const dailyStdDev = Math.sqrt(variance);
  const annualizedVolatilityPct = dailyStdDev * Math.sqrt(252) * 100;

  return Math.round(annualizedVolatilityPct * 100) / 100;
}

/**
 * Classifies annualized volatility into Low / Medium / High risk, using
 * illustrative thresholds typical of Indian large/mid/small-cap equities.
 */
function deriveRiskLevel(volatility) {
  if (volatility < 18) return RISK_LEVELS[0]; // "Low"
  if (volatility < 32) return RISK_LEVELS[1]; // "Medium"
  return RISK_LEVELS[2]; // "High"
}

/**
 * Computes the composite 0-100 Investment Score from a stock's own
 * fundamentals, performance and volatility. Weights:
 *   35% historical performance (1-year return)
 *   35% financial health (ROE, ROCE, debt relative to revenue)
 *   20% stability (inverse of volatility)
 *   10% dividend yield
 */
function calculateAIScore({ oneYearReturn, roe, roce, debt, revenue, dividendYield, volatility }) {
  const performanceScore = normalize(oneYearReturn ?? 0, -20, 60);

  const roeNorm = normalize(roe ?? 0, 0, 40);
  const roceNorm = normalize(roce ?? 0, 0, 40);
  const debtToRevenue = revenue > 0 ? (debt || 0) / revenue : 0;
  const debtScore = clamp(100 - debtToRevenue * 30);
  const financialHealthScore = roeNorm * 0.4 + roceNorm * 0.4 + debtScore * 0.2;

  const stabilityScore = clamp(100 - (volatility || 0) * 2);

  const dividendScore = normalize(dividendYield ?? 0, 0, 6);

  const composite =
    performanceScore * 0.35 + financialHealthScore * 0.35 + stabilityScore * 0.2 + dividendScore * 0.1;

  return {
    aiScore: Math.round(clamp(composite)),
    subscores: {
      performanceScore: Math.round(performanceScore),
      financialHealthScore: Math.round(financialHealthScore),
      stabilityScore: Math.round(stabilityScore),
      dividendScore: Math.round(dividendScore),
    },
  };
}

/**
 * Generates short, plain-language reasons behind a stock's score —
 * both positive highlights and honest cautions. Never claims guaranteed
 * returns; only describes historical/fundamental facts.
 */
function buildScoreReasons({ oneYearReturn, roe, roce, dividendYield, volatility, riskLevel }, subscores) {
  const reasons = [];

  if (subscores.performanceScore >= 65 && oneYearReturn !== null && oneYearReturn !== undefined) {
    reasons.push(`Strong 1-year historical return of ${oneYearReturn > 0 ? "+" : ""}${oneYearReturn}%`);
  } else if (subscores.performanceScore <= 30 && oneYearReturn !== null && oneYearReturn !== undefined) {
    reasons.push(`Weak 1-year historical return of ${oneYearReturn > 0 ? "+" : ""}${oneYearReturn}%`);
  }

  if (subscores.financialHealthScore >= 65) {
    reasons.push(`Healthy fundamentals — ROE of ${roe ?? "—"}% and ROCE of ${roce ?? "—"}%`);
  } else if (subscores.financialHealthScore <= 35) {
    reasons.push("Comparatively weaker fundamentals or higher debt relative to revenue");
  }

  if (subscores.stabilityScore >= 65) {
    reasons.push(`Relatively stable price history (${riskLevel} risk classification)`);
  } else if (subscores.stabilityScore <= 35) {
    reasons.push(`Higher price volatility (${riskLevel} risk classification) — suited to a higher risk tolerance`);
  }

  if (dividendYield && dividendYield >= 2) {
    reasons.push(`Notable dividend yield of ${dividendYield}%`);
  }

  return reasons.slice(0, 4);
}

module.exports = {
  clamp,
  normalize,
  calculateVolatility,
  deriveRiskLevel,
  calculateAIScore,
  buildScoreReasons,
};
