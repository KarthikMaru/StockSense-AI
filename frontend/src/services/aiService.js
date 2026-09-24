import api from "./api";

/**
 * Sends the full conversation so far and gets the assistant's next reply.
 * messages: [{ role: "user"|"assistant", content: string }]
 */
export async function sendChatMessage(messages) {
  const { data } = await api.post("/ai/chat", { messages });
  return data; // { success, reply }
}

/**
 * Gets personalized stock recommendations. Pass `profile` to let a
 * logged-out visitor try the advisor; omit it to use the logged-in user's
 * saved preferences instead.
 */
export async function getRecommendations(profile, limit = 6) {
  const { data } = await api.post("/ai/recommend", { profile, limit });
  return data; // { success, profile, count, recommendations }
}

export async function buildPortfolio(profile) {
  const { data } = await api.post("/ai/build-portfolio", { profile });
  return data; // { success, profile, portfolio }
}

export async function analyzeStock(symbol) {
  const { data } = await api.post("/ai/analyze-stock", { symbol });
  return data; // { success, symbol, analysis }
}

export async function compareStocksAI(symbols, profile) {
  const { data } = await api.post("/ai/compare-stocks", { symbols, profile });
  return data; // { success, stocks, summary, narrative }
}
