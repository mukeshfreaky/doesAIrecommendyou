import OpenAI from "openai";
import { Citation, ProviderMetadata } from "@/types";
import { AIProvider, AIResponse, ProviderOptions } from "./types";
import { checkAndIncrementLiveCall } from "./safetyGate";

/**
 * Creates an OpenAI client configured to route through the Experiential gateway
 * for models like "gpt-5.6-luna".
 */
export function createOpenAIClient(options?: { apiKey?: string; baseURL?: string }): OpenAI {
  const apiKey =
    options?.apiKey ||
    process.env.EXPLABS_API_KEY ||
    process.env.OPENAI_API_KEY;

  const baseURL =
    options?.baseURL ||
    process.env.EXPLABS_BASE_URL ||
    "https://api.experientiallabs.ai/v1";

  return new OpenAI({
    apiKey: apiKey || "",
    baseURL,
  });
}

/**
 * OpenAI Provider implementation routing LLM calls through Experiential gateway.
 * Compatible with OpenAI Chat Completions API with model "gpt-5.6-luna".
 */
export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly name = "OpenAI (gpt-5.6-luna via Experiential Gateway)";
  readonly modelId: string;
  readonly baseURL: string;
  private client: OpenAI | null = null;

  constructor(modelId?: string) {
    this.modelId = modelId || process.env.OPENAI_MODEL || "gpt-5.6-luna";
    this.baseURL = process.env.EXPLABS_BASE_URL || "https://api.experientiallabs.ai/v1";

    const apiKey = process.env.EXPLABS_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.client = createOpenAIClient({
        apiKey,
        baseURL: this.baseURL,
      });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getClient(): OpenAI | null {
    return this.client;
  }

  async generateResponse(
    prompt: string,
    systemInstruction?: string,
    options?: ProviderOptions
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error(
        "OpenAI / Experiential API key is not configured. Set EXPLABS_API_KEY in your server environment (.env.local)."
      );
    }

    // Safety Gate: Protect development budget and strictly enforce AI_LIVE_ENABLED / limits
    const safety = checkAndIncrementLiveCall(this.id);
    if (!safety.allowed) {
      throw new Error(`[AI Safety Gate Blocked]: ${safety.reason}`);
    }

    const startTime = Date.now();
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemInstruction) {
      messages.push({
        role: "system",
        content: systemInstruction,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const completionParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.modelId,
      messages,
    };

    if (options?.temperature !== undefined) {
      completionParams.temperature = options.temperature;
    }
    if (options?.maxOutputTokens !== undefined) {
      completionParams.max_tokens = options.maxOutputTokens;
    }

    let response: OpenAI.Chat.ChatCompletion;
    try {
      response = await this.client.chat.completions.create(completionParams);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenAI API (Experiential gateway) execution failed: ${errorMsg}`);
    }

    const latencyMs = Date.now() - startTime;
    const choice = response.choices?.[0];
    const content = choice?.message?.content || "";

    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || promptTokens + completionTokens;

    // Cost estimation for gpt-5.6-luna ($0.25/1M input, $1.00/1M output baseline)
    const estimatedCostUSD = Number(
      ((promptTokens / 1_000_000) * 0.25 + (completionTokens / 1_000_000) * 1.0).toFixed(6)
    );

    const metadata: ProviderMetadata = {
      providerId: this.id,
      modelId: this.modelId,
      searchGroundingEnabled: false,
      searchGroundingStatus: "UNGROUNDED",
      searchQueriesExecuted: 0,
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      estimatedCostUSD,
      latencyMs,
    };

    return {
      content,
      citations: [] as Citation[],
      groundingQueries: [],
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

