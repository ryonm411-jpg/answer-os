import { describe, expect, it } from "vitest";
import { AIProviderError } from "./errors";
import { MockProvider } from "./mock";

describe("lib/providers/mock", () => {
  it("resolves ask() with AIResponse matching the contract", async () => {
    const provider = new MockProvider("openai");
    const response = await provider.ask("What is AnswerOS?");

    expect(provider.name).toBe("openai");
    expect(response.content).toContain("Mock openai evaluation");
    expect(response.model).toBe("mock-openai");
    expect(response.tokensUsed).toBeGreaterThan(0);
    expect(response.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("applies custom mock overrides when provided", async () => {
    const provider = new MockProvider("anthropic", {
      content: "Custom mock answer",
      model: "mock-claude-test",
      tokensUsed: 150,
      latencyMs: 120,
    });

    const response = await provider.ask("Test prompt");

    expect(response.content).toBe("Custom mock answer");
    expect(response.model).toBe("mock-claude-test");
    expect(response.tokensUsed).toBe(150);
    expect(response.latencyMs).toBe(120);
  });

  it("rejects with specified error override for failure testing", async () => {
    const customError = new AIProviderError("Rate limit exceeded", {
      provider: "gemini",
      retryable: true,
      statusCode: 429,
    });

    const provider = new MockProvider("gemini", { error: customError });

    await expect(provider.ask("Test prompt")).rejects.toThrow(AIProviderError);
    await expect(provider.ask("Test prompt")).rejects.toMatchObject({
      provider: "gemini",
      retryable: true,
      statusCode: 429,
    });
  });
});
