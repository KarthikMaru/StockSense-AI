/**
 * Centralized enums shared across models, validators, and services so the
 * same sector/category names are used everywhere (User preferences, Stock
 * sector field, sector browsing routes, etc.) instead of duplicating and
 * risking drift between them.
 */

const SECTORS = [
  "Technology",
  "Banking & Financial Services",
  "Energy Resources",
  "Minerals & Natural Resources",
  "Everyday Consumer Goods",
  "Luxury & Non-Essential Goods",
  "Healthcare & Pharmaceuticals",
  "Infrastructure",
  "Telecommunications",
  "Real Estate",
];

const RISK_LEVELS = ["Low", "Medium", "High"];

const INVESTMENT_GOALS = [
  "Long-term wealth creation",
  "Short-term investment",
  "Retirement planning",
  "Passive income",
  "Tax saving",
];

const INVESTMENT_BUDGETS = ["₹5,000", "₹10,000", "₹25,000", "₹50,000", "₹1,00,000+"];

const INVESTMENT_DURATIONS = ["Less than 1 year", "1-3 years", "3-5 years", "More than 5 years"];

const INVESTMENT_TYPES = ["Stocks", "Mutual Funds", "SIP", "ETF", "AI Recommended Portfolio"];

const PLATFORMS = ["Groww", "Zerodha"];

// Historical chart range -> number of calendar days to look back.
const HISTORY_RANGES = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 182,
  "1Y": 365,
  "3Y": 1095,
  "5Y": 1825,
};

// Illustrative market-cap tiers (in ₹) used for stock filtering/ranking.
// Real classification (e.g. SEBI's rank-based large/mid/small cap rules)
// uses relative ranking across the whole exchange; fixed thresholds are a
// reasonable approximation for a demo-scale dataset.
const MARKET_CAP_TIERS = {
  LARGE_CAP_MIN: 20000 * 1e7, // ₹20,000 Cr
  MID_CAP_MIN: 5000 * 1e7, // ₹5,000 Cr
};

function getMarketCapTier(marketCap) {
  if (!marketCap) return "Small Cap";
  if (marketCap >= MARKET_CAP_TIERS.LARGE_CAP_MIN) return "Large Cap";
  if (marketCap >= MARKET_CAP_TIERS.MID_CAP_MIN) return "Mid Cap";
  return "Small Cap";
}

const MARKET_CAP_TIER_NAMES = ["Large Cap", "Mid Cap", "Small Cap"];

const MUTUAL_FUND_CATEGORIES = [
  "Large Cap Fund",
  "Mid Cap Fund",
  "Small Cap Fund",
  "Index Fund",
  "ELSS",
  "Debt Fund",
  "Hybrid Fund",
];

module.exports = {
  SECTORS,
  RISK_LEVELS,
  INVESTMENT_GOALS,
  INVESTMENT_BUDGETS,
  INVESTMENT_DURATIONS,
  INVESTMENT_TYPES,
  PLATFORMS,
  HISTORY_RANGES,
  MARKET_CAP_TIERS,
  MARKET_CAP_TIER_NAMES,
  MUTUAL_FUND_CATEGORIES,
  getMarketCapTier,
};
