/**
 * Competitive gap calculator for a single prompt (spec §14).
 *
 * Reads ScanResult rows for a specific prompt from the latest completed scan
 * and computes per-prompt competitive gap using pure calculation module.
 */

import { prisma } from "./prisma";
import {
  calculatePromptCompetitiveGapFromRows,
  type PromptCompetitiveGapResult,
} from "../scoring/competitive-gap-calc";

export { calculatePromptCompetitiveGapFromRows };
export type { PromptCompetitiveGapResult };

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

  return calculatePromptCompetitiveGapFromRows(rows);
}
