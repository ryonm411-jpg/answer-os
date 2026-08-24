import { describe, expect, it } from "vitest";
import {
  ALL_PROVIDERS,
  FREE_PROVIDERS,
  PREMIUM_PROVIDERS,
  resolveAllowedProviders,
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
});
