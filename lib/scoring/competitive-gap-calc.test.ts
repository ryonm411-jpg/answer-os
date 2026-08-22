import { describe, it, expect } from "vitest";
import { calculatePromptCompetitiveGapFromRows } from "./competitive-gap-calc";

describe("calculatePromptCompetitiveGapFromRows", () => {
  it("returns null gap when there are no valid rows", () => {
    const res = calculatePromptCompetitiveGapFromRows([]);
    expect(res.competitiveGap).toBeNull();
    expect(res.companyMentionRate).toBeNull();
    expect(res.competitorPresenceRate).toBeNull();
    expect(res.validChecks).toBe(0);
  });

  it("excludes error rows from denominator", () => {
    const res = calculatePromptCompetitiveGapFromRows([
      { mentioned: false, competitorsMentioned: null, error: "Provider timeout" },
      { mentioned: true, competitorsMentioned: [], error: null },
      { mentioned: false, competitorsMentioned: [{ name: "CompA" }], error: null },
    ]);

    expect(res.validChecks).toBe(2);
    expect(res.companyMentionRate).toBe(0.5); // 1 mention out of 2 valid checks
    expect(res.competitorPresenceRate).toBe(0.5); // 1 check with competitor out of 2
    // gap = clamp(0.5 + 0.5 - 0.5, 0, 1) = 0.5
    expect(res.competitiveGap).toBe(0.5);
  });

  it("calculates gap=1 when competitors are present but tracked company is never mentioned", () => {
    const res = calculatePromptCompetitiveGapFromRows([
      { mentioned: false, competitorsMentioned: [{ name: "CompA" }], error: null },
      { mentioned: false, competitorsMentioned: [{ name: "CompB" }], error: null },
    ]);
    expect(res.validChecks).toBe(2);
    expect(res.companyMentionRate).toBe(0);
    expect(res.competitorPresenceRate).toBe(1);
    // gap = clamp(0.5 + 1.0 - 0, 0, 1) = 1.0
    expect(res.competitiveGap).toBe(1);
  });

  it("calculates gap=0 when tracked company is mentioned 100% and competitors are 0%", () => {
    const res = calculatePromptCompetitiveGapFromRows([
      { mentioned: true, competitorsMentioned: [], error: null },
      { mentioned: true, competitorsMentioned: [], error: null },
    ]);
    expect(res.validChecks).toBe(2);
    expect(res.companyMentionRate).toBe(1);
    expect(res.competitorPresenceRate).toBe(0);
    // gap = clamp(0.5 + 0 - 1.0, 0, 1) = 0
    expect(res.competitiveGap).toBe(0);
  });
});
