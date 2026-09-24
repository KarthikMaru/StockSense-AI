import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, PieChart, CheckCircle2 } from "lucide-react";
import { getRecommendations, buildPortfolio as buildPortfolioApi } from "../services/aiService";
import { useAuth } from "../context/AuthContext";
import AIChat from "../components/AIChat";
import InvestmentCard from "../components/InvestmentCard";

const GOALS = ["Long-term wealth creation", "Short-term investment", "Retirement planning", "Passive income", "Tax saving"];
const RISKS = ["Low", "Medium", "High"];
const BUDGETS = ["₹5,000", "₹10,000", "₹25,000", "₹50,000", "₹1,00,000+"];
const DURATIONS = ["Less than 1 year", "1-3 years", "3-5 years", "More than 5 years"];
const TYPES = ["Stocks", "Mutual Funds", "SIP", "ETF", "AI Recommended Portfolio"];
const SECTORS = [
  "Technology",
  "Banking & Financial Services",
  "Energy Resources",
  "Minerals & Natural Resources",
  "Everyday Consumer Goods",
  "Luxury & Non-Essential Goods",
  "Healthcare & Pharmaceuticals",
  "Infrastructure",
  "Telecommunications",
  "Real Estate",
];

function PillGroup({ options, selected, onSelect, multi = false }) {
  const isSelected = (opt) => (multi ? selected.includes(opt) : selected === opt);
  const handleClick = (opt) => {
    if (!multi) return onSelect(opt);
    onSelect(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => handleClick(opt)}
          className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            isSelected(opt)
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {isSelected(opt) && <CheckCircle2 className="h-3 w-3" />}
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function AIAdvisor() {
  const { isAuthenticated } = useAuth();

  const [profile, setProfile] = useState({
    investmentGoal: "",
    riskTolerance: "",
    investmentBudget: "",
    investmentDuration: "",
    preferredInvestmentTypes: [],
    preferredSectors: [],
  });

  const [recommendations, setRecommendations] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const hasEnoughInfo = profile.investmentGoal && profile.riskTolerance;

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError("");
    setPortfolio(null);
    try {
      const data = await getRecommendations(profile, 6);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message || "Could not generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildPortfolio = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await buildPortfolioApi(profile);
      setPortfolio(data.portfolio);
    } catch (err) {
      setError(err.message || "Could not build a portfolio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-brand-600 dark:text-brand-300" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Investment Advisor</h1>
      </div>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Answer a few questions to get personalized, educational investment insights.
        {!isAuthenticated && (
          <>
            {" "}
            <Link to="/register" className="font-medium text-brand-600 dark:text-brand-300">
              Create an account
            </Link>{" "}
            to save these preferences to your profile — or just answer below to try it out.
          </>
        )}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Guided quiz */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What are your investment goals?</h3>
            <div className="mt-2">
              <PillGroup options={GOALS} selected={profile.investmentGoal} onSelect={(v) => update("investmentGoal", v)} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What is your risk tolerance?</h3>
            <div className="mt-2">
              <PillGroup options={RISKS} selected={profile.riskTolerance} onSelect={(v) => update("riskTolerance", v)} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What is your investment budget?</h3>
            <div className="mt-2">
              <PillGroup options={BUDGETS} selected={profile.investmentBudget} onSelect={(v) => update("investmentBudget", v)} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">How long do you want to invest?</h3>
            <div className="mt-2">
              <PillGroup options={DURATIONS} selected={profile.investmentDuration} onSelect={(v) => update("investmentDuration", v)} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What type of investment interests you?</h3>
            <div className="mt-2">
              <PillGroup
                options={TYPES}
                selected={profile.preferredInvestmentTypes}
                onSelect={(v) => update("preferredInvestmentTypes", v)}
                multi
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Which sectors are you interested in?</h3>
            <div className="mt-2">
              <PillGroup options={SECTORS} selected={profile.preferredSectors} onSelect={(v) => update("preferredSectors", v)} multi />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGetRecommendations}
              disabled={!hasEnoughInfo || loading}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> {loading ? "Thinking..." : "Get My Recommendations"}
            </button>
            <button
              onClick={handleBuildPortfolio}
              disabled={!hasEnoughInfo || loading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <PieChart className="h-4 w-4" /> Build My Portfolio
            </button>
          </div>
          {!hasEnoughInfo && (
            <p className="text-xs text-slate-400">Pick at least a goal and risk tolerance to continue.</p>
          )}
        </div>

        {/* Chat */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Or just ask</h3>
          <AIChat />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Top Matches</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ranked by fit with your stated preferences, on top of each stock's objective Investment Score.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((stock) => (
              <InvestmentCard
                key={stock.symbol}
                investment={{
                  name: stock.companyName,
                  symbol: stock.symbol,
                  score: stock.personalizedScore,
                  currentPrice: stock.currentPrice,
                  oneYearReturn: stock.oneYearReturn,
                  reasons: stock.reasons,
                  type: stock.sector,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {portfolio && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Suggested Portfolio Allocation</h2>
          <div className="mt-4 space-y-3">
            {portfolio.allocations.map((a) => (
              <div key={a.category} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">{a.category}</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-300">{a.percent}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-brand-600" style={{ width: `${a.percent}%` }} />
                </div>
                {a.exampleStocks?.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Example matches: {a.exampleStocks.join(", ")}
                  </p>
                )}
                {a.note && <p className="mt-2 text-xs text-slate-400">{a.note}</p>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">{portfolio.note}</p>
        </div>
      )}
    </div>
  );
}
