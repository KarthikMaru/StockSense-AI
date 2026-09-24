require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const aiRoutes = require("./routes/aiRoutes");
const mutualFundRoutes = require("./routes/mutualFundRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const marketRoutes = require("./routes/marketRoutes");

// ------------------------------------------------------------------
// Connect to MongoDB
// ------------------------------------------------------------------
connectDB();

const app = express();

// ------------------------------------------------------------------
// Core security & parsing middleware
// ------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ------------------------------------------------------------------
// Rate limiting (applies to all /api routes)
// ------------------------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api", apiLimiter);

// ------------------------------------------------------------------
// Routes
// Phase 1: health check. Phase 2: authentication + profile.
// Phase 3: stock database + historical data. Phase 5: rankings/sectors/compare.
// Phase 6: AI advisor + personalized recommendations.
// Phase 7: mutual funds + portfolio simulator. Phase 8: watchlist.
// ------------------------------------------------------------------
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/mutual-funds", mutualFundRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/market", marketRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the StockSense AI API. See /api/health for status.",
  });
});

// ------------------------------------------------------------------
// 404 + error handling (must be registered last)
// ------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ------------------------------------------------------------------
// Start server
// ------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

// Guard app.listen so this file can be safely `require()`'d by tests
// (e.g. supertest) without opening a real network port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] StockSense AI backend running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
}

module.exports = app;
