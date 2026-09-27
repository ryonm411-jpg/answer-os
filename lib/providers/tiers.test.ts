import { describe, expect, it } from "vitest";
import {
  ALL_PROVIDERS,
  capFreeProviders,
  DEFAULT_FREE_PROVIDERS,
  FREE_PROVIDERS,
  FREE_TIER_MAX_ENABLED,
  PREMIUM_PROVIDERS,
  resolveAllowedProviders,
  resolveDefaultProviders,
  resolveEffectiveProviders,
} from "./tiers";
import type { AIProviderName } from "./types";

describe("lib/providers/tiers", () => {
  it("exports correct provider lists for free-tier providers", () => {
    expect(FREE_PROVIDERS).toEqual(["gemini", "groq", "nvidia"]);
    expect(DEFAULT_FREE_PROVIDERS).toEqual(["gemini"]);
    expect(PREMIUM_PROVIDERS).toEqual(["openai", "anthropic", "perplexity"]);
    expect(ALL_PROVIDERS).toEqual([
      "gemini",
      "groq",
      "nvidia",
      "openai",
      "anthropic",
      "perplexity",
    ]);
  });

  describe("resolveAllowedProviders", () => {
    it("returns free providers only when unpaid (entitled: false)", () => {
      const allConfigured: AIProviderName[] = [
        "openai",
        "gemini",
        "groq",
        "nvidia",
        "anthropic",
        "perplexity",
      ];
      const allowed = resolveAllowedProviders({
        entitled: false,
        configured: allConfigured,
      });
      expect(allowed).toEqual(["gemini", "groq", "nvidia"]);
    });

    it("returns only configured free providers when unpaid", () => {
      const allowed = resolveAllowedProviders({
        entitled: false,
        configured: ["gemini", "groq"],
      });
      expect(allowed).toEqual(["gemini", "groq"]);
    });

    it("returns all configured providers when paid (entitled: true)", () => {
      const allConfigured: AIProviderName[] = [
        "openai",
        "gemini",
        "groq",
        "nvidia",
        "anthropic",
        "perplexity",
      ];
      const allowed = resolveAllowedProviders({
        entitled: true,
        configured: allConfigured,
      });
      expect(allowed).toEqual([
        "gemini",
        "groq",
        "nvidia",
        "openai",
        "anthropic",
        "perplexity",
      ]);
    });
  });

  describe("resolveDefaultProviders", () => {
    const allConfigured: AIProviderName[] = [
      "openai",
      "gemini",
      "groq",
      "nvidia",
      "anthropic",
      "perplexity",
    ];

    it("returns Gemini only for unpaid users when configured", () => {
      const defaults = resolveDefaultProviders({
        entitled: false,
        configured: allConfigured,
      });
      expect(defaults).toEqual(["gemini"]);
    });

    it("falls back to another free provider if Gemini is not configured", () => {
      const defaults = resolveDefaultProviders({
        entitled: false,
        configured: ["groq", "nvidia"],
      });
      expect(defaults).toEqual(["groq"]);
    });

    it("returns all configured providers for paid users", () => {
      const defaults = resolveDefaultProviders({
        entitled: true,
        configured: allConfigured,
      });
      expect(defaults).toEqual([
        "gemini",
        "groq",
        "nvidia",
        "openai",
        "anthropic",
        "perplexity",
      ]);
    });
  });

  describe("resolveEffectiveProviders", () => {
    const allConfigured: AIProviderName[] = [
      "openai",
      "gemini",
      "groq",
      "nvidia",
      "anthropic",
      "perplexity",
    ];

    it("returns Gemini only when unpaid and no preference row exists (enabled: null)", () => {
      const effective = resolveEffectiveProviders({
        entitled: false,
        configured: allConfigured,
        enabled: null,
      });
      expect(effective).toEqual(["gemini"]);
    });

    it("returns all configured providers when paid and no preference row exists", () => {
      const effective = resolveEffectiveProviders({
        entitled: true,
        configured: allConfigured,
        enabled: null,
      });
      expect(effective).toEqual([
        "gemini",
        "groq",
        "nvidia",
        "openai",
        "anthropic",
        "perplexity",
      ]);
    });

    it("narrows the tier-allowed set to the stored selection and caps free users to one provider", () => {
      const effective = resolveEffectiveProviders({
        entitled: false,
        configured: allConfigured,
        enabled: ["gemini", "groq"],
      });
      // Free-tier cap: only the first stored free provider is kept.
      expect(effective).toEqual(["gemini"]);
    });

    it("excludes premium providers while unpaid even when stored", () => {
      const effective = resolveEffectiveProviders({
        entitled: false,
        configured: allConfigured,
        enabled: ["gemini", "anthropic", "perplexity"],
      });
      expect(effective).toEqual(["gemini"]);
    });

    it("excludes unconfigured providers", () => {
      const effective = resolveEffectiveProviders({
        entitled: true,
        configured: ["gemini", "anthropic"],
        enabled: ["gemini", "groq", "anthropic"],
      });
      expect(effective).toEqual(["gemini", "anthropic"]);
    });

    it("does not auto-add premium providers to a stored row on an entitled flip", () => {
      const effective = resolveEffectiveProviders({
        entitled: true,
        configured: allConfigured,
        enabled: ["gemini", "groq"],
      });
      expect(effective).toEqual(["gemini", "groq"]);
    });

    it("returns an empty array when the stored selection is empty", () => {
      const effective = resolveEffectiveProviders({
        entitled: false,
        configured: allConfigured,
        enabled: [],
      });
      expect(effective).toEqual([]);
    });

    it("caps free-tier users to FREE_TIER_MAX_ENABLED free provider when multiple free ones stored", () => {
      const effective = resolveEffectiveProviders({
        entitled: false,
        configured: allConfigured,
        enabled: ["gemini", "groq", "nvidia"],
      });
      // Only the first FREE_TIER_MAX_ENABLED provider is kept.
      expect(effective).toHaveLength(FREE_TIER_MAX_ENABLED);
      expect(effective[0]).toBe("gemini");
    });

    it("does not cap paid users when multiple free providers are stored", () => {
      const effective = resolveEffectiveProviders({
        entitled: true,
        configured: allConfigured,
        enabled: ["gemini", "groq", "nvidia"],
      });
      expect(effective).toEqual(["gemini", "groq", "nvidia"]);
    });
  });

  describe("FREE_TIER_MAX_ENABLED", () => {
    it("is 1", () => {
      expect(FREE_TIER_MAX_ENABLED).toBe(1);
    });
  });

  describe("capFreeProviders", () => {
    it("returns the list unchanged for entitled users", () => {
      const result = capFreeProviders(["gemini", "groq", "nvidia"], true);
      expect(result).toEqual(["gemini", "groq", "nvidia"]);
    });

    it("strips all but the first free provider for free-tier users", () => {
      const result = capFreeProviders(["gemini", "groq", "nvidia"], false);
      expect(result).toEqual(["gemini"]);
    });

    it("strips premium providers entirely for free-tier users", () => {
      const result = capFreeProviders(["openai", "gemini", "groq"], false);
      // Premium provider is removed; only first free provider kept.
      expect(result).toEqual(["gemini"]);
    });

    it("returns empty array when no free providers in input for free-tier user", () => {
      const result = capFreeProviders(["openai", "anthropic"], false);
      expect(result).toEqual([]);
    });

    it("returns a single free provider unchanged for free-tier user", () => {
      const result = capFreeProviders(["groq"], false);
      expect(result).toEqual(["groq"]);
    });
  });
});
