const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const watchlistService = require("../services/watchlistService");

/**
 * @route   GET /api/watchlist
 * @access  Private
 */
const getWatchlist = asyncHandler(async (req, res) => {
  const stocks = await watchlistService.getWatchlist(req.user.id);
  res.json({ success: true, count: stocks.length, stocks });
});

/**
 * @route   POST /api/watchlist
 * @access  Private
 * @body    { symbol }
 */
const addStock = asyncHandler(async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) throw new ApiError(400, "symbol is required");

  const stocks = await watchlistService.addStock(req.user.id, symbol);
  res.status(201).json({ success: true, message: `${symbol.toUpperCase()} added to watchlist`, count: stocks.length, stocks });
});

/**
 * @route   DELETE /api/watchlist/:symbol
 * @access  Private
 */
const removeStock = asyncHandler(async (req, res) => {
  const stocks = await watchlistService.removeStock(req.user.id, req.params.symbol);
  res.json({ success: true, message: `${req.params.symbol.toUpperCase()} removed from watchlist`, count: stocks.length, stocks });
});

/**
 * @route   GET /api/watchlist/popular
 * @access  Public
 */
const getMostWatchlisted = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Number(req.query.limit) || 6);
  const stocks = await watchlistService.getMostWatchlisted(limit);
  res.json({ success: true, count: stocks.length, stocks });
});

module.exports = { getWatchlist, addStock, removeStock, getMostWatchlisted };
