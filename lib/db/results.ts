import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma";
import type { AIProvider } from "@/generated/prisma";
import type { ParsedCompetitorMention, ScanSentiment } from "@/lib/scan/parse";

export interface ScanResultInput {
  promptId: string;
  provider: AIProvider;
  mentioned: boolean;
  position: number | null;
  sentiment: ScanSentiment | null;
  reasoning: string | null;
  rawResponse: string | null;
  competitorsMentioned: ParsedCompetitorMention[] | null;
  error: string | null;
}

/** Idempotency (invariant #7): clear partial results from a prior task attempt. */
export async function deleteScanResults(scanId: string) {
  return prisma.scanResult.deleteMany({ where: { scanId } });
}

/** Batch-persist one scan's results (Decision #8). */
export async function createScanResults(scanId: string, results: ScanResultInput[]) {
  if (results.length === 0) return { count: 0 };
  return prisma.scanResult.createMany({
    data: results.map((r) => ({
      scanId,
      promptId: r.promptId,
      provider: r.provider,
      mentioned: r.mentioned,
      position: r.position,
      sentiment: r.sentiment,
      reasoning: r.reasoning,
      rawResponse: r.rawResponse,
      error: r.error,
      competitorsMentioned: (r.competitorsMentioned as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
    })),
  });
}

/** Read helper for verification and the scoring spec. */
export async function getResultsForScan(scanId: string) {
  return prisma.scanResult.findMany({
    where: { scanId },
    orderBy: [{ provider: "asc" }, { promptId: "asc" }],
  });
}
