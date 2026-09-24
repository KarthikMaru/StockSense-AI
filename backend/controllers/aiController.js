const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const aiService = require("../services/aiService");
const recommendationService = require("../services/recommendationService");
const stockService = require("../services/stockService");
const User = require("../models/User");

/**
 * Resolves the profile to personalize against: an explicit `profile` object
 * in the request body takes priority (lets logged-out visitors try the
 * advisor), otherwise falls back to the logged-in user's saved preferences.
 * Returns null if neither is available.
 */
async function resolveProfile(req) {
  if (req.body?.profile && typeof req.body.profile === "object") {
    return req.body.profile;
  }
  if (req.user?.id) {
    const user = await User.findById(req.user.id);
    if (user) {
      return {
        riskTolerance: user.riskTolerance,
        investmentGoal: user.investmentGoal,
        investmentBudget: user.investmentBudget,
        investmentDuration: user.investmentDuration,
        preferredInvestmentTypes: user.preferredInvestmentTypes,
        preferredSectors: user.preferredSectors,
      };
    }
  }
  return null;
}

/**
 * @route   POST /api/ai/chat
 * @access  Public
 * @body    { messages: [{ role: "user"|"assistant", content: string }] }
 */
const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "A non-empty messages array is required");
  }
  const reply = await aiService.chat(messages);
  res.json({ success: true, reply });
});

/**
 * @route   POST /api/ai/recommend
 * @access  Public (personalizes using body.profile) / Private (uses saved profile)
 */
const recommend = asyncHandler(async (req, res) => {
  const profile = await resolveProfile(req);
  if (!profile) {
    throw new ApiError(400, "Log in, or provide a `profile` object in the request body, to get personalized recommendations");
  }
  const recommendations = await recommendationService.getRecommendations(profile, {
    limit: Math.min(20, Number(req.body?.limit) || 6),
  });
  res.json({ success: true, profile, count: recommendations.length, recommendations });
});

/**
 * @route   POST /api/ai/build-portfolio
 * @access  Public (personalizes using body.profile) / Private (uses saved profile)
 */
const buildPortfolio = asyncHandler(async (req, res) => {
  const profile = await resolveProfile(req);
  if (!profile) {
    throw new ApiError(400, "Log in, or provide a `profile` object in the request body, to build a portfolio");
  }
  const recommendations = await recommendationService.getRecommendations(profile, { limit: 20 });
  const portfolio = recommendationService.buildPortfolio(profile, recommendations);
  res.json({ success: true, profile, portfolio });
});

/**
 * @route   POST /api/ai/analyze-stock
 * @access  Public
 * @body    { symbol: string }
 */
const analyzeStock = asyncHandler(async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) throw new ApiError(400, "symbol is required");

  const stock = await stockService.getStockBySymbol(symbol);
  if (!stock) throw new ApiError(404, `Stock "${symbol.toUpperCase()}" was not found`);

  const performance = await stockService.getPerformanceReturns(stock._id, stock.currentPrice);
  const analysis = await aiService.analyzeStock(stock, performance);

  res.json({ success: true, symbol: stock.symbol, analysis });
});

/**
 * @route   POST /api/ai/compare-stocks
 * @access  Public (optionally personalizes if a profile/logged-in user is present)
 * @body    { symbols: string[2-3] }
 *
 * Distinct from POST /api/stocks/compare (Phase 5's raw metrics + rule-based
 * highlights): this endpoint additionally asks the AI service to narrate
 * the comparison, optionally personalized to the caller's risk tolerance.
 */
const compareStocksHandler = asyncHandler(async (req, res) => {
  const { symbols } = req.body;
  if (!Array.isArray(symbols) || symbols.length < 2 || symbols.length > 3) {
    throw new ApiError(400, "Provide 2 or 3 stock symbols to compare");
  }

  const profile = await resolveProfile(req);
  const result = await stockService.compareStocks(symbols, profile?.riskTolerance);
  if (!result) throw new ApiError(404, "One or more of the requested stocks were not found");

  const narrative = await aiService.compareStocksNarrative(result, profile?.riskTolerance);

  res.json({ success: true, ...result, narrative });
});

module.exports = { chat, recommend, buildPortfolio, analyzeStock, compareStocksHandler };
