import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma";
import type { AIProvider, CitationType as PrismaCitationType } from "@/generated/prisma";
import type { ParsedCompetitorMention, ScanSentiment } from "@/lib/scan/parse";
import type { ExtractedCitation } from "@/lib/scan/citations";

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
  citations?: ExtractedCitation[];
}

/** Idempotency (invariant #7): clear partial results from a prior task attempt. */
export async function deleteScanResults(scanId: string) {
  return prisma.scanResult.deleteMany({ where: { scanId } });
}

/** Batch-persist one scan's results and extracted domain citations. */
export async function createScanResults(scanId: string, results: ScanResultInput[]) {
  if (results.length === 0) return { count: 0 };

  return prisma.$transaction(async (tx) => {
    const createdResults = await Promise.all(
      results.map(async (r) => {
        const created = await tx.scanResult.create({
          data: {
            scanId,
            promptId: r.promptId,
            provider: r.provider,
            mentioned: r.mentioned,
            position: r.position,
            sentiment: r.sentiment,
            reasoning: r.reasoning,
            rawResponse: r.rawResponse,
            error: r.error,
            competitorsMentioned:
              (r.competitorsMentioned as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
          },
        });

        if (r.citations && r.citations.length > 0) {
          await tx.scanResultCitation.createMany({
            data: r.citations.map((c) => ({
              scanResultId: created.id,
              domain: c.domain,
              url: c.url,
              title: c.title,
              citationType: c.citationType as PrismaCitationType,
            })),
          });
        }

        return created;
      })
    );

    return { count: createdResults.length };
  });
}

/** Read helper for verification and the scoring spec. */
export async function getResultsForScan(scanId: string) {
  return prisma.scanResult.findMany({
    where: { scanId },
    orderBy: [{ provider: "asc" }, { promptId: "asc" }],
  });
}
