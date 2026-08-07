import type { AIProviderName } from "./types";

export const DEFAULT_MODELS: Record<AIProviderName, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-latest",
  gemini: "gemini-2.5-flash",
  perplexity: "sonar",
};

export const DEFAULT_MAX_TOKENS = 2048;
export const DEFAULT_TEMPERATURE = 0.2;
export const DEFAULT_TIMEOUT_MS = 30_000;

export function resolveModel(
  name: AIProviderName,
  overrideModel?: string
): string {
  if (overrideModel && overrideModel.trim().length > 0) {
    return overrideModel;
  }

  const envKeyMap: Record<AIProviderName, string | undefined> = {
    openai: process.env.OPENAI_MODEL,
    anthropic: process.env.ANTHROPIC_MODEL,
    gemini: process.env.GEMINI_MODEL,
    perplexity: process.env.PERPLEXITY_MODEL,
  };

  const envModel = envKeyMap[name];
  if (envModel && envModel.trim().length > 0) {
    return envModel;
  }

  return DEFAULT_MODELS[name];
}
