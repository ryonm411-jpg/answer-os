import { describe, expect, it } from "vitest";
import { calculateVisibilityScore, type ScoreResultRow } from "./calculator";

describe("calculateVisibilityScore", () => {
  it("returns score: null when rows array is empty", () => {
    const res = calculateVisibilityScore([]);
    expect(res.score).toBeNull();
    expect(res.factors).toBeNull();
    expect(res.summary).toEqual({
      results: 0,
      validResults: 0,
      mentions: 0,
      errors: 0,
      promptType: "ALL",
    });
  });

  it("returns score: null when all rows contain errors", () => {
    const rows: ScoreResultRow[] = [
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: "Rate limited",
      },
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: "Timeout",
      },
    ];
    const res = calculateVisibilityScore(rows);
    expect(res.score).toBeNull();
    expect(res.factors).toBeNull();
    expect(res.summary).toEqual({
      results: 2,
      validResults: 0,
      mentions: 0,
      errors: 2,
      promptType: "ALL",
    });
  });

  it("excludes error rows from factor calculations and denominators", () => {
    const rows: ScoreResultRow[] = [
      {
        mentioned: true,
        position: 1,
        sentiment: "POSITIVE",
        competitorsMentioned: [],
        error: null,
      },
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: "API error",
      },
    ];
    const res = calculateVisibilityScore(rows);
    expect(res.summary).toEqual({
      results: 2,
      validResults: 1,
      mentions: 1,
      errors: 1,
      promptType: "ALL",
    });
    expect(res.factors?.mentionRate).toBe(1);
  });

  it("calculates averageRank decay and handles null positions & zero mentions", () => {
    // pos 1 -> 1.0, pos 3 -> 1/3 (0.333) -> mean is 2/3 (~0.667)
    const rows: ScoreResultRow[] = [
      {
        mentioned: true,
        position: 1,
        sentiment: "POSITIVE",
        competitorsMentioned: [],
        error: null,
      },
      {
        mentioned: true,
        position: 3,
        sentiment: "POSITIVE",
        competitorsMentioned: [],
        error: null,
      },
    ];
    const res = calculateVisibilityScore(rows);
    expect(res.factors?.averageRank).toBeCloseTo(2 / 3, 3);

    // mentioned with null position defaults to 0.5
    const rowsNullPos: ScoreResultRow[] = [
      {
        mentioned: true,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: null,
      },
    ];
    expect(calculateVisibilityScore(rowsNullPos).factors?.averageRank).toBe(0.5);

    // zero mentions gives 0 rank score
    const rowsNoMention: ScoreResultRow[] = [
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: null,
      },
    ];
    expect(calculateVisibilityScore(rowsNoMention).factors?.averageRank).toBe(0);
  });

  it("filters rows by promptType when specified", () => {
    const rows: ScoreResultRow[] = [
      {
        mentioned: true,
        position: 1,
        sentiment: "POSITIVE",
        competitorsMentioned: [],
        error: null,
        promptType: "BRANDED",
      },
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: ["CompetitorA"],
        error: null,
        promptType: "UNBRANDED",
      },
    ];

    const brandedScore = calculateVisibilityScore(rows, "BRANDED");
    expect(brandedScore.summary.results).toBe(1);
    expect(brandedScore.summary.mentions).toBe(1);
    expect(brandedScore.score).toBe(95);

    const unbrandedScore = calculateVisibilityScore(rows, "UNBRANDED");
    expect(unbrandedScore.summary.results).toBe(1);
    expect(unbrandedScore.summary.mentions).toBe(0);
    expect(unbrandedScore.score).toBe(5);

    const overallScore = calculateVisibilityScore(rows, "ALL");
    expect(overallScore.summary.results).toBe(2);
  });

  it("calculates the perfect ceiling score (95)", () => {
    const rows: ScoreResultRow[] = [
      {
        mentioned: true,
        position: 1,
        sentiment: "POSITIVE",
        competitorsMentioned: [],
        error: null,
      },
    ];
    const res = calculateVisibilityScore(rows);
    expect(res.score).toBe(95);
  });
});
