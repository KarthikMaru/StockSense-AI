# StockSense AI — AI-Powered Investment Intelligence Platform

StockSense AI is an educational, full-stack platform for exploring, analyzing, comparing, and
understanding stocks, mutual funds, SIPs, ETFs, and index funds. An AI assistant learns a user's
goals, risk tolerance, budget, and preferred sectors, then produces personalized, data-driven
**educational** insights.

> **This platform never executes trades, processes payments, or stores brokerage credentials.**
> When a user is ready to invest, StockSense AI redirects them to their platform of choice —
> Groww or Zerodha — to complete the transaction independently.

---

## ✅ Project Status

This repository is being built in phases (see [Roadmap](#roadmap) below). What's currently working:

**Phase 1 — Project Setup (complete)**
- Frontend scaffold: React 18 + Vite + Tailwind CSS + React Router + Axios + Recharts + lucide-react
- Backend scaffold: Node.js + Express with security middleware (helmet, cors, rate limiting)
- MongoDB connection layer (Mongoose)
- AI provider abstraction (Claude / OpenAI / Gemini / mock), fully driven by environment variables
- Global error handling, JWT auth middleware (ready for Phase 2), health check endpoint
- Full page/route skeleton for every screen in the spec (Home, Dashboard, Stock Explorer, Stock
  Details, Mutual Funds, SIP Calculator, AI Advisor, Compare, Watchlist, Portfolio, Profile,
  Login, Register, 404)
- Shared components: Navbar, Sidebar, Footer, Layout, StockCard, StockChart, MarketOverview,
  AIChat, InvestmentCard, SectorFilter — built with real, reusable code (not throwaway mockups),
  ready to be wired to live data in later phases
- Dark mode / light mode support

**Phase 2 — Authentication + User Profile (complete)**
- `User` Mongoose model with bcrypt password hashing (`pre("save")` hook) and a
  `comparePassword` instance method — plaintext passwords are never stored or logged
- `POST /api/auth/register`, `POST /api/auth/login` — both validated with `express-validator`
  before hitting the controller
- `GET /api/auth/profile`, `PUT /api/auth/profile` — protected by JWT (`middleware/authMiddleware.js`),
  let the user view/update investment preferences (risk tolerance, goal, budget, duration,
  preferred investment types, preferred sectors, preferred platform)
- JWT issued via `utils/generateToken.js`, verified on every protected request
- Frontend `Login`/`Register` pages now work end-to-end against the real API
- Frontend `Profile` page: a full form to view and edit every preference field, wired to
  `GET`/`PUT /api/auth/profile`, with loading/error/success states

**Phase 3 — Stock Database, Data Sync, Historical Data (complete)**
- `models/Stock.js` — full fundamentals schema (`marketCap`, `peRatio`, `eps`, `dividendYield`,
  `revenue`, `netProfit`, `debt`, `roe`, `roce`, 52-week high/low) with `change`/`changePercent`
  auto-computed and persisted on save (so gainers/losers can be queried directly)
- `models/HistoricalStockData.js` — daily OHLCV records, one per stock per day
- `services/marketDataService/` — the Real Data Mode / Demo Data Mode abstraction:
  - `isRealDataEnabled()` — true only if `USE_REAL_MARKET_DATA=true` **and** an API key/base URL
    are configured; otherwise the app always safely runs on demo data
  - `fetchLiveQuote(symbol)` — calls a configured external market data API, validates the
    response shape, and returns `null` (never throws) on any failure so the caller can fall
    back to demo data
  - `generateHistoricalSeries()` — generates a realistic 5-year daily random-walk price series
    for demo mode, anchored to end exactly at each stock's current price
  - `demoStocks.js` — illustrative fundamentals for 41 real Indian companies across all 10
    sectors from the spec (Reliance, TCS, HDFC Bank, Tata Steel, ITC, Titan, Sun Pharma, L&T,
    Bharti Airtel, DLF, and more)
- `services/stockService/` — search, sector filtering, sorting, pagination, top stocks,
  gainers/losers, and historical range queries (1D through 5Y)
- `utils/seedData.js` — `npm run seed` populates MongoDB with all 41 demo stocks and ~1,300
  trading days of history each (safe to re-run; clears and rebuilds both collections)
- New public endpoints: `GET /api/stocks`, `/top`, `/gainers`, `/losers`, `/sector/:sector`,
  `/:symbol`, `/:symbol/history`
- `utils/constants.js` now centralizes the sector list so `User` preferences and `Stock.sector`
  always agree on the same 10 category names

**Phase 4 — Stock Explorer, Stock Details, Interactive Charts (complete)**
- Backend: `stockService` now computes a `oneYearReturn` for every stock returned by `listStocks`,
  `getTopStocks`, and `getMovers` via a single aggregation (no N+1 queries), and a new
  `getPerformanceReturns()` computes 1D/1W/1M/3M/6M/1Y/3Y/5Y returns for the stock detail
  endpoint — `GET /api/stocks/:symbol` now returns `{ stock, performance }`
- `frontend/src/services/stockService.js` — thin wrapper around every stock endpoint
- **Stock Explorer** (`/stocks`): live data, instant client-side search + sector filter + sort
  (Highest Market Cap, Highest/Lowest Price, Highest 1Y Return, Lowest P/E, Highest Dividend
  Yield), table/card view toggle, and a floating "compare up to 3 stocks" bar that hands off to
  the Compare page
- **Stock Details** (`/stocks/:symbol`): header with live price/change, an interactive chart
  with all 8 time-range tabs (1D–5Y, powered by `utils/performance.js` slicing a single 5-year
  fetch client-side so range switches are instant), a performance grid, and a full fundamentals
  grid (market cap, P/E, EPS, dividend yield, revenue, net profit, debt, ROE, ROCE, 52W high/low)
- `StockChart` now supports a controlled `range`/`onRangeChange` API (with a non-blocking loading
  overlay) in addition to its original uncontrolled mode
- `StockCard` gained an opt-in compare checkbox (`onToggleCompare`/`compareSelected`) used by the
  Explorer, without changing any of its existing usages
- **Dashboard** (`/dashboard`) now shows real Top Stocks, Gainers, and Losers
- **Compare** (`/compare`) reads the symbols selected in the Explorer via the URL and previews
  their key stats side by side — the full AI-generated comparison summary is Phase 5

**Phase 5 — Sector Categorization, Filters, Ranking & Comparison Engine (complete)**
- `services/stockService/scoring.js` — a deterministic, rule-based scoring engine (no external
  AI provider call): computes annualized volatility from each stock's price history, classifies
  it into a Low/Medium/High `riskLevel`, and derives a 0-100 `aiScore` (35% historical
  performance, 35% financial health, 20% stability, 10% dividend yield) with plain-language
  `aiScoreReasons`. This is intentionally the *objective* score — the *personalized* version that
  factors in a user's own risk tolerance/goal/sectors is Phase 6
- `Stock` model gained `volatility`, `riskLevel`, `aiScore`, `aiScoreReasons`; `seedData.js`
  computes all of them at seed time from the generated 5-year price series
- `GET /api/stocks/rankings` — stocks ranked by AI Score, filterable by sector, risk level, and
  market-cap tier (Large/Mid/Small Cap, via `utils/constants.getMarketCapTier`)
- `GET /api/stocks/sectors` — per-sector stock counts, average daily change, and combined market
  cap, powering the Home page's "Explore by Sector" tiles
- `POST /api/stocks/compare` — rule-based comparison of 2-3 stocks: identifies strongest
  fundamentals, best historical growth, and most stable pick, with a plain-language summary that
  only ever describes historical/fundamental facts — it never claims a stock is guaranteed to
  perform a certain way
- **Stock Explorer**: added an "Highest AI Score" sort (now the default), Risk Level and Market
  Cap tier filter pills, an AI Score column, and the sector filter is now synced to the URL
  (`?sector=Technology`) so other pages can deep-link into a filtered view
- **Home page**: "Explore by Sector" and a new "Top Ranked Stocks" section now show real data;
  Mutual Funds and AI Recommendations sections remain clearly labeled for Phases 6-7
- **Compare Stocks**: now calls the real comparison engine and renders an actual multi-metric
  table (price, market cap, P/E, dividend yield, 1Y return, volatility, risk level, AI score)
  plus the generated Comparison Summary — no longer a placeholder

**Phase 6 — AI Assistant, Personalized Recommendation Engine, AI Stock Comparison (complete)**
- `services/aiService/` — the real Claude/OpenAI/Gemini dispatch layer promised since Phase 1's
  `aiConfig.js`: calls whichever provider is configured (`AI_PROVIDER` env var), and — critically —
  falls back to a fully-functional, deterministic rule-based response on any failure *or* when
  `AI_PROVIDER=mock`, so the AI Advisor, stock analysis, and AI comparison narrative all work with
  zero API keys configured
- `services/recommendationService/` — the *personalized* layer on top of Phase 5's objective AI
  Score: blends each stock's base score with risk-tolerance compatibility, sector-preference
  match, and investment-goal fit into a `personalizedScore`, plus a deterministic portfolio
  allocation builder (risk/duration-aware, with real example stocks slotted into the
  stock-based categories)
- New endpoints: `POST /api/ai/chat` (conversational, walks through goal → risk → budget →
  duration → type → sectors, matching the spec's exact question flow — even in mock mode),
  `POST /api/ai/recommend`, `POST /api/ai/build-portfolio` (both work for logged-out visitors via
  an explicit `profile` in the body, or logged-in users' saved preferences), `POST
  /api/ai/analyze-stock`, `POST /api/ai/compare-stocks` (distinct from Phase 5's
  `/api/stocks/compare`: adds an AI-narrated summary, optionally personalized to risk tolerance)
- **AI Advisor page**: a full guided quiz (pill-button questions matching the spec's exact option
  sets) feeding "Get My Recommendations" (renders real `InvestmentCard`s with personalized scores
  and reasons) and "Build My Portfolio" (an animated allocation breakdown), plus the existing
  chat widget for freeform follow-up
- **Stock Details**: an on-demand "Analyze this Stock" button wired to the new AI analysis
  endpoint

Every AI-generated response — mock or real — explicitly avoids claiming guaranteed returns and
reiterates that this is educational insight only, not financial advice.

**Phase 7 — Mutual Funds, SIP Calculator, Portfolio Simulator (complete)**
- `models/MutualFund.js` — fund name/house, category (all 7 from the spec: Large/Mid/Small Cap,
  Index, ELSS, Debt, Hybrid), NAV, expense ratio, risk level, 1Y/3Y/5Y returns; seeded with 20
  illustrative funds across real Indian fund houses via `npm run seed:funds`
- `GET /api/mutual-funds` (search/category/risk filters + sort), `GET /api/mutual-funds/:id`,
  `POST /api/mutual-funds/compare` (2-3 funds, same rule-based-summary pattern as stock compare)
- **Mutual Fund Explorer** (`/mutual-funds`): category + risk filter pills, sortable table, and
  compare-up-to-3 with a generated summary
- **SIP Calculator** (`/sip-calculator`): the standard SIP future-value formula
  `M = P × ({[1+i]^n – 1} / i) × (1+i)`, live sliders for monthly investment / expected return /
  duration, and a year-by-year invested-vs-value growth chart — verified against a known
  reference value (₹10,000/month at 12% for 10 years → ₹23.2L) before shipping
- `models/Portfolio.js` — per-user hypothetical holdings (simulation only, no real transactions).
  `services/portfolioService` computes current value/profit-loss **live** against real `Stock`
  prices on every read (never stores stale computed values) and derives sector-based asset
  allocation
- `GET /api/portfolio`, `POST /api/portfolio` (buy at current price or a custom purchase price),
  `DELETE /api/portfolio/:id` — all protected, since portfolios are per-user
- **Portfolio Simulator** (`/portfolio`): add hypothetical investments from any real seeded stock,
  see live P/L and returns per holding and in aggregate, plus a sector allocation pie chart

**Phase 8 — Watchlist, Groww/Zerodha Redirection (complete)**
- `models/Watchlist.js` — per-user list of `{ symbol, addedAt }`. `services/watchlistService`
  joins with live `Stock` data on every read (so price/change are never stale) and includes a
  `getMostWatchlisted()` aggregation across *all* users — an anonymous popularity signal, not
  any individual's list — powering the Dashboard's "Most Watchlisted" section
- `GET /api/watchlist`, `POST /api/watchlist`, `DELETE /api/watchlist/:symbol` (protected), plus
  a public `GET /api/watchlist/popular`
- **Watchlist page** (`/watchlist`): live prices/daily change per stock, remove button, empty state
- **Stock Details**: the star icon next to the price now actually adds/removes the stock from
  your watchlist; **Stock Explorer**'s card-view "+ Add to Watchlist" button is wired up too
  (prompts login if you're not authenticated)
- `components/InvestOptions.jsx` — the real "Where would you like to invest?" flow: opens Groww's
  search or Zerodha's Kite in a new tab. It **never** processes payments, stores brokerage
  credentials, or executes a transaction — only the two platforms' own sites, opened
  independently. Highlights your saved `preferredPlatform` (from Phase 2's profile) if set, and
  always shows the required disclaimers. This replaces the Stock Details placeholder from Phase 4

**Phase 9 — Testing, Bug Fixing, UI Polish, Deployment Prep (complete)**
- **Automated tests**: `backend/tests/` (Jest + Supertest) covers the scoring engine's pure
  functions and an API smoke test (health check, 404 handling, validation errors);
  `frontend/src/utils/__tests__/` (Vitest) covers the currency/percent formatters and the
  client-side performance/return calculations. Every assertion in both suites was manually
  verified against real output before being committed — not just written and assumed correct
- **Bug fixes**: `server.js` no longer auto-starts a live server when `require()`'d (guarded
  behind `require.main === module`), so it can be safely imported by tests; hardened
  `stockService.compareStocks`'s risk-match sort against undefined risk levels (previously could
  produce `NaN` comparisons)
- **UI polish**: a top-level `ErrorBoundary` now shows a friendly fallback instead of a blank
  white screen on an unexpected render error; `ScrollToTop` resets scroll position on every route
  change (previously navigating to a new page kept your old scroll position)
- **Deployment prep**: `Dockerfile`s for both backend and frontend (multi-stage, served via
  nginx with SPA fallback routing so React Router works on refresh), a root `docker-compose.yml`
  wiring MongoDB + backend + frontend together, and a full deployment walkthrough below for both
  Docker and manual (Render/Railway + Vercel/Netlify + MongoDB Atlas) approaches

All 9 phases of the original roadmap are now complete.

**Post-Phase-9 audit fixes (found by re-checking the whole app end-to-end):**
- Built the **Market Overview** feature (NIFTY 50 / SENSEX / NIFTY BANK + sentiment) that was
  called for in the original spec's Dashboard section but never actually implemented — the
  Dashboard was silently passing an empty array the whole time. `models/MarketIndex.js` +
  `services/marketIndexService` derive index movement from the *actual* aggregate performance of
  seeded stocks (not arbitrary numbers), via a new `GET /api/market/indices`
- The Home page's "Popular Mutual Funds" and "AI Investment Recommendations" sections were still
  static placeholder boxes even after Phases 6-7 shipped the real features — now show real fund
  data and an honest AI Advisor call-to-action (personalized data isn't fabricated for anonymous
  visitors who haven't answered the quiz)
- `POST /api/ai/compare-stocks` (Phase 6's AI-narrated comparison) was built on the backend but
  never called by the frontend — `CompareStocks.jsx` was still using only Phase 5's rule-based
  endpoint. Fixed to use the real AI-narrated version, personalized by the logged-in user's risk
  tolerance when available
- Cleaned up several stale "isn't available yet — built in Phase X" fallback messages that had
  become inaccurate once those phases shipped

---

## 🧱 Technology Stack

| Layer          | Technology                                                             |
|----------------|-------------------------------------------------------------------------|
| Frontend       | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Recharts, lucide-react |
| Backend        | Node.js, Express.js                                                    |
| Database       | MongoDB + Mongoose                                                      |
| Auth           | JWT, bcrypt                                                             |
| AI             | Pluggable provider layer — Claude API / OpenAI API / Gemini API / mock  |
| Testing        | Jest + Supertest (backend), Vitest (frontend)                          |
| Deployment     | Docker + Docker Compose, nginx (frontend static serving + SPA routing) |

---

## 📁 Folder Structure

```
StockSense-AI/
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Footer, Layout, ProtectedRoute, ErrorBoundary,
│   │   │                   # ScrollToTop, StockCard, StockChart, MarketOverview, AIChat,
│   │   │                   # InvestmentCard, InvestOptions, SectorFilter
│   │   ├── pages/          # Home, Dashboard, StockExplorer, StockDetails, MutualFunds,
│   │   │                   # SIPCalculator, AIAdvisor, CompareStocks, Watchlist, Portfolio,
│   │   │                   # Profile, Login, Register, NotFound
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── services/       # api.js, stockService.js, aiService.js, mutualFundService.js,
│   │   │                   # portfolioService.js, watchlistService.js
│   │   ├── hooks/          # useLocalStorage
│   │   ├── utils/          # format.js, performance.js (+ __tests__/, Vitest)
│   │   └── App.jsx
│   ├── index.html, vite.config.js, tailwind.config.js, package.json
│   ├── Dockerfile, nginx.conf, .dockerignore
│
├── backend/
│   ├── controllers/         # auth, stock, ai, mutualFund, portfolio, watchlist
│   ├── models/               # User, Stock, HistoricalStockData, MutualFund, Portfolio, Watchlist
│   ├── routes/                # health, auth, stocks, ai, mutualFunds, portfolio, watchlist
│   ├── middleware/            # errorHandler.js, authMiddleware.js, validateRequest.js
│   ├── services/
│   │   ├── stockService/      # index.js, scoring.js (rule-based ranking engine)
│   │   ├── aiService/         # Claude/OpenAI/Gemini dispatch + mock fallback
│   │   ├── recommendationService/  # personalized scoring + portfolio builder
│   │   ├── marketDataService/ # real/demo data abstraction, demoStocks.js
│   │   ├── mutualFundService/
│   │   ├── portfolioService/
│   │   └── watchlistService/
│   ├── config/                # db.js, aiConfig.js
│   ├── utils/                 # constants.js, seedData.js, seedMutualFunds.js, generateToken.js
│   ├── tests/                 # Jest + Supertest
│   ├── Dockerfile, .dockerignore
│   └── server.js
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Clone / unzip the project
```bash
cd StockSense-AI
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI, JWT_SECRET, and (optionally) an AI provider key
npm install
npm run dev
```
In a separate terminal (from the `backend/` directory), seed demo data (stocks + historical prices, and mutual funds):
```bash
cd backend
npm run seed
npm run seed:funds
```
The API starts on `http://localhost:5000`. Verify it's running:
```bash
curl http://localhost:5000/api/health
```

### 3. Frontend setup
In a new terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
The app starts on `http://localhost:5173` and proxies `/api` requests to the backend.

### 4. MongoDB
- **Local:** install MongoDB Community Edition and run `mongod`; the default `MONGODB_URI` in
  `.env.example` (`mongodb://127.0.0.1:27017/stocksense-ai`) will work as-is.
- **Atlas (cloud):** create a free cluster at mongodb.com/atlas, get your connection string, and
  set it as `MONGODB_URI` in `backend/.env`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
See `backend/.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens — use a long random string |
| `AI_PROVIDER` | `claude` \| `openai` \| `gemini` \| `mock` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | API key for the chosen AI provider |
| `USE_REAL_MARKET_DATA` | `true` to call a real market data API, `false` for demo data |

**Never commit your real `.env` file.** Only `.env.example` (with no real secrets) is tracked.

### Frontend (`frontend/.env`)
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API (default `http://localhost:5000/api`) |

---

## 🤖 Connecting an AI Provider

StockSense AI never hardcodes API keys. To enable real AI responses instead of the rule-based
mock engine:

1. Choose a provider: Claude, OpenAI, or Gemini.
2. Get an API key from that provider's console.
3. In `backend/.env`, set:
   ```
   AI_PROVIDER=claude
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Restart the backend. `aiService` reads `config/aiConfig.js` and calls whichever provider is
   configured — no code changes required to switch providers. If the real call fails for any
   reason (bad key, network issue, unexpected response shape), it automatically falls back to
   the rule-based mock response rather than breaking the feature.

If no key is configured, `AI_PROVIDER=mock` keeps the AI Advisor and recommendation features
fully functional using deterministic, rule-based logic — useful for demos and development.

---

## 📈 Connecting a Real Stock Market Data API

By default the app runs in **Demo Data Mode** with realistic sample data, clearly labeled
"Demo Data" in the UI. To connect a real market data API (e.g. NSE/BSE data providers, Alpha
Vantage, Twelve Data, etc.):

1. Set `USE_REAL_MARKET_DATA=true` in `backend/.env`.
2. Set `MARKET_DATA_API_KEY` and `MARKET_DATA_BASE_URL`.
3. `services/marketDataService/fetchLiveQuote()` will call the real API, validate the response
   shape, and fall back to `null` (demo data) if the API is unreachable, rate-limited, or returns
   an unexpected shape — the UI will always indicate which mode is active via each stock's
   `isDemoData` field ("Market data delayed" vs. "Demo Data"). Note: `fetchLiveQuote()` currently
   fetches a single live quote; wiring it into a scheduled sync job that updates `Stock` documents
   in bulk is a natural next step once you've picked a real data provider.

---

## 📡 API Documentation

### Implemented so far (Phases 1–3)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Server, database, and AI provider status |
| POST | `/api/auth/register` | Public | Create an account — `{ name, email, password }` |
| POST | `/api/auth/login` | Public | Log in — `{ email, password }`, returns `{ user, token }` |
| GET | `/api/auth/profile` | Private (JWT) | Get the logged-in user's profile |
| PUT | `/api/auth/profile` | Private (JWT) | Update name / investment preferences |
| GET | `/api/stocks` | Public | List stocks — `?search=&sector=&sortBy=&order=&page=&limit=` |
| GET | `/api/stocks/top` | Public | Top stocks by market cap — `?limit=` |
| GET | `/api/stocks/gainers` | Public | Biggest daily gainers — `?limit=` |
| GET | `/api/stocks/losers` | Public | Biggest daily losers — `?limit=` |
| GET | `/api/stocks/sector/:sector` | Public | All stocks in a given sector |
| GET | `/api/stocks/:symbol` | Public | Single stock's fundamentals + performance — `{ stock, performance }` |
| GET | `/api/stocks/:symbol/history` | Public | OHLCV history — `?range=1D\|1W\|1M\|3M\|6M\|1Y\|3Y\|5Y` |
| GET | `/api/stocks/rankings` | Public | Stocks ranked by AI Score — `?sector=&riskLevel=&marketCapTier=&page=&limit=` |
| GET | `/api/stocks/sectors` | Public | Per-sector stock counts, avg change, combined market cap |
| POST | `/api/stocks/compare` | Public | Compare 2-3 stocks — `{ symbols: [...] }` (rule-based summary) |
| POST | `/api/ai/chat` | Public | Conversational advisor — `{ messages: [{role, content}] }` |
| POST | `/api/ai/recommend` | Public/Private | Personalized recommendations — `{ profile? , limit? }` |
| POST | `/api/ai/build-portfolio` | Public/Private | Portfolio allocation — `{ profile? }` |
| POST | `/api/ai/analyze-stock` | Public | AI analysis of one stock — `{ symbol }` |
| POST | `/api/ai/compare-stocks` | Public/Private | AI-narrated comparison — `{ symbols: [...], profile? }` |
| GET | `/api/mutual-funds` | Public | List funds — `?search=&category=&riskLevel=&sortBy=&order=&page=&limit=` |
| GET | `/api/mutual-funds/:id` | Public | Single fund detail |
| POST | `/api/mutual-funds/compare` | Public | Compare 2-3 funds — `{ ids: [...] }` |
| GET | `/api/portfolio` | Private (JWT) | Your simulated portfolio with live P/L |
| POST | `/api/portfolio` | Private (JWT) | Add a hypothetical investment — `{ symbol, investedAmount, purchasePrice? }` |
| DELETE | `/api/portfolio/:id` | Private (JWT) | Remove a holding |
| GET | `/api/watchlist` | Private (JWT) | Your watchlist with live prices |
| POST | `/api/watchlist` | Private (JWT) | Add a stock — `{ symbol }` |
| DELETE | `/api/watchlist/:symbol` | Private (JWT) | Remove a stock |
| GET | `/api/watchlist/popular` | Public | Most-watchlisted stocks across all users |
| GET | `/api/market/indices` | Public | NIFTY 50 / SENSEX / NIFTY BANK + market sentiment |

All planned endpoints from the original spec are now implemented.

---

## 🗺️ Roadmap

| Phase | Scope |
|---|---|
| 1 | Project setup — frontend, backend, MongoDB connection ✅ |
| 2 | Authentication (register/login/JWT) + user profile ✅ |
| 3 | Stock database, sync service, historical data ✅ |
| 4 | Stock explorer, stock details page, interactive charts ✅ |
| 5 | Sector categorization, filters, ranking & comparison engine ✅ |
| 6 | AI assistant, recommendation engine, AI stock comparison ✅ |
| 7 | Mutual funds, SIP calculator, portfolio simulator ✅ |
| 8 | Watchlist, Groww/Zerodha redirect ✅ |
| 9 | Testing, bug fixing, UI polish, deployment prep ✅ |

---

## ⚠️ Important Disclaimers

- This platform provides **educational insights and data-driven analysis only**.
- Investment decisions involve risk and should be made independently.
- StockSense AI does **not** execute trades, process payments, or store brokerage credentials.
- All "Demo Data" is clearly labeled and must never be presented as real-time market data.

---

## 🧪 Testing the Setup

```bash
# Backend health check
curl http://localhost:5000/api/health
# Expect: { "success": true, "message": "StockSense AI backend is running", ... }

# Seed the database with 41 demo stocks + 5 years of daily history each
cd backend && npm run seed
# Expect console output like:
#   [Seed] TCS          — ₹3850 — 1304 daily records
#   ...
#   [Seed] Done. Seeded 41 stocks and ~53,000 historical records.

# List stocks (search + sector filter + sort)
curl "http://localhost:5000/api/stocks?sector=Technology&sortBy=marketCap&order=desc&limit=5"

# Top stocks by market cap
curl http://localhost:5000/api/stocks/top

# Gainers / losers
curl http://localhost:5000/api/stocks/gainers
curl http://localhost:5000/api/stocks/losers

# A single stock's fundamentals
curl http://localhost:5000/api/stocks/TCS

# Historical price data for a time range
curl "http://localhost:5000/api/stocks/TCS/history?range=1Y"

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"password123"}'
# Expect: { "success": true, "user": {...}, "token": "..." }

# Log in
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}'
# Expect: { "success": true, "user": {...}, "token": "..." }

# Fetch profile (replace TOKEN with the token from register/login)
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Update profile preferences
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"riskTolerance":"Medium","investmentGoal":"Long-term wealth creation","preferredSectors":["Technology","Banking & Financial Services"]}'

# Rankings, sector summary, and comparison
curl "http://localhost:5000/api/stocks/rankings?riskLevel=Low&limit=5"
curl http://localhost:5000/api/stocks/sectors
curl -X POST http://localhost:5000/api/stocks/compare \
  -H "Content-Type: application/json" \
  -d '{"symbols":["TCS","INFY","WIPRO"]}'

# Mutual funds
curl "http://localhost:5000/api/mutual-funds?category=Index%20Fund"
curl -X POST http://localhost:5000/api/mutual-funds/compare \
  -H "Content-Type: application/json" \
  -d '{"ids":["<fund_id_1>","<fund_id_2>"]}'

# Portfolio simulator (replace TOKEN with a login token)
curl -X POST http://localhost:5000/api/portfolio \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"symbol":"TCS","investedAmount":10000}'
curl http://localhost:5000/api/portfolio -H "Authorization: Bearer TOKEN"

# Watchlist (replace TOKEN with a login token)
curl -X POST http://localhost:5000/api/watchlist \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"symbol":"TCS"}'
curl http://localhost:5000/api/watchlist -H "Authorization: Bearer TOKEN"
curl http://localhost:5000/api/watchlist/popular

# AI Advisor (works with zero API keys configured — AI_PROVIDER=mock is the default)
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[]}'
# Expect a reply asking about your investment goal

