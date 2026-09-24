import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Sparkles, Star } from "lucide-react";
import { fetchStockBySymbol, fetchStockHistory } from "../services/stockService";
import { analyzeStock } from "../services/aiService";
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from "../services/watchlistService";
import { useAuth } from "../context/AuthContext";
import StockChart from "../components/StockChart";
import InvestOptions from "../components/InvestOptions";
import { formatCurrency, formatMarketCap, formatPercent, changeColorClass } from "../utils/format";
import { filterHistoryByRange, computePeriodReturns } from "../utils/performance";

const PERFORMANCE_LABELS = [
  { key: "1D", label: "1 Day" },
  { key: "1W", label: "1 Week" },
  { key: "1M", label: "1 Month" },
  { key: "3M", label: "3 Month" },
  { key: "6M", label: "6 Month" },
  { key: "1Y", label: "1 Year" },
  { key: "3Y", label: "3 Year" },
  { key: "5Y", label: "5 Year" },
];

const FUNDAMENTALS_LABELS = [
  { key: "marketCap", label: "Market Cap", format: (v) => formatMarketCap(v) },
  { key: "peRatio", label: "P/E Ratio", format: (v) => (v === null || v === undefined ? "—" : v) },
  { key: "eps", label: "EPS", format: (v) => (v === null || v === undefined ? "—" : formatCurrency(v)) },
  { key: "dividendYield", label: "Dividend Yield", format: (v) => (v === null || v === undefined ? "—" : `${v}%`) },
  { key: "revenue", label: "Revenue", format: (v) => formatMarketCap(v) },
  { key: "netProfit", label: "Net Profit", format: (v) => formatMarketCap(v) },
  { key: "debt", label: "Debt", format: (v) => formatMarketCap(v) },
  { key: "roe", label: "ROE", format: (v) => (v === null || v === undefined ? "—" : `${v}%`) },
  { key: "roce", label: "ROCE", format: (v) => (v === null || v === undefined ? "—" : `${v}%`) },
  { key: "fiftyTwoWeekHigh", label: "52 Week High", format: (v) => formatCurrency(v) },
  { key: "fiftyTwoWeekLow", label: "52 Week Low", format: (v) => formatCurrency(v) },
];

export default function StockDetails() {
  const { symbol } = useParams();
  const { isAuthenticated } = useAuth();

  const [stock, setStock] = useState(null);
  const [fullHistory, setFullHistory] = useState([]);
  const [range, setRange] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setHistoryLoading(true);
      setError("");
      try {
        const [stockData, historyData] = await Promise.all([
          fetchStockBySymbol(symbol),
          fetchStockHistory(symbol, "5Y"),
        ]);
        if (cancelled) return;
        setStock(stockData.stock);
        setFullHistory(historyData.history || []);
      } catch (err) {
        if (!cancelled) setError(err.message || `Could not load data for ${symbol}.`);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHistoryLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchWatchlist()
      .then((data) => {
        if (!cancelled) setInWatchlist((data.stocks || []).some((s) => s.symbol === symbol.toUpperCase()));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [symbol, isAuthenticated]);

  const visibleHistory = useMemo(() => filterHistoryByRange(fullHistory, range), [fullHistory, range]);
  const performance = useMemo(() => computePeriodReturns(fullHistory), [fullHistory]);

  const handleAnalyze = async () => {
    setAiLoading(true);
    try {
      const data = await analyzeStock(symbol);
      setAiAnalysis(data.analysis);
    } catch (err) {
      setAiAnalysis(err.message || "Could not generate an analysis right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(symbol);
        setInWatchlist(false);
      } else {
        await addToWatchlist(symbol);
        setInWatchlist(true);
      }
    } catch (err) {
      setError(err.message || "Could not update your watchlist.");
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          {error || `We couldn't find a stock with symbol "${symbol}".`}
        </p>
        <Link to="/stocks" className="mt-4 inline-block text-sm font-medium text-brand-600 dark:text-brand-300">
          &larr; Back to Stock Explorer
        </Link>
      </div>
    );
  }

  const isUp = stock.change >= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/stocks"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Stock Explorer
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{stock.symbol}</h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {stock.sector}
            </span>
            {stock.isDemoData && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Demo Data
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400">{stock.companyName}</p>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stock.currentPrice)}
            </div>
            {isAuthenticated && (
              <button
                onClick={handleToggleWatchlist}
                disabled={watchlistLoading}
                aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                className={`rounded-full p-1.5 transition-colors ${
                  inWatchlist
                    ? "text-amber-500"
                    : "text-slate-300 hover:text-amber-500 dark:text-slate-600"
                }`}
              >
                <Star className="h-5 w-5" fill={inWatchlist ? "currentColor" : "none"} />
              </button>
            )}
          </div>
          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${changeColorClass(stock.change)}`}>
            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {stock.change >= 0 ? "+" : ""}
            {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)}) today
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6">
        <StockChart
          history={visibleHistory}
          isDemoData={stock.isDemoData}
          range={range}
          onRangeChange={setRange}
          loading={historyLoading}
        />
      </div>

      {/* Performance */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Performance</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {PERFORMANCE_LABELS.map(({ key, label }) => {
            const value = performance[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-slate-200 p-3 text-center dark:border-slate-800"
              >
                <p className="text-[11px] text-slate-400">{label}</p>
                <p className={`mt-1 text-sm font-semibold ${value === null ? "text-slate-400" : changeColorClass(value)}`}>
                  {value === null || value === undefined ? "—" : formatPercent(value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fundamentals */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Fundamentals</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {FUNDAMENTALS_LABELS.map(({ key, label, format }) => (
            <div key={key} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{format(stock[key])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Analysis</h2>
          <button
            onClick={handleAnalyze}
            disabled={aiLoading}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" /> {aiLoading ? "Analyzing..." : aiAnalysis ? "Re-analyze" : "Analyze this Stock"}
          </button>
        </div>
        {aiAnalysis && (
          <p className="mt-3 rounded-lg border border-brand-200 bg-brand-50/50 p-4 text-sm text-slate-700 dark:border-brand-900/50 dark:bg-brand-900/10 dark:text-slate-300">
            {aiAnalysis}
          </p>
        )}
      </div>

      {/* Investing */}
      <div className="mt-8">
        <InvestOptions symbol={stock.symbol} />
      </div>
    </div>
  );
}
