import api from "./api";

export async function fetchWatchlist() {
  const { data } = await api.get("/watchlist");
  return data; // { success, count, stocks }
}

export async function addToWatchlist(symbol) {
  const { data } = await api.post("/watchlist", { symbol });
  return data; // { success, message, count, stocks }
}

export async function removeFromWatchlist(symbol) {
  const { data } = await api.delete(`/watchlist/${symbol}`);
  return data; // { success, message, count, stocks }
}

export async function fetchMostWatchlisted(limit = 6) {
  const { data } = await api.get("/watchlist/popular", { params: { limit } });
  return data; // { success, count, stocks }
}
