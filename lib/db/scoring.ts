import { prisma } from "./prisma";
import type { PromptType } from "@/generated/prisma";
import {
  calculateVisibilityScore,
  type ScoredScan,
  type ScoreResultRow,
} from "@/lib/scoring/calculator";

/** The most recent COMPLETED scan for a company — the only scan worth scoring. */
export async function getLatestCompletedScan(companyId: string) {
  return prisma.scan.findFirst({
    where: { companyId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
}

/**
 * Score the company's latest COMPLETED scan. Server-only (invariant #4) —
 * never called from a client component. Returns null when the company has no
 * completed scan; ScoredScan.score is null when the scan has no valid rows.
 * Optional promptType parameter filters scores by BRANDED or UNBRANDED (Organic).
 */
export async function getCompanyScore(
  companyId: string,
  promptType?: PromptType | "ALL"
): Promise<ScoredScan | null> {
  const scan = await getLatestCompletedScan(companyId);
  if (!scan) return null;

  const results = await prisma.scanResult.findMany({
    where: { scanId: scan.id },
    orderBy: [{ provider: "asc" }, { promptId: "asc" }],
    include: {
      prompt: {
        select: {
          promptType: true,
        },
      },
    },
  });

  const scoreRows: ScoreResultRow[] = results.map((r) => ({
    mentioned: r.mentioned,
    position: r.position,
    sentiment: r.sentiment,
    competitorsMentioned: Array.isArray(r.competitorsMentioned)
      ? (r.competitorsMentioned as { name?: unknown }[])
          .map((c) => (typeof c?.name === "string" ? c.name : ""))
          .filter(Boolean)
      : [],
    error: r.error,
    promptType: r.prompt.promptType,
  }));

  return calculateVisibilityScore(scoreRows, promptType);
}
