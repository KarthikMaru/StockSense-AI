import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <strong className="font-semibold">Disclaimer:</strong> This platform provides educational
          insights and data-driven analysis only. Investment decisions involve risk and should be
          made independently. StockSense AI does not execute trades, process payments, or store
          brokerage credentials.
        </p>
        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} StockSense AI. Built for educational purposes.
          </span>
          <div className="flex gap-4 text-sm">
            <Link to="/" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">
              Home
            </Link>
            <Link to="/stocks" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">
              Explore Stocks
            </Link>
            <Link to="/ai-advisor" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">
              AI Advisor
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
