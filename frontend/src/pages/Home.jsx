import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, TrendingUp, TrendingDown, Activity, Sparkles } from "lucide-react";
import { fetchRankings, fetchSectorSummary, fetchGainers, fetchLosers } from "../services/stockService";
import { fetchMarketIndices } from "../services/marketService";
import { fetchMutualFunds } from "../services/mutualFundService";
import StockCard from "../components/StockCard";
import { formatMarketCap, changeColorClass, formatPercent } from "../utils/format";

export default function Home() {
  const [topStocks, setTopStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [indices, setIndices] = useState([]);
  const [gainersCount, setGainersCount] = useState(null);
  const [losersCount, setLosersCount] = useState(null);
  const [popularFunds, setPopularFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [rankingsData, sectorData, marketData, gainersData, losersData, fundsData] = await Promise.all([
          fetchRankings({ limit: 4 }),
          fetchSectorSummary(),
          fetchMarketIndices(),
          fetchGainers(50), // used only for a count on the hero card
          fetchLosers(50),
          fetchMutualFunds({ sortBy: "aum", order: "desc", limit: 3 }),
        ]);
        setTopStocks(rankingsData.stocks || []);
        setSectors(sectorData.sectors || []);
        setIndices(marketData.indices || []);
        setGainersCount(gainersData.count ?? 0);
        setLosersCount(losersData.count ?? 0);
        setPopularFunds(fundsData.funds || []);
      } catch {
        // Home page stays fully usable even if the backend/demo data isn't
        // seeded yet — sections below simply show their empty states.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const heroCards = [
    ...indices.map((idx) => ({
      label: idx.name,
      value: idx.value.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
      change: formatPercent(idx.changePercent),
      up: idx.changePercent >= 0,
    })),
    { label: "Top Gainers", value: "View list", change: gainersCount !== null ? `${gainersCount} stocks` : "—", up: true, link: "/stocks" },
    { label: "Top Losers", value: "View list", change: losersCount !== null ? `${losersCount} stocks` : "—", up: false, link: "/stocks" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-surface-dark">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <span className="inline-block rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            Educational insights, not financial advice
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Invest Smarter with AI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Discover stocks, mutual funds, SIPs and investment opportunities personalized for your
            financial goals.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/stocks"
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Explore Stocks <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/ai-advisor"
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Bot className="h-4 w-4" /> Ask AI Advisor
            </Link>
          </div>

          {/* Market summary cards (real data: live indices + gainer/loser counts) */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {loading ? (
              <div className="col-span-2 flex justify-center sm:col-span-4">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
              </div>
            ) : (
              heroCards.map((item) => {
                const Card = (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                      {item.up ? (
                        <TrendingUp className="h-4 w-4 text-gain-light dark:text-gain-dark" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-loss-light dark:text-loss-dark" />
                      )}
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{item.value}</div>
                    <div className={`text-xs font-medium ${item.up ? "text-gain-light dark:text-gain-dark" : "text-loss-light dark:text-loss-dark"}`}>
                      {item.change}
                    </div>
                  </div>
                );
                return item.link ? (
                  <Link key={item.label} to={item.link}>{Card}</Link>
                ) : (
                  <div key={item.label}>{Card}</div>
                );
              })
            )}
          </div>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-400">
            <Activity className="h-3 w-3" /> Demo data — market data delayed / illustrative until a live feed is connected
          </p>
        </div>
      </section>

      {/* Top-ranked stocks (real data, via the AI Score ranking engine) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Top Ranked Stocks</h2>
          <Link to="/stocks" className="text-sm font-medium text-brand-600 dark:text-brand-300">
            View all &rarr;
          </Link>
        </div>
        {loading ? (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : topStocks.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No stocks found yet — run <code>npm run seed</code> in the backend to populate demo data.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topStocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        )}
      </section>

      {/* Explore by Sector (real sector counts + avg daily change) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Explore by Sector</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => (
            <Link
              key={s.sector}
              to={`/stocks?sector=${encodeURIComponent(s.sector)}`}
              className="rounded-xl border border-slate-200 p-5 transition-shadow hover:shadow-md dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">{s.sector}</h3>
                <span className={`text-xs font-medium ${changeColorClass(s.avgChangePercent)}`}>
                  {formatPercent(s.avgChangePercent)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {s.stockCount} {s.stockCount === 1 ? "stock" : "stocks"} · {formatMarketCap(s.totalMarketCap)} combined market cap
              </p>
            </Link>
          ))}
          {sectors.length === 0 && !loading && (
            <p className="text-sm text-slate-400">Sector data will appear once demo data is seeded.</p>
          )}
        </div>
      </section>

      {/* Popular Mutual Funds (real data) + AI Recommendations CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Popular Mutual Funds</h2>
              <Link to="/mutual-funds" className="text-sm font-medium text-brand-600 dark:text-brand-300">
                View all &rarr;
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {popularFunds.length === 0 && !loading && (
                <p className="text-sm text-slate-400">Fund data will appear once demo data is seeded.</p>
              )}
              {popularFunds.map((f) => (
                <Link
                  key={f._id}
                  to="/mutual-funds"
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-md dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{f.fundName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{f.fundHouse} · {f.category}</p>
                  </div>
                  <span className={`text-sm font-semibold ${changeColorClass(f.returns?.oneYear)}`}>
                    {formatPercent(f.returns?.oneYear)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Personalized recommendations require quiz answers we don't have for
              an anonymous Home page visit — so this is an honest call-to-action
              into the real AI Advisor rather than fabricated "personalized" data. */}
          <div className="flex flex-col justify-center rounded-xl border border-brand-200 bg-brand-50/50 p-6 dark:border-brand-900/50 dark:bg-brand-900/10">
            <Sparkles className="h-8 w-8 text-brand-600 dark:text-brand-300" />
            <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">AI Investment Recommendations</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Answer a few quick questions about your goals, risk tolerance, and preferred sectors,
              and get personalized, educational stock picks with an AI-generated portfolio
              allocation — powered by the same AI Score ranking engine used across the platform.
            </p>
            <Link
              to="/ai-advisor"
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Bot className="h-4 w-4" /> Get My Recommendations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
