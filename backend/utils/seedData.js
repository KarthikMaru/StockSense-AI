/**
 * Seeds the database with demo stock data: fundamentals + a full 5-year
 * daily OHLCV history for every stock in demoStocks.js. This gives the
 * frontend real data to render immediately, without needing a live market
 * data API key.
 *
 * Run with: npm run seed   (from the backend/ directory)
 *
 * Safe to re-run: it clears the Stock and HistoricalStockData collections
 * before reseeding, so you always end up with a clean, consistent dataset.
 */
require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Stock = require("../models/Stock");
const HistoricalStockData = require("../models/HistoricalStockData");
const { DEMO_STOCKS } = require("../services/marketDataService/demoStocks");
const { generateHistoricalSeries } = require("../services/marketDataService");
const { calculateVolatility, deriveRiskLevel, calculateAIScore, buildScoreReasons } = require("../services/stockService/scoring");

const HISTORY_DAYS = 1825; // 5 years, so every chart time-range filter has real data

/**
 * Finds the closing price at or immediately before `days` calendar days
 * before the series' last date. Series is assumed sorted ascending by date.
 */
function findClosePriceDaysAgo(series, days) {
  const target = new Date(series[series.length - 1].date);
  target.setDate(target.getDate() - days);

  let result = null;
  for (const point of series) {
    if (point.date <= target) result = point;
    else break;
  }
  return result ? result.close : null;
}

async function seed() {
  await connectDB();

  console.log("[Seed] Clearing existing Stock and HistoricalStockData collections...");
  await Promise.all([Stock.deleteMany({}), HistoricalStockData.deleteMany({})]);

  let stockCount = 0;
  let historyCount = 0;

  for (const seedStock of DEMO_STOCKS) {
    const series = generateHistoricalSeries(seedStock.basePrice, { days: HISTORY_DAYS });

    if (series.length < 2) {
      console.warn(`[Seed] Skipping ${seedStock.symbol} — not enough generated history.`);
      continue;
    }

    const latest = series[series.length - 1];
    const previous = series[series.length - 2];

    // 52-week high/low from the most recent ~365 calendar days of the series.
    const lastYear = series.slice(-260); // ~260 trading days ≈ 1 year (weekends excluded)
    const fiftyTwoWeekHigh = Math.max(...lastYear.map((p) => p.high));
    const fiftyTwoWeekLow = Math.min(...lastYear.map((p) => p.low));

    // 1-year return: date-based lookup (accurate even though weekends are skipped).
    const pastClose = findClosePriceDaysAgo(series, 365);
    const oneYearReturn = pastClose ? Math.round(((latest.close - pastClose) / pastClose) * 10000) / 100 : null;

    // ---- Phase 5 scoring: volatility, risk level, objective AI score ----
    const volatility = calculateVolatility(series);
    const riskLevel = deriveRiskLevel(volatility);
    const { aiScore, subscores } = calculateAIScore({
      oneYearReturn,
      roe: seedStock.roe,
      roce: seedStock.roce,
      debt: seedStock.debtCr,
      revenue: seedStock.revenueCr,
      dividendYield: seedStock.dividendYield,
      volatility,
    });
    const aiScoreReasons = buildScoreReasons(
      { oneYearReturn, roe: seedStock.roe, roce: seedStock.roce, dividendYield: seedStock.dividendYield, volatility, riskLevel },
      subscores
    );

    const stock = await Stock.create({
      symbol: seedStock.symbol,
      companyName: seedStock.companyName,
      sector: seedStock.sector,
      industry: seedStock.industry,
      currentPrice: latest.close,
      previousClose: previous.close,
      volume: latest.volume,
      marketCap: seedStock.marketCapCr * 1e7,
      peRatio: seedStock.peRatio,
      eps: seedStock.eps,
      dividendYield: seedStock.dividendYield,
      revenue: seedStock.revenueCr * 1e7,
      netProfit: seedStock.netProfitCr * 1e7,
      debt: seedStock.debtCr * 1e7,
      roe: seedStock.roe,
      roce: seedStock.roce,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      volatility,
      riskLevel,
      aiScore,
      aiScoreReasons,
      isDemoData: true,
      lastSyncedAt: new Date(),
    });

    const historyDocs = series.map((point) => ({
      stock: stock._id,
      date: point.date,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
    }));

    await HistoricalStockData.insertMany(historyDocs, { ordered: false });

    stockCount += 1;
    historyCount += historyDocs.length;
    console.log(`[Seed] ${seedStock.symbol.padEnd(12)} — ₹${latest.close} — ${historyDocs.length} daily records`);
  }

  console.log(`\n[Seed] Done. Seeded ${stockCount} stocks and ${historyCount} historical records.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
