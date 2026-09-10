import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { MockProvider } from "./mock";
import { OpenAIProvider } from "./openai";

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

  // OpenAI provider via Experiential gateway
  if (
    providerId === "openai" ||
    providerId === "gpt-5.6-luna" ||
    (!providerId && process.env.DEFAULT_PROVIDER === "openai") ||
    (!providerId && process.env.DEFAULT_PROVIDER === "gpt-5.6-luna")
  ) {
    return new OpenAIProvider(providerId === "gpt-5.6-luna" ? "gpt-5.6-luna" : undefined);
  }

  // Production and live pipeline default to Google Gemini provider
  return new GeminiProvider();
}

export function getAllSupportedProviders(): Array<{ id: string; name: string; isConfigured: boolean }> {
  const gemini = new GeminiProvider();
  const openai = new OpenAIProvider();
  return [
    {
      id: gemini.id,
      name: gemini.name,
      isConfigured: gemini.isConfigured(),
    },
    {
      id: "openai",
      name: openai.name,
      isConfigured: openai.isConfigured(),
    },
    {
      id: "perplexity",
      name: "Perplexity Sonar (Planned Phase 2)",
      isConfigured: false,
    },
  ];
}

