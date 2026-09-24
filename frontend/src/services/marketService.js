import api from "./api";

export async function fetchMarketIndices() {
  const { data } = await api.get("/market/indices");
  return data; // { success, indices, sentiment }
}
