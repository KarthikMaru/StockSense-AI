/**
 * Seeds the database with demo mutual fund data across all 7 categories.
 * Run with: npm run seed:funds   (from the backend/ directory)
 * Safe to re-run: clears the MutualFund collection before reseeding.
 */
require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const MutualFund = require("../models/MutualFund");
const { DEMO_MUTUAL_FUNDS } = require("../services/mutualFundService/demoMutualFunds");

async function seed() {
  await connectDB();

  console.log("[Seed] Clearing existing MutualFund collection...");
  await MutualFund.deleteMany({});

  const docs = DEMO_MUTUAL_FUNDS.map((f) => ({ ...f, isDemoData: true }));
  await MutualFund.insertMany(docs);

  console.log(`[Seed] Done. Seeded ${docs.length} mutual funds.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
