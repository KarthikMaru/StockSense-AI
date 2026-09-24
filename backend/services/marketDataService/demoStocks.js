/**
 * Illustrative fundamentals for a realistic set of Indian equities across
 * every sector defined in utils/constants.js. Values are approximate,
 * illustrative figures for a DEMO DATA MODE — not live market data.
 *
 * Fields:
 *   basePrice    -> anchors the generated historical series' latest close
 *   peRatio/eps/dividendYield/roe/roce -> illustrative ratios (%)
 *   marketCapCr/revenueCr/netProfitCr/debtCr -> figures in ₹ Crore
 */
const DEMO_STOCKS = [
  // ---- Technology ----
  { symbol: "TCS", companyName: "Tata Consultancy Services", sector: "Technology", industry: "IT Services", basePrice: 3850, peRatio: 28.4, eps: 135.6, dividendYield: 1.6, marketCapCr: 1395000, revenueCr: 240000, netProfitCr: 45000, debtCr: 5000, roe: 45.2, roce: 58.1 },
  { symbol: "INFY", companyName: "Infosys", sector: "Technology", industry: "IT Services", basePrice: 1650, peRatio: 25.1, eps: 65.7, dividendYield: 2.3, marketCapCr: 685000, revenueCr: 158000, netProfitCr: 26500, debtCr: 3200, roe: 31.4, roce: 40.2 },
  { symbol: "WIPRO", companyName: "Wipro", sector: "Technology", industry: "IT Services", basePrice: 480, peRatio: 21.8, eps: 22.0, dividendYield: 1.1, marketCapCr: 251000, revenueCr: 89500, netProfitCr: 11200, debtCr: 4100, roe: 16.8, roce: 20.5 },
  { symbol: "HCLTECH", companyName: "HCL Technologies", sector: "Technology", industry: "IT Services", basePrice: 1780, peRatio: 24.6, eps: 72.3, dividendYield: 3.1, marketCapCr: 483000, revenueCr: 111000, netProfitCr: 16800, debtCr: 2800, roe: 24.3, roce: 29.8 },
  { symbol: "TECHM", companyName: "Tech Mahindra", sector: "Technology", industry: "IT Services", basePrice: 1620, peRatio: 26.9, eps: 60.2, dividendYield: 2.5, marketCapCr: 157000, revenueCr: 52500, netProfitCr: 4200, debtCr: 3500, roe: 14.1, roce: 17.6 },

  // ---- Banking & Financial Services ----
  { symbol: "HDFCBANK", companyName: "HDFC Bank", sector: "Banking & Financial Services", industry: "Private Banks", basePrice: 1720, peRatio: 19.5, eps: 88.2, dividendYield: 1.2, marketCapCr: 1305000, revenueCr: 310000, netProfitCr: 64000, debtCr: 0, roe: 16.5, roce: 8.9 },
  { symbol: "ICICIBANK", companyName: "ICICI Bank", sector: "Banking & Financial Services", industry: "Private Banks", basePrice: 1265, peRatio: 18.2, eps: 69.5, dividendYield: 0.9, marketCapCr: 890000, revenueCr: 218000, netProfitCr: 44000, debtCr: 0, roe: 18.1, roce: 9.5 },
  { symbol: "SBIN", companyName: "State Bank of India", sector: "Banking & Financial Services", industry: "Public Banks", basePrice: 820, peRatio: 11.4, eps: 71.9, dividendYield: 1.8, marketCapCr: 732000, revenueCr: 495000, netProfitCr: 67000, debtCr: 0, roe: 19.8, roce: 7.2 },
  { symbol: "AXISBANK", companyName: "Axis Bank", sector: "Banking & Financial Services", industry: "Private Banks", basePrice: 1150, peRatio: 14.8, eps: 77.7, dividendYield: 0.1, marketCapCr: 355000, revenueCr: 132000, netProfitCr: 24500, debtCr: 0, roe: 17.2, roce: 8.4 },
  { symbol: "BAJFINANCE", companyName: "Bajaj Finance", sector: "Banking & Financial Services", industry: "NBFC", basePrice: 7150, peRatio: 31.2, eps: 229.2, dividendYield: 0.4, marketCapCr: 442000, revenueCr: 58000, netProfitCr: 14200, debtCr: 315000, roe: 22.4, roce: 12.1 },

  // ---- Energy Resources ----
  { symbol: "RELIANCE", companyName: "Reliance Industries", sector: "Energy Resources", industry: "Oil & Gas / Conglomerate", basePrice: 2980, peRatio: 24.7, eps: 120.6, dividendYield: 0.4, marketCapCr: 2018000, revenueCr: 990000, netProfitCr: 79000, debtCr: 310000, roe: 9.8, roce: 11.2 },
  { symbol: "ONGC", companyName: "Oil and Natural Gas Corporation", sector: "Energy Resources", industry: "Oil & Gas", basePrice: 265, peRatio: 8.1, eps: 32.7, dividendYield: 5.2, marketCapCr: 333000, revenueCr: 640000, netProfitCr: 38500, debtCr: 45000, roe: 14.5, roce: 17.8 },
  { symbol: "IOC", companyName: "Indian Oil Corporation", sector: "Energy Resources", industry: "Oil Refining & Marketing", basePrice: 168, peRatio: 9.4, eps: 17.9, dividendYield: 6.8, marketCapCr: 237000, revenueCr: 875000, netProfitCr: 22000, debtCr: 158000, roe: 16.2, roce: 13.4 },
  { symbol: "NTPC", companyName: "NTPC Limited", sector: "Energy Resources", industry: "Electric Power", basePrice: 385, peRatio: 16.8, eps: 22.9, dividendYield: 2.4, marketCapCr: 373000, revenueCr: 178000, netProfitCr: 20200, debtCr: 195000, roe: 13.1, roce: 10.9 },
  { symbol: "POWERGRID", companyName: "Power Grid Corporation of India", sector: "Energy Resources", industry: "Electric Power", basePrice: 330, peRatio: 18.2, eps: 18.1, dividendYield: 3.9, marketCapCr: 307000, revenueCr: 47500, netProfitCr: 16500, debtCr: 132000, roe: 24.6, roce: 12.2 },
  { symbol: "ADANIGREEN", companyName: "Adani Green Energy", sector: "Energy Resources", industry: "Renewable Energy", basePrice: 1050, peRatio: 92.5, eps: 11.4, dividendYield: 0.0, marketCapCr: 166000, revenueCr: 9200, netProfitCr: 1050, debtCr: 48500, roe: 9.2, roce: 7.8 },

  // ---- Minerals & Natural Resources ----
  { symbol: "TATASTEEL", companyName: "Tata Steel", sector: "Minerals & Natural Resources", industry: "Steel", basePrice: 165, peRatio: 32.1, eps: 5.1, dividendYield: 2.2, marketCapCr: 205000, revenueCr: 218000, netProfitCr: 6400, debtCr: 78000, roe: 5.8, roce: 8.1 },
  { symbol: "HINDALCO", companyName: "Hindalco Industries", sector: "Minerals & Natural Resources", industry: "Metals & Mining", basePrice: 650, peRatio: 12.4, eps: 52.4, dividendYield: 0.6, marketCapCr: 146000, revenueCr: 227000, netProfitCr: 11800, debtCr: 52000, roe: 14.2, roce: 15.9 },
  { symbol: "VEDL", companyName: "Vedanta", sector: "Minerals & Natural Resources", industry: "Mining & Metals", basePrice: 445, peRatio: 14.9, eps: 29.9, dividendYield: 7.5, marketCapCr: 165000, revenueCr: 148000, netProfitCr: 11100, debtCr: 68000, roe: 38.5, roce: 22.4 },
  { symbol: "COALINDIA", companyName: "Coal India", sector: "Minerals & Natural Resources", industry: "Coal Mining", basePrice: 445, peRatio: 7.6, eps: 58.6, dividendYield: 6.4, marketCapCr: 274000, revenueCr: 143000, netProfitCr: 36000, debtCr: 8500, roe: 55.2, roce: 62.1 },
  { symbol: "NMDC", companyName: "NMDC Limited", sector: "Minerals & Natural Resources", industry: "Iron Ore Mining", basePrice: 210, peRatio: 9.8, eps: 21.4, dividendYield: 4.1, marketCapCr: 61500, revenueCr: 22400, netProfitCr: 6300, debtCr: 1200, roe: 20.4, roce: 24.8 },

  // ---- Everyday Consumer Goods ----
  { symbol: "HINDUNILVR", companyName: "Hindustan Unilever", sector: "Everyday Consumer Goods", industry: "FMCG", basePrice: 2450, peRatio: 52.3, eps: 46.8, dividendYield: 1.8, marketCapCr: 576000, revenueCr: 62000, netProfitCr: 10200, debtCr: 1200, roe: 18.9, roce: 25.6 },
  { symbol: "ITC", companyName: "ITC Limited", sector: "Everyday Consumer Goods", industry: "FMCG / Tobacco", basePrice: 465, peRatio: 26.8, eps: 17.4, dividendYield: 3.4, marketCapCr: 580000, revenueCr: 72000, netProfitCr: 21600, debtCr: 200, roe: 27.4, roce: 34.1 },
  { symbol: "NESTLEIND", companyName: "Nestle India", sector: "Everyday Consumer Goods", industry: "Food & Beverages", basePrice: 2380, peRatio: 68.4, eps: 34.8, dividendYield: 1.1, marketCapCr: 229000, revenueCr: 20500, netProfitCr: 3350, debtCr: 150, roe: 108.5, roce: 145.2 },
  { symbol: "BRITANNIA", companyName: "Britannia Industries", sector: "Everyday Consumer Goods", industry: "Food Products", basePrice: 5150, peRatio: 48.6, eps: 106.0, dividendYield: 1.5, marketCapCr: 124000, revenueCr: 17800, netProfitCr: 2550, debtCr: 800, roe: 44.2, roce: 58.9 },
  { symbol: "DABUR", companyName: "Dabur India", sector: "Everyday Consumer Goods", industry: "Personal Care / FMCG", basePrice: 545, peRatio: 41.2, eps: 13.2, dividendYield: 1.4, marketCapCr: 96500, revenueCr: 12400, netProfitCr: 2000, debtCr: 900, roe: 19.5, roce: 24.3 },

  // ---- Luxury & Non-Essential Goods ----
  { symbol: "TITAN", companyName: "Titan Company", sector: "Luxury & Non-Essential Goods", industry: "Jewelry & Watches", basePrice: 3420, peRatio: 74.5, eps: 45.9, dividendYield: 0.4, marketCapCr: 303000, revenueCr: 45800, netProfitCr: 3350, debtCr: 8200, roe: 32.1, roce: 26.8 },
  { symbol: "TATAMOTORS", companyName: "Tata Motors", sector: "Luxury & Non-Essential Goods", industry: "Automobiles", basePrice: 940, peRatio: 11.2, eps: 83.9, dividendYield: 0.5, marketCapCr: 345000, revenueCr: 437000, netProfitCr: 31000, debtCr: 68000, roe: 38.9, roce: 24.5 },
  { symbol: "MARUTI", companyName: "Maruti Suzuki India", sector: "Luxury & Non-Essential Goods", industry: "Automobiles", basePrice: 12450, peRatio: 26.9, eps: 462.8, dividendYield: 1.0, marketCapCr: 393000, revenueCr: 145000, netProfitCr: 13500, debtCr: 2100, roe: 16.8, roce: 21.4 },
  { symbol: "EICHERMOT", companyName: "Eicher Motors", sector: "Luxury & Non-Essential Goods", industry: "Automobiles", basePrice: 4850, peRatio: 29.4, eps: 165.0, dividendYield: 0.7, marketCapCr: 133000, revenueCr: 17200, netProfitCr: 4400, debtCr: 500, roe: 24.6, roce: 30.2 },

  // ---- Healthcare & Pharmaceuticals ----
  { symbol: "SUNPHARMA", companyName: "Sun Pharmaceutical Industries", sector: "Healthcare & Pharmaceuticals", industry: "Pharmaceuticals", basePrice: 1780, peRatio: 33.6, eps: 53.0, dividendYield: 0.7, marketCapCr: 427000, revenueCr: 51500, netProfitCr: 10200, debtCr: 3200, roe: 16.4, roce: 19.8 },
  { symbol: "DRREDDY", companyName: "Dr. Reddy's Laboratories", sector: "Healthcare & Pharmaceuticals", industry: "Pharmaceuticals", basePrice: 1250, peRatio: 18.9, eps: 66.1, dividendYield: 0.7, marketCapCr: 104000, revenueCr: 29200, netProfitCr: 5300, debtCr: 1500, roe: 19.2, roce: 23.5 },
  { symbol: "CIPLA", companyName: "Cipla", sector: "Healthcare & Pharmaceuticals", industry: "Pharmaceuticals", basePrice: 1540, peRatio: 24.8, eps: 62.1, dividendYield: 0.8, marketCapCr: 124000, revenueCr: 26800, netProfitCr: 4400, debtCr: 900, roe: 17.6, roce: 21.9 },
  { symbol: "APOLLOHOSP", companyName: "Apollo Hospitals Enterprise", sector: "Healthcare & Pharmaceuticals", industry: "Hospitals", basePrice: 7250, peRatio: 68.9, eps: 105.2, dividendYield: 0.2, marketCapCr: 103000, revenueCr: 20500, netProfitCr: 1450, debtCr: 5200, roe: 13.8, roce: 16.2 },

  // ---- Infrastructure ----
  { symbol: "LT", companyName: "Larsen & Toubro", sector: "Infrastructure", industry: "Engineering & Construction", basePrice: 3580, peRatio: 32.4, eps: 110.5, dividendYield: 0.8, marketCapCr: 492000, revenueCr: 235000, netProfitCr: 14600, debtCr: 145000, roe: 14.9, roce: 12.5 },
  { symbol: "ULTRACEMCO", companyName: "UltraTech Cement", sector: "Infrastructure", industry: "Cement", basePrice: 11200, peRatio: 38.6, eps: 290.2, dividendYield: 0.6, marketCapCr: 325000, revenueCr: 71500, netProfitCr: 4900, debtCr: 12800, roe: 10.4, roce: 12.9 },
  { symbol: "ADANIPORTS", companyName: "Adani Ports and Special Economic Zone", sector: "Infrastructure", industry: "Ports & Logistics", basePrice: 1385, peRatio: 27.2, eps: 50.9, dividendYield: 0.4, marketCapCr: 300000, revenueCr: 26800, netProfitCr: 9200, debtCr: 42000, roe: 21.5, roce: 15.8 },

  // ---- Telecommunications ----
  { symbol: "BHARTIARTL", companyName: "Bharti Airtel", sector: "Telecommunications", industry: "Telecom Services", basePrice: 1620, peRatio: 68.2, eps: 23.8, dividendYield: 0.5, marketCapCr: 972000, revenueCr: 152000, netProfitCr: 14200, debtCr: 205000, roe: 22.4, roce: 12.1 },
  { symbol: "IDEA", companyName: "Vodafone Idea", sector: "Telecommunications", industry: "Telecom Services", basePrice: 8.5, peRatio: null, eps: -3.2, dividendYield: 0.0, marketCapCr: 61500, revenueCr: 42500, netProfitCr: -28000, debtCr: 225000, roe: -85.4, roce: -12.6 },

  // ---- Real Estate ----
  { symbol: "DLF", companyName: "DLF Limited", sector: "Real Estate", industry: "Real Estate Developers", basePrice: 830, peRatio: 42.1, eps: 19.7, dividendYield: 1.0, marketCapCr: 205000, revenueCr: 6900, netProfitCr: 3600, debtCr: 3800, roe: 8.9, roce: 6.4 },
  { symbol: "GODREJPROP", companyName: "Godrej Properties", sector: "Real Estate", industry: "Real Estate Developers", basePrice: 2650, peRatio: 55.8, eps: 47.5, dividendYield: 0.1, marketCapCr: 82500, revenueCr: 4200, netProfitCr: 1050, debtCr: 6200, roe: 12.4, roce: 9.8 },
];

module.exports = { DEMO_STOCKS };
