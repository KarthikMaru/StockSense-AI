const express = require("express");
const mongoose = require("mongoose");
const aiConfig = require("../config/aiConfig");

const router = express.Router();

/**
 * GET /api/health
 * Simple diagnostic endpoint confirming the API is running, whether MongoDB
 * is connected, and which AI provider is currently configured. Useful for
 * verifying Phase 1 setup before any real features exist.
 */
router.get("/", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];

  res.json({
    success: true,
    message: "StockSense AI backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStates[mongoose.connection.readyState] || "unknown",
    },
    ai: {
      provider: aiConfig.provider,
      configured: aiConfig.isProviderConfigured(),
    },
  });
});

module.exports = router;
