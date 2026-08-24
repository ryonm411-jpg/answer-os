import type { AIProviderName } from "./types";

export const FREE_PROVIDERS: AIProviderName[] = [
  "openai",
  "gemini",
  "groq",
  "nvidia",
  "openrouter",
];

export const PREMIUM_PROVIDERS: AIProviderName[] = [
  "anthropic",
  "perplexity",
];

export const ALL_PROVIDERS: AIProviderName[] = [
  ...FREE_PROVIDERS,
  ...PREMIUM_PROVIDERS,
];

/** Server-side only: which provider names may this entitlement level use? */
export function resolveAllowedProviders(input: {
  entitled: boolean;
  configured: AIProviderName[];
}): AIProviderName[] {
  const tier = input.entitled ? ALL_PROVIDERS : FREE_PROVIDERS;
  return tier.filter((name) => input.configured.includes(name));
}
