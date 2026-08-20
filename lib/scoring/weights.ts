/**
 * Visibility score weights — the only tuning surface (answeros-spec).
 * Source: project-overview.md "Visibility Score" feature table.
 */
export const SCORE_WEIGHTS = {
  mentionRate: 0.3,
  averageRank: 0.25,
  sentiment: 0.2,
  competitorShare: 0.15,
  sourceAuthority: 0.1,
} as const;

/** Sum of all weights — asserted to equal 1 in weights.test.ts. */
export const SCORE_WEIGHT_TOTAL =
  SCORE_WEIGHTS.mentionRate +
  SCORE_WEIGHTS.averageRank +
  SCORE_WEIGHTS.sentiment +
  SCORE_WEIGHTS.competitorShare +
  SCORE_WEIGHTS.sourceAuthority;
