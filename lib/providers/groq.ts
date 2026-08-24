import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  groqApiKey,
  resolveModel,
} from "./config";
import { toProviderError } from "./errors";
import type { AIProvider, AIProviderConfig, AIResponse } from "./types";

export function isConfigured(): boolean {
  return Boolean(groqApiKey());
}

export class GroqProvider implements AIProvider {
  readonly name = "groq" as const;

  async ask(
    prompt: string,
    config: Partial<AIProviderConfig> = {}
  ): Promise<AIResponse> {
    const startedAt = performance.now();
    try {
      const sdk = createOpenAICompatible({
        name: "groq",
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: groqApiKey(),
      });

      const modelId = resolveModel("groq", config.model);
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
      throw toProviderError("groq", err);
    }
  }
}
