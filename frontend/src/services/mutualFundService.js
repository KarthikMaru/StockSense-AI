import api from "./api";

export async function fetchMutualFunds(params = {}) {
  const { data } = await api.get("/mutual-funds", { params });
  return data; // { success, funds, pagination }
}

export async function fetchMutualFundById(id) {
  const { data } = await api.get(`/mutual-funds/${id}`);
  return data; // { success, fund }
}

export async function compareMutualFunds(ids) {
  const { data } = await api.post("/mutual-funds/compare", { ids });
  return data; // { success, funds, summary }
}
