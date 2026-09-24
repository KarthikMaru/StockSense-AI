import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../utils/format";

const RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y"];

function formatTick(dateStr, range) {
  const d = new Date(dateStr);
  if (range === "1D" || range === "1W") {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  if (range === "5Y" || range === "3Y") {
    return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/**
 * Renders an interactive area chart of historical close prices with
 * time-range tabs (1D through 5Y). Expects `history` as an array of
 * { date, open, high, low, close, volume }.
 *
 * Range can be either:
 *  - Uncontrolled (default): the component manages its own active range
 *    and the parent should refetch `history` via `onRangeChange`.
 *  - Controlled: pass `range` + `onRangeChange`; the parent owns the state
 *    (used by StockDetails, which slices a pre-fetched 5Y dataset locally).
 *
 * `loading` shows a subtle overlay without unmounting the previous chart,
 * so switching ranges never causes a jarring blank flash.
 */
export default function StockChart({
  history = [],
  isDemoData = true,
  range: controlledRange,
  onRangeChange,
  loading = false,
}) {
  const [internalRange, setInternalRange] = useState("1M");
  const range = controlledRange ?? internalRange;

  const handleRangeClick = (r) => {
    if (onRangeChange) onRangeChange(r);
    else setInternalRange(r);
  };

  const chartData = useMemo(
    () =>
      history.map((point) => ({
        date: point.date,
        close: point.close,
      })),
    [history]
  );

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleRangeClick(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-brand-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {isDemoData && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Demo Data
          </span>
        )}
      </div>

      <div className="relative mt-4 h-72">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-800/60">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        )}

        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No historical data available yet for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                minTickGap={40}
                tickFormatter={(v) => formatTick(v, range)}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${v}`}
                width={60}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Close"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                labelClassName="text-xs"
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
