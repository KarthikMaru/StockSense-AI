const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const portfolioService = require("../services/portfolioService");
const stockService = require("../services/stockService");

/**
 * @route   GET /api/portfolio
 * @access  Private
 */
const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.getPortfolio(req.user.id);
  res.json({ success: true, portfolio });
});

/**
 * @route   POST /api/portfolio
 * @access  Private
 * @body    { symbol, investedAmount, purchasePrice? }
 * If purchasePrice is omitted, the stock's current price is used (i.e. "buy today").
 */
const addInvestment = asyncHandler(async (req, res) => {
  const { symbol, investedAmount, purchasePrice, purchaseDate } = req.body;

  if (!symbol || !investedAmount || investedAmount <= 0) {
    throw new ApiError(400, "symbol and a positive investedAmount are required");
  }

  const stock = await stockService.getStockBySymbol(symbol);
  if (!stock) throw new ApiError(404, `Stock "${symbol.toUpperCase()}" was not found`);

  const effectivePurchasePrice = purchasePrice && purchasePrice > 0 ? purchasePrice : stock.currentPrice;

  const portfolio = await portfolioService.addInvestment(req.user.id, {
    symbol: stock.symbol,
    companyName: stock.companyName,
    investedAmount,
    purchasePrice: effectivePurchasePrice,
    purchaseDate,
  });

  res.status(201).json({ success: true, message: "Investment added to your simulated portfolio", portfolio });
});

/**
 * @route   DELETE /api/portfolio/:id
 * @access  Private
 */
const removeInvestment = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.removeInvestment(req.user.id, req.params.id);
  if (!portfolio) throw new ApiError(404, "Portfolio not found");
  res.json({ success: true, message: "Investment removed", portfolio });
});

module.exports = { getPortfolio, addInvestment, removeInvestment };
