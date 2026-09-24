import { useEffect, useMemo, useState } from "react";
import { Search, GitCompare, X } from "lucide-react";
import { fetchMutualFunds, compareMutualFunds } from "../services/mutualFundService";
import { formatPercent, changeColorClass } from "../utils/format";

const CATEGORIES = ["All", "Large Cap Fund", "Mid Cap Fund", "Small Cap Fund", "Index Fund", "ELSS", "Debt Fund", "Hybrid Fund"];
const RISK_LEVELS = ["All", "Low", "Medium", "High"];
const SORT_OPTIONS = [
  { label: "Largest AUM", value: "aum_desc" },
  { label: "Highest 1Y Return", value: "oneYear_desc" },
  { label: "Highest 5Y Return", value: "fiveYear_desc" },
  { label: "Lowest Expense Ratio", value: "expenseRatio_asc" },
];
const MAX_COMPARE = 3;

export default function MutualFunds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [riskLevel, setRiskLevel] = useState("All");
  const [sortValue, setSortValue] = useState("aum_desc");
  const [compareIds, setCompareIds] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMutualFunds({ limit: 100 });
        setFunds(data.funds || []);
      } catch (err) {
        setError(err.message || "Could not load mutual funds.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredFunds = useMemo(() => {
    let result = [...funds];
    if (category !== "All") result = result.filter((f) => f.category === category);
    if (riskLevel !== "All") result = result.filter((f) => f.riskLevel === riskLevel);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((f) => f.fundName.toLowerCase().includes(q) || f.fundHouse.toLowerCase().includes(q));
    }

    const [sortKey, direction] = sortValue.split("_");
    const dir = direction === "asc" ? 1 : -1;
    const getValue = (f) => (sortKey === "aum" || sortKey === "expenseRatio" ? f[sortKey] : f.returns[sortKey]);
    result.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av - bv) * dir;
    });

    return result;
  }, [funds, category, riskLevel, search, sortValue]);

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const runCompare = async () => {
    if (compareIds.length < 2) return;
    setCompareLoading(true);
    try {
      const data = await compareMutualFunds(compareIds);
      setCompareResult(data);
    } catch (err) {
      setError(err.message || "Could not compare the selected funds.");
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mutual Funds</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {loading ? "Loading funds..." : `${filteredFunds.length} of ${funds.length} funds`}
      </p>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by fund or fund house..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <select
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              category === c ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Risk:</span>
        {RISK_LEVELS.map((r) => (
          <button
            key={r}
            onClick={() => setRiskLevel(r)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              riskLevel === r ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Compare</th>
                <th className="px-4 py-3 font-medium">Fund Name</th>
                <th className="px-4 py-3 font-medium">Fund House</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">NAV</th>
                <th className="px-4 py-3 font-medium text-right">Expense Ratio</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium text-right">1Y Return</th>
                <th className="px-4 py-3 font-medium text-right">3Y Return</th>
                <th className="px-4 py-3 font-medium text-right">5Y Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFunds.map((f) => (
                <tr key={f._id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(f._id)}
                      onChange={() => toggleCompare(f._id)}
                      disabled={compareIds.length >= MAX_COMPARE && !compareIds.includes(f._id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{f.fundName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{f.fundHouse}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{f.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-white">₹{f.nav}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{f.expenseRatio}%</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{f.riskLevel}</td>
                  <td className={`px-4 py-3 text-right font-medium ${changeColorClass(f.returns.oneYear)}`}>{formatPercent(f.returns.oneYear)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${changeColorClass(f.returns.threeYear)}`}>{formatPercent(f.returns.threeYear)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${changeColorClass(f.returns.fiveYear)}`}>{formatPercent(f.returns.fiveYear)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {compareResult && (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900/50 dark:bg-brand-900/10">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Comparison Summary</h2>
            <button onClick={() => setCompareResult(null)} aria-label="Close comparison">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {compareResult.summary.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-300">{compareIds.length} of {MAX_COMPARE} selected</span>
          <button
            onClick={runCompare}
            disabled={compareIds.length < 2 || compareLoading}
            className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <GitCompare className="h-4 w-4" /> {compareLoading ? "Comparing..." : "Compare"}
          </button>
          <button onClick={() => setCompareIds([])} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
