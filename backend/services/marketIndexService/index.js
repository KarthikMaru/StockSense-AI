const MarketIndex = require("../../models/MarketIndex");
const Stock = require("../../models/Stock");

// Illustrative baseline levels for each index.
// The day's movement is calculated from the actual stock data
// stored in MongoDB.
const BASELINE_INDICES = [
  { name: "NIFTY 50", value: 24850.3 },
  { name: "SENSEX", value: 81540.75 },
  { name: "NIFTY BANK", value: 52100.4 },
];

/**
 * Creates the baseline market indices if they do not already exist.
 *
 * When real market data is enabled, the indices are marked as
 * non-demo data. Otherwise, they are marked as demo data.
 */
async function ensureSeeded() {
  const count = await MarketIndex.countDocuments();

  if (count === 0) {
    const isDemoData =
      process.env.USE_REAL_MARKET_DATA !== "true";

    await MarketIndex.insertMany(
      BASELINE_INDICES.map((index) => ({
        ...index,
        isDemoData,
      }))
    );
  }
}

/**
 * Computes the average percentage change across a group of stocks.
 *
 * This is an approximation rather than the actual methodology used
 * by NIFTY/SENSEX, which use index-weighting methodologies.
 */
function averageChange(stocks) {
  if (stocks.length === 0) {
    return 0;
  }

  const sum = stocks.reduce(
    (acc, stock) => acc + (stock.changePercent || 0),
    0
  );

  return Math.round((sum / stocks.length) * 100) / 100;
}

/**
 * Returns the current market-index view.
 *
 * NIFTY 50 and SENSEX move according to the average movement
 * of all available stocks.
 *
 * NIFTY BANK moves according to the Banking & Financial Services
 * stocks specifically.
 */
async function getMarketIndices() {
  await ensureSeeded();

  const [allStocks, bankStocks, baselines] = await Promise.all([
    Stock.find({}).select("changePercent"),

    Stock.find({
      sector: "Banking & Financial Services",
    }).select("changePercent"),

    MarketIndex.find({}),
  ]);

  // Calculate overall market movement.
  const overallChangePercent = averageChange(allStocks);

  // Calculate banking-sector movement.
  // If no banking stocks exist, fall back to overall market movement.
  const bankChangePercent = averageChange(
    bankStocks.length ? bankStocks : allStocks
  );

  const changeByName = {
    "NIFTY 50": overallChangePercent,
    SENSEX: overallChangePercent,
    "NIFTY BANK": bankChangePercent,
  };

  const indices = baselines.map((index) => {
    const changePercent = changeByName[index.name] ?? 0;

    const change =
      Math.round(
        ((index.value * changePercent) / 100) * 100
      ) / 100;

    return {
      name: index.name,

      value:
        Math.round(
          (index.value + change) * 100
        ) / 100,

      change,

      changePercent,

      isDemoData: index.isDemoData,
    };
  });

  // Determine overall market sentiment.
  let sentiment = "neutral";

  if (overallChangePercent > 0.3) {
    sentiment = "bullish";
  } else if (overallChangePercent < -0.3) {
    sentiment = "bearish";
  }

  return {
    indices,
    sentiment,
  };
}

module.exports = {
  getMarketIndices,
};