const { asyncHandler } = require("../middleware/errorHandler");
const marketIndexService = require("../services/marketIndexService");

/**
 * @route   GET /api/market/indices
 * @access  Public
 */
const getMarketIndices = asyncHandler(async (req, res) => {
  const result = await marketIndexService.getMarketIndices();
  res.json({ success: true, ...result });
});

module.exports = { getMarketIndices };
