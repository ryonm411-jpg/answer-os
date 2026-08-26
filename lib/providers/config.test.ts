import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MODELS,
  geminiApiKey,
  groqApiKey,
  nvidiaApiKey,
  openrouterApiKey,
} from "./config";
import { TO_PRISMA_PROVIDER } from "./types";

describe("lib/providers/config", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_MODEL", "");
    vi.stubEnv("ANTHROPIC_MODEL", "");
    vi.stubEnv("GEMINI_MODEL", "");
    vi.stubEnv("PERPLEXITY_MODEL", "");
    vi.stubEnv("GROQ_MODEL", "");
    vi.stubEnv("NVIDIA_MODEL", "");
    vi.stubEnv("OPENROUTER_MODEL", "");

    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("NVIDIA_NIM_API_KEY", "");
    vi.stubEnv("OPEN_ROUTER_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defines default models for all 7 providers", () => {
    expect(DEFAULT_MODELS.openai).toBe("gpt-4o");
    expect(DEFAULT_MODELS.anthropic).toBe("claude-3-5-sonnet-latest");
    expect(DEFAULT_MODELS.gemini).toBe("gemini-3.6-flash");
    expect(DEFAULT_MODELS.perplexity).toBe("sonar");
    expect(DEFAULT_MODELS.groq).toBe("groq/compound");
    expect(DEFAULT_MODELS.nvidia).toBe("meta/llama-3.3-70b-instruct");
    expect(DEFAULT_MODELS.openrouter).toBe("openrouter/free");
  });

  it("maps provider names to uppercase Prisma enum values in TO_PRISMA_PROVIDER", () => {
    expect(TO_PRISMA_PROVIDER.openai).toBe("OPENAI");
    expect(TO_PRISMA_PROVIDER.anthropic).toBe("ANTHROPIC");
    expect(TO_PRISMA_PROVIDER.gemini).toBe("GEMINI");
    expect(TO_PRISMA_PROVIDER.perplexity).toBe("PERPLEXITY");
    expect(TO_PRISMA_PROVIDER.groq).toBe("GROQ");
    expect(TO_PRISMA_PROVIDER.nvidia).toBe("NVIDIA");
    expect(TO_PRISMA_PROVIDER.openrouter).toBe("OPENROUTER");
  });

  it("resolves key helpers correctly from process.env", () => {
    vi.stubEnv("GEMINI_API_KEY", "sk-gemini-key");
    vi.stubEnv("GROQ_API_KEY", "sk-groq-key");
    vi.stubEnv("NVIDIA_NIM_API_KEY", "sk-nvidia-key");
    vi.stubEnv("OPEN_ROUTER_API_KEY", "sk-openrouter-key");

    expect(geminiApiKey()).toBe("sk-gemini-key");
    expect(groqApiKey()).toBe("sk-groq-key");
    expect(nvidiaApiKey()).toBe("sk-nvidia-key");
    expect(openrouterApiKey()).toBe("sk-openrouter-key");
  });
});
