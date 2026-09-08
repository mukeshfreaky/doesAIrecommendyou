import { GoogleGenAI } from "@google/genai";
import { Citation, ProviderMetadata } from "@/types";
import { AIProvider, AIResponse, ProviderOptions, RawGroundingMetadata } from "./types";

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

    const startTime = Date.now();
    const enableSearch = options?.enableSearchGrounding ?? true;

    try {
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
      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await this.client.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config,
      });

      const latencyMs = Date.now() - startTime;
      const candidate = response.candidates?.[0];
      const content = candidate?.content?.parts?.map((p) => p.text || "").join("") || response.text || "";

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
      // Gemini 2.5 Flash / 3.8 Flash rates:
      // $0.15 / 1M prompt tokens, $0.60 / 1M completion tokens, $0.035 per search query
      const tokenCost =
        (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.60;
      const searchCost = searchQueries.length * 0.035;
      const estimatedCostUSD = Number((tokenCost + searchCost).toFixed(6));

      const metadata: ProviderMetadata = {
        providerId: this.id,
        modelId: this.modelId,
        searchGroundingEnabled: enableSearch,
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Google Gemini API execution failed: ${errorMsg}`);
    }
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
