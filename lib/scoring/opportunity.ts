/**
 * Opportunity Score Calculator (spec §12).
 *
 * Pure, server-only module. No Prisma, React, or provider SDK imports.
 *
 * Formula:
 *   score = round(demandScore × competitiveGap × businessRelevance / 10000)
 *
 * Where:
 *   demandScore        0..100  (AI estimate or fallback 50)
 *   competitiveGap     0..1    (from latest completed scan; null before scan)
 *   businessRelevance  0..100  (AI estimate or intent-based default)
 *   score              0..100  (null when competitiveGap is unknown)
 */

export interface OpportunityScoreInput {
  /** 0..100. null → treated as missing; fallback 50 is applied at the read layer, not here. */
  demandScore: number | null;
  /** 0..1. null → no completed scan exists; score must be null. */
  competitiveGap: number | null;
  /** 0..100. null → treated as missing; not manufactured into zero. */
  businessRelevance: number | null;
}

export interface OpportunityScoreResult {
  /** Integer 0..100, or null when competitiveGap is unknown. */
  score: number | null;
  demandScore: number | null;
  competitiveGap: number | null;
  businessRelevance: number | null;
  /**
   * true when all three factor inputs are non-null (score is fully computed).
   * false only applies when score is null (awaiting scan data).
   */
  isEstimated: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate the Opportunity Score for a single prompt.
 *
 * Returns `null` for score when `competitiveGap` is null — never manufactures
 * a provisional gap (spec §16).
 */
export function calculateOpportunityScore(
  input: OpportunityScoreInput
): OpportunityScoreResult {
  const { demandScore, competitiveGap, businessRelevance } = input;

  // Gap is required — without it we cannot produce a meaningful score (spec §16).
  if (competitiveGap === null) {
    return {
      score: null,
      demandScore,
      competitiveGap: null,
      businessRelevance,
      isEstimated: false,
    };
  }

  // Missing demand or relevance → also cannot produce a score (spec §12).
  if (demandScore === null || businessRelevance === null) {
    return {
      score: null,
      demandScore,
      competitiveGap,
      businessRelevance,
      isEstimated: false,
    };
  }

  const d = clamp(demandScore, 0, 100);
  const g = clamp(competitiveGap, 0, 1);
  const r = clamp(businessRelevance, 0, 100);

  const score = clamp(Math.round((d * g * r) / 100), 0, 100);

  return {
    score,
    demandScore: d,
    competitiveGap: g,
    businessRelevance: r,
    isEstimated: true,
  };
}
