const mongoose = require("mongoose");
const { MUTUAL_FUND_CATEGORIES, RISK_LEVELS } = require("../utils/constants");

const mutualFundSchema = new mongoose.Schema(
  {
    fundName: { type: String, required: true, trim: true },
    fundHouse: { type: String, required: true, trim: true },
    category: { type: String, enum: MUTUAL_FUND_CATEGORIES, required: true, index: true },
    nav: { type: Number, required: true, min: 0 },
    expenseRatio: { type: Number, required: true }, // percent
    riskLevel: { type: String, enum: RISK_LEVELS, required: true },
    returns: {
      oneYear: { type: Number, default: null },
      threeYear: { type: Number, default: null },
      fiveYear: { type: Number, default: null },
    },
    aum: { type: Number, default: null }, // Assets Under Management, in ₹
    isDemoData: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mutualFundSchema.index({ fundName: "text", fundHouse: "text" });

mutualFundSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("MutualFund", mutualFundSchema);
