/**
 * Formats a number as Indian Rupees, e.g. 385000 -> "₹3,85,000"
 */
export function formatCurrency(value, { decimals = 2 } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats large numbers using Indian units (Lakh / Crore), used for market cap.
 * e.g. 1234567890 -> "₹123.46 Cr"
 */
export function formatMarketCap(valueInRupees) {
  if (valueInRupees === null || valueInRupees === undefined) return "—";
  const crore = 1e7;
  const lakh = 1e5;
  if (valueInRupees >= crore) {
    return `₹${(valueInRupees / crore).toFixed(2)} Cr`;
  }
  if (valueInRupees >= lakh) {
    return `₹${(valueInRupees / lakh).toFixed(2)} L`;
  }
  return formatCurrency(valueInRupees, { decimals: 0 });
}

/**
 * Formats a percentage change with a leading + or - sign.
 */
export function formatPercent(value, { decimals = 2 } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(decimals)}%`;
}

/**
 * Returns a Tailwind text color class based on whether a value is a gain
 * (green), loss (red), or neutral (gray).
 */
export function changeColorClass(value) {
  if (value === null || value === undefined || Number(value) === 0) {
    return "text-slate-500 dark:text-slate-400";
  }
  return value > 0
    ? "text-gain-light dark:text-gain-dark"
    : "text-loss-light dark:text-loss-dark";
}
