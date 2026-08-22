import { describe, expect, it, vi, afterEach } from "vitest";
import { createMockProvider } from "../providers/registry";
import {
  filterSuggestions,
  generatePromptSuggestions,
  parseSuggestions,
  type PromptSuggestion,
} from "./generator";
import { PromptGenerationError } from "./errors";
import { normalizePromptText } from "./curated";

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

  it("extracts JSON with intent, demandScore, and businessRelevance", () => {
    const raw = JSON.stringify([
      {
        text: "Acme vs Vivobarefoot",
        category: "Comparisons",
        intent: "COMPARISON",
        demandScore: 85,
        businessRelevance: 90,
      },
    ]);
    const res = parseSuggestions(raw);
    expect(res).toHaveLength(1);
    expect(res[0].intent).toBe("COMPARISON");
    expect(res[0].demandScore).toBe(85);
    expect(res[0].businessRelevance).toBe(90);
  });

  it("returns empty array for invalid JSON or non-array JSON", () => {
    expect(parseSuggestions("Invalid string")).toEqual([]);
    expect(parseSuggestions(`{ "error": "failed" }`)).toEqual([]);
  });
});

describe("filterSuggestions", () => {
  const curatedSet = new Set([
    normalizePromptText("What is the best CRM software for small businesses?"),
  ]);

  it("dedupes items within batch, sets defaults, and drops curated prompt matches", () => {
    const raw: Partial<PromptSuggestion>[] = [
      { text: "What is the best CRM software for small businesses?", category: "CRM" }, // Curated match!
      { text: "Custom suggestion for Acme?", category: "CRM", intent: "COMPARISON", demandScore: 80, businessRelevance: 85 },
      { text: "  custom suggestion for acme?  ", category: "CRM" }, // Duplicate!
      { text: "Another suggestion?", category: "Analytics" },
    ];

    const res = filterSuggestions(raw, curatedSet, 20);
    expect(res).toHaveLength(2);
    expect(res[0].text).toBe("Custom suggestion for Acme?");
    expect(res[0].intent).toBe("COMPARISON");
    expect(res[0].demandScore).toBe(80);
    expect(res[0].businessRelevance).toBe(85);

    // Default intent fallback is PRODUCT when missing/invalid
    expect(res[1].text).toBe("Another suggestion?");
    expect(res[1].intent).toBe("PRODUCT");
    expect(res[1].demandScore).toBe(50);
    expect(res[1].businessRelevance).toBe(70);
  });

  it("preserves non-empty category string or uses fallbackCategory", () => {
    const raw: Partial<PromptSuggestion>[] = [
      { text: "Something unique question?", category: "Barefoot Footwear" },
      { text: "Another question without category?", category: "" },
    ];
    const res = filterSuggestions(raw, curatedSet, 20, "Footwear");
    expect(res[0].category).toBe("Barefoot Footwear");
    expect(res[1].category).toBe("Footwear");
  });

  it("respects max cap limit", () => {
    const raw: Partial<PromptSuggestion>[] = Array.from({ length: 30 }, (_, i) => ({
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

  it("throws error if Business Profile productDescription is missing", async () => {
    const mockProvider = createMockProvider("openai", { content: "[]" });
    await expect(
      generatePromptSuggestions(
        {
          companyName: "Acme",
          domain: "acme.com",
          industry: "SaaS",
          businessProfile: { productDescription: "", category: "SaaS" },
          competitors: [],
        },
        { provider: mockProvider }
      )
    ).rejects.toThrow("Business Profile productDescription is required");
  });

  it("generates suggestions using MockProvider with Business Profile", async () => {
    const mockContent = JSON.stringify([
      {
        text: "How does Acme compare to CompetitorX?",
        category: "Comparisons",
        intent: "COMPARISON",
        demandScore: 80,
        businessRelevance: 90,
      },
    ]);

    const mockProvider = createMockProvider("openai", { content: mockContent });

    const res = await generatePromptSuggestions(
      {
        companyName: "Acme",
        domain: "acme.com",
        industry: "SaaS",
        businessProfile: {
          productDescription: "Minimalist shoes for natural movement",
          category: "Footwear",
        },
        competitors: [{ name: "CompetitorX", domain: "competitorx.com" }],
        count: 10,
      },
      { provider: mockProvider }
    );

    expect(res).toHaveLength(1);
    expect(res[0].text).toBe("How does Acme compare to CompetitorX?");
    expect(res[0].intent).toBe("COMPARISON");
    expect(res[0].demandScore).toBe(80);
    expect(res[0].businessRelevance).toBe(90);
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
        businessProfile: { productDescription: "Some Product", category: "SaaS" },
        competitors: [],
      })
    ).rejects.toThrow(PromptGenerationError);
  });
});
