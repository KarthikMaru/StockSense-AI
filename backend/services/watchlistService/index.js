const Watchlist = require("../../models/Watchlist");
const Stock = require("../../models/Stock");
const { ApiError } = require("../../middleware/errorHandler");

/**
 * Returns the user's watchlisted stocks joined with live price/change data
 * from the Stock collection, plus when each was added. Stocks that no
 * longer exist in the Stock collection are simply omitted (no crash on
 * stale data).
 */
async function getWatchlist(userId) {
  const watchlist = await Watchlist.findOne({ user: userId });
  if (!watchlist || watchlist.stocks.length === 0) return [];

  const symbols = watchlist.stocks.map((s) => s.symbol);
  const stocks = await Stock.find({ symbol: { $in: symbols } });
  const stockMap = new Map(stocks.map((s) => [s.symbol, s]));
  const addedAtMap = new Map(watchlist.stocks.map((s) => [s.symbol, s.addedAt]));

  return symbols
    .filter((symbol) => stockMap.has(symbol))
    .map((symbol) => ({
      ...stockMap.get(symbol).toJSON(),
      addedAt: addedAtMap.get(symbol),
    }));
}

async function addStock(userId, symbol) {
  const upperSymbol = symbol.toUpperCase();

  const stock = await Stock.findOne({ symbol: upperSymbol });
  if (!stock) throw new ApiError(404, `Stock "${upperSymbol}" was not found`);

  let watchlist = await Watchlist.findOne({ user: userId });
  if (!watchlist) {
    watchlist = new Watchlist({ user: userId, stocks: [] });
  }

  const alreadyExists = watchlist.stocks.some((s) => s.symbol === upperSymbol);
  if (!alreadyExists) {
    watchlist.stocks.push({ symbol: upperSymbol });
    await watchlist.save();
  }

  return getWatchlist(userId);
}

async function removeStock(userId, symbol) {
  const upperSymbol = symbol.toUpperCase();
  const watchlist = await Watchlist.findOne({ user: userId });
  if (!watchlist) return [];

  watchlist.stocks = watchlist.stocks.filter((s) => s.symbol !== upperSymbol);
  await watchlist.save();

  return getWatchlist(userId);
}

/**
 * Returns the most-watchlisted stocks across ALL users (an anonymous,
 * aggregate popularity signal — not any individual's list). Powers the
 * Dashboard's "Most Watchlisted Stocks" section.
 */
async function getMostWatchlisted(limit = 6) {
  const results = await Watchlist.aggregate([
    { $unwind: "$stocks" },
    { $group: { _id: "$stocks.symbol", watchers: { $sum: 1 } } },
    { $sort: { watchers: -1 } },
    { $limit: limit },
  ]);

  if (results.length === 0) return [];

  const symbols = results.map((r) => r._id);
  const stocks = await Stock.find({ symbol: { $in: symbols } });
  const stockMap = new Map(stocks.map((s) => [s.symbol, s]));
  const watcherMap = new Map(results.map((r) => [r._id, r.watchers]));

  return symbols
    .filter((s) => stockMap.has(s))
    .map((symbol) => ({ ...stockMap.get(symbol).toJSON(), watchers: watcherMap.get(symbol) }));
}

module.exports = { getWatchlist, addStock, removeStock, getMostWatchlisted };
