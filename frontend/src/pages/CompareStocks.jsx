import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { compareStocksAI } from "../services/aiService";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatPercent, changeColorClass } from "../utils/format";

const METRIC_ROWS = [
  { key: "currentPrice", label: "Current Price", format: (v) => formatCurrency(v) },
  { key: "marketCap", label: "Market Cap", format: (v) => formatCurrency(v) },
  { key: "peRatio", label: "P/E Ratio", format: (v) => v ?? "—" },
  { key: "dividendYield", label: "Dividend Yield", format: (v) => (v == null ? "—" : `${v}%`) },
  { key: "oneYearReturn", label: "1 Year Return", format: (v) => (v == null ? "—" : formatPercent(v)), colored: true },
  { key: "volatility", label: "Volatility (annualized)", format: (v) => `${v}%` },
  { key: "riskLevel", label: "Risk Level", format: (v) => v },
  { key: "aiScore", label: "AI Score", format: (v) => `${v}/100` },
];

export default function CompareStocks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const symbols = (searchParams.get("symbols") || "").split(",").filter(Boolean);
  const { user } = useAuth();

  const [stocks, setStocks] = useState([]);
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (symbols.length < 2) {
      setStocks([]);
      setNarrative("");
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Uses the AI-narrated comparison (POST /api/ai/compare-stocks), which
        // falls back to a deterministic rule-based summary when no AI provider
        // key is configured — personalized to the user's saved risk tolerance
        // when logged in.
        const profile = user?.riskTolerance ? { riskTolerance: user.riskTolerance } : undefined;
        const data = await compareStocksAI(symbols, profile);
        if (!cancelled) {
          setStocks(data.stocks || []);
          setNarrative(data.narrative || data.summary?.highlights?.join(" ") || "");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not compare the selected stocks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("symbols"), user?.riskTolerance]);

  const removeSymbol = (symbol) => {
    const next = symbols.filter((s) => s !== symbol);
    setSearchParams(next.length ? { symbols: next.join(",") } : {});
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compare Stocks</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Compare up to 3 stocks side by side with a data-driven summary.
      </p>

      {symbols.length < 2 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-700">
          Select at least 2 stocks to compare. Head to the{" "}
          <Link to="/stocks" className="font-medium text-brand-600 dark:text-brand-300">
            Stock Explorer
          </Link>{" "}
          and check up to 3 stocks to compare them here.
        </div>
      ) : loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : error ? (
        <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {stocks.map((stock) => (
              <span
                key={stock.symbol}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {stock.symbol}
                <button onClick={() => removeSymbol(stock.symbol)} aria-label={`Remove ${stock.symbol}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Metric</th>
                  {stocks.map((s) => (
                    <th key={s.symbol} className="px-4 py-3 font-medium text-right">
                      {s.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {METRIC_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.label}</td>
                    {stocks.map((s) => (
                      <td
                        key={s.symbol}
                        className={`px-4 py-3 text-right font-medium ${
                          row.colored ? changeColorClass(s[row.key]) : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {row.format(s[row.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {narrative && (
            <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900/50 dark:bg-brand-900/10">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-300" /> AI Comparison Summary
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{narrative}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
