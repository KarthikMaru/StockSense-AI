const mongoose = require("mongoose");

const historicalStockDataSchema = new mongoose.Schema(
  {
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true },
  },
  { timestamps: true }
);

// One record per stock per day.
historicalStockDataSchema.index({ stock: 1, date: 1 }, { unique: true });

historicalStockDataSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const HistoricalStockData = mongoose.model("HistoricalStockData", historicalStockDataSchema);

module.exports = HistoricalStockData;
