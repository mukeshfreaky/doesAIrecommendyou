import { describe, it, expect, vi } from "vitest";
import { OpenAIProvider, createOpenAIClient } from "../src/providers/openai";
import { getProvider, getAllSupportedProviders } from "../src/providers/registry";

describe("OpenAIProvider with Experiential Gateway", () => {
  it("uses default Experiential base URL and model gpt-5.6-luna", () => {
    const provider = new OpenAIProvider();
    expect(provider.modelId).toBe("gpt-5.6-luna");
    expect(provider.baseURL).toBe("https://api.experientiallabs.ai/v1");
  });

  it("reports unconfigured when no EXPLABS_API_KEY or OPENAI_API_KEY is present", () => {
    const prevExplabs = process.env.EXPLABS_API_KEY;
    const prevOpenai = process.env.OPENAI_API_KEY;
    delete process.env.EXPLABS_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const provider = new OpenAIProvider();
    expect(provider.isConfigured()).toBe(false);

    if (prevExplabs) process.env.EXPLABS_API_KEY = prevExplabs;
    if (prevOpenai) process.env.OPENAI_API_KEY = prevOpenai;
  });

  it("reports configured when EXPLABS_API_KEY is set", () => {
    const prevExplabs = process.env.EXPLABS_API_KEY;
    process.env.EXPLABS_API_KEY = "xpl_test_key";

    const provider = new OpenAIProvider();
    expect(provider.isConfigured()).toBe(true);
    expect(provider.id).toBe("openai");

    if (prevExplabs) process.env.EXPLABS_API_KEY = prevExplabs;
    else delete process.env.EXPLABS_API_KEY;
  });

  it("createOpenAIClient configures baseURL and apiKey properly", () => {
    const client = createOpenAIClient({
      apiKey: "xpl_test_123",
      baseURL: "https://api.experientiallabs.ai/v1",
    });
    expect(client.baseURL).toBe("https://api.experientiallabs.ai/v1");
    expect(client.apiKey).toBe("xpl_test_123");
  });

  it("registry retrieves OpenAIProvider for providerId 'openai' and 'gpt-5.6-luna'", () => {
    const p1 = getProvider("openai");
    expect(p1.id).toBe("openai");
    expect(p1.modelId).toBe("gpt-5.6-luna");

    const p2 = getProvider("gpt-5.6-luna");
    expect(p2.id).toBe("openai");
    expect(p2.modelId).toBe("gpt-5.6-luna");
  });

  it("getAllSupportedProviders reflects OpenAI configuration status", () => {
    const providers = getAllSupportedProviders();
    const openaiEntry = providers.find((p) => p.id === "openai");
    expect(openaiEntry).toBeDefined();
  });

  it("strictly enforces AI Safety Gate when AI_LIVE_ENABLED is not enabled", async () => {
    const prevLive = process.env.AI_LIVE_ENABLED;
    const prevKey = process.env.EXPLABS_API_KEY;
    process.env.AI_LIVE_ENABLED = "false";
    process.env.EXPLABS_API_KEY = "xpl_test_mock_key";

    const provider = new OpenAIProvider();
    await expect(provider.generateResponse("Test prompt")).rejects.toThrow(
      /AI Safety Gate Blocked/
    );

    if (prevLive !== undefined) process.env.AI_LIVE_ENABLED = prevLive;
    else delete process.env.AI_LIVE_ENABLED;
    if (prevKey !== undefined) process.env.EXPLABS_API_KEY = prevKey;
    else delete process.env.EXPLABS_API_KEY;
  });
});

