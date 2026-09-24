const express = require("express");
const { getFunds, getFundById, compareFunds } = require("../controllers/mutualFundController");

const router = express.Router();

router.post("/compare", compareFunds);
router.get("/:id", getFundById);
router.get("/", getFunds);

module.exports = router;
