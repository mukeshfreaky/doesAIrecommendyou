import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { MockProvider } from "./mock";

/**
 * Returns the requested AI provider.
 * Enforces strictly: NO fake fallback responses in the production scan path.
 * MockProvider is permitted ONLY for isolated unit tests or explicit offline test harnesses.
 */
export function getProvider(providerId?: string): AIProvider {
  // Only allow MockProvider if explicitly requested in test/non-prod environment
  if (providerId === "mock" && process.env.NODE_ENV !== "production") {
    return new MockProvider();
  }

  // Production and live pipeline always use real Google Gemini provider
  return new GeminiProvider();
}

export function getAllSupportedProviders(): Array<{ id: string; name: string; isConfigured: boolean }> {
  const gemini = new GeminiProvider();
  return [
    {
      id: gemini.id,
      name: gemini.name,
      isConfigured: gemini.isConfigured(),
    },
    {
      id: "openai",
      name: "OpenAI ChatGPT Search (Planned Phase 2)",
      isConfigured: false,
    },
    {
      id: "perplexity",
      name: "Perplexity Sonar (Planned Phase 2)",
      isConfigured: false,
    },
  ];
}
