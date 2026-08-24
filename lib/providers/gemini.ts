import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  geminiApiKey,
  resolveModel,
} from "./config";
import { toProviderError } from "./errors";
import type { AIProvider, AIProviderConfig, AIResponse } from "./types";

export function isConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const;
  private readonly sdk = createGoogleGenerativeAI({ apiKey: geminiApiKey() });

  async ask(
    prompt: string,
    config: Partial<AIProviderConfig> = {}
  ): Promise<AIResponse> {
    const startedAt = performance.now();
    try {
      const modelId = resolveModel("gemini", config.model);
      const result = await generateText({
        model: this.sdk(modelId),
        prompt,
        maxOutputTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: config.temperature ?? DEFAULT_TEMPERATURE,
        abortSignal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });

      return {
        content: result.text,
        model: result.response.modelId ?? modelId,
        tokensUsed: result.usage.totalTokens ?? 0,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (err) {
      throw toProviderError("gemini", err);
    }
  }
}
