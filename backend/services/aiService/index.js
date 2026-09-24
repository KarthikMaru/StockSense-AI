const axios = require("axios");
const aiConfig = require("../../config/aiConfig");

/**
 * ==========================================================================
 * AI Service
 * ==========================================================================
 * Single abstraction point for every call to an external AI provider.
 * Controllers/services never call axios or a provider SDK directly — they
 * call chat()/analyzeStock()/compareStocksNarrative() below, which decide
 * whether to hit Claude, OpenAI, Gemini, or fall back to a deterministic,
 * rule-based response (AI_PROVIDER=mock, or if the real call fails for any
 * reason). This means the app is always fully functional, even with no API
 * key configured.
 * ==========================================================================
 */

const ADVISOR_SYSTEM_PROMPT = `You are the AI Investment Assistant for StockSense AI, an educational investment analysis platform for Indian retail investors.
Your job is to understand the user's investment goals, risk tolerance, budget, duration, preferred investment type, and preferred sectors, asking about whichever of these you don't yet know — one question at a time — using these exact option sets where relevant:
- Investment goal: Long-term wealth creation, Short-term investment, Retirement planning, Passive income, Tax saving
- Risk tolerance: Low Risk, Medium Risk, High Risk
- Budget: ₹5,000, ₹10,000, ₹25,000, ₹50,000, ₹1,00,000+
- Duration: Less than 1 year, 1-3 years, 3-5 years, More than 5 years
- Investment type: Stocks, Mutual Funds, SIP, ETF, AI Recommended Portfolio
- Sectors: Technology, Banking & Financial Services, Energy Resources, Minerals & Natural Resources, Everyday Consumer Goods, Luxury & Non-Essential Goods, Healthcare & Pharmaceuticals, Infrastructure, Telecommunications, Real Estate
Once you have enough information, give a short, educational summary of what kind of investments might suit them and suggest they use the "Get My Recommendations" or "Build My Portfolio" actions in the app. Never claim any investment is guaranteed to perform a certain way. Always keep in mind this platform provides educational insights only, not financial advice, and never executes trades. Keep replies concise (2-4 sentences).`;

const ANALYSIS_SYSTEM_PROMPT = `You are a financial data analyst for StockSense AI. Given a factual data sheet about one stock, write a short, educational analysis (3-5 sentences) using ONLY the facts provided. Do not invent numbers. Do not claim guaranteed returns. Mention both strengths and risks where the data supports it.`;

const COMPARISON_SYSTEM_PROMPT = `You are a financial data analyst for StockSense AI. Given factual comparison data for 2-3 stocks, write a short, educational comparison summary (3-5 sentences) using ONLY the facts provided. Explain which has stronger fundamentals, which has grown more historically, and which is more stable — and if a user risk tolerance is given, which best fits it. Never claim guaranteed returns.`;

// ---------------------------------------------------------------------------
// Provider callers — each takes (messages, systemPrompt) and returns a string
// ---------------------------------------------------------------------------

