import { describe, it, expect } from "vitest";
import { calculateOpportunityScore } from "./opportunity";

describe("calculateOpportunityScore", () => {
  it("returns null score when competitiveGap is null (no scan data)", () => {
    const result = calculateOpportunityScore({
      demandScore: 80,
      competitiveGap: null,
      businessRelevance: 90,
    });
    expect(result.score).toBeNull();
    expect(result.isEstimated).toBe(false);
  });

  it("returns null score when demandScore is null", () => {
    const result = calculateOpportunityScore({
      demandScore: null,
      competitiveGap: 0.8,
      businessRelevance: 90,
    });
    expect(result.score).toBeNull();
    expect(result.isEstimated).toBe(false);
  });

  it("returns null score when businessRelevance is null", () => {
    const result = calculateOpportunityScore({
      demandScore: 80,
      competitiveGap: 0.8,
      businessRelevance: null,
    });
    expect(result.score).toBeNull();
    expect(result.isEstimated).toBe(false);
  });

  it("calculates correct score with all factors present", () => {
    // 80 × 0.8 × 90 / 10000 = 5760 / 10000 = 0.576 → round(57.6) = 58
    const result = calculateOpportunityScore({
      demandScore: 80,
      competitiveGap: 0.8,
      businessRelevance: 90,
    });
    expect(result.score).toBe(58);
    expect(result.isEstimated).toBe(true);
  });

  it("worked example from spec: demand 91, gap 0.92, relevance 95", () => {
    // 91 × 0.92 × 95 / 10000 = 7955.4 / 10000 = 0.79554 → round(79.554) = 80
    const result = calculateOpportunityScore({
      demandScore: 91,
      competitiveGap: 0.92,
      businessRelevance: 95,
    });
    expect(result.score).toBe(80);
    expect(result.isEstimated).toBe(true);
  });

  it("clamps demand score above 100 to 100", () => {
    const result = calculateOpportunityScore({
      demandScore: 150,
      competitiveGap: 1,
      businessRelevance: 100,
    });
    // clamped: 100 × 1 × 100 / 10000 = 100
    expect(result.score).toBe(100);
    expect(result.demandScore).toBe(100);
  });

  it("clamps business relevance above 100 to 100", () => {
    const result = calculateOpportunityScore({
      demandScore: 100,
      competitiveGap: 1,
      businessRelevance: 200,
    });
    expect(result.score).toBe(100);
    expect(result.businessRelevance).toBe(100);
  });

  it("clamps competitive gap above 1 to 1", () => {
    const result = calculateOpportunityScore({
      demandScore: 100,
      competitiveGap: 5,
      businessRelevance: 100,
    });
    expect(result.score).toBe(100);
    expect(result.competitiveGap).toBe(1);
  });

  it("returns 0 when gap is 0 (company is dominant)", () => {
    const result = calculateOpportunityScore({
      demandScore: 90,
      competitiveGap: 0,
      businessRelevance: 90,
    });
    expect(result.score).toBe(0);
    expect(result.isEstimated).toBe(true);
  });

  it("returns null score when all inputs are null", () => {
    const result = calculateOpportunityScore({
      demandScore: null,
      competitiveGap: null,
      businessRelevance: null,
    });
    expect(result.score).toBeNull();
    expect(result.isEstimated).toBe(false);
  });

  it("passes through raw input values in result", () => {
    const result = calculateOpportunityScore({
      demandScore: 70,
      competitiveGap: 0.6,
      businessRelevance: 80,
    });
    expect(result.demandScore).toBe(70);
    expect(result.competitiveGap).toBe(0.6);
    expect(result.businessRelevance).toBe(80);
  });
});
