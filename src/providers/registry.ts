import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { MockProvider } from "./mock";

export function getProvider(providerId?: string): AIProvider {
  if (providerId === "mock" || process.env.NEXT_PUBLIC_MOCK_PROVIDER === "true") {
    return new MockProvider();
  }

  // Default to Gemini
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
