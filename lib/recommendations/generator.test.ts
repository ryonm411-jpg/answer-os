import { describe, expect, it } from "vitest";
import {
  generateRecommendations,
  type ScanResultForAnalysis,
  type CompanyAnalysisContext,
} from "./generator";

describe("lib/recommendations/generator", () => {
  const context: CompanyAnalysisContext = {
    companyName: "Xero Shoes",
    domain: "xeroshoes.com",
  };

  it("generates competitor comparison page recommendations when competitors win missed prompts", () => {
    const results: ScanResultForAnalysis[] = [
      {
        promptId: "p1",
        promptText: "Best barefoot hiking shoes",
        category: "Trail & Outdoor",
        mentioned: false,
        position: null,
        competitorsMentioned: [{ name: "Altra" }, { name: "Merrell" }],
        error: null,
      },
      {
        promptId: "p2",
        promptText: "Top zero drop trail runners",
        category: "Trail & Outdoor",
        mentioned: false,
        position: null,
        competitorsMentioned: [{ name: "Altra" }],
        error: null,
      },
    ];

    const recs = generateRecommendations(context, results);

    expect(recs.length).toBeGreaterThan(0);
    const comparisonRec = recs.find((r) => r.category === "Comparison Pages");
    expect(comparisonRec).toBeDefined();
    expect(comparisonRec?.title).toContain("Xero Shoes vs Altra");
    expect(comparisonRec?.priority).toBe(1);
    expect(comparisonRec?.estimatedImpact).toBeNull();
  });

  it("generates category FAQ recommendation when category mention rate is low", () => {
    const results: ScanResultForAnalysis[] = [
      {
        promptId: "p1",
        promptText: "Trail durability review",
        category: "Durability & Reviews",
        mentioned: false,
        position: null,
        competitorsMentioned: [{ name: "Merrell" }],
        error: null,
      },
      {
        promptId: "p2",
        promptText: "How long do soles last?",
        category: "Durability & Reviews",
        mentioned: false,
        position: null,
        competitorsMentioned: [],
        error: null,
      },
    ];

    const recs = generateRecommendations(context, results);

    const faqRec = recs.find((r) => r.category === "FAQ & Schema");
    expect(faqRec).toBeDefined();
    expect(faqRec?.title).toContain("Durability & Reviews FAQ");
    expect(faqRec?.priority).toBe(1);
  });

  it("generates product positioning recommendation when mentioned at position #2+", () => {
    const results: ScanResultForAnalysis[] = [
      {
        promptId: "p1",
        promptText: "Compare Xero Shoes vs VivoBarefoot",
        category: "Comparisons",
        mentioned: true,
        position: 2,
        competitorsMentioned: [{ name: "VivoBarefoot" }],
        error: null,
      },
    ];

    const recs = generateRecommendations(context, results);

    const positioningRec = recs.find((r) => r.category === "Product Positioning");
    expect(positioningRec).toBeDefined();
    expect(positioningRec?.priority).toBe(2);
    expect(positioningRec?.estimatedImpact).toBeNull();
  });

  it("generates fallback schema recommendation when all prompts are 100% mentioned at rank #1", () => {
    const results: ScanResultForAnalysis[] = [
      {
        promptId: "p1",
        promptText: "Xero Shoes review",
        category: "Reviews",
        mentioned: true,
        position: 1,
        competitorsMentioned: [],
        error: null,
      },
    ];

    const recs = generateRecommendations(context, results);

    const schemaRec = recs.find((r) => r.category === "Schema Markup");
    expect(schemaRec).toBeDefined();
    expect(schemaRec?.priority).toBe(3);
  });

  it("handles empty/all-errored scans gracefully", () => {
    const results: ScanResultForAnalysis[] = [
      {
        promptId: "p1",
        promptText: "Test prompt",
        category: "General",
        mentioned: false,
        position: null,
        competitorsMentioned: [],
        error: "Rate limit 429",
      },
    ];

    const recs = generateRecommendations(context, results);

    expect(recs.length).toBe(1);
    expect(recs[0].category).toBe("Indexing & Crawlability");
    expect(recs[0].priority).toBe(1);
  });
});
