const express = require("express");
const { getWatchlist, addStock, removeStock, getMostWatchlisted } = require("../controllers/watchlistController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: aggregate popularity across all users, no auth required.
router.get("/popular", getMostWatchlisted);

router.use(protect);
router.get("/", getWatchlist);
router.post("/", addStock);
router.delete("/:symbol", removeStock);

module.exports = router;
