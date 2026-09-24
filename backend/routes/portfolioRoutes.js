const express = require("express");
const { getPortfolio, addInvestment, removeInvestment } = require("../controllers/portfolioController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getPortfolio);
router.post("/", addInvestment);
router.delete("/:id", removeInvestment);

module.exports = router;
