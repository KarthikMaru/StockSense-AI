import api from "./api";

export async function fetchPortfolio() {
  const { data } = await api.get("/portfolio");
  return data; // { success, portfolio }
}

export async function addPortfolioInvestment({ symbol, investedAmount, purchasePrice }) {
  const { data } = await api.post("/portfolio", { symbol, investedAmount, purchasePrice });
  return data; // { success, message, portfolio }
}

export async function removePortfolioInvestment(investmentId) {
  const { data } = await api.delete(`/portfolio/${investmentId}`);
  return data; // { success, message, portfolio }
}
