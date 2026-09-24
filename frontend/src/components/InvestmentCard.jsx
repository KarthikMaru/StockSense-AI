import { CheckCircle2 } from "lucide-react";
import { formatCurrency, changeColorClass, formatPercent } from "../utils/format";

/**
 * Displays a single AI-generated investment recommendation: name, AI score
 * (0-100), current price/return, and a list of plain-language reasons.
 * Populated by POST /api/ai/recommend.
 */
export default function InvestmentCard({ investment, onInvest }) {
  if (!investment) return null;

  const { name, symbol, score, currentPrice, oneYearReturn, reasons = [], type } = investment;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{name}</h4>
          {symbol && <p className="text-xs text-slate-500 dark:text-slate-400">{symbol}</p>}
          {type && (
            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {type}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400">AI Score</span>
          <span className="text-xl font-bold text-brand-600 dark:text-brand-300">{score}/100</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-6">
        {currentPrice !== undefined && (
          <div>
            <p className="text-xs text-slate-400">Price</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(currentPrice)}
            </p>
          </div>
        )}
        {oneYearReturn !== undefined && (
          <div>
            <p className="text-xs text-slate-400">1Y Return</p>
            <p className={`font-semibold ${changeColorClass(oneYearReturn)}`}>
              {formatPercent(oneYearReturn)}
            </p>
          </div>
        )}
      </div>

      {reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-gain-light dark:text-gain-dark" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {onInvest && (
        <button
          onClick={() => onInvest(investment)}
          className="mt-4 w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          View Investment Options
        </button>
      )}
    </div>
  );
}
