/**
 * Illustrative mutual fund data for DEMO DATA MODE — not live NAV/returns.
 * Covers all 7 categories from the spec, across well-known Indian fund
 * houses, for a realistic browsing/filtering/comparison experience.
 */
const DEMO_MUTUAL_FUNDS = [
  // ---- Large Cap Funds ----
  { fundName: "Bluechip Growth Fund", fundHouse: "HDFC Mutual Fund", category: "Large Cap Fund", nav: 892.45, expenseRatio: 1.05, riskLevel: "Medium", returns: { oneYear: 18.2, threeYear: 15.4, fiveYear: 14.1 }, aum: 45000 * 1e7 },
  { fundName: "Large Cap Equity Fund", fundHouse: "ICICI Prudential", category: "Large Cap Fund", nav: 645.2, expenseRatio: 0.98, riskLevel: "Medium", returns: { oneYear: 17.5, threeYear: 14.8, fiveYear: 13.6 }, aum: 38500 * 1e7 },
  { fundName: "Top 100 Fund", fundHouse: "SBI Mutual Fund", category: "Large Cap Fund", nav: 412.9, expenseRatio: 0.89, riskLevel: "Medium", returns: { oneYear: 16.8, threeYear: 14.2, fiveYear: 13.9 }, aum: 29800 * 1e7 },

  // ---- Mid Cap Funds ----
  { fundName: "Midcap Opportunities Fund", fundHouse: "Axis Mutual Fund", category: "Mid Cap Fund", nav: 118.6, expenseRatio: 1.42, riskLevel: "High", returns: { oneYear: 26.4, threeYear: 21.8, fiveYear: 18.9 }, aum: 18200 * 1e7 },
  { fundName: "Emerging Equity Fund", fundHouse: "Kotak Mahindra", category: "Mid Cap Fund", nav: 96.3, expenseRatio: 1.38, riskLevel: "High", returns: { oneYear: 24.9, threeYear: 20.5, fiveYear: 17.6 }, aum: 15400 * 1e7 },

  // ---- Small Cap Funds ----
  { fundName: "Small Cap Discovery Fund", fundHouse: "Nippon India", category: "Small Cap Fund", nav: 152.8, expenseRatio: 1.68, riskLevel: "High", returns: { oneYear: 32.1, threeYear: 24.6, fiveYear: 20.2 }, aum: 21500 * 1e7 },
  { fundName: "Small Cap Fund", fundHouse: "DSP Mutual Fund", category: "Small Cap Fund", nav: 138.4, expenseRatio: 1.72, riskLevel: "High", returns: { oneYear: 29.8, threeYear: 23.1, fiveYear: 19.4 }, aum: 14800 * 1e7 },

  // ---- Index Funds ----
  { fundName: "Nifty 50 Index Fund", fundHouse: "UTI Mutual Fund", category: "Index Fund", nav: 178.9, expenseRatio: 0.2, riskLevel: "Medium", returns: { oneYear: 15.9, threeYear: 13.2, fiveYear: 12.8 }, aum: 12500 * 1e7 },
  { fundName: "Sensex Index Fund", fundHouse: "HDFC Mutual Fund", category: "Index Fund", nav: 605.4, expenseRatio: 0.18, riskLevel: "Medium", returns: { oneYear: 15.6, threeYear: 13.0, fiveYear: 12.5 }, aum: 9800 * 1e7 },
  { fundName: "Nifty Next 50 Index Fund", fundHouse: "ICICI Prudential", category: "Index Fund", nav: 52.7, expenseRatio: 0.3, riskLevel: "Medium", returns: { oneYear: 19.4, threeYear: 16.1, fiveYear: 14.7 }, aum: 6200 * 1e7 },

  // ---- ELSS (tax-saving) ----
  { fundName: "Long Term Equity Fund (ELSS)", fundHouse: "Axis Mutual Fund", category: "ELSS", nav: 88.2, expenseRatio: 1.12, riskLevel: "Medium", returns: { oneYear: 19.8, threeYear: 15.9, fiveYear: 14.5 }, aum: 32400 * 1e7 },
  { fundName: "Tax Saver Fund", fundHouse: "SBI Mutual Fund", category: "ELSS", nav: 305.6, expenseRatio: 0.95, riskLevel: "Medium", returns: { oneYear: 18.6, threeYear: 15.2, fiveYear: 14.0 }, aum: 24900 * 1e7 },
  { fundName: "ELSS Tax Saver Fund", fundHouse: "Mirae Asset", category: "ELSS", nav: 42.8, expenseRatio: 1.08, riskLevel: "Medium", returns: { oneYear: 20.5, threeYear: 16.8, fiveYear: 15.1 }, aum: 18700 * 1e7 },

  // ---- Debt Funds ----
  { fundName: "Corporate Bond Fund", fundHouse: "HDFC Mutual Fund", category: "Debt Fund", nav: 24.6, expenseRatio: 0.35, riskLevel: "Low", returns: { oneYear: 7.4, threeYear: 6.9, fiveYear: 7.1 }, aum: 21300 * 1e7 },
  { fundName: "Banking & PSU Debt Fund", fundHouse: "Kotak Mahindra", category: "Debt Fund", nav: 58.9, expenseRatio: 0.32, riskLevel: "Low", returns: { oneYear: 7.1, threeYear: 6.7, fiveYear: 6.9 }, aum: 15600 * 1e7 },
  { fundName: "Short Term Debt Fund", fundHouse: "ICICI Prudential", category: "Debt Fund", nav: 45.2, expenseRatio: 0.4, riskLevel: "Low", returns: { oneYear: 7.6, threeYear: 6.8, fiveYear: 6.8 }, aum: 12400 * 1e7 },

  // ---- Hybrid Funds ----
  { fundName: "Balanced Advantage Fund", fundHouse: "ICICI Prudential", category: "Hybrid Fund", nav: 62.3, expenseRatio: 0.85, riskLevel: "Medium", returns: { oneYear: 13.8, threeYear: 11.9, fiveYear: 11.2 }, aum: 58900 * 1e7 },
  { fundName: "Equity Savings Fund", fundHouse: "Kotak Mahindra", category: "Hybrid Fund", nav: 28.4, expenseRatio: 0.78, riskLevel: "Low", returns: { oneYear: 11.2, threeYear: 9.8, fiveYear: 9.5 }, aum: 8900 * 1e7 },
  { fundName: "Aggressive Hybrid Fund", fundHouse: "SBI Mutual Fund", category: "Hybrid Fund", nav: 94.6, expenseRatio: 0.92, riskLevel: "Medium", returns: { oneYear: 16.4, threeYear: 13.5, fiveYear: 12.9 }, aum: 19200 * 1e7 },
];

module.exports = { DEMO_MUTUAL_FUNDS };
