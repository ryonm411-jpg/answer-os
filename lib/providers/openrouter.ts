import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  openrouterApiKey,
  resolveModel,
} from "./config";
import { toProviderError } from "./errors";
import type { AIProvider, AIProviderConfig, AIResponse } from "./types";

export function isConfigured(): boolean {
  return Boolean(openrouterApiKey());
}

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter" as const;

  async ask(
    prompt: string,
    config: Partial<AIProviderConfig> = {}
  ): Promise<AIResponse> {
    const startedAt = performance.now();
    try {
      const sdk = createOpenAICompatible({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterApiKey(),
      });

      const modelId = resolveModel("openrouter", config.model);
      const result = await generateText({
        model: sdk(modelId),
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
      throw toProviderError("openrouter", err);
    }
  }
}
