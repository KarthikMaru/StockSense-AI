import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Check } from "lucide-react";
import { formatCurrency, formatPercent, changeColorClass } from "../utils/format";

/**
 * Displays a single stock's snapshot: company name, symbol, current price,
 * absolute change and percentage change. Used across Dashboard, Stock
 * Explorer, Watchlist, and sector browsing pages.
 *
 * Expected `stock` shape: { symbol, companyName, currentPrice, change,
 * changePercent, sector, oneYearReturn? }
 *
 * Compare selection (Stock Explorer's "compare up to 3 stocks" feature) is
 * opt-in: pass `onToggleCompare` + `compareSelected` to show the checkbox.
 */
export default function StockCard({
  stock,
  onAddToWatchlist,
  onToggleCompare,
  compareSelected = false,
  compareDisabled = false,
}) {
  if (!stock) return null;

  const { symbol, companyName, currentPrice, change = 0, changePercent = 0, sector } = stock;
  const isUp = change >= 0;

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50">
      {onToggleCompare && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleCompare(symbol);
          }}
          disabled={compareDisabled && !compareSelected}
          title={compareSelected ? "Remove from comparison" : "Add to comparison (max 3)"}
          className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            compareSelected
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-300 bg-white text-transparent hover:border-brand-400 dark:border-slate-600 dark:bg-slate-900"
          } ${compareDisabled && !compareSelected ? "cursor-not-allowed opacity-40" : ""}`}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/stocks/${symbol}`}
            className="font-semibold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
          >
            {symbol}
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[10rem]">
            {companyName}
          </p>
        </div>
        {!onToggleCompare &&
          (isUp ? (
            <TrendingUp className="h-4 w-4 text-gain-light dark:text-gain-dark" />
          ) : (
            <TrendingDown className="h-4 w-4 text-loss-light dark:text-loss-dark" />
          ))}
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatCurrency(currentPrice)}
          </div>
          <div className={`text-xs font-medium ${changeColorClass(change)}`}>
            {change >= 0 ? "+" : ""}
            {formatCurrency(Math.abs(change)).replace("₹", "₹")} ({formatPercent(changePercent)})
          </div>
        </div>
        {sector && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {sector}
          </span>
        )}
      </div>

      {onAddToWatchlist && (
        <button
          onClick={() => onAddToWatchlist(symbol)}
          className="mt-3 w-full rounded-lg border border-slate-300 py-1.5 text-xs font-medium text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Add to Watchlist
        </button>
      )}
    </div>
  );
}
