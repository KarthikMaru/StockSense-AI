import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StockCard from "../components/StockCard";
import MarketOverview from "../components/MarketOverview";
import { fetchTopStocks, fetchGainers, fetchLosers } from "../services/stockService";
import { fetchMostWatchlisted } from "../services/watchlistService";
import { fetchMarketIndices } from "../services/marketService";

function StockRow({ title, viewAllHref, stocks, loading, emptyMessage }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        {viewAllHref && (
          <Link to={viewAllHref} className="text-xs font-medium text-brand-600 dark:text-brand-300">
            View all
          </Link>
        )}
      </div>
      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : stocks.length === 0 ? (
        <p className="mt-6 text-center text-xs text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stocks.slice(0, 4).map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [topStocks, setTopStocks] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [mostWatchlisted, setMostWatchlisted] = useState([]);
  const [marketData, setMarketData] = useState({ indices: [], sentiment: "neutral" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [top, gain, lose, popular, market] = await Promise.all([
          fetchTopStocks(6),
          fetchGainers(4),
          fetchLosers(4),
          fetchMostWatchlisted(4),
          fetchMarketIndices(),
        ]);
        setTopStocks(top.stocks || []);
        setGainers(gain.stocks || []);
        setLosers(lose.stocks || []);
        setMostWatchlisted(popular.stocks || []);
        setMarketData({ indices: market.indices || [], sentiment: market.sentiment || "neutral" });
      } catch (err) {
        setError(
          err?.response?.status === 404 || err?.message?.includes("Network")
            ? "Couldn't reach the backend. Make sure the API is running and the database has been seeded (npm run seed)."
            : err.message || "Could not load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Your market overview, top stocks, gainers/losers, and watchlist at a glance.
      </p>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MarketOverview indices={marketData.indices} sentiment={marketData.sentiment} isDemoData />
        </div>
        <StockRow
          title="Most Watchlisted"
          stocks={mostWatchlisted}
          loading={loading}
          emptyMessage="No one has added a stock to their watchlist yet."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <StockRow
          title="Top Stocks"
          viewAllHref="/stocks"
          stocks={topStocks}
          loading={loading}
          emptyMessage="No stocks found. Run the seed script (npm run seed) in backend/."
        />
        <StockRow
          title="Top Gainers"
          viewAllHref="/stocks"
          stocks={gainers}
          loading={loading}
          emptyMessage="No gainers right now."
        />
        <StockRow
          title="Top Losers"
          viewAllHref="/stocks"
          stocks={losers}
          loading={loading}
          emptyMessage="No losers right now."
        />
      </div>
    </div>
  );
}
