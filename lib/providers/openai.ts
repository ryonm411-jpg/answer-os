import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  openaiApiKey,
  resolveModel,
} from "./config";
import { toProviderError } from "./errors";
import type { AIProvider, AIProviderConfig, AIResponse } from "./types";

export function isConfigured(): boolean {
  return Boolean(openaiApiKey());
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;

  async ask(
    prompt: string,
    config: Partial<AIProviderConfig> = {}
  ): Promise<AIResponse> {
    const startedAt = performance.now();
    try {
      const sdk = createOpenAI({ apiKey: openaiApiKey() });
      const modelId = resolveModel("openai", config.model);
      const result = await generateText({
        model: sdk(modelId),
        prompt,
        maxOutputTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: config.temperature ?? DEFAULT_TEMPERATURE,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });

      return {
        content: result.text,
        model: result.response.modelId ?? modelId,
        tokensUsed: result.usage.totalTokens ?? 0,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (err) {
      throw toProviderError("openai", err);
    }
  }
}
