import { ExternalLink, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Displays "Where would you like to invest?" with Groww/Zerodha options.
 * This NEVER processes payments, stores brokerage credentials, or executes
 * trades — it only opens the platform's own site in a new tab, where the
 * user completes any transaction entirely independently.
 */
export default function InvestOptions({ symbol }) {
  const { user } = useAuth();
  const preferredPlatform = user?.preferredPlatform;

  const openGroww = () => {
    window.open(`https://groww.in/search?query=${encodeURIComponent(symbol)}`, "_blank", "noopener,noreferrer");
  };

  const openZerodha = () => {
    window.open("https://kite.zerodha.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
      <h3 className="font-semibold text-slate-900 dark:text-white">Where would you like to invest?</h3>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-none" />
        You will be redirected to an external investment platform. StockSense AI does not process
        payments, store your brokerage credentials, or execute any transaction on your behalf.
      </p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={openGroww}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
            preferredPlatform === "Groww"
              ? "border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/20 dark:text-brand-300"
              : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          Invest via Groww
          {preferredPlatform === "Groww" && <span className="text-[10px] font-normal">(Preferred)</span>}
        </button>
        <button
          onClick={openZerodha}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
            preferredPlatform === "Zerodha"
              ? "border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/20 dark:text-brand-300"
              : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          Invest via Zerodha
          {preferredPlatform === "Zerodha" && <span className="text-[10px] font-normal">(Preferred)</span>}
        </button>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
        This platform provides educational insights and data-driven analysis only. Investment
        decisions involve risk and should be made independently.
      </p>
    </div>
  );
}
