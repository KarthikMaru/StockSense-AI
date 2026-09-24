const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const stockService = require("../services/stockService");
const { HISTORY_RANGES } = require("../utils/constants");

/**
 * @route   GET /api/stocks
 * @access  Public
 * @query   search, sector, sortBy, order, page, limit
 */
const getStocks = asyncHandler(async (req, res) => {
  const { search, sector, sortBy, order, page, limit } = req.query;
  const result = await stockService.listStocks({ search, sector, sortBy, order, page, limit });
  res.json({ success: true, ...result });
});

/**
 * @route   GET /api/stocks/top
 * @access  Public
 * @query   limit
 */
const getTopStocks = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const stocks = await stockService.getTopStocks(limit);
  res.json({ success: true, count: stocks.length, stocks });
});

/**
 * @route   GET /api/stocks/gainers
 * @route   GET /api/stocks/losers
 * @access  Public
 * @query   limit
 */
const getGainers = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const stocks = await stockService.getMovers("gainers", limit);
  res.json({ success: true, count: stocks.length, stocks });
});

const getLosers = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const stocks = await stockService.getMovers("losers", limit);
  res.json({ success: true, count: stocks.length, stocks });
});

/**
 * @route   GET /api/stocks/sector/:sector
 * @access  Public
 */
const getStocksBySector = asyncHandler(async (req, res) => {
  const stocks = await stockService.getStocksBySector(req.params.sector);
  res.json({ success: true, sector: req.params.sector, count: stocks.length, stocks });
});

/**
 * @route   GET /api/stocks/:symbol
 * @access  Public
 */
const getStockBySymbol = asyncHandler(async (req, res) => {
  const stock = await stockService.getStockBySymbol(req.params.symbol);
  if (!stock) {
    throw new ApiError(404, `Stock "${req.params.symbol.toUpperCase()}" was not found`);
  }

  const performance = await stockService.getPerformanceReturns(stock._id, stock.currentPrice);

  res.json({ success: true, stock, performance });
});

/**
 * @route   GET /api/stocks/:symbol/history
 * @access  Public
 * @query   range (1D | 1W | 1M | 3M | 6M | 1Y | 3Y | 5Y)
 */
const getStockHistory = asyncHandler(async (req, res) => {
  const range = Object.keys(HISTORY_RANGES).includes(req.query.range) ? req.query.range : "1M";
  const history = await stockService.getHistory(req.params.symbol, range);

  if (history === null) {
    throw new ApiError(404, `Stock "${req.params.symbol.toUpperCase()}" was not found`);
  }

  res.json({
    success: true,
    symbol: req.params.symbol.toUpperCase(),
    range,
    count: history.length,
    history,
  });
});

/**
 * @route   GET /api/stocks/rankings
 * @access  Public
 * @query   sector, riskLevel, marketCapTier, page, limit
 */
const getRankings = asyncHandler(async (req, res) => {
  const { sector, riskLevel, marketCapTier, page, limit } = req.query;
  const result = await stockService.getRankings({ sector, riskLevel, marketCapTier, page, limit });
  res.json({ success: true, ...result });
});

/**
 * @route   GET /api/stocks/sectors
 * @access  Public
 */
const getSectorSummary = asyncHandler(async (req, res) => {
  const sectors = await stockService.getSectorSummary();
  res.json({ success: true, count: sectors.length, sectors });
});

/**
 * @route   POST /api/stocks/compare
 * @access  Public
 * @body    { symbols: string[] } — 2 or 3 symbols
 */
const compareStocksHandler = asyncHandler(async (req, res) => {
  const { symbols } = req.body;

  if (!Array.isArray(symbols) || symbols.length < 2 || symbols.length > 3) {
    throw new ApiError(400, "Provide 2 or 3 stock symbols to compare");
  }

  const result = await stockService.compareStocks(symbols);
  if (!result) {
    throw new ApiError(404, "One or more of the requested stocks were not found");
  }

  res.json({ success: true, ...result });
});

module.exports = {
  getStocks,
  getTopStocks,
  getGainers,
  getLosers,
  getStocksBySector,
  getStockBySymbol,
  getStockHistory,
  getRankings,
  getSectorSummary,
  compareStocksHandler,
};
