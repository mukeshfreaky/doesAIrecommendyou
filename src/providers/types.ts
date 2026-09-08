import { Citation } from "@/types";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderOptions {
  temperature?: number;
  enableSearchGrounding?: boolean;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  citations: Citation[];
  groundingQueries: string[];
  tokenUsage?: TokenUsage;
  estimatedCostUSD: number;
  providerId: string;
  modelId: string;
  timestamp: string;
}

export interface AIProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  generateResponse(
    prompt: string,
    options?: ProviderOptions
  ): Promise<AIResponse>;
}
