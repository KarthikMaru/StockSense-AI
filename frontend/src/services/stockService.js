import api from "./api";

/**
 * Fetches a list of stocks with optional search/sector/sort/pagination.
 * params: { search, sector, sortBy, order, page, limit }
 */
export async function fetchStocks(params = {}) {
  const { data } = await api.get("/stocks", { params });
  return data; // { success, stocks, pagination }
}

export async function fetchTopStocks(limit = 10) {
  const { data } = await api.get("/stocks/top", { params: { limit } });
  return data; // { success, count, stocks }
}

export async function fetchGainers(limit = 10) {
  const { data } = await api.get("/stocks/gainers", { params: { limit } });
  return data;
}

export async function fetchLosers(limit = 10) {
  const { data } = await api.get("/stocks/losers", { params: { limit } });
  return data;
}

export async function fetchStocksBySector(sector) {
  const { data } = await api.get(`/stocks/sector/${encodeURIComponent(sector)}`);
  return data; // { success, sector, count, stocks }
}

export async function fetchStockBySymbol(symbol) {
  const { data } = await api.get(`/stocks/${encodeURIComponent(symbol)}`);
  return data; // { success, stock, performance }
}

/**
 * Fetches OHLCV history for a stock within a given time range
 * ("1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y").
 */
export async function fetchStockHistory(symbol, range = "1M") {
  const { data } = await api.get(`/stocks/${encodeURIComponent(symbol)}/history`, {
    params: { range },
  });
  return data; // { success, symbol, range, count, history }
}

export async function fetchRankings(params = {}) {
  const { data } = await api.get("/stocks/rankings", { params });
  return data; // { success, stocks, pagination }
}

export async function fetchSectorSummary() {
  const { data } = await api.get("/stocks/sectors");
  return data; // { success, count, sectors }
}

export async function compareStocksApi(symbols) {
  const { data } = await api.post("/stocks/compare", { symbols });
  return data; // { success, stocks, summary }
}
