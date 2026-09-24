const MutualFund = require("../../models/MutualFund");

async function listFunds({ search, category, riskLevel, sortBy = "aum", order = "desc", page = 1, limit = 50 } = {}) {
  const query = {};
  if (category && category !== "All") query.category = category;
  if (riskLevel && riskLevel !== "All") query.riskLevel = riskLevel;
  if (search) {
    query.$or = [
      { fundName: { $regex: search, $options: "i" } },
      { fundHouse: { $regex: search, $options: "i" } },
    ];
  }

  const sortFieldMap = {
    aum: "aum",
    nav: "nav",
    expenseRatio: "expenseRatio",
    oneYear: "returns.oneYear",
    threeYear: "returns.threeYear",
    fiveYear: "returns.fiveYear",
  };
  const sortField = sortFieldMap[sortBy] || "aum";
  const sortOrder = order === "asc" ? 1 : -1;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [funds, total] = await Promise.all([
    MutualFund.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(safeLimit),
    MutualFund.countDocuments(query),
  ]);

  return {
    funds,
    pagination: { total, page: safePage, limit: safeLimit, pages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}

async function getFundById(id) {
  return MutualFund.findById(id);
}

/**
 * Rule-based comparison of 2-3 mutual funds, mirroring stockService.compareStocks:
 * lowest expense ratio, highest 1Y return, and a plain-language summary that
 * never promises future performance.
 */
async function compareFunds(ids) {
  const funds = await MutualFund.find({ _id: { $in: ids } });
  if (funds.length < 2) return null;

  const lowestExpense = [...funds].sort((a, b) => a.expenseRatio - b.expenseRatio)[0];
  const bestOneYear = [...funds].sort((a, b) => (b.returns.oneYear ?? -Infinity) - (a.returns.oneYear ?? -Infinity))[0];
  const bestFiveYear = [...funds].sort((a, b) => (b.returns.fiveYear ?? -Infinity) - (a.returns.fiveYear ?? -Infinity))[0];

  const highlights = [
    `${lowestExpense.fundName} has the lowest expense ratio at ${lowestExpense.expenseRatio}%, meaning more of your investment stays invested.`,
    `${bestOneYear.fundName} had the strongest 1-year historical return at ${bestOneYear.returns.oneYear}%.`,
    `${bestFiveYear.fundName} had the strongest 5-year historical return at ${bestFiveYear.returns.fiveYear}%, if a longer track record matters to you.`,
    "Past returns do not guarantee future performance. Compare expense ratios and risk levels alongside returns, and consider consulting a financial advisor for personalized guidance.",
  ];

  return { funds, summary: { lowestExpense: lowestExpense.fundName, bestOneYear: bestOneYear.fundName, bestFiveYear: bestFiveYear.fundName, highlights } };
}

module.exports = { listFunds, getFundById, compareFunds };
