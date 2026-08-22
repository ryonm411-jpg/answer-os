/**
 * Competitive gap calculator for a single prompt (spec §14).
 *
 * Reads ScanResult rows for a specific prompt from the latest completed scan
 * and computes:
 *
 *   companyMentionRate    = tracked mentions / valid checks
 *   competitorPresenceRate = checks with ≥1 competitor / valid checks
 *   competitiveGap        = clamp(0.5 + competitorPresenceRate - companyMentionRate, 0, 1)
 *
 * Error rows are excluded from both rates (spec §14).
 * Returns null when no completed scan data exists for this prompt.
 */

import { prisma } from "./prisma";

export interface PromptCompetitiveGapResult {
  competitiveGap: number | null;
  companyMentionRate: number | null;
  competitorPresenceRate: number | null;
  validChecks: number;
}

/**
 * Calculates the competitive gap for a prompt within a specific scan.
 *
 * @param promptId - The prompt to evaluate
 * @param scanId   - The completed scan to read results from (latest COMPLETED)
 */
export async function getPromptCompetitiveGap(
  promptId: string,
  scanId: string
): Promise<PromptCompetitiveGapResult> {
  const rows = await prisma.scanResult.findMany({
    where: { promptId, scanId },
    select: {
      mentioned: true,
      competitorsMentioned: true,
      error: true,
    },
  });

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
