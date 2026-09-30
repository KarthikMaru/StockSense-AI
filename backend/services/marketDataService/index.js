const axios = require("axios");

/**
 * ==========================================================================
 * StockSense AI - Market Data Service
 * ==========================================================================
 *
 * Provider:
 *   Alpha Vantage
 *
 * Real Data Flow:
 *
 *   StockSense Backend
 *          |
 *          v
 *   Market Data Service
 *          |
 *          v
 *   Alpha Vantage API
 *          |
 *          v
 *   Normalize / Validate
 *          |
 *          v
 *   MongoDB
 *
 * Demo Data Flow:
 *
 *   Market Data Service
 *          |
 *          v
 *   generateHistoricalSeries()
 *
 * The Alpha Vantage API key is NEVER hard-coded here.
 * It is read from:
 *
 *   process.env.MARKET_DATA_API_KEY
 *
 * ==========================================================================
 */


/**
 * ==========================================================================
 * Configuration
 * ==========================================================================
 */

const ALPHA_VANTAGE_BASE_URL =
  process.env.MARKET_DATA_BASE_URL ||
  "https://www.alphavantage.co/query";


/**
 * ==========================================================================
 * Check whether Real Market Data is Enabled
 * ==========================================================================
 */

function isRealDataEnabled() {
  return (
    process.env.USE_REAL_MARKET_DATA === "true" &&
    Boolean(process.env.MARKET_DATA_API_KEY)
  );
}


/**
 * ==========================================================================
 * Normalize Stock Symbol
 * ==========================================================================
 *
 * Alpha Vantage uses exchange-qualified symbols for international stocks.
 *
 * Example:
 *
 *   RELIANCE
 *      ->
 *   RELIANCE.BSE
 *
 * If a symbol already contains an exchange suffix, it is left unchanged.
 *
 * IMPORTANT:
 * Your demoStocks.js symbols should ideally be mapped to the actual
 * Alpha Vantage-supported symbols.
 * ==========================================================================
 */

function normalizeSymbol(symbol) {
  if (!symbol) return null;

  const cleanedSymbol = String(symbol)
    .trim()
    .toUpperCase();

  /**
   * If the symbol already contains an exchange suffix such as:
   *
   * RELIANCE.BSE
   * TCS.BSE
   * INFY.BSE
   *
   * don't modify it.
   */

  if (cleanedSymbol.includes(".")) {
    return cleanedSymbol;
  }

  /**
   * For this StockSense-AI project we are using Indian BSE symbols.
   */

  return `${cleanedSymbol}.BSE`;
}


/**
 * ==========================================================================
 * Handle Alpha Vantage API Errors
 * ==========================================================================
 */

function checkAlphaVantageError(data, symbol) {
  if (!data) {
    console.warn(
      `[marketDataService] Empty Alpha Vantage response for ${symbol}`
    );

    return true;
  }

  if (data["Error Message"]) {
    console.warn(
      `[marketDataService] Alpha Vantage error for ${symbol}: ${data["Error Message"]}`
    );

    return true;
  }

  if (data["Note"]) {
    console.warn(
      `[marketDataService] Alpha Vantage rate-limit message for ${symbol}: ${data["Note"]}`
    );

    return true;
  }

  if (data["Information"]) {
    console.warn(
      `[marketDataService] Alpha Vantage information for ${symbol}: ${data["Information"]}`
    );

    return true;
  }

  return false;
}


/**
 * ==========================================================================
 * Fetch Live Quote
 * ==========================================================================
 *
 * Alpha Vantage endpoint:
 *
 *   GLOBAL_QUOTE
 *
 * Returns:
 *
 * {
 *   symbol,
 *   currentPrice,
 *   previousClose,
 *   volume,
 *   isDemoData,
 *   lastSyncedAt
 * }
 *
 * Alpha Vantage's quote endpoint is documented as:
 *
 * function=GLOBAL_QUOTE
 * symbol=...
 * apikey=...
 * ==========================================================================
 */

