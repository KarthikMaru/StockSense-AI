import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PiggyBank } from "lucide-react";
import { formatCurrency } from "../utils/format";

/**
 * Standard SIP future value formula:
 *   M = P × ({[1 + i]^n – 1} / i) × (1 + i)
 * where P = monthly investment, i = monthly rate, n = number of months.
 */
function calculateSIP(monthlyInvestment, annualReturnPercent, years) {
  const months = Math.round(years * 12);
  const i = annualReturnPercent / 100 / 12;

  const maturityValue = i === 0
    ? monthlyInvestment * months
    : monthlyInvestment * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);

  const totalInvested = monthlyInvestment * months;
  const estimatedReturns = maturityValue - totalInvested;

  // Year-by-year breakdown for the growth chart.
  const yearlyData = [];
  for (let y = 1; y <= Math.ceil(years); y++) {
    const m = Math.min(y * 12, months);
    const value = i === 0 ? monthlyInvestment * m : monthlyInvestment * ((Math.pow(1 + i, m) - 1) / i) * (1 + i);
    yearlyData.push({
      year: `Year ${y}`,
      invested: Math.round(monthlyInvestment * m),
      value: Math.round(value),
    });
  }

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(estimatedReturns),
    maturityValue: Math.round(maturityValue),
    yearlyData,
  };
}

export default function SIPCalculator() {
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateSIP(monthlyInvestment, annualReturn, years),
    [monthlyInvestment, annualReturn, years]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <PiggyBank className="h-6 w-6 text-brand-600 dark:text-brand-300" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SIP Calculator</h1>
      </div>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Estimate the future value of a monthly Systematic Investment Plan (SIP).
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium text-slate-700 dark:text-slate-300">Monthly Investment</label>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(monthlyInvestment)}</span>
            </div>
            <input
              type="range"
              min="500"
              max="200000"
              step="500"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              className="mt-2 w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium text-slate-700 dark:text-slate-300">Expected Annual Return</label>
              <span className="font-semibold text-slate-900 dark:text-white">{annualReturn}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="mt-2 w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium text-slate-700 dark:text-slate-300">Investment Duration</label>
              <span className="font-semibold text-slate-900 dark:text-white">{years} {years === 1 ? "year" : "years"}</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-2 w-full accent-brand-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">Total Invested</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(result.totalInvested)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">Estimated Returns</p>
              <p className="mt-1 text-lg font-bold text-gain-light dark:text-gain-dark">{formatCurrency(result.estimatedReturns)}</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
              <p className="text-xs text-brand-600 dark:text-brand-300">Maturity Value</p>
              <p className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-300">{formatCurrency(result.maturityValue)}</p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Calculated using the standard SIP future-value formula, assuming a constant monthly
            investment and a constant expected annual return. Actual returns will vary — this is
            an educational estimate, not a guarantee.
          </p>
        </div>

        {/* Growth chart */}
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Growth Over Time</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.yearlyData}>
                <defs>
                  <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={Math.ceil(years / 8)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={55} />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name === "invested" ? "Invested" : "Value"]} />
                <Legend formatter={(value) => (value === "invested" ? "Total Invested" : "Portfolio Value")} />
                <Area type="monotone" dataKey="invested" stroke="#94a3b8" strokeWidth={2} fill="url(#investedGradient)" />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#valueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
