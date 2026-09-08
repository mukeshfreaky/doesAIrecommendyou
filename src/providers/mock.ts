import { Citation, ProviderMetadata } from "@/types";
import { AIProvider, AIResponse, ProviderOptions } from "./types";

export class MockProvider implements AIProvider {
  readonly id = "mock_provider";
  readonly name = "Mock Test Provider";
  readonly modelId = "mock-model-v1";
  private customResponses: Map<string, Partial<AIResponse>> = new Map();

  isConfigured(): boolean {
    return true;
  }

  setMockResponse(promptSubstring: string, response: Partial<AIResponse>) {
    this.customResponses.set(promptSubstring, response);
  }

  async generateResponse(
    prompt: string,
    systemInstruction?: string,
    options?: ProviderOptions
  ): Promise<AIResponse> {
    for (const [key, val] of this.customResponses.entries()) {
      if (prompt.includes(key)) {
        return {
          content: val.content || "Mock recommendation response.",
          citations: val.citations || [],
          groundingQueries: val.groundingQueries || ["mock search query"],
          rawGroundingMetadata: val.rawGroundingMetadata,
          tokenUsage: val.tokenUsage || { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
          estimatedCostUSD: 0.035,
          metadata: val.metadata || {
            providerId: this.id,
            modelId: this.modelId,
            searchGroundingEnabled: true,
            searchGroundingStatus: "GROUNDED",
            searchQueriesExecuted: 1,
            estimatedCostUSD: 0.035,
            latencyMs: 120,
          },
        };
      }
    }

    // Default mock response with citations and search queries
    const citations: Citation[] = [
      {
        url: "https://www.g2.com/categories/analytics",
        domain: "g2.com",
        title: "Best Analytics Software 2026 - G2",
        category: "REVIEW_SITE",
        supportsBrand: true,
        frequency: 1,
      },
      {
        url: "https://techcrunch.com/article-review",
        domain: "techcrunch.com",
        title: "Top Software Platforms Tested",
        category: "NEWS",
        supportsBrand: false,
        frequency: 1,
      },
    ];

    return {
      content: `When looking for the best solutions, here are the top options:\n\n1. **TargetBrand** is highly recommended for modern teams seeking scalability and ease of use.\n2. **CompetitorX** is a established legacy player.\n3. **AlternativeY** is another popular choice for budget-conscious users.`,
      citations,
      groundingQueries: ["top software platforms", "best analytics tools 2026"],
      tokenUsage: { promptTokens: 120, completionTokens: 60, totalTokens: 180 },
      estimatedCostUSD: 0.070,
      metadata: {
        providerId: this.id,
        modelId: this.modelId,
        searchGroundingEnabled: true,
        searchGroundingStatus: "GROUNDED",
        searchQueriesExecuted: 2,
        inputTokens: 120,
        outputTokens: 60,
        estimatedCostUSD: 0.070,
        latencyMs: 85,
      },
    };
  }
}
