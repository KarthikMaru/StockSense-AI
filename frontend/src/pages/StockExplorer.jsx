import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, LayoutGrid, List, GitCompare, AlertCircle } from "lucide-react";
import { fetchStocks } from "../services/stockService";
import { addToWatchlist } from "../services/watchlistService";
import { useAuth } from "../context/AuthContext";
import StockCard from "../components/StockCard";
import SectorFilter from "../components/SectorFilter";
import { formatCurrency, formatMarketCap, formatPercent, changeColorClass } from "../utils/format";

const SORT_OPTIONS = [
  { label: "Highest AI Score", value: "aiScore_desc" },
  { label: "Highest Market Cap", value: "marketCap_desc" },
  { label: "Highest Price", value: "price_desc" },
  { label: "Lowest Price", value: "price_asc" },
  { label: "Highest 1Y Return", value: "oneYearReturn_desc" },
  { label: "Lowest P/E Ratio", value: "peRatio_asc" },
  { label: "Highest Dividend Yield", value: "dividendYield_desc" },
];

const SORT_FIELD_MAP = {
  aiScore: "aiScore",
  marketCap: "marketCap",
  price: "currentPrice",
  oneYearReturn: "oneYearReturn",
  peRatio: "peRatio",
  dividendYield: "dividendYield",
};

const RISK_LEVELS = ["All", "Low", "Medium", "High"];
const MARKET_CAP_TIERS = ["All", "Large Cap", "Mid Cap", "Small Cap"];

const MAX_COMPARE = 3;

function marketCapTier(marketCap) {
  if (marketCap >= 20000 * 1e7) return "Large Cap";
  if (marketCap >= 5000 * 1e7) return "Mid Cap";
  return "Small Cap";
}

export default function StockExplorer() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  // Sector is synced with the URL (?sector=Technology) so the Home page's
  // "Explore by Sector" tiles can deep-link straight into a filtered view.
  const sector = searchParams.get("sector") || "All";
  const setSector = (value) => {
    if (value === "All") {
      searchParams.delete("sector");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams), sector: value });
    }
  };
  const [riskLevel, setRiskLevel] = useState("All");
  const [capTier, setCapTier] = useState("All");
  const [sortValue, setSortValue] = useState("aiScore_desc");
  const [viewMode, setViewMode] = useState("table");
  const [compareSymbols, setCompareSymbols] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // The demo dataset is small (~40 stocks), so we fetch everything
        // once and do search/sort/sector filtering client-side for a snappy
        // UI. For a much larger stock universe, move filtering/sorting/
        // pagination server-side (the API already supports it via
        // ?search=&sector=&sortBy=&order=&page=&limit=).
        const data = await fetchStocks({ limit: 200 });
        setStocks(data.stocks || []);
      } catch (err) {
        setError(err.message || "Could not load stocks.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (sector !== "All") {
      result = result.filter((s) => s.sector === sector);
    }

    if (riskLevel !== "All") {
      result = result.filter((s) => s.riskLevel === riskLevel);
    }

    if (capTier !== "All") {
      result = result.filter((s) => marketCapTier(s.marketCap) === capTier);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) => s.companyName.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q)
      );
    }

    const [sortKey, direction] = sortValue.split("_");
    const field = SORT_FIELD_MAP[sortKey] || "aiScore";
    const dir = direction === "asc" ? 1 : -1;

    result.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av - bv) * dir;
    });

    return result;
  }, [stocks, sector, riskLevel, capTier, search, sortValue]);

  const toggleCompare = (symbol) => {
    setCompareSymbols((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, symbol];
    });
  };

  const goToCompare = () => {
    if (compareSymbols.length < 2) return;
    navigate(`/compare?symbols=${compareSymbols.join(",")}`);
  };

  const [watchlistMessage, setWatchlistMessage] = useState("");

  const handleAddToWatchlist = async (symbol) => {
    if (!isAuthenticated) {
      setWatchlistMessage("Log in to save stocks to your watchlist.");
      setTimeout(() => setWatchlistMessage(""), 3000);
      return;
    }
    try {
      await addToWatchlist(symbol);
      setWatchlistMessage(`${symbol} added to your watchlist.`);
    } catch (err) {
      setWatchlistMessage(err.message || "Could not add to watchlist.");
    } finally {
      setTimeout(() => setWatchlistMessage(""), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Explorer</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Loading stocks..." : `${filteredStocks.length} of ${stocks.length} stocks`}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          <button
            onClick={() => setViewMode("table")}
            className={`rounded-md p-1.5 ${
              viewMode === "table" ? "bg-brand-600 text-white" : "text-slate-500 dark:text-slate-400"
            }`}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`rounded-md p-1.5 ${
              viewMode === "card" ? "bg-brand-600 text-white" : "text-slate-500 dark:text-slate-400"
            }`}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or symbol..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <select
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <SectorFilter selected={sector} onSelect={setSector} />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Risk:</span>
            {RISK_LEVELS.map((r) => (
              <button
                key={r}
                onClick={() => setRiskLevel(r)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  riskLevel === r
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Market Cap:</span>
            {MARKET_CAP_TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => setCapTier(tier)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  capTier === tier
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="mt-8 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-none" /> {error}
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="mt-16 text-center text-sm text-slate-400">
          No stocks match your filters. Try a different search or sector.
        </div>
      ) : viewMode === "card" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              onToggleCompare={toggleCompare}
              compareSelected={compareSymbols.includes(stock.symbol)}
              compareDisabled={compareSymbols.length >= MAX_COMPARE}
              onAddToWatchlist={handleAddToWatchlist}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Compare</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Change</th>
                <th className="px-4 py-3 font-medium text-right">Market Cap</th>
                <th className="px-4 py-3 font-medium text-right">P/E</th>
                <th className="px-4 py-3 font-medium">Sector</th>
                <th className="px-4 py-3 font-medium text-right">1Y Return</th>
                <th className="px-4 py-3 font-medium text-right">AI Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStocks.map((stock) => (
                <tr
                  key={stock.symbol}
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={compareSymbols.includes(stock.symbol)}
                      onChange={() => toggleCompare(stock.symbol)}
                      disabled={compareSymbols.length >= MAX_COMPARE && !compareSymbols.includes(stock.symbol)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/stocks/${stock.symbol}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
                    >
                      {stock.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{stock.symbol}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(stock.currentPrice)}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${changeColorClass(stock.change)}`}>
                    {formatPercent(stock.changePercent)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {formatMarketCap(stock.marketCap)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {stock.peRatio ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {stock.sector}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                      stock.oneYearReturn === null ? "text-slate-400" : changeColorClass(stock.oneYearReturn)
                    }`}
                  >
                    {stock.oneYearReturn === null ? "—" : formatPercent(stock.oneYearReturn)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {stock.aiScore ?? "—"}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {watchlistMessage && (
        <div className="fixed right-6 top-20 z-40 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-700">
          {watchlistMessage}
        </div>
      )}

      {/* Floating compare bar */}
      {compareSymbols.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {compareSymbols.length} of {MAX_COMPARE} selected: {compareSymbols.join(", ")}
          </span>
          <button
            onClick={goToCompare}
            disabled={compareSymbols.length < 2}
            className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitCompare className="h-4 w-4" /> Compare
          </button>
          <button
            onClick={() => setCompareSymbols([])}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
