import { describe, it, expect } from "vitest";
import {
  getProviderProfile,
  isCanonicalProvider,
  isAuxiliaryProvider,
  CANONICAL_PROVIDERS,
  AUXILIARY_PROVIDERS,
} from "./profiles";
import { AIProviderError, toProviderError } from "./errors";

describe("lib/providers/profiles", () => {
  it("defines exact canonical and auxiliary provider lists", () => {
    expect(CANONICAL_PROVIDERS).toEqual(["openai", "anthropic", "gemini", "perplexity"]);
    expect(AUXILIARY_PROVIDERS).toEqual(["groq", "nvidia"]);
  });

  it("identifies canonical vs auxiliary providers correctly", () => {
    expect(isCanonicalProvider("openai")).toBe(true);
    expect(isCanonicalProvider("anthropic")).toBe(true);
    expect(isCanonicalProvider("gemini")).toBe(true);
    expect(isCanonicalProvider("perplexity")).toBe(true);
    expect(isCanonicalProvider("groq")).toBe(false);

    expect(isAuxiliaryProvider("groq")).toBe(true);
    expect(isAuxiliaryProvider("nvidia")).toBe(true);
    expect(isAuxiliaryProvider("openai")).toBe(false);
  });

  it("returns explicit capability profile for each provider", () => {
    const openai = getProviderProfile("openai");
    expect(openai.provider).toBe("openai");
    expect(openai.model).toBe("gpt-4o");
    expect(openai.tier).toBe("paid");
    expect(openai.canonicalForVisibilityScore).toBe(true);
    expect(openai.auxiliaryOnly).toBe(false);
    expect(openai.maxConcurrency).toBe(5);

    const groq = getProviderProfile("groq");
    expect(groq.provider).toBe("groq");
    expect(groq.tier).toBe("free");
    expect(groq.canonicalForVisibilityScore).toBe(false);
    expect(groq.auxiliaryOnly).toBe(true);
    expect(groq.tokensPerMinute).toBe(8000);

    const perplexity = getProviderProfile("perplexity");
    expect(perplexity.supportsCitations).toBe(true);
  });

  it("classifies retryable vs non-retryable errors correctly", () => {
    const rateLimitErr = toProviderError("gemini", new Error("Rate limit exceeded 429"));
    expect(rateLimitErr.retryable).toBe(true);

    const timeoutErr = toProviderError("nvidia", new Error("request timeout exceeded"));
    expect(timeoutErr.retryable).toBe(true);

    const payloadTooLargeErr = new AIProviderError("Request Entity Too Large", {
      provider: "groq",
      retryable: false,
      statusCode: 413,
    });
    expect(payloadTooLargeErr.retryable).toBe(false);

    const authErr = new AIProviderError("Invalid API key", {
      provider: "openai",
      retryable: false,
      statusCode: 401,
    });
    expect(authErr.retryable).toBe(false);
  });
});
