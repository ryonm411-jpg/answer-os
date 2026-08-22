export interface PromptCompetitiveGapResult {
  competitiveGap: number | null;
  companyMentionRate: number | null;
  competitorPresenceRate: number | null;
  validChecks: number;
}

export interface ScanResultRowForGap {
  mentioned: boolean;
  competitorsMentioned: unknown;
  error: string | null;
}

/** Pure competitive gap calculator over raw result rows (spec §14). */
export function calculatePromptCompetitiveGapFromRows(
  rows: ScanResultRowForGap[]
): PromptCompetitiveGapResult {
  // Exclude error rows from the denominator (spec §14, Invariant #9).
  const validRows = rows.filter((r) => r.error === null);

  if (validRows.length === 0) {
    return {
      competitiveGap: null,
      companyMentionRate: null,
      competitorPresenceRate: null,
      validChecks: 0,
    };
  }

  const mentionedCount = validRows.filter((r) => r.mentioned).length;
  const companyMentionRate = mentionedCount / validRows.length;

  const withCompetitorCount = validRows.filter((r) => {
    const competitors = r.competitorsMentioned;
    if (!competitors) return false;
    if (Array.isArray(competitors)) return competitors.length > 0;
    return false;
  }).length;
  const competitorPresenceRate = withCompetitorCount / validRows.length;

  const gap = Math.max(0, Math.min(1, 0.5 + competitorPresenceRate - companyMentionRate));

  return {
    competitiveGap: gap,
    companyMentionRate,
    competitorPresenceRate,
    validChecks: validRows.length,
  };
}