async function fetchLiveQuote(symbol) {
  if (!isRealDataEnabled()) {
    return null;
  }

  if (!symbol) {
    console.warn(
      "[marketDataService] Cannot fetch quote: symbol is missing."
    );

    return null;
  }

  const alphaSymbol = normalizeSymbol(symbol);

  try {
    const response = await axios.get(
      ALPHA_VANTAGE_BASE_URL,
      {
        params: {
          function: "GLOBAL_QUOTE",
          symbol: alphaSymbol,
          apikey: process.env.MARKET_DATA_API_KEY,
        },

        timeout: 10000,
      }
    );

    const data = response.data;

    if (checkAlphaVantageError(data, alphaSymbol)) {
      return null;
    }

    const quote = data?.["Global Quote"];

    if (!quote || Object.keys(quote).length === 0) {
      console.warn(
        `[marketDataService] No quote data returned for ${alphaSymbol}`
      );

      return null;
    }

    /**
     * Alpha Vantage GLOBAL_QUOTE response fields:
     *
     * 01. symbol
     * 02. open
     * 03. high
     * 04. low
     * 05. price
     * 06. volume
     * 07. latest trading day
     * 08. previous close
     * 09. change
     * 10. change percent
     */

    const price = Number(quote["05. price"]);

    const previousClose = Number(
      quote["08. previous close"]
    );

    const volume = Number(
      quote["06. volume"]
    );


    /**
     * Validate price.
     */

    if (!Number.isFinite(price)) {
      console.warn(
        `[marketDataService] Invalid price received for ${alphaSymbol}`
      );

      return null;
    }


    /**
     * Previous close is useful for calculating daily movement.
     *
     * If unavailable, use current price as a safe fallback.
     */

    const safePreviousClose =
      Number.isFinite(previousClose)
        ? previousClose
        : price;


    return {
      symbol: alphaSymbol,

      currentPrice: round2(price),

      previousClose: round2(
        safePreviousClose
      ),

      volume:
        Number.isFinite(volume)
          ? volume
          : 0,

      isDemoData: false,

      lastSyncedAt: new Date(),
    };

  } catch (error) {

    console.warn(
      `[marketDataService] Failed to fetch live quote for ${alphaSymbol}: ${error.message}`
    );

    return null;
  }
}


/**
 * ==========================================================================
 * Fetch Historical Daily Data
 * ==========================================================================
 *
 * Alpha Vantage endpoint:
 *
 *   TIME_SERIES_DAILY
 *
 * This returns:
 *
 *   date
 *   open
 *   high
 *   low
 *   close
 *   volume
 *
 * Alpha Vantage's free/standard API supports the compact daily response,
 * which returns the latest 100 data points.
 * ==========================================================================
 */