curl -X POST http://localhost:5000/api/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"profile":{"riskTolerance":"Medium","investmentGoal":"Long-term wealth creation","preferredSectors":["Technology"]},"limit":5}'

curl -X POST http://localhost:5000/api/ai/build-portfolio \
  -H "Content-Type: application/json" \
  -d '{"profile":{"riskTolerance":"High","investmentDuration":"More than 5 years"}}'

curl -X POST http://localhost:5000/api/ai/analyze-stock \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TCS"}'

curl -X POST http://localhost:5000/api/ai/compare-stocks \
  -H "Content-Type: application/json" \
  -d '{"symbols":["TCS","INFY"],"profile":{"riskTolerance":"Low"}}'

# Frontend
# Visit http://localhost:5173 — register a new account via the UI, you should be
# redirected to /dashboard (now showing real Top Stocks / Gainers / Losers), and
# /profile should let you set and save your investment preferences (risk tolerance,
# goal, budget, duration, types, sectors, platform).
#
# Visit /stocks — search, sort, filter by sector, toggle table/card view, and check
# up to 3 stocks to compare (a floating bar appears — click "Compare" to jump to
# /compare with those symbols pre-loaded).
#
# Click any stock to open /stocks/:symbol — try every chart time range (1D–5Y),
# and check the Performance and Fundamentals sections below the chart.
#
# The Home page now shows real "Top Ranked Stocks" and "Explore by Sector" tiles
# (click a sector to jump into a filtered Stock Explorer view). In the Explorer,
# try the Risk Level and Market Cap filters alongside "Highest AI Score" sort.
# Select 2-3 stocks and click "Compare" to see the real comparison table and
# generated summary.
#
# Visit /ai-advisor — answer the guided quiz (goal, risk, budget, duration, type,
# sectors), then click "Get My Recommendations" or "Build My Portfolio". Try the
# chat panel too — it walks through the same questions conversationally, even
# with no AI provider key configured. On any Stock Details page, click
# "Analyze this Stock" for an AI-generated summary.
#
# Visit /mutual-funds — filter by category/risk, sort, and compare up to 3 funds.
# Visit /sip-calculator — drag the sliders and watch the growth chart update live.
# Visit /portfolio (requires login) — add a hypothetical stock investment and see
# live profit/loss and a sector allocation pie chart.
#
# Click the star icon on any Stock Details page to add/remove it from /watchlist.
# Try "Invest via Groww" / "Invest via Zerodha" on a Stock Details page — each opens
# the real external site in a new tab; no payment or credentials ever touch this app.
```

---

## ✅ Automated Testing

**Backend** — Jest + Supertest, covering the scoring engine's pure functions (volatility,
risk classification, AI score, score reasons) and an API smoke test (health check, 404
handling, validation errors):
```bash
cd backend
npm install
npm test
```

**Frontend** — Vitest, covering the currency/percent formatters and the client-side
performance/return calculations used on Stock Details:
```bash
cd frontend
npm install
npm test
```

Every assertion in both suites was independently verified against real computed output before
being written into test form — see the Phase 9 notes above.

---

## 🚢 Deployment

### Option A — Docker Compose (recommended for a full local or single-server deployment)

This spins up MongoDB, the backend API, and the frontend (served by nginx) together:

```bash
# from the project root
cp backend/.env.example backend/.env   # edit as needed; Docker Compose also lets you
                                        # override JWT_SECRET / AI_PROVIDER / API keys
                                        # via a root .env file or shell exports
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Seed demo data into the running containers:
  ```bash
  docker compose exec backend npm run seed
  docker compose exec backend npm run seed:funds
  ```

