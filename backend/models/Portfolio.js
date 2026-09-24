const mongoose = require("mongoose");

/**
 * A single hypothetical holding within a user's simulated portfolio.
 * currentValue/profitLoss are intentionally NOT stored — they're computed
 * on read against live Stock prices (see services/portfolioService), since
 * storing them would go stale the moment the market price changes.
 */
const investmentSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, required: true },
    investedAmount: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: true }
);

const portfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    investments: [investmentSchema],
  },
  { timestamps: true }
);

portfolioSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Portfolio", portfolioSchema);
