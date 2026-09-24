const express = require("express");
const {
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
} = require("../controllers/stockController");

const router = express.Router();

// IMPORTANT: literal routes must be declared before "/:symbol" so that,
// e.g., "top" is not interpreted as a stock symbol.
router.get("/top", getTopStocks);
router.get("/gainers", getGainers);
router.get("/losers", getLosers);
router.get("/rankings", getRankings);
router.get("/sectors", getSectorSummary);
router.post("/compare", compareStocksHandler);
router.get("/sector/:sector", getStocksBySector);
router.get("/:symbol/history", getStockHistory);
router.get("/:symbol", getStockBySymbol);
router.get("/", getStocks);

module.exports = router;
