const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const mutualFundService = require("../services/mutualFundService");

/**
 * @route   GET /api/mutual-funds
 * @access  Public
 * @query   search, category, riskLevel, sortBy, order, page, limit
 */
const getFunds = asyncHandler(async (req, res) => {
  const { search, category, riskLevel, sortBy, order, page, limit } = req.query;
  const result = await mutualFundService.listFunds({ search, category, riskLevel, sortBy, order, page, limit });
  res.json({ success: true, ...result });
});

/**
 * @route   GET /api/mutual-funds/:id
 * @access  Public
 */
const getFundById = asyncHandler(async (req, res) => {
  const fund = await mutualFundService.getFundById(req.params.id);
  if (!fund) throw new ApiError(404, "Mutual fund not found");
  res.json({ success: true, fund });
});

/**
 * @route   POST /api/mutual-funds/compare
 * @access  Public
 * @body    { ids: string[2-3] }
 */
const compareFunds = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
    throw new ApiError(400, "Provide 2 or 3 mutual fund ids to compare");
  }
  const result = await mutualFundService.compareFunds(ids);
  if (!result) throw new ApiError(404, "One or more of the requested funds were not found");
  res.json({ success: true, ...result });
});

module.exports = { getFunds, getFundById, compareFunds };
