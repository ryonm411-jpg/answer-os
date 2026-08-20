import { describe, expect, it } from "vitest";
import { SCORE_WEIGHTS, SCORE_WEIGHT_TOTAL } from "./weights";

describe("SCORE_WEIGHTS", () => {
  it("matches the documented 30/25/20/15/10 weight table", () => {
    expect(SCORE_WEIGHTS.mentionRate).toBe(0.3);
    expect(SCORE_WEIGHTS.averageRank).toBe(0.25);
    expect(SCORE_WEIGHTS.sentiment).toBe(0.2);
    expect(SCORE_WEIGHTS.competitorShare).toBe(0.15);
    expect(SCORE_WEIGHTS.sourceAuthority).toBe(0.1);
  });

  it("asserts SCORE_WEIGHT_TOTAL equals 1", () => {
    expect(SCORE_WEIGHT_TOTAL).toBeCloseTo(1.0, 5);
  });
});
