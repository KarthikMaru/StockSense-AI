const express = require("express");
const { getMarketIndices } = require("../controllers/marketIndexController");

const router = express.Router();

router.get("/indices", getMarketIndices);

module.exports = router;
