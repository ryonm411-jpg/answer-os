import { task, logger, AbortTaskRunError } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { getPromptsForCompany } from "@/lib/db/prompts";
import { getAvailableProviders } from "@/lib/providers/registry";
import type { AIProvider } from "@/lib/providers/types";

/**
 * Placeholder for the visibility scanner pipeline spec (tracker #2).
 * Replaced by the real implementation: provider.ask(prompt), parse
 * mention/position/sentiment, Redis cache, persist ScanResult rows.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function scanPrompt(_provider: AIProvider, _prompt: { id: string; text: string }, _scanId: string): Promise<void> {
  // pipeline spec — intentionally a no-op here
}

export const runScan = task({
  id: "scan-company",
  // maxDuration inherits 3600 from the config; no queue/concurrency yet (Decision #4)
  run: async (payload: { scanId: string }, { ctx }) => {
    const { scanId } = payload;

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { company: true },
    });
    if (!scan) {
      // Replayed from the dashboard against a deleted scan — nothing to do.
      // Non-retryable: abort so Trigger.dev doesn't retry 3 times for a missing row.
      throw new AbortTaskRunError("Scan not found");
    }

    // RUNNING + startedAt
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    try {
      const prompts = await getPromptsForCompany(scan.companyId);
      const providers = getAvailableProviders(); // only configured providers (09)

      // Sequential scaffold — fan-out/concurrency is post-MVP (Decision #4)
      for (const provider of providers) {
        for (const prompt of prompts) {
          await scanPrompt(provider, prompt, scanId);
        }
      }

      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      logger.info("Scan completed", {
        scanId,
        companyId: scan.companyId,
        prompts: prompts.length,
        providers: providers.length,
        attempt: ctx.attempt.number,
      });

      return { status: "COMPLETED", prompts: prompts.length, providers: providers.length };
    } catch (error) {
      // Never an unhandled exception (Provider Integration Checklist #6):
      // surface as FAILED so the dashboard/report can show it.
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "FAILED", completedAt: new Date() },
      });
      logger.error("Scan failed", { scanId, error });
      throw error; // let Trigger.dev retry (config default: 3 attempts)
    }
  },
});
