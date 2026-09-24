const Stock = require("../../models/Stock");
const HistoricalStockData = require("../../models/HistoricalStockData");
const { HISTORY_RANGES, getMarketCapTier } = require("../../utils/constants");

// Maps public-facing sort keys (used in query params) to actual schema fields.
// "return" (1-year return) is intentionally absent here — it's a computed,
// not stored, field (see attachOneYearReturns), so it's sorted client-side.
const SORT_FIELD_MAP = {
  price: "currentPrice",
  marketCap: "marketCap",
  peRatio: "peRatio",
  dividendYield: "dividendYield",
  change: "changePercent",
  name: "companyName",
};

// Ranges used for the Stock Details "performance" breakdown.
const PERFORMANCE_RANGES = {
  oneDay: 1,
  oneWeek: 7,
  oneMonth: 30,
  threeMonth: 90,
  sixMonth: 182,
  oneYear: 365,
  threeYear: 1095,
  fiveYear: 1825,
};

/**
 * Given an array of Stock documents, attaches a computed `oneYearReturn`
 * percentage to each (via a single aggregation over HistoricalStockData,
 * regardless of how many stocks are passed in — no N+1 queries). Stocks
 * with no data old enough get `oneYearReturn: null` rather than a guess.
 */
async function attachOneYearReturns(stocks) {
  if (!stocks.length) return stocks;

  const ids = stocks.map((s) => s._id);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 365);

  const pastPrices = await HistoricalStockData.aggregate([
    { $match: { stock: { $in: ids }, date: { $lte: targetDate } } },
    { $sort: { date: -1 } },
    { $group: { _id: "$stock", close: { $first: "$close" } } },
  ]);

  const priceMap = new Map(pastPrices.map((p) => [String(p._id), p.close]));

  return stocks.map((stock) => {
    const obj = stock.toJSON ? stock.toJSON() : stock;
    const pastClose = priceMap.get(String(stock._id));
    obj.oneYearReturn =
      pastClose && pastClose > 0
        ? Math.round(((stock.currentPrice - pastClose) / pastClose) * 10000) / 100
        : null;
    return obj;
  });
}

/**
 * Computes 1D / 1W / 1M / 3M / 6M / 1Y / 3Y / 5Y percentage returns for a
 * single stock, for the Stock Details performance section. Runs the range
 * lookups in parallel since it's just one stock, not a list.
 */
async function getPerformanceReturns(stockId, currentPrice) {
  const entries = Object.entries(PERFORMANCE_RANGES);

  const results = await Promise.all(
    entries.map(async ([key, days]) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);

      const doc = await HistoricalStockData.findOne({
        stock: stockId,
        date: { $lte: targetDate },
      })
        .sort({ date: -1 })
        .select("close");

      if (!doc || !doc.close) return [key, null];

      const pct = Math.round(((currentPrice - doc.close) / doc.close) * 10000) / 100;
      return [key, pct];
    })
  );

  return Object.fromEntries(results);
}

/**
 * Lists stocks with optional search, sector filtering, sorting and
 * pagination. Powers GET /api/stocks (and the future Stock Explorer UI).
 */
async function listStocks({ search, sector, sortBy, order = "desc", page = 1, limit = 50 } = {}) {
  const query = {};

  if (sector && sector !== "All") {
    query.sector = sector;
  }

  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { symbol: { $regex: search, $options: "i" } },
    ];
  }

  const sortField = SORT_FIELD_MAP[sortBy] || "marketCap";
  const sortOrder = order === "asc" ? 1 : -1;
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [stocks, total] = await Promise.all([
    Stock.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(safeLimit),
    Stock.countDocuments(query),
  ]);

  const stocksWithReturns = await attachOneYearReturns(stocks);

  return {
    stocks: stocksWithReturns,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/**
 * Returns the top stocks by market capitalization. Powers the Dashboard's
 * "Top Stocks" section and GET /api/stocks/top.
 */
async function getTopStocks(limit = 10) {
  const stocks = await Stock.find({}).sort({ marketCap: -1 }).limit(limit);
  return attachOneYearReturns(stocks);
}

/**
 * Returns the biggest daily gainers or losers by percentage change.
 * direction: "gainers" | "losers"
 */
async function getMovers(direction = "gainers", limit = 10) {
  const sortOrder = direction === "losers" ? 1 : -1;
  const filter = direction === "losers" ? { changePercent: { $lt: 0 } } : { changePercent: { $gt: 0 } };
  const stocks = await Stock.find(filter).sort({ changePercent: sortOrder }).limit(limit);
  return attachOneYearReturns(stocks);
}

async function getStockBySymbol(symbol) {
  if (!symbol) return null;
  return Stock.findOne({ symbol: symbol.toUpperCase() });
}

async function getStocksBySector(sector) {
  return Stock.find({ sector }).sort({ marketCap: -1 });
}

/**
 * Returns historical OHLCV data for a stock within a given time range
 * ("1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y"). Returns null if
 * the stock itself doesn't exist (distinct from an empty array, which means
 * the stock exists but has no data in that range).
 */
async function getHistory(symbol, range = "1M") {
  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) return null;

  const days = HISTORY_RANGES[range] || HISTORY_RANGES["1M"];
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const history = await HistoricalStockData.find({
    stock: stock._id,
    date: { $gte: fromDate },
  })
    .sort({ date: 1 })
    .select("-_id date open high low close volume");

  return history;
}

/**
 * Powers the "All Stock Ranking" experience (folded into Stock Explorer's
 * sort/filter UI, per the frontend's page structure): stocks ranked by the
 * objective AI Investment Score (Phase 5's rule-based scoring engine),
 * filterable by sector, risk level, and market-cap tier.
 */
