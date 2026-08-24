import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIProviderError } from "./errors";
import { GroqProvider } from "./groq";
import { MockProvider } from "./mock";
import { NvidiaProvider } from "./nvidia";
import { OpenRouterProvider } from "./openrouter";
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
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("NVIDIA_NIM_API_KEY", "");
    vi.stubEnv("OPEN_ROUTER_API_KEY", "");
    vi.stubEnv("USE_MOCK_PROVIDERS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a typed AIProviderError when requesting an unconfigured provider", () => {
    expect(() => getProvider("groq")).toThrow(AIProviderError);
    try {
      getProvider("groq");
    } catch (err) {
      const providerErr = err as AIProviderError;
      expect(providerErr.provider).toBe("groq");
      expect(providerErr.retryable).toBe(false);
      expect(providerErr.message).toContain("GROQ_API_KEY");
    }
  });

  it("returns configured free tier providers when API key environment variables are present", () => {
    vi.stubEnv("GEMINI_API_KEY", "sk-gemini");
    vi.stubEnv("GROQ_API_KEY", "sk-groq");
    vi.stubEnv("NVIDIA_NIM_API_KEY", "sk-nvidia");
    vi.stubEnv("OPEN_ROUTER_API_KEY", "sk-openrouter");

    expect(isProviderConfigured("gemini")).toBe(true);
    expect(isProviderConfigured("groq")).toBe(true);
    expect(isProviderConfigured("nvidia")).toBe(true);
    expect(isProviderConfigured("openrouter")).toBe(true);

    expect(getProvider("groq")).toBeInstanceOf(GroqProvider);
    expect(getProvider("nvidia")).toBeInstanceOf(NvidiaProvider);
    expect(getProvider("openrouter")).toBeInstanceOf(OpenRouterProvider);
  });

  it("getAvailableProviders() returns only providers with configured API keys", () => {
    vi.stubEnv("GEMINI_API_KEY", "sk-gemini");
    vi.stubEnv("GROQ_API_KEY", "sk-groq");

    const available = getAvailableProviders();
    expect(available.map((p) => p.name)).toEqual(["gemini", "groq"]);
  });

  it("returns MockProvider when USE_MOCK_PROVIDERS is true", () => {
    vi.stubEnv("USE_MOCK_PROVIDERS", "true");
    expect(isProviderConfigured("groq")).toBe(true);
    const provider = getProvider("groq");
    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider.name).toBe("groq");
  });

  it("createMockProvider returns an instance of MockProvider", () => {
    const mock = createMockProvider("nvidia", { content: "NVIDIA mock answer" });
    expect(mock).toBeInstanceOf(MockProvider);
    expect(mock.name).toBe("nvidia");
  });
});
