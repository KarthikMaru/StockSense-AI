import { useEffect, useState } from "react";
import { Save, User as UserIcon, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SECTORS } from "../components/SectorFilter";

const RISK_LEVELS = ["Low", "Medium", "High"];
const INVESTMENT_GOALS = [
  "Long-term wealth creation",
  "Short-term investment",
  "Retirement planning",
  "Passive income",
  "Tax saving",
];
const INVESTMENT_BUDGETS = ["₹5,000", "₹10,000", "₹25,000", "₹50,000", "₹1,00,000+"];
const INVESTMENT_DURATIONS = ["Less than 1 year", "1-3 years", "3-5 years", "More than 5 years"];
const INVESTMENT_TYPES = ["Stocks", "Mutual Funds", "SIP", "ETF", "AI Recommended Portfolio"];
const PLATFORMS = ["Groww", "Zerodha"];

const emptyForm = {
  name: "",
  riskTolerance: "",
  investmentGoal: "",
  investmentBudget: "",
  investmentDuration: "",
  preferredInvestmentTypes: [],
  preferredSectors: [],
  preferredPlatform: "",
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        const u = data.user;
        setForm({
          name: u.name || "",
          riskTolerance: u.riskTolerance || "",
          investmentGoal: u.investmentGoal || "",
          investmentBudget: u.investmentBudget || "",
          investmentDuration: u.investmentDuration || "",
          preferredInvestmentTypes: u.preferredInvestmentTypes || [],
          preferredSectors: u.preferredSectors || [],
          preferredPlatform: u.preferredPlatform || "",
        });
        setUser(u);
      } catch (err) {
        setError(err.message || "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleArrayValue = (field, value) => {
    setForm((f) => {
      const current = f[field];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, [field]: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      setUser(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        These preferences power your personalized, educational recommendations across the AI
        Advisor, stock rankings, and portfolio suggestions. Nothing here is shared with brokers or
        used to place trades.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Basic info */}
        <section>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Full Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </section>

        {/* Risk tolerance */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Risk Tolerance</h3>
          <div className="mt-2 flex gap-2">
            {RISK_LEVELS.map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setForm((f) => ({ ...f, riskTolerance: level }))}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  form.riskTolerance === level
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </section>

        {/* Investment goal */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Investment Goal</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {INVESTMENT_GOALS.map((goal) => (
              <button
                type="button"
                key={goal}
                onClick={() => setForm((f) => ({ ...f, investmentGoal: goal }))}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  form.investmentGoal === goal
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </section>

        {/* Budget */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Investment Budget (per month)
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {INVESTMENT_BUDGETS.map((budget) => (
              <button
                type="button"
                key={budget}
                onClick={() => setForm((f) => ({ ...f, investmentBudget: budget }))}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  form.investmentBudget === budget
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {budget}
              </button>
            ))}
          </div>
        </section>

        {/* Duration */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Investment Duration
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {INVESTMENT_DURATIONS.map((duration) => (
              <button
                type="button"
                key={duration}
                onClick={() => setForm((f) => ({ ...f, investmentDuration: duration }))}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  form.investmentDuration === duration
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {duration}
              </button>
            ))}
          </div>
        </section>

        {/* Investment types (multi-select) */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Preferred Investment Types
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {INVESTMENT_TYPES.map((type) => {
              const active = form.preferredInvestmentTypes.includes(type);
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => toggleArrayValue("preferredInvestmentTypes", type)}
                  className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {active && <CheckCircle2 className="h-3 w-3" />}
                  {type}
                </button>
              );
            })}
          </div>
        </section>

        {/* Sectors (multi-select) */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Preferred Sectors
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTORS.filter((s) => s !== "All").map((sector) => {
              const active = form.preferredSectors.includes(sector);
              return (
                <button
                  type="button"
                  key={sector}
                  onClick={() => toggleArrayValue("preferredSectors", sector)}
                  className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {active && <CheckCircle2 className="h-3 w-3" />}
                  {sector}
                </button>
              );
            })}
          </div>
        </section>

        {/* Preferred platform */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Preferred Investment Platform
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Used only to pre-select where we redirect you when you choose to invest. We never
            store brokerage credentials.
          </p>
          <div className="mt-2 flex gap-2">
            {PLATFORMS.map((platform) => (
              <button
                type="button"
                key={platform}
                onClick={() => setForm((f) => ({ ...f, preferredPlatform: platform }))}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  form.preferredPlatform === platform
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Profile saved successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