async function getRankings({ sector, riskLevel, marketCapTier, page = 1, limit = 50 } = {}) {
  const query = {};
  if (sector && sector !== "All") query.sector = sector;
  if (riskLevel && riskLevel !== "All") query.riskLevel = riskLevel;

  if (marketCapTier === "Large Cap") query.marketCap = { $gte: 20000 * 1e7 };
  else if (marketCapTier === "Mid Cap") query.marketCap = { $gte: 5000 * 1e7, $lt: 20000 * 1e7 };
  else if (marketCapTier === "Small Cap") query.marketCap = { $lt: 5000 * 1e7 };

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [stocks, total] = await Promise.all([
    Stock.find(query).sort({ aiScore: -1 }).skip(skip).limit(safeLimit),
    Stock.countDocuments(query),
  ]);

  const stocksWithReturns = await attachOneYearReturns(stocks);

  // Attach rank (1-based, relative to this filtered result set) and tier label.
  const ranked = stocksWithReturns.map((stock, i) => ({
    ...stock,
    rank: skip + i + 1,
    marketCapTier: getMarketCapTier(stock.marketCap),
  }));

  return {
    stocks: ranked,
    pagination: { total, page: safePage, limit: safeLimit, pages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}

/**
 * Aggregates stock counts and average performance per sector, for the
 * Home page's "Explore by Sector" tiles and any sector-browsing UI.
 */
async function getSectorSummary() {
  const results = await Stock.aggregate([
    {
      $group: {
        _id: "$sector",
        stockCount: { $sum: 1 },
        avgChangePercent: { $avg: "$changePercent" },
        totalMarketCap: { $sum: "$marketCap" },
      },
    },
    { $sort: { totalMarketCap: -1 } },
  ]);

  return results.map((r) => ({
    sector: r._id,
    stockCount: r.stockCount,
    avgChangePercent: Math.round((r.avgChangePercent || 0) * 100) / 100,
    totalMarketCap: r.totalMarketCap,
  }));
}

/**
 * Builds a rule-based (non-LLM) side-by-side comparison of 2-3 stocks:
 * fundamentals, performance, volatility, and a plain-language summary that
 * only ever describes historical/fundamental facts — never a promise about
 * future returns.
 */
async function compareStocks(symbols, riskTolerance) {
  const upperSymbols = symbols.map((s) => s.toUpperCase());
  const stocks = await Stock.find({ symbol: { $in: upperSymbols } });

  if (stocks.length < 2) return null;

  const withReturns = await attachOneYearReturns(stocks);

  const strongestFundamentals = [...withReturns].sort(
    (a, b) => (b.roe || 0) + (b.roce || 0) - ((a.roe || 0) + (a.roce || 0))
  )[0];
  const bestHistoricalGrowth = [...withReturns].sort(
    (a, b) => (b.oneYearReturn ?? -Infinity) - (a.oneYearReturn ?? -Infinity)
  )[0];
  const mostStable = [...withReturns].sort((a, b) => (a.volatility || 0) - (b.volatility || 0))[0];

  const highlights = [
    `${strongestFundamentals.companyName} (${strongestFundamentals.symbol}) shows the strongest fundamentals among the selected stocks, with ROE of ${strongestFundamentals.roe ?? "—"}% and ROCE of ${strongestFundamentals.roce ?? "—"}%.`,
    bestHistoricalGrowth.oneYearReturn !== null
      ? `${bestHistoricalGrowth.companyName} (${bestHistoricalGrowth.symbol}) had the strongest 1-year historical return at ${bestHistoricalGrowth.oneYearReturn > 0 ? "+" : ""}${bestHistoricalGrowth.oneYearReturn}%.`
      : null,
    `${mostStable.companyName} (${mostStable.symbol}) has been the most stable, with the lowest historical volatility (${mostStable.riskLevel} risk classification).`,
  ];

  if (riskTolerance) {
    const RISK_ORDER = { Low: 0, Medium: 1, High: 2 };
    const targetRisk = RISK_ORDER[riskTolerance];
    const bestMatch =
      targetRisk !== undefined
        ? [...withReturns].sort((a, b) => {
            const aDiff = RISK_ORDER[a.riskLevel] !== undefined ? Math.abs(targetRisk - RISK_ORDER[a.riskLevel]) : Infinity;
            const bDiff = RISK_ORDER[b.riskLevel] !== undefined ? Math.abs(targetRisk - RISK_ORDER[b.riskLevel]) : Infinity;
            return aDiff - bDiff;
          })[0]
        : null;
    if (bestMatch) {
      highlights.push(
        `Given a stated ${riskTolerance} risk tolerance, ${bestMatch.symbol} (${bestMatch.riskLevel} risk) is the closest match among the selected stocks.`
      );
    }
  }

  highlights.push(
    "This comparison is based on historical and fundamental data only. Past performance does not guarantee future returns, and investment decisions should be made independently."
  );

  const summary = {
    strongestFundamentals: strongestFundamentals.symbol,
    bestHistoricalGrowth: bestHistoricalGrowth.symbol,
    mostStable: mostStable.symbol,
    highlights: highlights.filter(Boolean),
  };

  return { stocks: withReturns, summary };
}

module.exports = {
  listStocks,
  getTopStocks,
  getMovers,
  getStockBySymbol,
  getStocksBySector,
  getHistory,
  getPerformanceReturns,
  getRankings,
  getSectorSummary,
  compareStocks,
};
