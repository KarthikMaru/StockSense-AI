const mongoose = require("mongoose");

/**
 * Represents a headline market index (NIFTY 50, SENSEX, NIFTY BANK, etc.)
 * for the Dashboard/Home "Market Overview" section. In Demo Data Mode the
 * value/change are derived from the aggregate performance of seeded
 * stocks (see services/marketIndexService) rather than being arbitrary
 * fake numbers, so the sentiment shown is at least internally consistent
 * with the rest of the demo dataset.
 */
const marketIndexSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    value: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    isDemoData: { type: Boolean, default: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketIndexSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("MarketIndex", marketIndexSchema);
