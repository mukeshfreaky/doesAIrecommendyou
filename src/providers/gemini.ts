import { GoogleGenAI } from "@google/genai";
import { Citation, ProviderMetadata } from "@/types";
import { AIProvider, AIResponse, ProviderOptions, RawGroundingMetadata } from "./types";
import { checkAndIncrementLiveCall } from "./safetyGate";

export class GeminiProvider implements AIProvider {
  readonly id = "google_gemini";
  readonly name = "Google Gemini";
  readonly modelId: string;
  private client: GoogleGenAI | null = null;

  constructor(modelId?: string) {
    this.modelId = modelId || process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generateResponse(
    prompt: string,
    systemInstruction?: string,
    options?: ProviderOptions
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error(
        "Gemini API key is not configured. Set GEMINI_API_KEY in your server environment (.env.local)."
      );
    }

    // Safety Gate: Protect development budget and strictly enforce AI_LIVE_ENABLED / limits
    const safety = checkAndIncrementLiveCall(this.id);
    if (!safety.allowed) {
      throw new Error(`[AI Safety Gate Blocked]: ${safety.reason}`);
    }

    const startTime = Date.now();
    const enableSearch = options?.enableSearchGrounding ?? true;

    // Configure tools and options for @google/genai SDK
    const config: Record<string, unknown> = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (options?.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    if (options?.maxOutputTokens !== undefined) {
      config.maxOutputTokens = options.maxOutputTokens;
    }
    if (options?.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }
    if (options?.thinkingBudget !== undefined || options?.thinkingLevel !== undefined) {
      const thinkingConfig: Record<string, unknown> = {};
      if (options.thinkingBudget !== undefined) {
        thinkingConfig.thinkingBudget = options.thinkingBudget;
      }
      if (options.thinkingLevel !== undefined) {
        thinkingConfig.thinkingLevel = options.thinkingLevel;
      }
      config.thinkingConfig = thinkingConfig;
    }
    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    let response: any;
    try {
      response = await this.client.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("Quota exceeded") ||
        errorMsg.includes("quota")
      ) {
        throw new Error(`Google Gemini API quota/billing exhausted: ${errorMsg}`);
      }
      throw new Error(`Google Gemini API execution failed: ${errorMsg}`);
    }

    const latencyMs = Date.now() - startTime;
    const candidate = response.candidates?.[0];
    const content =
      candidate?.content?.parts?.map((p: any) => p.text || "").join("") ||
      response.text ||
      "";

    // Extract raw grounding metadata
    const rawGrounding = candidate?.groundingMetadata as RawGroundingMetadata | undefined;
    const searchQueries: string[] = rawGrounding?.webSearchQueries || [];
    const groundingChunks = rawGrounding?.groundingChunks || [];

    // Truthful grounding determination: REQUESTED != ACTUAL
    let searchGroundingStatus: "GROUNDED" | "UNGROUNDED" | "QUOTA_EXHAUSTED" | "ERROR";
    if (searchQueries.length > 0 || groundingChunks.length > 0) {
      searchGroundingStatus = "GROUNDED";
    } else {
      searchGroundingStatus = "UNGROUNDED";
    }

    // Extract citations from grounding chunks
    const citations: Citation[] = [];
    if (groundingChunks.length > 0) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri || chunk.web?.title) {
          const uri = chunk.web?.uri || "";
          const domain = extractDomainFromChunk(chunk);
          const title = chunk.web?.title || domain;
          citations.push({
            url: uri,
            domain,
            title,
            category: categorizeDomain(domain),
            supportsBrand: false, // will be evaluated during analysis
            frequency: 1,
          });
        }
      }
    }

    // Token usage
    const usage = response.usageMetadata;
    const promptTokens = usage?.promptTokenCount || 0;
    const completionTokens = usage?.candidatesTokenCount || 0;
    const totalTokens = usage?.totalTokenCount || promptTokens + completionTokens;

    // Cost estimation based on docs/cost-model.md
    // $0.15 / 1M prompt tokens, $0.60 / 1M completion tokens, $0.035 per search query
    const tokenCost =
      (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.60;
    const searchCost = searchQueries.length * 0.035;
    const estimatedCostUSD = Number((tokenCost + searchCost).toFixed(6));

    const metadata: ProviderMetadata = {
      providerId: this.id,
      modelId: this.modelId,
      searchGroundingEnabled: enableSearch,
      searchGroundingStatus,
      groundingError: undefined,
      searchQueriesExecuted: searchQueries.length,
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      estimatedCostUSD,
      latencyMs,
    };

    return {
      content,
      citations,
      groundingQueries: searchQueries,
      rawGroundingMetadata: rawGrounding,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      estimatedCostUSD,
      metadata,
    };
  }
}

function extractDomainFromChunk(chunk: { web?: { uri?: string; title?: string } }): string {
  const title = chunk.web?.title?.trim() || "";
  // Check if title is already a clean domain (e.g. "mailtrap.io", "ventureharbour.com")
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(title)) {
    return title.toLowerCase().replace(/^www\./, "");
  }
  // Check if title contains a domain pattern
  const match = title.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
  if (match) {
    return match[1].toLowerCase().replace(/^www\./, "");
  }
  // If URI is not an internal redirect, parse its hostname
  if (chunk.web?.uri) {
    try {
      const parsed = new URL(chunk.web.uri);
      if (!parsed.hostname.includes("vertexaisearch.cloud.google.com")) {
        return parsed.hostname.toLowerCase().replace(/^www\./, "");
      }
    } catch {}
  }
  return title || "web-source";
}

function categorizeDomain(domain: string): Citation["category"] {
  const d = domain.toLowerCase();
  if (
    d.includes("g2.com") ||
    d.includes("capterra.com") ||
    d.includes("trustradius.com") ||
    d.includes("getapp.com") ||
    d.includes("softwareadvice.com")
  ) {
    return "REVIEW_SITE";
  }
  if (
    d.includes("reddit.com") ||
    d.includes("quora.com") ||
    d.includes("stackoverflow.com") ||
    d.includes("ycombinator.com")
  ) {
    return "COMMUNITY_FORUM";
  }
  if (
    d.includes("techcrunch.com") ||
    d.includes("forbes.com") ||
    d.includes("theverge.com") ||
    d.includes("wired.com") ||
    d.includes("bloomberg.com")
  ) {
    return "NEWS";
  }
  if (
    d.includes("github.com") ||
    d.includes("docs.") ||
    d.includes("documentation")
  ) {
    return "DOCUMENTATION";
  }
  if (
    d.includes("slant.co") ||
    d.includes("alternativeto.net") ||
    d.includes("producthunt.com")
  ) {
    return "DIRECTORY";
  }
  if (
    d.includes("medium.com") ||
    d.includes("substack.com") ||
    d.includes("blog.")
  ) {
    return "EDITORIAL_COMPARISON";
  }
  return "OTHER";
}
