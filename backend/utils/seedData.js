/**
 * ==========================================================================
 * StockSense AI - Database Seed Script
 * ==========================================================================
 *
 * Modes:
 *
 * REAL DATA MODE
 *   USE_REAL_MARKET_DATA=true
 *       |
 *       v
 *   Alpha Vantage
 *       |
 *       v
 *   Live quote + historical OHLCV
 *       |
 *       v
 *   MongoDB
 *
 * DEMO DATA MODE
 *   USE_REAL_MARKET_DATA=false
 *       |
 *       v
 *   DEMO_STOCKS
 *       |
 *       v
 *   Generated historical data
 *
 * The seed script keeps demo data as a safe fallback so the application
 * does not fail completely if an external market-data request fails.
 *
 * Run with:
 *
 *   npm run seed
 *
 * from the backend/ directory.
 *
 * IMPORTANT:
 * The seed script clears the existing Stock and HistoricalStockData
 * collections before reseeding.
 * ==========================================================================
 */

require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");

const Stock = require("../models/Stock");

const HistoricalStockData = require("../models/HistoricalStockData");

const {
  DEMO_STOCKS,
} = require("../services/marketDataService/demoStocks");

const {
  isRealDataEnabled,
  fetchLiveQuote,
  fetchHistoricalData,
  generateHistoricalSeries,
} = require("../services/marketDataService");

const {
  calculateVolatility,
  deriveRiskLevel,
  calculateAIScore,
  buildScoreReasons,
} = require("../services/stockService/scoring");


/**
 * ==========================================================================
 * Configuration
 * ==========================================================================
 *
 * Alpha Vantage's free historical-data response may not provide five full
 * years of daily data.
 *
 * Therefore:
 *
 *   REAL DATA MODE
 *      -> use whatever valid historical data Alpha Vantage returns
 *
 *   DEMO DATA MODE / FALLBACK
 *      -> generate 5 years of historical demo data
 *
 * This preserves the application's existing chart functionality.
 * ==========================================================================
 */

const HISTORY_DAYS = 1825;


/**
 * ==========================================================================
 * Find Close Price N Days Ago
 * ==========================================================================
 *
 * Finds the closing price at or immediately before the requested number
 * of calendar days before the final date in the series.
 *
 * The series must be sorted from oldest -> newest.
 * ==========================================================================
 */

function findClosePriceDaysAgo(series, days) {

  if (!series || series.length === 0) {
    return null;
  }

  const target = new Date(
    series[series.length - 1].date
  );

  target.setDate(
    target.getDate() - days
  );

  let result = null;

  for (const point of series) {

    const pointDate = new Date(point.date);

    if (pointDate <= target) {
      result = point;
    } else {
      break;
    }
  }

  return result
    ? result.close
    : null;
}


/**
 * ==========================================================================
 * Calculate 52-Week High / Low
 * ==========================================================================
 */

function calculate52WeekRange(series) {

  if (!series || series.length === 0) {
    return {
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
    };
  }

  /**
   * Approximately 260 trading days = one year.
   *
   * If the real-data provider returns fewer records, this simply uses
   * everything available.
   */

  const lastYear = series.slice(-260);

  const fiftyTwoWeekHigh = Math.max(
    ...lastYear.map((point) => point.high)
  );

  const fiftyTwoWeekLow = Math.min(
    ...lastYear.map((point) => point.low)
  );

  return {
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
  };
}


/**
 * ==========================================================================
 * Get Historical Data
 * ==========================================================================
 *
 * Attempts real Alpha Vantage historical data first when real-data mode
 * is enabled.
 *
 * If real data is unavailable, generated demo data is used as a fallback.
 * ==========================================================================
 */

async function getHistoricalData(seedStock) {

  /**
   * ------------------------------------------------------------------------
   * REAL DATA MODE
   * ------------------------------------------------------------------------
   */

  if (isRealDataEnabled()) {

    console.log(
      `[Seed] Fetching real historical data for ${seedStock.symbol}...`
    );

    const realHistory = await fetchHistoricalData(
      seedStock.symbol,
      {
        outputsize: "compact",
      }
    );

    if (
      realHistory &&
      realHistory.length >= 2
    ) {

      console.log(
        `[Seed] ${seedStock.symbol} — received ${realHistory.length} real historical records.`
      );

      return {
        series: realHistory,
        isDemoData: false,
      };
    }

    console.warn(
      `[Seed] ${seedStock.symbol} — real historical data unavailable. Using demo history.`
    );
  }


  /**
   * ------------------------------------------------------------------------
   * DEMO / FALLBACK MODE
   * ------------------------------------------------------------------------
   */

  const demoSeries = generateHistoricalSeries(
    seedStock.basePrice,
    {
      days: HISTORY_DAYS,
    }
  );

  return {
    series: demoSeries,
    isDemoData: true,
  };
}


