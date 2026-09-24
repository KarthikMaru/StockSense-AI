const express = require("express");
const { chat, recommend, buildPortfolio, analyzeStock, compareStocksHandler } = require("../controllers/aiController");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/chat", chat);
router.post("/recommend", optionalAuth, recommend);
router.post("/build-portfolio", optionalAuth, buildPortfolio);
router.post("/analyze-stock", analyzeStock);
router.post("/compare-stocks", optionalAuth, compareStocksHandler);

module.exports = router;
