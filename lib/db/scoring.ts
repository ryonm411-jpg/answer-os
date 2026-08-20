import { prisma } from "./prisma";
import { getResultsForScan } from "./results";
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
 */
export async function getCompanyScore(companyId: string): Promise<ScoredScan | null> {
  const scan = await getLatestCompletedScan(companyId);
  if (!scan) return null;

  const rows = await getResultsForScan(scan.id);

  return calculateVisibilityScore(
    rows.map(
      (r): ScoreResultRow => ({
        mentioned: r.mentioned,
        position: r.position,
        sentiment: r.sentiment, // Prisma Sentiment enum ≈ ScanSentiment (same literals)
        competitorsMentioned: Array.isArray(r.competitorsMentioned)
          ? (r.competitorsMentioned as { name?: unknown }[])
              .map((c) => (typeof c?.name === "string" ? c.name : ""))
              .filter(Boolean)
          : [],
        error: r.error,
      })
    )
  );
}
