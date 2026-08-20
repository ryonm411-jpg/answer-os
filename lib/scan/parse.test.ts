import { describe, it, expect } from "vitest";
import { parseScanResponse, parseSentiment } from "./parse";

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
    const raw = `Some introductory explanation. {"mentioned": false, "position": null, "sentiment": null, "reasoning": null, "competitors": [{"name": "OtherCo", "position": 1, "sentiment": "positive"}]} End of answer.`;

    const result = parseScanResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(false);
      expect(result.data.position).toBeNull();
      expect(result.data.sentiment).toBeNull();
      expect(result.data.reasoning).toBeNull();
      expect(result.data.competitors).toEqual([
        { name: "OtherCo", position: 1, sentiment: "POSITIVE" },
      ]);
    }
  });

  it("coerces string boolean for mentioned", () => {
    const result = parseScanResponse(
      JSON.stringify({
        mentioned: "true",
        position: 1,
        sentiment: "positive",
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(true);
    }
  });

  it("forces position to null when mentioned is false", () => {
    const result = parseScanResponse(
      JSON.stringify({
        mentioned: false,
        position: 1,
        sentiment: "neutral",
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mentioned).toBe(false);
      expect(result.data.position).toBeNull();
    }
  });

  it("normalizes invalid position values to null", () => {
    const cases = [0, -1, 1.5, "1", null, undefined];
    for (const val of cases) {
      const result = parseScanResponse(
        JSON.stringify({
          mentioned: true,
          position: val,
        })
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.position).toBeNull();
      }
    }
  });

  it("handles empty or whitespace reasoning as null", () => {
    const result = parseScanResponse(
      JSON.stringify({
        mentioned: true,
        reasoning: "   ",
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.reasoning).toBeNull();
    }
  });

  it("cleans and bounds competitors array to 10 entries", () => {
    const rawCompetitors = [
      { name: "Comp 1", position: 1, sentiment: "positive" },
      { name: "", position: 2 }, // invalid: empty name
      null, // invalid: not an object
      "invalid", // invalid: not an object
      ...Array.from({ length: 15 }, (_, i) => ({
        name: `Extra ${i + 2}`,
        position: i + 2,
        sentiment: "neutral",
      })),
    ];

    const result = parseScanResponse(
      JSON.stringify({
        mentioned: false,
        competitors: rawCompetitors,
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.competitors.length).toBe(10);
      expect(result.data.competitors[0]).toEqual({
        name: "Comp 1",
        position: 1,
        sentiment: "POSITIVE",
      });
    }
  });

  it("returns ok: false when no JSON is present in response", () => {
    const result = parseScanResponse("No JSON object here at all");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Response contained no JSON metadata object");
    }
  });

  it("returns ok: false when JSON is malformed", () => {
    const result = parseScanResponse("{ mentioned: true, malformed }");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Response JSON could not be parsed");
    }
  });

  it("returns ok: false when parsed JSON is not an object", () => {
    const result = parseScanResponse("[1, 2, 3]");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Metadata is not a JSON object");
    }
  });
});
