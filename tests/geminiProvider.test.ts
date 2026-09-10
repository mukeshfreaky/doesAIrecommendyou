import { describe, it, expect } from "vitest";
import { GeminiProvider } from "../src/providers/gemini";
import { MockProvider } from "../src/providers/mock";
import { getProvider } from "../src/providers/registry";

describe("AI Providers & Registry", () => {
  it("GeminiProvider reports unconfigured when GEMINI_API_KEY is not set", () => {
    // Delete env key temporarily if present
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const provider = new GeminiProvider();
    expect(provider.isConfigured()).toBe(false);

    // Restore key
    if (prevKey) process.env.GEMINI_API_KEY = prevKey;
  });

  it("GeminiProvider throws descriptive server configuration error when invoked without key", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const provider = new GeminiProvider();
    await expect(provider.generateResponse("test question")).rejects.toThrow(
      /GEMINI_API_KEY/i
    );

    if (prevKey) process.env.GEMINI_API_KEY = prevKey;
  });

  it("MockProvider generates valid AIResponse with search queries and citations", async () => {
    const mock = new MockProvider();
    expect(mock.isConfigured()).toBe(true);

    const res = await mock.generateResponse("What are the best analytics tools?");
    expect(res.content.length).toBeGreaterThan(0);
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.groundingQueries.length).toBeGreaterThan(0);
    expect(res.metadata.searchQueriesExecuted).toBe(2);
    expect(res.estimatedCostUSD).toBeGreaterThan(0);
  });

  it("registry can retrieve mock provider when specified", () => {
    const provider = getProvider("mock");
    expect(provider.id).toBe("mock_provider");
  });

  it("MockProvider handles responses with missing or empty grounding metadata safely", async () => {
    const mock = new MockProvider();
    mock.setMockResponse("custom-query", {
      content: "Result without search grounding.",
      citations: [],
      groundingQueries: [],
      rawGroundingMetadata: undefined,
    });

    const res = await mock.generateResponse("custom-query");
    expect(res.content).toBe("Result without search grounding.");
    expect(res.citations).toHaveLength(0);
    expect(res.groundingQueries).toHaveLength(0);
    expect(res.rawGroundingMetadata).toBeUndefined();
  });

  it("GeminiProvider blocks live calls when AI_LIVE_ENABLED is not true", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    const prevLive = process.env.AI_LIVE_ENABLED;
    process.env.GEMINI_API_KEY = "test-key";
    process.env.AI_LIVE_ENABLED = "false";

    const provider = new GeminiProvider();
    await expect(provider.generateResponse("test question")).rejects.toThrow(
      /AI Safety Gate Blocked/i
    );

    if (prevKey) process.env.GEMINI_API_KEY = prevKey;
    else delete process.env.GEMINI_API_KEY;
    if (prevLive) process.env.AI_LIVE_ENABLED = prevLive;
    else delete process.env.AI_LIVE_ENABLED;
  });

  it("evaluates UNGROUNDED with zero citations when search grounding tool was requested but returned no queries or chunks", async () => {
    const mock = new MockProvider();
    mock.setMockResponse("timeless-query", {
      content: "Parametric response without web search.",
      citations: [],
      groundingQueries: [],
      rawGroundingMetadata: {
        webSearchQueries: [],
        groundingChunks: [],
      },
    });

    const res = await mock.generateResponse("timeless-query");
    expect(res.metadata.searchGroundingEnabled).toBe(true);
    // Crucial: 0 search queries executed means no citations can be fabricated
    expect(res.groundingQueries).toHaveLength(0);
    expect(res.citations).toHaveLength(0);
  });
});
