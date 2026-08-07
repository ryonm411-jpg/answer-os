import type { AIProviderError } from "./errors";

export type AIProviderName = "openai" | "anthropic" | "gemini" | "perplexity";

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIProvider {
  readonly name: AIProviderName;
  ask(prompt: string, config?: Partial<AIProviderConfig>): Promise<AIResponse>;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface MockOverrides {
  content?: string;
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  error?: AIProviderError;
}

export const TO_PRISMA_PROVIDER: Record<AIProviderName, string> = {
  openai: "OPENAI",
  anthropic: "ANTHROPIC",
  gemini: "GEMINI",
  perplexity: "PERPLEXITY",
};
