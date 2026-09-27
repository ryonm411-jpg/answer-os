import type { AIProviderName } from "./types";

/**
 * Free-tier users may enable at most this many free providers simultaneously.
 * Premium (paid) users have no such cap.
 */
export const FREE_TIER_MAX_ENABLED = 1;

export const FREE_PROVIDERS: AIProviderName[] = [
  "gemini",
  "groq",
  "nvidia",
];

export const PREMIUM_PROVIDERS: AIProviderName[] = [
  "openai",
  "anthropic",
  "perplexity",
];

export const ALL_PROVIDERS: AIProviderName[] = [
  ...FREE_PROVIDERS,
  ...PREMIUM_PROVIDERS,
];

export const DEFAULT_FREE_PROVIDERS: AIProviderName[] = ["gemini"];

/** Server-side only: which provider names may this entitlement level use? */
export function resolveAllowedProviders(input: {
  entitled: boolean;
  configured: AIProviderName[];
}): AIProviderName[] {
  const tier = input.entitled ? ALL_PROVIDERS : FREE_PROVIDERS;
  return tier.filter((name) => input.configured.includes(name));
}

/**
 * Returns the default enabled providers when no custom preferences are stored.
 * - Free tier: Gemini only (or first configured free provider fallback).
 * - Paid tier: All configured providers.
 */
export function resolveDefaultProviders(input: {
  entitled: boolean;
  configured: AIProviderName[];
}): AIProviderName[] {
  if (input.entitled) {
    return resolveAllowedProviders(input);
  }
  const defaultFreeConfigured = DEFAULT_FREE_PROVIDERS.filter((name) =>
    input.configured.includes(name)
  );
  if (defaultFreeConfigured.length > 0) {
    return defaultFreeConfigured;
  }
  const freeConfigured = FREE_PROVIDERS.filter((name) =>
    input.configured.includes(name)
  );
  return freeConfigured.slice(0, FREE_TIER_MAX_ENABLED);
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
  if (input.enabled === null) {
    return resolveDefaultProviders({
      entitled: input.entitled,
      configured: input.configured,
    });
  }
  const tierAllowed = resolveAllowedProviders({
    entitled: input.entitled,
    configured: input.configured,
  });
  const effective = tierAllowed.filter((name) => input.enabled!.includes(name));
  // Free-tier: cap to at most FREE_TIER_MAX_ENABLED free providers.
  if (!input.entitled) return effective.slice(0, FREE_TIER_MAX_ENABLED);
  return effective;
}

/**
 * Enforces the free-tier single-provider cap on a candidate enabled list.
 * Returns the list unchanged for paid users. For free users, keeps only the
 * first `FREE_TIER_MAX_ENABLED` entries that are free providers.
 * Premium providers are stripped (tier enforcement is done separately in
 * `resolveAllowedProviders`).
 */
export function capFreeProviders(
  enabled: AIProviderName[],
  entitled: boolean
): AIProviderName[] {
  if (entitled) return enabled;
  const freeOnly = enabled.filter((name) =>
    FREE_PROVIDERS.includes(name)
  );
  return freeOnly.slice(0, FREE_TIER_MAX_ENABLED);
}
