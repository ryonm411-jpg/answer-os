import { describe, expect, it } from "vitest";
import {
  ALL_PROVIDERS,
  FREE_PROVIDERS,
  PREMIUM_PROVIDERS,
  resolveAllowedProviders,
  resolveEffectiveProviders,
} from "./tiers";
import type { AIProviderName } from "./types";

describe("lib/providers/tiers", () => {
  it("exports correct provider lists for free-tier providers", () => {
    expect(FREE_PROVIDERS).toEqual([
      "openai",
      "gemini",
      "groq",
      "nvidia",
      "openrouter",
    ]);
    expect(PREMIUM_PROVIDERS).toEqual(["anthropic", "perplexity"]);
    expect(ALL_PROVIDERS).toEqual([
      "openai",
      "gemini",
      "groq",
      "nvidia",
      "openrouter",
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
        "openrouter",
        "anthropic",
        "perplexity",
      ];
      const allowed = resolveAllowedProviders({
        entitled: false,
        configured: allConfigured,
      });
      expect(allowed).toEqual([
        "openai",
        "gemini",
        "groq",
        "nvidia",
        "openrouter",
      ]);
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
        "openrouter",
        "anthropic",
        "perplexity",
      ];
      const allowed = resolveAllowedProviders({
        entitled: true,
        configured: allConfigured,
      });
      expect(allowed).toEqual([
        "openai",
        "gemini",
        "groq",
        "nvidia",
        "openrouter",
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
      "openrouter",
      "anthropic",
      "perplexity",
    ];

    it("returns the tier default when no preference row exists (enabled: null)", () => {
      const effective = resolveEffectiveProviders({
        entitled: false,
        configured: allConfigured,
        enabled: null,
      });
      expect(effective).toEqual(FREE_PROVIDERS);
    });

    it("returns all configured providers when paid and no preference row exists", () => {
      const effective = resolveEffectiveProviders({
        entitled: true,
        configured: allConfigured,
        enabled: null,
      });
      expect(effective).toEqual(allConfigured);
    });

    it("narrows the tier-allowed set to the stored selection", () => {
      const effective = resolveEffectiveProviders({
        entitled: false,
        configured: allConfigured,
        enabled: ["gemini", "groq"],
      });
      expect(effective).toEqual(["gemini", "groq"]);
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
  });
});