/**
 * ==========================================================================
 * Get Latest Quote
 * ==========================================================================
 *
 * In real-data mode we first attempt to retrieve the latest quote.
 *
 * If the quote cannot be retrieved, the latest historical record is used.
 * If real mode itself is unavailable, the generated demo series is used.
 * ==========================================================================
 */

async function getLatestQuote(
  seedStock,
  series,
  isDemoData
) {

  /**
   * ------------------------------------------------------------------------
   * REAL QUOTE
   * ------------------------------------------------------------------------
   */

  if (!isDemoData && isRealDataEnabled()) {

    console.log(
      `[Seed] Fetching live quote for ${seedStock.symbol}...`
    );

    const liveQuote = await fetchLiveQuote(
      seedStock.symbol
    );

    if (liveQuote) {

      return {
        currentPrice: liveQuote.currentPrice,
        previousClose: liveQuote.previousClose,
        volume: liveQuote.volume,
        isDemoData: false,
        lastSyncedAt:
          liveQuote.lastSyncedAt || new Date(),
      };
    }

    console.warn(
      `[Seed] ${seedStock.symbol} — live quote unavailable. Using historical latest value.`
    );
  }


  /**
   * ------------------------------------------------------------------------
   * HISTORICAL / DEMO FALLBACK
   * ------------------------------------------------------------------------
   */

  const latest =
    series[series.length - 1];

  const previous =
    series[series.length - 2];

  return {
    currentPrice: latest.close,

    previousClose:
      previous.close,

    volume:
      latest.volume || 0,

    isDemoData,

    lastSyncedAt: new Date(),
  };
}


/**
 * ==========================================================================
 * Main Seed Function
 * ==========================================================================
 */

