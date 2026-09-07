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

/**
 * Calculates the competitive gap for all prompts within a specific scan in a single query (prevents N+1).
 *
 * @param scanId - The completed scan to read results from
 * @returns Map of promptId -> PromptCompetitiveGapResult
 */
export async function getBatchCompetitiveGaps(
  scanId: string
): Promise<Map<string, PromptCompetitiveGapResult>> {
  const rows = await prisma.scanResult.findMany({
    where: { scanId },
    select: {
      promptId: true,
      mentioned: true,
      competitorsMentioned: true,
      error: true,
    },
  });

  const promptRowsMap = new Map<string, Array<{ mentioned: boolean; competitorsMentioned: unknown; error: string | null }>>();
  for (const r of rows) {
    let list = promptRowsMap.get(r.promptId);
    if (!list) {
      list = [];
      promptRowsMap.set(r.promptId, list);
    }
    list.push(r);
  }

  const resultMap = new Map<string, PromptCompetitiveGapResult>();
  for (const [promptId, promptRows] of promptRowsMap.entries()) {
    resultMap.set(promptId, calculatePromptCompetitiveGapFromRows(promptRows));
  }

  return resultMap;
}

