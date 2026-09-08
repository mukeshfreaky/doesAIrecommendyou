import { GoogleGenAI } from "@google/genai";
import { Citation, ProviderMetadata } from "@/types";
import { AIProvider, AIResponse, ProviderOptions, RawGroundingMetadata } from "./types";

export class GeminiProvider implements AIProvider {
  readonly id = "google_gemini";
  readonly name = "Google Gemini";
  readonly modelId: string;
  private client: GoogleGenAI | null = null;

  constructor(modelId?: string) {
    this.modelId = modelId || process.env.GEMINI_MODEL || "gemini-3.8-flash";
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

    const startTime = Date.now();
    const enableSearch = options?.enableSearchGrounding ?? true;

    // Configure tools and instruction according to official @google/genai SDK
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

    let searchGroundingStatus: "GROUNDED" | "UNGROUNDED" | "QUOTA_EXHAUSTED" | "ERROR" =
      enableSearch ? "GROUNDED" : "UNGROUNDED";
    let groundingError: string | undefined;
    let actualSearchEnabled = enableSearch;

    let response: any;
    try {
      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      response = await callGenerateContentWithRetry(
        this.client,
        this.modelId,
        prompt,
        config
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // If search grounding was enabled and failed due to quota exhaustion / 429 / search tool restrictions
      if (
        enableSearch &&
        (errorMsg.includes("429") ||
          errorMsg.includes("RESOURCE_EXHAUSTED") ||
          errorMsg.includes("Quota exceeded") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("googleSearch"))
      ) {
        searchGroundingStatus = "QUOTA_EXHAUSTED";
        groundingError = errorMsg;
        actualSearchEnabled = false;
        // Retry ungrounded without googleSearch tool
        delete config.tools;
        try {
          response = await callGenerateContentWithRetry(
            this.client,
            this.modelId,
            prompt,
            config
          );
        } catch (retryErr: unknown) {
          const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
          throw new Error(`Google Gemini API execution failed (ungrounded retry): ${retryMsg}`);
        }
      } else {
        throw new Error(`Google Gemini API execution failed: ${errorMsg}`);
      }
    }

    const latencyMs = Date.now() - startTime;
    const candidate = response.candidates?.[0];
    const content = candidate?.content?.parts?.map((p: any) => p.text || "").join("") || response.text || "";

    // Extract raw grounding metadata
    const rawGrounding = candidate?.groundingMetadata as RawGroundingMetadata | undefined;
    const searchQueries: string[] = rawGrounding?.webSearchQueries || [];

    // Extract citations from grounding chunks
    const citations: Citation[] = [];
    if (rawGrounding?.groundingChunks) {
      for (const chunk of rawGrounding.groundingChunks) {
        if (chunk.web?.uri) {
          const uri = chunk.web.uri;
          const domain = extractDomainFromUrl(uri);
          citations.push({
            url: uri,
            domain,
            title: chunk.web.title || domain,
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
      searchGroundingEnabled: actualSearchEnabled,
      searchGroundingStatus,
      groundingError,
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

function extractDomainFromUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return urlStr;
  }
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

async function callGenerateContentWithRetry(
  client: GoogleGenAI,
  modelId: string,
  prompt: string,
  config: Record<string, unknown>,
  maxRetries = 2
): Promise<any> {
  let currentModel = modelId;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent({
        model: currentModel,
        contents: prompt,
        config,
      });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTemporary =
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("demand") ||
        msg.includes("overloaded");

      if (isTemporary && attempt < maxRetries) {
        if (currentModel === "gemini-3.8-flash") {
          currentModel = "gemini-3.6-flash";
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