async function seed() {

  await connectDB();


  /**
   * ------------------------------------------------------------------------
   * Display Current Mode
   * ------------------------------------------------------------------------
   */

  const realMode =
    isRealDataEnabled();

  console.log("\n==========================================");

  console.log(
    `[Seed] Market Data Mode: ${
      realMode
        ? "REAL DATA"
        : "DEMO DATA"
    }`
  );

  console.log("==========================================\n");


  /**
   * ------------------------------------------------------------------------
   * Clear Existing Data
   * ------------------------------------------------------------------------
   */

  console.log(
    "[Seed] Clearing existing Stock and HistoricalStockData collections..."
  );

  await Promise.all([
    Stock.deleteMany({}),
    HistoricalStockData.deleteMany({}),
  ]);


  let stockCount = 0;

  let historyCount = 0;

  let realStockCount = 0;

  let demoStockCount = 0;


  /**
   * ------------------------------------------------------------------------
   * Process Every Stock
   * ------------------------------------------------------------------------
   */

  for (const seedStock of DEMO_STOCKS) {

    try {

      console.log(
        `\n[Seed] Processing ${seedStock.symbol}...`
      );


      /**
       * --------------------------------------------------------------
       * 1. Get Historical Data
       * --------------------------------------------------------------
       */

      const historicalResult =
        await getHistoricalData(
          seedStock
        );

      const series =
        historicalResult.series;

      const isDemoData =
        historicalResult.isDemoData;


      if (
        !series ||
        series.length < 2
      ) {

        console.warn(
          `[Seed] Skipping ${seedStock.symbol} — not enough historical data.`
        );

        continue;
      }


      /**
       * --------------------------------------------------------------
       * 2. Get Latest Quote
       * --------------------------------------------------------------
       */

      const latestQuote =
        await getLatestQuote(
          seedStock,
          series,
          isDemoData
        );


      /**
       * --------------------------------------------------------------
       * 3. Latest Historical Records
       * --------------------------------------------------------------
       */

      const latest =
        series[series.length - 1];

      const previous =
        series[series.length - 2];


      /**
       * --------------------------------------------------------------
       * 4. 52-Week High / Low
       * --------------------------------------------------------------
       */

      const {
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
      } = calculate52WeekRange(
        series
      );


      /**
       * --------------------------------------------------------------
       * 5. One-Year Return
       * --------------------------------------------------------------
       */

      const pastClose =
        findClosePriceDaysAgo(
          series,
          365
        );

      const oneYearReturn =
        pastClose
          ? Math.round(
              (
                (
                  latest.close -
                  pastClose
                ) /
                pastClose
              ) *
                10000
            ) / 100
          : null;


      /**
       * --------------------------------------------------------------
       * 6. Volatility
       * --------------------------------------------------------------
       */

      const volatility =
        calculateVolatility(
          series
        );


      /**
       * --------------------------------------------------------------
       * 7. Risk Level
       * --------------------------------------------------------------
       */

      const riskLevel =
        deriveRiskLevel(
          volatility
        );


      /**
       * --------------------------------------------------------------
       * 8. AI / Recommendation Score
       * --------------------------------------------------------------
       *
       * The existing scoring system is preserved.
       */

      const {
        aiScore,
        subscores,
      } =
        calculateAIScore({
          oneYearReturn,

          roe:
            seedStock.roe,

          roce:
            seedStock.roce,

          debt:
            seedStock.debtCr,

          revenue:
            seedStock.revenueCr,

          dividendYield:
            seedStock.dividendYield,

          volatility,
        });


      /**
       * --------------------------------------------------------------
       * 9. Score Explanation
       * --------------------------------------------------------------
       */

      const aiScoreReasons =
        buildScoreReasons(
          {
            oneYearReturn,

            roe:
              seedStock.roe,

            roce:
              seedStock.roce,

            dividendYield:
              seedStock.dividendYield,

            volatility,

            riskLevel,
          },

          subscores
        );


      /**
       * --------------------------------------------------------------
       * 10. Create Stock Document
       * --------------------------------------------------------------
       *
       * Fundamental values currently come from demoStocks.js.
       *
       * Market price / previous close / volume come from real market
       * data when available.
       */

      const stock =
        await Stock.create({

          symbol:
            seedStock.symbol,

          companyName:
            seedStock.companyName,

          sector:
            seedStock.sector,

          industry:
            seedStock.industry,


          /**
           * Real quote when available.
           */

          currentPrice:
            latestQuote.currentPrice,

          previousClose:
            latestQuote.previousClose,

          volume:
            latestQuote.volume,


          /**
           * Fundamentals from demoStocks.js.
           *
           * These remain the existing illustrative values.
           */

          marketCap:
            seedStock.marketCapCr *
            1e7,

          peRatio:
            seedStock.peRatio,

          eps:
            seedStock.eps,

          dividendYield:
            seedStock.dividendYield,

          revenue:
            seedStock.revenueCr *
            1e7,

          netProfit:
            seedStock.netProfitCr *
            1e7,

          debt:
            seedStock.debtCr *
            1e7,

          roe:
            seedStock.roe,

          roce:
            seedStock.roce,


          /**
           * Calculated from the historical series.
           */

          fiftyTwoWeekHigh,

          fiftyTwoWeekLow,

          volatility,

          riskLevel,

          aiScore,

          aiScoreReasons,


          /**
           * IMPORTANT:
           *
           * false = real market data
           * true  = generated/demo data
           */

          isDemoData,

          lastSyncedAt:
            latestQuote.lastSyncedAt,
        });


      /**
       * --------------------------------------------------------------
       * 11. Store Historical Data
       * --------------------------------------------------------------
       */

      const historyDocs =
        series.map(
          (point) => ({

            stock:
              stock._id,

            date:
              point.date,

            open:
              point.open,

            high:
              point.high,

            low:
              point.low,

            close:
              point.close,

            volume:
              point.volume || 0,
          })
        );


      await HistoricalStockData.insertMany(
        historyDocs,
        {
          ordered: false,
        }
      );


      /**
       * --------------------------------------------------------------
       * 12. Counters
       * --------------------------------------------------------------
       */

      stockCount += 1;

      historyCount +=
        historyDocs.length;


      if (isDemoData) {
        demoStockCount += 1;
      } else {
        realStockCount += 1;
      }


      /**
       * --------------------------------------------------------------
       * 13. Logging
       * --------------------------------------------------------------
       */

      console.log(
        `[Seed] ${seedStock.symbol.padEnd(12)} — ` +
        `₹${latestQuote.currentPrice} — ` +
        `${historyDocs.length} records — ` +
        `${isDemoData ? "DEMO" : "REAL"}`
      );

    } catch (error) {

      /**
       * --------------------------------------------------------------
       * Per-stock error handling
       * --------------------------------------------------------------
       *
       * One failed stock should not destroy the entire seed process.
       */

      console.error(
        `[Seed] Failed to process ${seedStock.symbol}:`,
        error.message
      );

    }
  }


  /**
   * ------------------------------------------------------------------------
   * Final Summary
   * ------------------------------------------------------------------------
   */

  console.log("\n==========================================");

  console.log(
    `[Seed] Done. Seeded ${stockCount} stocks.`
  );

  console.log(
    `[Seed] Historical records: ${historyCount}`
  );

  console.log(
    `[Seed] Real-data stocks: ${realStockCount}`
  );

  console.log(
    `[Seed] Demo/fallback stocks: ${demoStockCount}`
  );

  console.log("==========================================\n");


  await mongoose.connection.close();

  process.exit(0);
}


/**
 * ==========================================================================
 * Start Seed
 * ==========================================================================
 */

seed().catch((err) => {

  console.error(
    "[Seed] Failed:",
    err
  );

  process.exit(1);
});