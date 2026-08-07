import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODELS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  resolveModel,
} from "./config";
import { TO_PRISMA_PROVIDER } from "./types";

describe("lib/providers/config", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_MODEL", "");
    vi.stubEnv("ANTHROPIC_MODEL", "");
    vi.stubEnv("GEMINI_MODEL", "");
    vi.stubEnv("PERPLEXITY_MODEL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defines default models for all four providers", () => {
    expect(DEFAULT_MODELS.openai).toBe("gpt-4o");
    expect(DEFAULT_MODELS.anthropic).toBe("claude-3-5-sonnet-latest");
    expect(DEFAULT_MODELS.gemini).toBe("gemini-2.5-flash");
    expect(DEFAULT_MODELS.perplexity).toBe("sonar");
  });

  it("defines default configuration bounds", () => {
    expect(DEFAULT_MAX_TOKENS).toBe(2048);
    expect(DEFAULT_TEMPERATURE).toBe(0.2);
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });

  it("maps provider names to uppercase Prisma enum values in TO_PRISMA_PROVIDER", () => {
    expect(TO_PRISMA_PROVIDER.openai).toBe("OPENAI");
    expect(TO_PRISMA_PROVIDER.anthropic).toBe("ANTHROPIC");
    expect(TO_PRISMA_PROVIDER.gemini).toBe("GEMINI");
    expect(TO_PRISMA_PROVIDER.perplexity).toBe("PERPLEXITY");
  });

  it("resolves default model when no override or env var is present", () => {
    expect(resolveModel("openai")).toBe("gpt-4o");
    expect(resolveModel("anthropic")).toBe("claude-3-5-sonnet-latest");
  });

  it("prioritizes environment variable overrides over default models", () => {
    vi.stubEnv("OPENAI_MODEL", "gpt-4-turbo");
    expect(resolveModel("openai")).toBe("gpt-4-turbo");
  });

  it("prioritizes per-call config model override above env var and defaults", () => {
    vi.stubEnv("OPENAI_MODEL", "gpt-4-turbo");
    expect(resolveModel("openai", "gpt-3.5-turbo")).toBe("gpt-3.5-turbo");
  });
});
