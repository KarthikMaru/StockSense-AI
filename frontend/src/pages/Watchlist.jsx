import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, X } from "lucide-react";
import { fetchWatchlist, removeFromWatchlist } from "../services/watchlistService";
import { formatCurrency, formatPercent, changeColorClass } from "../utils/format";

export default function Watchlist() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWatchlist();
      setStocks(data.stocks || []);
    } catch (err) {
      setError(err.message || "Could not load your watchlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
    } catch (err) {
      setError(err.message || "Could not remove this stock.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 text-amber-500" fill="currentColor" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Watchlist</h1>
      </div>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Track the stocks you care about.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : stocks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-700">
          Your watchlist is empty. Head to the{" "}
          <Link to="/stocks" className="font-medium text-brand-600 dark:text-brand-300">
            Stock Explorer
          </Link>{" "}
          and click the star on any stock to track it here.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Daily Change</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stocks.map((s) => (
                <tr key={s.symbol}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/stocks/${s.symbol}`}
                      className="font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
                    >
                      {s.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.symbol}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(s.currentPrice)}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${changeColorClass(s.change)}`}>
                    {formatPercent(s.changePercent)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRemove(s.symbol)} aria-label={`Remove ${s.symbol}`}>
                      <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
