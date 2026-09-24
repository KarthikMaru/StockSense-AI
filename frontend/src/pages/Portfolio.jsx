import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Briefcase, Trash2, Plus } from "lucide-react";
import { fetchPortfolio, addPortfolioInvestment, removePortfolioInvestment } from "../services/portfolioService";
import { fetchStocks } from "../services/stockService";
import { formatCurrency, formatPercent, changeColorClass } from "../utils/format";

const COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#84cc16"];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [symbol, setSymbol] = useState("");
  const [investedAmount, setInvestedAmount] = useState(10000);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [adding, setAdding] = useState(false);

  const loadPortfolio = async () => {
    try {
      const data = await fetchPortfolio();
      setPortfolio(data.portfolio);
    } catch (err) {
      setError(err.message || "Could not load your portfolio.");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [portfolioData, stocksData] = await Promise.all([fetchPortfolio(), fetchStocks({ limit: 100 })]);
        setPortfolio(portfolioData.portfolio);
        setStocks(stocksData.stocks || []);
        if (stocksData.stocks?.length) setSymbol(stocksData.stocks[0].symbol);
      } catch (err) {
        setError(err.message || "Could not load your portfolio.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!symbol || !investedAmount || investedAmount <= 0) return;
    setAdding(true);
    setError("");
    try {
      await addPortfolioInvestment({
        symbol,
        investedAmount: Number(investedAmount),
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      });
      await loadPortfolio();
      setInvestedAmount(10000);
      setPurchasePrice("");
    } catch (err) {
      setError(err.message || "Could not add this investment.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removePortfolioInvestment(id);
      await loadPortfolio();
    } catch (err) {
      setError(err.message || "Could not remove this investment.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Briefcase className="h-6 w-6 text-brand-600 dark:text-brand-300" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio Simulator</h1>
      </div>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        A risk-free way to simulate hypothetical investments. This is a simulation only — no real
        money, orders, or brokerage accounts are involved.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

      {/* Summary */}
      {portfolio && portfolio.investments.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Total Invested</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(portfolio.totalInvestment)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Current Value</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(portfolio.currentValue)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Profit / Loss</p>
            <p className={`mt-1 text-lg font-bold ${changeColorClass(portfolio.totalProfitLoss)}`}>{formatCurrency(portfolio.totalProfitLoss)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Return</p>
            <p className={`mt-1 text-lg font-bold ${changeColorClass(portfolio.totalReturnPercent)}`}>{formatPercent(portfolio.totalReturnPercent)}</p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Add investment form */}
        <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-800 lg:col-span-1">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add Hypothetical Investment</h3>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Stock</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {stocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Investment Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={investedAmount}
              onChange={(e) => setInvestedAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Purchase Price (₹) <span className="text-slate-400">— optional, defaults to current price</span>
            </label>
            <input
              type="number"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="Current market price"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> {adding ? "Adding..." : "Add to Portfolio"}
          </button>
        </form>

        {/* Holdings + allocation */}
        <div className="lg:col-span-2 space-y-6">
          {portfolio && portfolio.investments.length > 0 ? (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium text-right">Invested</th>
                      <th className="px-4 py-3 font-medium text-right">Current Value</th>
                      <th className="px-4 py-3 font-medium text-right">P/L</th>
                      <th className="px-4 py-3 font-medium text-right">Return</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {portfolio.investments.map((inv) => (
                      <tr key={inv._id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{inv.symbol}</div>
                          <div className="text-xs text-slate-400">{inv.companyName}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(inv.investedAmount)}</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatCurrency(inv.currentValue)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${changeColorClass(inv.profitLoss)}`}>{formatCurrency(inv.profitLoss)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${changeColorClass(inv.returnPercent)}`}>{formatPercent(inv.returnPercent)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleRemove(inv._id)} aria-label={`Remove ${inv.symbol}`}>
                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {portfolio.allocation.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Asset Allocation by Sector</h3>
                  <div className="mt-2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={portfolio.allocation} dataKey="value" nameKey="sector" innerRadius={50} outerRadius={90} paddingAngle={2}>
                          {portfolio.allocation.map((entry, i) => (
                            <Cell key={entry.sector} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-700">
              No hypothetical investments yet. Add one using the form to see it tracked here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
