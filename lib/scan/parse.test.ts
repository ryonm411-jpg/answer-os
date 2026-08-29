import { describe, it, expect } from "vitest";
import { parseScanResponse, parseUnbrandedScanResponse, parseSentiment } from "./parse";

describe("parseSentiment", () => {
  it("parses positive sentiments case-insensitively", () => {
    expect(parseSentiment("positive")).toBe("POSITIVE");
    expect(parseSentiment("POSITIVE")).toBe("POSITIVE");
    expect(parseSentiment("  Positive  ")).toBe("POSITIVE");
  });

  it("parses neutral and negative sentiments", () => {
    expect(parseSentiment("neutral")).toBe("NEUTRAL");
    expect(parseSentiment("negative")).toBe("NEGATIVE");
  });

  it("returns null for invalid or missing values", () => {
    expect(parseSentiment("mixed")).toBeNull();
    expect(parseSentiment("")).toBeNull();
    expect(parseSentiment(null)).toBeNull();
    expect(parseSentiment(undefined)).toBeNull();
    expect(parseSentiment(123)).toBeNull();
  });
});

describe("parseScanResponse", () => {
  it("parses pure JSON response", () => {
    const raw = JSON.stringify({
      mentioned: true,
      position: 1,
      sentiment: "positive",
      reasoning: "Top recommendation for fast setups.",
      competitors: [
        { name: "CompetitorA", position: 2, sentiment: "neutral" },
        { name: "CompetitorB", position: 3, sentiment: "negative" },
      ],
    });

    const result = parseScanResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(true);
      expect(result.data.position).toBe(1);
      expect(result.data.sentiment).toBe("POSITIVE");
      expect(result.data.reasoning).toBe("Top recommendation for fast setups.");
      expect(result.data.competitors).toEqual([
        { name: "CompetitorA", position: 2, sentiment: "NEUTRAL" },
        { name: "CompetitorB", position: 3, sentiment: "NEGATIVE" },
      ]);
    }
  });

  it("extracts JSON from markdown code fences", () => {
    const raw = `
Here is my analysis of the software options:

\`\`\`json
{
  "mentioned": true,
  "position": 2,
  "sentiment": "neutral",
  "reasoning": "Good secondary choice.",
  "competitors": []
}
\`\`\`
Hope this helps!`;

    const result = parseScanResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(true);
      expect(result.data.position).toBe(2);
      expect(result.data.sentiment).toBe("NEUTRAL");
      expect(result.data.reasoning).toBe("Good secondary choice.");
      expect(result.data.competitors).toEqual([]);
    }
  });

  it("extracts JSON wrapped in prose without markdown fences", () => {
    const raw = `Some introductory explanation. {"mentioned": false, "position": null, "sentiment": null, "reasoning": null, "competitors": [{"name": "Vivobarefoot", "position": 1, "sentiment": "positive"}]} End of answer.`;

    const result = parseScanResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(false);
      expect(result.data.position).toBeNull();
      expect(result.data.sentiment).toBeNull();
      expect(result.data.reasoning).toBeNull();
      expect(result.data.competitors).toEqual([
        { name: "Vivobarefoot", position: 1, sentiment: "POSITIVE" },
      ]);
    }
  });

  it("filters synthetic placeholder competitor names such as OtherCo", () => {
    const raw = JSON.stringify({
      mentioned: false,
      competitors: [
        { name: "OtherCo", position: 1 },
        { name: "Other Company", position: 2 },
        { name: "RealCompetitor", position: 3 },
      ],
    });
    const result = parseScanResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.competitors).toEqual([
        { name: "RealCompetitor", position: 3, sentiment: null },
      ]);
    }
  });
});

describe("parseUnbrandedScanResponse", () => {
  const trackedName = "Slickwraps";
  const trackedDomain = "slickwraps.com";

  it("identifies tracked company by domain match", () => {
    const raw = JSON.stringify({
      mentionedCompanies: [
        { name: "dbrand", domain: "dbrand.com", position: 1, sentiment: "positive" },
        { name: "Slickwraps Inc", domain: "https://www.slickwraps.com/", position: 2, sentiment: "positive", reasoning: "High quality skins" },
      ],
    });

    const result = parseUnbrandedScanResponse(raw, trackedName, trackedDomain);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(true);
      expect(result.data.position).toBe(2);
      expect(result.data.sentiment).toBe("POSITIVE");
      expect(result.data.reasoning).toBe("High quality skins");
      expect(result.data.competitors).toEqual([
        { name: "dbrand", position: 1, sentiment: "POSITIVE" },
      ]);
    }
  });

  it("identifies tracked company by case-insensitive name match when domain is missing", () => {
    const raw = JSON.stringify({
      mentionedCompanies: [
        { name: "Slickwraps", domain: "", position: 1, sentiment: "positive", reasoning: "Great skins." },
      ],
    });

    const result = parseUnbrandedScanResponse(raw, trackedName, trackedDomain);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(true);
      expect(result.data.position).toBe(1);
      expect(result.data.competitors).toEqual([]);
    }
  });

  it("returns mentioned: false when tracked company is not in mentionedCompanies", () => {
    const raw = JSON.stringify({
      mentionedCompanies: [
        { name: "dbrand", domain: "dbrand.com", position: 1, sentiment: "positive" },
        { name: "Skinit", domain: "skinit.com", position: 2, sentiment: "neutral" },
      ],
    });

    const result = parseUnbrandedScanResponse(raw, trackedName, trackedDomain);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(false);
      expect(result.data.position).toBeNull();
      expect(result.data.sentiment).toBeNull();
      expect(result.data.reasoning).toBeNull();
      expect(result.data.competitors).toEqual([
        { name: "dbrand", position: 1, sentiment: "POSITIVE" },
        { name: "Skinit", position: 2, sentiment: "NEUTRAL" },
      ]);
    }
  });

  it("handles empty mentionedCompanies array", () => {
    const raw = JSON.stringify({ mentionedCompanies: [] });
    const result = parseUnbrandedScanResponse(raw, trackedName, trackedDomain);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(false);
      expect(result.data.competitors).toEqual([]);
    }
  });
});
