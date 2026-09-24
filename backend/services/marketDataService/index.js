const axios = require("axios");

/**
 * ==========================================================================
 * Market Data Service
 * ==========================================================================
 * Architecture (per project spec):
 *
 *   External Stock API
 *         |
 *   Market Data Service   <-- this file
 *         |
 *   Data Validation
 *         |
 *   MongoDB Database
 *         |
 *   StockSense AI Frontend
 *
 * This module is the single place that decides whether the app is running
 * in REAL DATA MODE or DEMO DATA MODE, and is the only place that should
 * ever call an external market data API. Callers (seed script, future sync
 * jobs) never talk to axios/external APIs directly.
 * ==========================================================================
 */

/**
 * Real data mode requires an explicit opt-in AND a configured key/base URL.
 * If any of these are missing, the app safely stays in Demo Data Mode.
 */
function isRealDataEnabled() {
  return (
    process.env.USE_REAL_MARKET_DATA === "true" &&
    Boolean(process.env.MARKET_DATA_API_KEY) &&
    Boolean(process.env.MARKET_DATA_BASE_URL)
  );
}

/**
 * Attempts to fetch a live quote for a symbol from the configured external
 * market data API. Returns null (rather than throwing) on any failure or
 * unexpected response shape, so callers can gracefully fall back to demo
 * data instead of crashing a sync job over one bad symbol.
 *
 * NOTE: The exact request/response contract depends on which market data
 * provider you connect (e.g. Alpha Vantage, Twelve Data, an NSE/BSE
 * reseller). Adjust the request params and the `validate` step below to
 * match your chosen provider's actual response shape.
 */
async function fetchLiveQuote(symbol) {
  if (!isRealDataEnabled()) return null;

  try {
    const response = await axios.get(`${process.env.MARKET_DATA_BASE_URL}/quote`, {
      params: { symbol, apikey: process.env.MARKET_DATA_API_KEY },
      timeout: 8000,
    });

    const data = response.data;

    // Defensive validation: only accept a response that has the minimum
    // fields we need. Anything else is treated as a failed fetch.
    const price = Number(data?.price ?? data?.currentPrice);
    const previousClose = Number(data?.previousClose ?? data?.prevClose);

    if (!Number.isFinite(price) || !Number.isFinite(previousClose)) {
      console.warn(`[marketDataService] Unexpected quote shape for ${symbol}, falling back to demo data.`);
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: price,
      previousClose,
      volume: Number(data.volume) || 0,
      isDemoData: false,
    };
  } catch (error) {
    console.warn(`[marketDataService] Failed to fetch live quote for ${symbol}: ${error.message}`);
    return null;
  }
}

/**
 * Generates a realistic-looking daily OHLCV price series ending at
 * `basePrice`, going back `days` calendar days (skipping weekends to
 * mimic real trading days). Used exclusively in Demo Data Mode.
 *
 * This is a simple bounded random walk with a slight upward drift — good
 * enough to produce plausible-looking charts, NOT a real financial model.
 */
function generateHistoricalSeries(basePrice, { days = 365, volatility = 0.015, drift = 0.0003 } = {}) {
  const series = [];
  // Start the random walk at basePrice; we'll rescale the whole series
  // afterwards so it ends exactly on basePrice without distorting shape.
  let price = basePrice;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const changePct = drift + (Math.random() - 0.5) * 2 * volatility;
    const open = price;
    price = Math.max(0.5, price * (1 + changePct));
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(500000 + Math.random() * 4500000);

    series.push({ date, open, high, low, close, volume });
  }

  if (series.length === 0) return series;

  // Rescale every price point uniformly so the series ends exactly at
  // basePrice. This preserves the shape/volatility of the random walk
  // (including a smooth final candle) instead of forcing a discontinuous
  // jump on the last day.
  const naturalFinalClose = series[series.length - 1].close;
  const scale = naturalFinalClose ? basePrice / naturalFinalClose : 1;

  return series.map((point) => ({
    date: point.date,
    open: round2(point.open * scale),
    high: round2(point.high * scale),
    low: round2(point.low * scale),
    close: round2(point.close * scale),
    volume: point.volume,
  }));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  isRealDataEnabled,
  fetchLiveQuote,
  generateHistoricalSeries,
};