async function fetchHistoricalData(
  symbol,
  {
    outputsize = "compact",
  } = {}
) {

  if (!isRealDataEnabled()) {
    return null;
  }

  if (!symbol) {
    console.warn(
      "[marketDataService] Cannot fetch historical data: symbol is missing."
    );

    return null;
  }

  const alphaSymbol = normalizeSymbol(symbol);

  try {

    const response = await axios.get(
      ALPHA_VANTAGE_BASE_URL,
      {
        params: {
          function: "TIME_SERIES_DAILY",
          symbol: alphaSymbol,
          outputsize,
          apikey: process.env.MARKET_DATA_API_KEY,
        },

        timeout: 15000,
      }
    );

    const data = response.data;

    if (checkAlphaVantageError(data, alphaSymbol)) {
      return null;
    }


    /**
     * Alpha Vantage daily response:
     *
     * "Time Series (Daily)": {
     *   "2026-09-24": {
     *      "1. open": "...",
     *      "2. high": "...",
     *      "3. low": "...",
     *      "4. close": "...",
     *      "5. volume": "..."
     *   }
     * }
     */

    const timeSeries =
      data?.["Time Series (Daily)"];


    if (
      !timeSeries ||
      typeof timeSeries !== "object"
    ) {

      console.warn(
        `[marketDataService] No daily historical data returned for ${alphaSymbol}`
      );

      return null;
    }


    const historicalData = Object.entries(
      timeSeries
    )
      .map(([date, values]) => {

        const open = Number(
          values["1. open"]
        );

        const high = Number(
          values["2. high"]
        );

        const low = Number(
          values["3. low"]
        );

        const close = Number(
          values["4. close"]
        );

        const volume = Number(
          values["5. volume"]
        );


        /**
         * Reject invalid rows.
         */

        if (
          !Number.isFinite(open) ||
          !Number.isFinite(high) ||
          !Number.isFinite(low) ||
          !Number.isFinite(close)
        ) {
          return null;
        }


        return {
          date: new Date(`${date}T00:00:00.000Z`),

          open: round2(open),

          high: round2(high),

          low: round2(low),

          close: round2(close),

          volume:
            Number.isFinite(volume)
              ? volume
              : 0,
        };

      })
      .filter(Boolean);


    if (historicalData.length === 0) {

      console.warn(
        `[marketDataService] Historical data contained no valid rows for ${alphaSymbol}`
      );

      return null;
    }


    /**
     * Alpha Vantage usually returns newest dates first.
     *
     * Sort oldest -> newest so charts and MongoDB processing are easier.
     */

    historicalData.sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );


    return historicalData;

  } catch (error) {

    console.warn(
      `[marketDataService] Failed to fetch historical data for ${alphaSymbol}: ${error.message}`
    );

    return null;
  }
}


/**
 * ==========================================================================
 * Generate Demo Historical Series
 * ==========================================================================
 *
 * This remains as the fallback/demo system.
 *
 * IMPORTANT:
 * This is NOT real financial data.
 * ==========================================================================
 */

function generateHistoricalSeries(
  basePrice,
  {
    days = 365,
    volatility = 0.015,
    drift = 0.0003,
  } = {}
) {

  const series = [];

  let price = basePrice;

  const today = new Date();

  today.setHours(0, 0, 0, 0);


  for (
    let i = days;
    i >= 0;
    i--
  ) {

    const date = new Date(today);

    date.setDate(
      date.getDate() - i
    );


    const dayOfWeek =
      date.getDay();


    /**
     * Skip weekends.
     */

    if (
      dayOfWeek === 0 ||
      dayOfWeek === 6
    ) {
      continue;
    }


    /**
     * Simulated daily price movement.
     */

    const changePct =
      drift +
      (Math.random() - 0.5) *
        2 *
        volatility;


    const open = price;


    price = Math.max(
      0.5,
      price * (1 + changePct)
    );


    const close = price;


    const high =
      Math.max(open, close) *
      (1 + Math.random() * 0.008);


    const low =
      Math.min(open, close) *
      (1 - Math.random() * 0.008);


    const volume =
      Math.floor(
        500000 +
        Math.random() * 4500000
      );


    series.push({
      date,
      open,
      high,
      low,
      close,
      volume,
    });
  }


  if (series.length === 0) {
    return series;
  }


  /**
   * Rescale the series so the final close equals basePrice.
   */

  const naturalFinalClose =
    series[
      series.length - 1
    ].close;


  const scale =
    naturalFinalClose
      ? basePrice / naturalFinalClose
      : 1;


  return series.map(
    (point) => ({
      date: point.date,

      open: round2(
        point.open * scale
      ),

      high: round2(
        point.high * scale
      ),

      low: round2(
        point.low * scale
      ),

      close: round2(
        point.close * scale
      ),

      volume: point.volume,
    })
  );
}


/**
 * ==========================================================================
 * Utility
 * ==========================================================================
 */

function round2(value) {
  return Math.round(value * 100) / 100;
}


/**
 * ==========================================================================
 * Exports
 * ==========================================================================
 */

module.exports = {
  isRealDataEnabled,

  fetchLiveQuote,

  fetchHistoricalData,

  generateHistoricalSeries,
};