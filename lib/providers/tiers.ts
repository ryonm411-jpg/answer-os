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

/**
 * Server-side only: the provider set that may actually run.
 * `enabled === null` means "no preference stored" → plan default.
 * Otherwise the user's selection is intersected with the tier- and config-allowed set.
 */
export function resolveEffectiveProviders(input: {
  entitled: boolean;
  configured: AIProviderName[];
  enabled: AIProviderName[] | null;
}): AIProviderName[] {
  const tierAllowed = resolveAllowedProviders({
    entitled: input.entitled,
    configured: input.configured,
  });
  const enabled = input.enabled;
  if (enabled === null) return tierAllowed;
  return tierAllowed.filter((name) => enabled.includes(name));
}
