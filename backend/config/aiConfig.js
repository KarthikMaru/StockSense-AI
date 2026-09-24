/**
 * Centralized AI provider configuration.
 * Reads everything from environment variables so no API keys are ever
 * hardcoded in source. The active provider is chosen via AI_PROVIDER.
 *
 * Supported values for AI_PROVIDER: "claude" | "openai" | "gemini" | "mock"
 * "mock" is a safe default that returns rule-based responses when no
 * API key is configured, so the app remains fully functional out of the box.
 */

const aiConfig = {
  provider: (process.env.AI_PROVIDER || "mock").toLowerCase(),

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    baseUrl: "https://api.anthropic.com/v1/messages",
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1/chat/completions",
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  },
};

/**
 * Returns true if the currently configured provider actually has an API key
 * set. Used by aiService to decide whether to call a real provider or fall
 * back to the mock/rule-based engine.
 */
aiConfig.isProviderConfigured = function isProviderConfigured() {
  switch (aiConfig.provider) {
    case "claude":
      return Boolean(aiConfig.claude.apiKey);
    case "openai":
      return Boolean(aiConfig.openai.apiKey);
    case "gemini":
      return Boolean(aiConfig.gemini.apiKey);
    default:
      return false;
  }
};

module.exports = aiConfig;
