const mongoose = require("mongoose");
const { SECTORS, RISK_LEVELS } = require("../utils/constants");

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, "Stock symbol is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    sector: {
      type: String,
      enum: SECTORS,
      required: [true, "Sector is required"],
      index: true,
    },
    industry: {
      type: String,
      trim: true,
    },

    // ---- Pricing ----
    currentPrice: { type: Number, required: true, min: 0 },
    previousClose: { type: Number, required: true, min: 0 },
    // change / changePercent are derived from currentPrice vs previousClose,
    // but stored (not virtual) so they can be queried and sorted on directly
    // (e.g. top gainers / top losers) without an aggregation pipeline.
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },

    // ---- Fundamentals ----
    marketCap: { type: Number, required: true, min: 0 }, // in rupees
    peRatio: { type: Number },
    eps: { type: Number },
    dividendYield: { type: Number }, // percent
    revenue: { type: Number }, // annual, in rupees
    netProfit: { type: Number }, // annual, in rupees
    debt: { type: Number }, // in rupees
    roe: { type: Number }, // percent
    roce: { type: Number }, // percent
    fiftyTwoWeekHigh: { type: Number },
    fiftyTwoWeekLow: { type: Number },

    // ---- Scoring (Phase 5 — objective, rule-based, not personalized) ----
    // Annualized volatility (%) computed from the historical price series.
    volatility: { type: Number, default: 0 },
    riskLevel: { type: String, enum: RISK_LEVELS, default: "Medium" },
    // 0-100 composite Investment Score based on the stock's own
    // performance, fundamentals and stability — see services/stockService/scoring.js.
    aiScore: { type: Number, min: 0, max: 100, default: 0 },
    aiScoreReasons: { type: [String], default: [] },
    // Computed once at seed/sync time from historical data, so the Stock
    // Explorer can sort/display "1 Year Return" without an expensive
    // per-row historical query on every list request.
    oneYearReturn: { type: Number, default: 0 },

    // ---- Data provenance ----
    // Distinguishes demo/seeded data from a real market data feed, so the
    // UI can always honestly label what the user is looking at.
    isDemoData: { type: Boolean, default: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Recompute change/changePercent whenever price fields change, so callers
// never have to remember to do this themselves.
stockSchema.pre("save", function computeChange(next) {
  if (this.isModified("currentPrice") || this.isModified("previousClose")) {
    const change = this.currentPrice - this.previousClose;
    this.change = Math.round(change * 100) / 100;
    this.changePercent = this.previousClose
      ? Math.round((change / this.previousClose) * 10000) / 100
      : 0;
  }
  next();
});

// Support case-insensitive company/symbol search.
stockSchema.index({ companyName: "text", symbol: "text" });

stockSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;