async function callClaude(messages, systemPrompt) {
  const response = await axios.post(
    aiConfig.claude.baseUrl,
    {
      model: aiConfig.claude.model,
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    },
    {
      headers: {
        "x-api-key": aiConfig.claude.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      timeout: 15000,
    }
  );

  return (response.data?.content || [])
    .map((block) => block.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function callOpenAI(messages, systemPrompt) {
  const response = await axios.post(
    aiConfig.openai.baseUrl,
    {
      model: aiConfig.openai.model,
      max_tokens: 600,
      messages: [{ role: "system", content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
    },
    {
      headers: { Authorization: `Bearer ${aiConfig.openai.apiKey}`, "content-type": "application/json" },
      timeout: 15000,
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
}

async function callGemini(messages, systemPrompt) {
  const url = `${aiConfig.gemini.baseUrl}/${aiConfig.gemini.model}:generateContent?key=${aiConfig.gemini.apiKey}`;

  const response = await axios.post(
    url,
    {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    },
    { timeout: 15000 }
  );

  return (response.data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

/**
 * Tries the configured provider; on any error (missing key, network,
 * unexpected response shape) or if AI_PROVIDER=mock, falls back to a
 * deterministic response so the feature never breaks.
 */
async function dispatch(messages, systemPrompt, mockFallback) {
  if (!aiConfig.isProviderConfigured()) return mockFallback();

  try {
    let text = "";
    if (aiConfig.provider === "claude") text = await callClaude(messages, systemPrompt);
    else if (aiConfig.provider === "openai") text = await callOpenAI(messages, systemPrompt);
    else if (aiConfig.provider === "gemini") text = await callGemini(messages, systemPrompt);

    return text || mockFallback();
  } catch (error) {
    console.warn(`[aiService] ${aiConfig.provider} call failed (${error.message}); using rule-based fallback.`);
    return mockFallback();
  }
}

// ---------------------------------------------------------------------------
// Mock (rule-based) fallbacks — fully functional with zero API keys
// ---------------------------------------------------------------------------

const ADVISOR_STEPS = [
  "what's your main investment goal? (Long-term wealth creation, Short-term investment, Retirement planning, Passive income, or Tax saving)",
  "what's your risk tolerance — Low, Medium, or High?",
  "what's your approximate investment budget? (e.g. ₹5,000, ₹10,000, ₹25,000, ₹50,000, or ₹1,00,000+)",
  "how long do you plan to stay invested? (Less than 1 year, 1-3 years, 3-5 years, or More than 5 years)",
  "which type of investment interests you most — Stocks, Mutual Funds, SIP, ETF, or an AI Recommended Portfolio?",
  "finally, any sectors you're particularly interested in? (Technology, Banking & Financial Services, Energy Resources, Healthcare, or others — or say 'no preference')",
];

function mockAdvisorReply(messages) {
  const userTurns = messages.filter((m) => m.role === "user").length;

  if (userTurns === 0) {
    return `Hi! I'm your AI Investment Assistant. To get started, ${ADVISOR_STEPS[0]}`;
  }
  if (userTurns <= ADVISOR_STEPS.length - 1) {
    return `Got it — thanks. Next, ${ADVISOR_STEPS[userTurns]}`;
  }
  return "Thanks — I have a good picture of your preferences now. Head to \"Get My Recommendations\" or \"Build My Portfolio\" above and I'll put together educational, data-driven suggestions based on what you've told me. Remember: this is educational insight only, not financial advice, and investment decisions should be made independently.";
}

function mockStockAnalysis(stock, performance) {
  const parts = [
    `${stock.companyName} (${stock.symbol}) is currently trading at ₹${stock.currentPrice} in the ${stock.sector} sector.`,
  ];
  if (performance?.oneYear !== null && performance?.oneYear !== undefined) {
    parts.push(`Over the past year it has returned ${performance.oneYear > 0 ? "+" : ""}${performance.oneYear}%.`);
  }
  parts.push(
    `It carries a ${stock.riskLevel?.toLowerCase()} risk classification based on historical volatility of ${stock.volatility}%, with an overall Investment Score of ${stock.aiScore}/100.`
  );
  if (stock.aiScoreReasons?.length) parts.push(stock.aiScoreReasons.join(" "));
  parts.push(
    "This is an educational, data-driven overview only — not a recommendation to buy or sell, and past performance does not guarantee future results."
  );
  return parts.join(" ");
}

function mockComparisonNarrative(comparisonResult) {
  return comparisonResult?.summary?.highlights?.join(" ") || "Comparison data is unavailable for these stocks.";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function chat(messages) {
  return dispatch(messages, ADVISOR_SYSTEM_PROMPT, () => mockAdvisorReply(messages));
}

async function analyzeStock(stock, performance) {
  const factSheet = [
    `Company: ${stock.companyName} (${stock.symbol})`,
    `Sector: ${stock.sector}`,
    `Current Price: ₹${stock.currentPrice}`,
    `P/E Ratio: ${stock.peRatio ?? "—"}`,
    `EPS: ${stock.eps ?? "—"}`,
    `Dividend Yield: ${stock.dividendYield ?? "—"}%`,
    `ROE: ${stock.roe ?? "—"}%`,
    `ROCE: ${stock.roce ?? "—"}%`,
    `1-Month Return: ${performance?.oneMonth ?? "—"}%`,
    `1-Year Return: ${performance?.oneYear ?? "—"}%`,
    `Volatility (annualized): ${stock.volatility}%`,
    `Risk Level: ${stock.riskLevel}`,
    `Objective Investment Score: ${stock.aiScore}/100`,
  ].join("\n");

  const messages = [
    { role: "user", content: `Here is the data sheet for one stock:\n${factSheet}\n\nWrite the analysis.` },
  ];

  return dispatch(messages, ANALYSIS_SYSTEM_PROMPT, () => mockStockAnalysis(stock, performance));
}

async function compareStocksNarrative(comparisonResult, riskTolerance) {
  const stats = comparisonResult.stocks
    .map(
      (s) =>
        `${s.symbol}: price ₹${s.currentPrice}, 1Y return ${s.oneYearReturn ?? "—"}%, P/E ${s.peRatio ?? "—"}, ROE ${s.roe ?? "—"}%, volatility ${s.volatility}%, risk ${s.riskLevel}, AI score ${s.aiScore}/100`
    )
    .join("\n");

  const messages = [
    {
      role: "user",
      content: `Compare these stocks:\n${stats}${riskTolerance ? `\n\nThe user's stated risk tolerance is: ${riskTolerance}.` : ""}`,
    },
  ];

  return dispatch(messages, COMPARISON_SYSTEM_PROMPT, () => mockComparisonNarrative(comparisonResult));
}

module.exports = { chat, analyzeStock, compareStocksNarrative };
