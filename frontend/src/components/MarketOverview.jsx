import { Activity } from "lucide-react";
import { formatPercent, changeColorClass } from "../utils/format";

/**
 * Displays headline index values (NIFTY 50, SENSEX, NIFTY BANK) and a
 * market sentiment indicator. Expects `indices` as an array of
 * { name, value, changePercent } and `sentiment` as "bullish" | "bearish" | "neutral".
 * Real values come from GET /api/market/indices (services/marketIndexService),
 * derived from the aggregate performance of the actual seeded stocks.
 */
export default function MarketOverview({ indices = [], sentiment = "neutral", isDemoData = true }) {
  const sentimentStyles = {
    bullish: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    bearish: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">Market Overview</h3>
        {isDemoData && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Demo Data
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {indices.length === 0 ? (
          <p className="col-span-3 text-sm text-slate-400">
            Index data will appear here once stocks have been seeded (npm run seed).
          </p>
        ) : (
          indices.map((idx) => (
            <div key={idx.name} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">{idx.name}</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {typeof idx.value === "number" ? idx.value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : idx.value}
              </p>
              <p className={`text-xs font-medium ${changeColorClass(idx.changePercent)}`}>
                {formatPercent(idx.changePercent)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <Activity className="h-4 w-4 text-slate-400" />
        <span className="text-slate-500 dark:text-slate-400">Sentiment:</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${sentimentStyles[sentiment]}`}>
          {sentiment}
        </span>
      </div>
    </div>
  );
}
