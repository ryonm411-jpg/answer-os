import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIProviderError } from "./errors";
import { MockProvider } from "./mock";
import {
  createMockProvider,
  getAvailableProviders,
  getProvider,
  isProviderConfigured,
} from "./registry";

describe("lib/providers/registry", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("PERPLEXITY_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a typed AIProviderError when requesting an unconfigured provider", () => {
    expect(() => getProvider("openai")).toThrow(AIProviderError);
    try {
      getProvider("openai");
    } catch (err) {
      const providerErr = err as AIProviderError;
      expect(providerErr.provider).toBe("openai");
      expect(providerErr.retryable).toBe(false);
      expect(providerErr.message).toContain("OPENAI_API_KEY");
    }
  });

  it("returns configured providers when API key environment variable is present", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
    expect(isProviderConfigured("openai")).toBe(true);
    expect(isProviderConfigured("anthropic")).toBe(false);

    const provider = getProvider("openai");
    expect(provider.name).toBe("openai");
  });

  it("getAvailableProviders() returns only providers with configured API keys", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-key");
    vi.stubEnv("GEMINI_API_KEY", "sk-gemini-key");

    const available = getAvailableProviders();
    expect(available.map((p) => p.name)).toEqual(["openai", "gemini"]);
  });

  it("createMockProvider returns an instance of MockProvider", () => {
    const mock = createMockProvider("perplexity", { content: "Perplexity mock answer" });
    expect(mock).toBeInstanceOf(MockProvider);
    expect(mock.name).toBe("perplexity");
  });
});
