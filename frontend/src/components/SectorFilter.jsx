const SECTORS = [
  "All",
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

/**
 * Renders a row of pill buttons for filtering stocks by economic sector.
 * `selected` is the currently active sector name ("All" by default);
 * `onSelect` is called with the sector the user clicked.
 */
export default function SectorFilter({ selected = "All", onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SECTORS.map((sector) => (
        <button
          key={sector}
          onClick={() => onSelect?.(sector)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            selected === sector
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {sector}
        </button>
      ))}
    </div>
  );
}

export { SECTORS };
