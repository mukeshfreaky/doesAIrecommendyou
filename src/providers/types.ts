import { Citation, ProviderMetadata } from "@/types";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderOptions {
  temperature?: number;
  enableSearchGrounding?: boolean;
  maxOutputTokens?: number;
  responseMimeType?: string;
  thinkingBudget?: number;
  thinkingLevel?: "THINKING_LEVEL_UNSPECIFIED" | "MINIMAL" | "LOW" | "MEDIUM" | "HIGH";
}

export interface RawGroundingChunk {
  uri?: string;
  title?: string;
}

export interface RawGroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: Array<{ web?: RawGroundingChunk }>;
  groundingSupports?: Array<{
    groundingChunkIndices?: number[];
    segment?: { text?: string };
  }>;
}

export interface AIResponse {
  content: string;
  citations: Citation[];
  groundingQueries: string[];
  rawGroundingMetadata?: RawGroundingMetadata;
  tokenUsage?: TokenUsage;
  estimatedCostUSD: number;
  metadata: ProviderMetadata;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly modelId: string;
  isConfigured(): boolean;
  generateResponse(
    prompt: string,
    systemInstruction?: string,
    options?: ProviderOptions
  ): Promise<AIResponse>;
}
