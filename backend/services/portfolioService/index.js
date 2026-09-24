const Portfolio = require("../../models/Portfolio");
const Stock = require("../../models/Stock");

/**
 * Attaches live current price/value/profit-loss to each investment by
 * looking up its symbol in the Stock collection. If a symbol no longer
 * exists in the Stock collection, falls back to the purchase price (so the
 * simulator never crashes on stale data — it just shows 0 profit/loss).
 */
async function withLiveValues(portfolio) {
  if (!portfolio || portfolio.investments.length === 0) {
    return { investments: [], totalInvestment: 0, currentValue: 0, totalProfitLoss: 0, totalReturnPercent: 0, allocation: [] };
  }

  const symbols = [...new Set(portfolio.investments.map((i) => i.symbol))];
  const stocks = await Stock.find({ symbol: { $in: symbols } }).select("symbol currentPrice sector");
  const priceMap = new Map(stocks.map((s) => [s.symbol, s]));

  const investments = portfolio.investments.map((inv) => {
    const live = priceMap.get(inv.symbol);
    const currentPrice = live ? live.currentPrice : inv.purchasePrice;
    const currentValue = Math.round(currentPrice * inv.quantity * 100) / 100;
    const profitLoss = Math.round((currentValue - inv.investedAmount) * 100) / 100;
    const returnPercent = inv.investedAmount > 0 ? Math.round((profitLoss / inv.investedAmount) * 10000) / 100 : 0;

    return {
      _id: inv._id,
      symbol: inv.symbol,
      companyName: inv.companyName,
      sector: live?.sector || null,
      investedAmount: inv.investedAmount,
      purchasePrice: inv.purchasePrice,
      quantity: inv.quantity,
      purchaseDate: inv.purchaseDate,
      currentPrice,
      currentValue,
      profitLoss,
      returnPercent,
    };
  });

  const totalInvestment = Math.round(investments.reduce((sum, i) => sum + i.investedAmount, 0) * 100) / 100;
  const currentValue = Math.round(investments.reduce((sum, i) => sum + i.currentValue, 0) * 100) / 100;
  const totalProfitLoss = Math.round((currentValue - totalInvestment) * 100) / 100;
  const totalReturnPercent = totalInvestment > 0 ? Math.round((totalProfitLoss / totalInvestment) * 10000) / 100 : 0;

  // Asset allocation by sector (falls back to "Unknown" for stocks not found).
  const allocationMap = new Map();
  investments.forEach((i) => {
    const key = i.sector || "Unknown";
    allocationMap.set(key, (allocationMap.get(key) || 0) + i.currentValue);
  });
  const allocation = [...allocationMap.entries()].map(([sector, value]) => ({
    sector,
    value: Math.round(value * 100) / 100,
    percent: currentValue > 0 ? Math.round((value / currentValue) * 10000) / 100 : 0,
  }));

  return { investments, totalInvestment, currentValue, totalProfitLoss, totalReturnPercent, allocation };
}

async function getPortfolio(userId) {
  const portfolio = await Portfolio.findOne({ user: userId });
  return withLiveValues(portfolio);
}

async function addInvestment(userId, { symbol, companyName, investedAmount, purchasePrice, purchaseDate }) {
  const quantity = purchasePrice > 0 ? investedAmount / purchasePrice : 0;

  let portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) {
    portfolio = new Portfolio({ user: userId, investments: [] });
  }

  portfolio.investments.push({
    symbol: symbol.toUpperCase(),
    companyName,
    investedAmount,
    purchasePrice,
    quantity,
    purchaseDate: purchaseDate || new Date(),
  });

  await portfolio.save();
  return withLiveValues(portfolio);
}

async function removeInvestment(userId, investmentId) {
  const portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) return null;

  portfolio.investments = portfolio.investments.filter((inv) => String(inv._id) !== String(investmentId));
  await portfolio.save();
  return withLiveValues(portfolio);
}

module.exports = { getPortfolio, addInvestment, removeInvestment };
