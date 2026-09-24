export const PERFORMANCE_RANGES = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 182,
  "1Y": 365,
  "3Y": 1095,
  "5Y": 1825,
};

/**
 * Given a full historical series (sorted or unsorted, ascending by date
 * assumed after sort), computes the percentage return for each standard
 * period by finding the closest available close on/before "today - N days"
 * and comparing it to the most recent close.
 *
 * Returns an object like { "1D": 0.4, "1W": -1.2, ..., "5Y": 187.3 }.
 * A value is `null` if there isn't enough history to compute that period.
 */
export function computePeriodReturns(history) {
  if (!history || history.length === 0) return {};

  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const latestDate = new Date(latest.date);

  const result = {};

  Object.entries(PERFORMANCE_RANGES).forEach(([label, days]) => {
    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - days);

    let basePoint = null;
    for (const point of sorted) {
      if (new Date(point.date) <= cutoff) {
        basePoint = point;
      } else {
        break;
      }
    }

    // Fall back to the earliest available point if the requested range
    // extends further back than our history (e.g. asking for 5Y on a
    // stock with only 3Y of data).
    if (!basePoint && sorted.length > 0) {
      basePoint = sorted[0];
    }

    if (basePoint && basePoint.close) {
      result[label] = ((latest.close - basePoint.close) / basePoint.close) * 100;
    } else {
      result[label] = null;
    }
  });

  return result;
}

/**
 * Filters a full historical series down to just the last N days for a given
 * chart range label, so the chart can re-render instantly on range changes
 * without an extra network request.
 */
export function filterHistoryByRange(history, rangeLabel) {
  if (!history || history.length === 0) return [];
  const days = PERFORMANCE_RANGES[rangeLabel] || PERFORMANCE_RANGES["1M"];

  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestDate = new Date(sorted[sorted.length - 1].date);
  const cutoff = new Date(latestDate);
  cutoff.setDate(cutoff.getDate() - days);

  return sorted.filter((point) => new Date(point.date) >= cutoff);
}
