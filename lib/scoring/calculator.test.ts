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

  it("calculates sentiment mapping POSITIVE=1, NEUTRAL=0.5, NEGATIVE=0, skipping nulls", () => {
    const rows: ScoreResultRow[] = [
      {
        mentioned: true,
        position: 1,
        sentiment: "POSITIVE", // 1
        competitorsMentioned: [],
        error: null,
      },
      {
        mentioned: true,
        position: 1,
        sentiment: "NEUTRAL", // 0.5
        competitorsMentioned: [],
        error: null,
      },
      {
        mentioned: true,
        position: 1,
        sentiment: "NEGATIVE", // 0
        competitorsMentioned: [],
        error: null,
      },
      {
        mentioned: true,
        position: 1,
        sentiment: null, // skipped
        competitorsMentioned: [],
        error: null,
      },
    ];
    const res = calculateVisibilityScore(rows);
    expect(res.factors?.sentiment).toBeCloseTo((1 + 0.5 + 0) / 3, 3);

    // no sentiment reported gives 0 sentiment factor
    const rowsNoSentiment: ScoreResultRow[] = [
      {
        mentioned: true,
        position: 1,
        sentiment: null,
        competitorsMentioned: [],
        error: null,
      },
    ];
    expect(calculateVisibilityScore(rowsNoSentiment).factors?.sentiment).toBe(0);
  });

  it("calculates competitorShare accurately across scenarios", () => {
    // Scenario 1: No data (neither mentioned nor competitor present) -> 0.5 neutral
    const rowsNeutral: ScoreResultRow[] = [
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: null,
      },
    ];
    expect(calculateVisibilityScore(rowsNeutral).factors?.competitorShare).toBe(0.5);

    // Scenario 2: You dominate (you mentioned, no competitors) -> 1.0
    const rowsDominate: ScoreResultRow[] = [
      {
        mentioned: true,
        position: 1,
        sentiment: null,
        competitorsMentioned: [],
        error: null,
      },
    ];
    expect(calculateVisibilityScore(rowsDominate).factors?.competitorShare).toBe(1.0);

    // Scenario 3: Competitors dominate (you never mentioned, competitors present) -> 0
    const rowsSuppressed: ScoreResultRow[] = [
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: ["Acme Inc"],
        error: null,
      },
    ];
    expect(calculateVisibilityScore(rowsSuppressed).factors?.competitorShare).toBe(0);
  });

  it("matches the worked example from the specification (score 64)", () => {
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
        sentiment: "NEUTRAL",
        competitorsMentioned: ["Comp A", "Comp B"],
        error: null,
      },
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: ["Comp C"],
        error: null,
      },
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: "rate limited",
      },
    ];

    const res = calculateVisibilityScore(rows);

    expect(res.summary).toEqual({
      results: 4,
      validResults: 3,
      mentions: 2,
      errors: 1,
    });

    expect(res.factors?.mentionRate).toBeCloseTo(2 / 3, 3);
    expect(res.factors?.averageRank).toBeCloseTo((1 + 1 / 3) / 2, 3);
    expect(res.factors?.sentiment).toBe(0.75);
    expect(res.factors?.competitorShare).toBe(0.5);
    expect(res.factors?.sourceAuthority).toBe(0.5);

    // 0.6667*0.3 + 0.6667*0.25 + 0.75*0.2 + 0.5*0.15 + 0.5*0.1 = 0.64167 -> rounded 64
    expect(res.score).toBe(64);
  });

  it("calculates contrast cases: never mentioned no competitors (13)", () => {
    const rows: ScoreResultRow[] = [
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: [],
        error: null,
      },
    ];
    const res = calculateVisibilityScore(rows);
    // mentionRate: 0, averageRank: 0, sentiment: 0, competitorShare: 0.5, sourceAuthority: 0.5
    // weighted = 0 + 0 + 0 + 0.5*0.15 + 0.5*0.1 = 0.075 + 0.05 = 0.125 -> rounded 13
    expect(res.score).toBe(13);
  });

  it("calculates contrast cases: never mentioned with competitors everywhere (5)", () => {
    const rows: ScoreResultRow[] = [
      {
        mentioned: false,
        position: null,
        sentiment: null,
        competitorsMentioned: ["Comp A"],
        error: null,
      },
    ];
    const res = calculateVisibilityScore(rows);
    // mentionRate: 0, averageRank: 0, sentiment: 0, competitorShare: 0, sourceAuthority: 0.5
    // weighted = 0 + 0 + 0 + 0 + 0.5*0.1 = 0.05 -> rounded 5
    expect(res.score).toBe(5);
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
    // 1*0.3 + 1*0.25 + 1*0.2 + 1*0.15 + 0.5*0.1 = 0.3 + 0.25 + 0.2 + 0.15 + 0.05 = 0.95 -> 95
    expect(res.score).toBe(95);
  });
});
