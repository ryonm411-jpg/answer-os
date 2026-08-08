import { describe, expect, it, vi, afterEach } from "vitest";
import { createMockProvider } from "../providers/registry";
import {
  filterSuggestions,
  generatePromptSuggestions,
  parseSuggestions,
  type PromptSuggestion,
} from "./generator";
import { PromptGenerationError } from "./errors";
import { CURATED_PROMPTS, normalizePromptText } from "./curated";

describe("parseSuggestions", () => {
  it("parses a plain JSON array string", () => {
    const json = JSON.stringify([
      { text: "What is Acme?", category: "CRM" },
      { text: "Acme vs Competitor", category: "Analytics" },
    ]);
    const res = parseSuggestions(json);
    expect(res).toHaveLength(2);
    expect(res[0].text).toBe("What is Acme?");
  });

  it("extracts JSON from markdown code fences", () => {
    const raw = `Here are suggestions:
\`\`\`json
[
  { "text": "Best CRM for SaaS?", "category": "CRM" }
]
\`\`\``;
    const res = parseSuggestions(raw);
    expect(res).toHaveLength(1);
    expect(res[0].category).toBe("CRM");
  });

  it("handles embedded JSON array in prose", () => {
    const raw = `Sure! Here is the JSON: [ { "text": "Top security tools?", "category": "Security" } ] Hope this helps!`;
    const res = parseSuggestions(raw);
    expect(res).toHaveLength(1);
    expect(res[0].text).toBe("Top security tools?");
  });

  it("returns empty array for invalid JSON or non-array JSON", () => {
    expect(parseSuggestions("Invalid string")).toEqual([]);
    expect(parseSuggestions(`{ "error": "failed" }`)).toEqual([]);
  });

  it("filters out invalid items without required fields", () => {
    const raw = JSON.stringify([
      { text: "", category: "CRM" },
      { text: "Valid question?", category: 123 },
      { text: "Good prompt?", category: "Payments" },
    ]);
    const res = parseSuggestions(raw);
    expect(res).toHaveLength(1);
    expect(res[0].text).toBe("Good prompt?");
  });
});

describe("filterSuggestions", () => {
  const curatedSet = new Set(
    CURATED_PROMPTS.map((p) => normalizePromptText(p.text))
  );

  it("dedupes items within batch and drops curated prompt matches", () => {
    const raw: PromptSuggestion[] = [
      { text: "What is the best CRM software for small businesses?", category: "CRM" }, // Curated match!
      { text: "Custom suggestion for Acme?", category: "CRM" },
      { text: "  custom suggestion for acme?  ", category: "CRM" }, // Duplicate!
      { text: "Another suggestion?", category: "Analytics" },
    ];

    const res = filterSuggestions(raw, curatedSet, 20);
    expect(res).toHaveLength(2);
    expect(res[0].text).toBe("Custom suggestion for Acme?");
    expect(res[1].text).toBe("Another suggestion?");
  });

  it("maps unknown categories to 'Other'", () => {
    const raw: PromptSuggestion[] = [
      { text: "Something unique question?", category: "UnheardCategory" },
    ];
    const res = filterSuggestions(raw, curatedSet, 20);
    expect(res[0].category).toBe("Other");
  });

  it("respects max cap limit", () => {
    const raw: PromptSuggestion[] = Array.from({ length: 30 }, (_, i) => ({
      text: `Unique question number ${i}?`,
      category: "CRM",
    }));

    const res = filterSuggestions(raw, curatedSet, 5);
    expect(res).toHaveLength(5);
  });
});

describe("generatePromptSuggestions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates suggestions using MockProvider", async () => {
    const mockContent = JSON.stringify([
      { text: "How does Acme compare to CompetitorX?", category: "CRM" },
      { text: "Is Acme secure for enterprise?", category: "Security" },
    ]);

    const mockProvider = createMockProvider("openai", { content: mockContent });

    const res = await generatePromptSuggestions(
      {
        companyName: "Acme",
        domain: "acme.com",
        industry: "SaaS",
        competitors: [{ name: "CompetitorX", domain: "competitorx.com" }],
        count: 10,
      },
      { provider: mockProvider }
    );

    expect(res).toHaveLength(2);
    expect(res[0].text).toBe("How does Acme compare to CompetitorX?");
    expect(res[0].category).toBe("CRM");
  });

  it("throws PromptGenerationError when no provider is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("PERPLEXITY_API_KEY", "");

    await expect(
      generatePromptSuggestions({
        companyName: "Acme",
        domain: "acme.com",
        industry: "SaaS",
        competitors: [],
      })
    ).rejects.toThrow(PromptGenerationError);
  });
});
