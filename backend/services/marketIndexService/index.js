const MarketIndex = require("../../models/MarketIndex");
const Stock = require("../../models/Stock");

// Illustrative baseline levels for each index — these anchor the starting
// point; the day's movement is derived from the aggregate performance of
// the actual seeded stocks, so "sentiment" stays internally consistent
// with the rest of the demo dataset instead of being arbitrary.
const BASELINE_INDICES = [
  { name: "NIFTY 50", value: 24850.3 },
  { name: "SENSEX", value: 81540.75 },
  { name: "NIFTY BANK", value: 52100.4 },
];

async function ensureSeeded() {
  const count = await MarketIndex.countDocuments();
  if (count === 0) {
    await MarketIndex.insertMany(BASELINE_INDICES.map((i) => ({ ...i, isDemoData: true })));
  }
}

/**
 * Computes the average changePercent across a set of stocks, weighted
 * equally (a simple average is a reasonable approximation for a small
 * demo universe; a real index would weight by float-adjusted market cap).
 */
function averageChange(stocks) {
  if (stocks.length === 0) return 0;
  const sum = stocks.reduce((acc, s) => acc + (s.changePercent || 0), 0);
  return Math.round((sum / stocks.length) * 100) / 100;
}

/**
 * Returns live index values: NIFTY 50 and SENSEX move with the overall
 * market's average change; NIFTY BANK moves with the Banking & Financial
 * Services sector specifically, so it can plausibly diverge from the
 * broader market — same as in real markets.
 */
async function getMarketIndices() {
  await ensureSeeded();

  const [allStocks, bankStocks, baselines] = await Promise.all([
    Stock.find({}).select("changePercent"),
    Stock.find({ sector: "Banking & Financial Services" }).select("changePercent"),
    MarketIndex.find({}),
  ]);

  const overallChangePercent = averageChange(allStocks);
  const bankChangePercent = averageChange(bankStocks.length ? bankStocks : allStocks);

  const changeByName = {
    "NIFTY 50": overallChangePercent,
    SENSEX: overallChangePercent,
    "NIFTY BANK": bankChangePercent,
  };

  const indices = baselines.map((idx) => {
    const changePercent = changeByName[idx.name] ?? 0;
    const change = Math.round(((idx.value * changePercent) / 100) * 100) / 100;
    return {
      name: idx.name,
      value: Math.round((idx.value + change) * 100) / 100,
      change,
      changePercent,
      isDemoData: idx.isDemoData,
    };
  });

  let sentiment = "neutral";
  if (overallChangePercent > 0.3) sentiment = "bullish";
  else if (overallChangePercent < -0.3) sentiment = "bearish";

  return { indices, sentiment };
}

module.exports = { getMarketIndices };
