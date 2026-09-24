const stockService = require("../stockService");
const { clamp, normalize } = require("../stockService/scoring");

/**
 * ==========================================================================
 * Recommendation Service (Phase 6)
 * ==========================================================================
 * Builds on Phase 5's OBJECTIVE Investment Score (fundamentals + performance
 * + stability, the same for every user) by adding a PERSONALIZED layer that
 * factors in one specific user's risk tolerance, investment goal, and
 * preferred sectors. This is what powers "Get My Recommendations",
 * "Compare Best Stocks For Me", and "Build My Portfolio".
 * ==========================================================================
 */

const RISK_ORDER = { Low: 0, Medium: 1, High: 2 };

function riskCompatibilityScore(userRisk, stockRisk) {
  if (!userRisk || RISK_ORDER[userRisk] === undefined) return 65; // neutral if unset
  const diff = Math.abs(RISK_ORDER[userRisk] - RISK_ORDER[stockRisk]);
  if (diff === 0) return 100;
  if (diff === 1) return 55;
  return 20;
}

function sectorPreferenceScore(preferredSectors, stockSector) {
  if (!preferredSectors || preferredSectors.length === 0) return 60; // neutral if unset
  return preferredSectors.includes(stockSector) ? 100 : 35;
}

function goalFitScore(goal, stock) {
  switch (goal) {
    case "Passive income":
      return normalize(stock.dividendYield ?? 0, 0, 6);
    case "Long-term wealth creation":
      return normalize(stock.oneYearReturn ?? 0, -10, 50);
    case "Retirement planning":
      return clamp(100 - (stock.volatility || 0) * 1.5);
    case "Short-term investment":
      return normalize(stock.oneYearReturn ?? 0, -10, 30);
    case "Tax saving":
      return 55; // neutral — ELSS mutual funds (the real tax-saving vehicle) arrive in Phase 7
    default:
      return 60;
  }
}

function computePersonalizedScore(stock, profile) {
  const risk = riskCompatibilityScore(profile.riskTolerance, stock.riskLevel);
  const sector = sectorPreferenceScore(profile.preferredSectors, stock.sector);
  const goal = goalFitScore(profile.investmentGoal, stock);
  const base = stock.aiScore ?? 50;

  const personalizedScore = Math.round(clamp(base * 0.4 + risk * 0.25 + sector * 0.15 + goal * 0.2));
  return { personalizedScore, components: { base, risk, sector, goal } };
}

function buildPersonalizedReasons(stock, profile, components) {
  const reasons = [];
  if (components.risk >= 90 && profile.riskTolerance) {
    reasons.push(`Matches your ${profile.riskTolerance} risk tolerance`);
  }
  if (components.sector === 100) {
    reasons.push(`In your preferred ${stock.sector} sector`);
  }
  if (profile.investmentGoal) {
    reasons.push(`Aligned with your "${profile.investmentGoal}" goal`);
  }
  return [...reasons, ...(stock.aiScoreReasons || [])].slice(0, 5);
}

/**
 * Returns the top `limit` stocks for this user profile, ranked by
 * personalized score (highest first).
 */
async function getRecommendations(profile, { limit = 6 } = {}) {
  const { stocks } = await stockService.getRankings({ limit: 200 });

  const scored = stocks.map((stock) => {
    const { personalizedScore, components } = computePersonalizedScore(stock, profile);
    return {
      ...stock,
      personalizedScore,
      reasons: buildPersonalizedReasons(stock, profile, components),
    };
  });

  scored.sort((a, b) => b.personalizedScore - a.personalizedScore);
  return scored.slice(0, limit);
}

/**
 * Builds an illustrative portfolio allocation based on risk tolerance and
 * duration, and slots in real example stocks from the user's own
 * recommendations where the category is stock-based. Categories that map to
 * Mutual Funds / Index Funds / ETFs are labeled as such — actual fund data
 * arrives in Phase 7.
 */
function buildPortfolio(profile, recommendations = []) {
  const risk = profile.riskTolerance || "Medium";
  const duration = profile.investmentDuration;

  let allocations;
  if (duration === "Less than 1 year") {
    allocations = [
      { category: "Cash / Debt Allocation", percent: 50 },
      { category: "Index Funds", percent: 20 },
      { category: "Large Cap Stocks", percent: 15 },
      { category: "Mutual Funds", percent: 15 },
    ];
  } else if (risk === "Low") {
    allocations = [
      { category: "Index Funds", percent: 40 },
      { category: "Large Cap Stocks", percent: 20 },
      { category: "Mutual Funds", percent: 20 },
      { category: "ETFs", percent: 10 },
      { category: "Cash / Debt Allocation", percent: 10 },
    ];
  } else if (risk === "High") {
    allocations = [
      { category: "Large Cap Stocks", percent: 30 },
      { category: "Mid / Small Cap Stocks", percent: 20 },
      { category: "ETFs", percent: 20 },
      { category: "Mutual Funds", percent: 15 },
      { category: "Index Funds", percent: 10 },
      { category: "Cash / Debt Allocation", percent: 5 },
    ];
  } else {
    allocations = [
      { category: "Index Funds", percent: 35 },
      { category: "Large Cap Stocks", percent: 25 },
      { category: "Mutual Funds", percent: 15 },
      { category: "ETFs", percent: 15 },
      { category: "Cash / Debt Allocation", percent: 10 },
    ];
  }

  const largeCap = recommendations.filter((s) => s.marketCapTier === "Large Cap").slice(0, 3);
  const midSmallCap = recommendations.filter((s) => s.marketCapTier !== "Large Cap").slice(0, 3);

  const withExamples = allocations.map((a) => {
    if (a.category === "Large Cap Stocks") {
      return { ...a, exampleStocks: largeCap.map((s) => s.symbol) };
    }
    if (a.category === "Mid / Small Cap Stocks") {
      return { ...a, exampleStocks: midSmallCap.map((s) => s.symbol) };
    }
    if (["Mutual Funds", "Index Funds", "ETFs"].includes(a.category)) {
      return { ...a, note: "Fund-level picks are built out in Phase 7" };
    }
    return a;
  });

  return {
    allocations: withExamples,
    note:
      "This is an educational example allocation, not personalized financial advice. It does not account for your complete financial situation, and actual investment decisions should be made independently.",
  };
}

module.exports = { getRecommendations, buildPortfolio, computePersonalizedScore };