To point the frontend at a different backend URL (e.g. deploying frontend and backend to
different hosts), pass it at build time:
```bash
docker compose build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api frontend
```

### Option B — Manual deployment (separate platforms)

A common free/low-cost combination:

1. **Database — MongoDB Atlas**: create a free cluster at mongodb.com/atlas, add a database
   user, allow network access from your backend host (or `0.0.0.0/0` for simplicity), and copy
   the connection string into `MONGODB_URI`.
2. **Backend — Render, Railway, or Fly.io**: point the service at the `backend/` directory,
   set the build command to `npm install` and the start command to `npm start`, and configure
   the environment variables from `backend/.env.example` (at minimum `MONGODB_URI`,
   `JWT_SECRET`, `CLIENT_URL` set to your deployed frontend's URL, and `NODE_ENV=production`).
   After the first deploy, run the seed scripts once via the platform's shell/console:
   `npm run seed && npm run seed:funds`.
3. **Frontend — Vercel or Netlify**: point the service at the `frontend/` directory, build
   command `npm run build`, output directory `dist`, and set `VITE_API_BASE_URL` to your
   deployed backend's `/api` URL (e.g. `https://your-backend.onrender.com/api`). Both platforms
   handle the SPA fallback routing automatically for Vite projects.
4. Update the backend's `CLIENT_URL` env var to match your deployed frontend's URL exactly
   (used for CORS) once both are live.

### Production checklist
- [ ] `JWT_SECRET` is a long, random, unique value (never reuse the example value)
- [ ] `NODE_ENV=production` is set on the backend
- [ ] `MONGODB_URI` points to a real, backed-up database (not a local instance)
- [ ] `CLIENT_URL` (backend) and `VITE_API_BASE_URL` (frontend) point at each other correctly
- [ ] Real API keys are set only if you intend to use a real AI provider / market data feed —
      otherwise `AI_PROVIDER=mock` and `USE_REAL_MARKET_DATA=false` keep the app fully functional
- [ ] `.env` files are never committed (already covered by `.gitignore`)

---

## 📄 License

MIT — built as a portfolio project demonstrating full-stack development, AI integration,
recommendation systems, financial data visualization, authentication, and database design.
