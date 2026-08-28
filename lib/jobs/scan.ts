import { task, logger, AbortTaskRunError } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { getPromptsForCompany } from "@/lib/db/prompts";
import { deleteScanResults, createScanResults } from "@/lib/db/results";
import { saveScanRecommendations } from "@/lib/db/recommendations";
import type { ScanResultInput } from "@/lib/db/results";
import { AIProviderError } from "@/lib/providers/errors";
import { getAvailableProviders } from "@/lib/providers/registry";
import { TO_PRISMA_PROVIDER } from "@/lib/providers/types";
import type { AIProvider, AIProviderName, AIResponse } from "@/lib/providers/types";
import { buildScanPrompt } from "@/lib/scan/prompt";
import { parseScanResponse } from "@/lib/scan/parse";
import {
  SCAN_MAX_TOKENS,
  SCAN_TEMPERATURE,
  SCAN_PROVIDER_MAX_ATTEMPTS,
  SCAN_RETRY_BASE_MS,
  SCAN_RETRY_MAX_MS,
} from "@/lib/scan/config";
import { scanResultKey, getCachedScanResult, setCachedScanResult } from "@/lib/utils/cache";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Bounded retries for retryable provider errors (Decision #3). */
async function askWithRetry(provider: AIProvider, prompt: string): Promise<AIResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SCAN_PROVIDER_MAX_ATTEMPTS; attempt++) {
    try {
      return await provider.ask(prompt, {
        maxTokens: SCAN_MAX_TOKENS,
        temperature: SCAN_TEMPERATURE,
      });
    } catch (error) {
      lastError = error;
      const retryable = error instanceof AIProviderError && error.retryable;
      if (!retryable || attempt === SCAN_PROVIDER_MAX_ATTEMPTS - 1) throw error;
      const backoff = Math.min(SCAN_RETRY_BASE_MS * 2 ** attempt, SCAN_RETRY_MAX_MS);
      logger.warn("Provider call retrying", {
        provider: provider.name,
        attempt: attempt + 1,
        backoffMs: backoff,
      });
      await sleep(backoff);
    }
  }
  throw lastError; // unreachable — TS exhaustiveness
}

import { extractCitations } from "@/lib/scan/citations";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { captureJobError } from "@/lib/monitoring/sentry";
import * as Sentry from "@sentry/nextjs";

// Trigger.dev workers bundle this file independently and never run Next.js's
// instrumentation.ts, so initialize Sentry here with the same config so
// captureJobError() actually reports (spec 21, "Sentry + Trigger.dev").
// No-op (silently disabled) when SENTRY_DSN is missing.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV !== "development" || !!process.env.SENTRY_DSN,
});

/** One provider × prompt check → one ScanResultInput (Decision #7, #8, #9). */
async function scanPrompt(input: {
  provider: AIProvider;
  prompt: { id: string; text: string };
  company: { id: string; name: string; domain: string; competitors?: Array<{ domain: string }> };
}): Promise<ScanResultInput> {
  const { provider, prompt, company } = input;
  const competitorDomains = company.competitors?.map((c) => c.domain) ?? [];
  const prismaProvider = TO_PRISMA_PROVIDER[provider.name] as import("@/generated/prisma").AIProvider;
  const providerKey =
    process.env.USE_MOCK_PROVIDERS === "true" ? `mock:${provider.name}` : provider.name;
  const cacheKey = scanResultKey(company.id, prompt.id, providerKey);

  // Cache-first: a 24h-hit skips the provider call entirely but still persists (Decision #7).
  const cached = await getCachedScanResult(cacheKey);
  if (cached) {
    return {
      promptId: prompt.id,
      provider: prismaProvider,
      mentioned: cached.mentioned,
      position: cached.position,
      sentiment: cached.sentiment,
      reasoning: cached.reasoning,
      rawResponse: null, // only the parsed result is cached (Decision #7)
      competitorsMentioned: cached.competitors,
      error: null,
      citations: [],
    };
  }

  try {
    const response = await askWithRetry(
      provider,
      buildScanPrompt({
        question: prompt.text,
        companyName: company.name,
        companyDomain: company.domain,
      })
    );

    const citations = extractCitations(
      response.content,
      company.domain,
      competitorDomains
    );

    const parsed = parseScanResponse(response.content);
    if (!parsed.ok) {
      // Unparseable response → error row, raw response preserved for debugging.
      return {
        promptId: prompt.id,
        provider: prismaProvider,
        mentioned: false,
        position: null,
        sentiment: null,
        reasoning: null,
        rawResponse: response.content,
        competitorsMentioned: null,
        error: parsed.error,
        citations,
      };
    }

    // Cache BEFORE persist (invariant #3). Failures are never cached.
    await setCachedScanResult(cacheKey, parsed.data);

    return {
      promptId: prompt.id,
      provider: prismaProvider,
      mentioned: parsed.data.mentioned,
      position: parsed.data.position,
      sentiment: parsed.data.sentiment,
      reasoning: parsed.data.reasoning,
      rawResponse: response.content,
      competitorsMentioned: parsed.data.competitors,
      error: null,
      citations,
    };
  } catch (error) {
    if (error instanceof AIProviderError) {
      return {
        promptId: prompt.id,
        provider: prismaProvider,
        mentioned: false,
        position: null,
        sentiment: null,
        reasoning: null,
        rawResponse: null,
        competitorsMentioned: null,
        error: error.message,
        citations: [],
      };
    }
    throw error;
  }
}

export const runScan = task({
  id: "scan-company",
  run: async (
    payload: { scanId: string; providers?: AIProviderName[] },
    { ctx }
  ) => {
    const { scanId, providers: allowedNames } = payload;

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        company: { include: { competitors: true, user: { select: { clerkId: true } } } },
      },
    });
    if (!scan) throw new AbortTaskRunError("Scan not found");

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    try {
      const allConfigured = getAvailableProviders();
      const providers = allowedNames
        ? allConfigured.filter((p) => allowedNames.includes(p.name))
        : allConfigured;

      const prompts = await getPromptsForCompany(scan.companyId);

      await deleteScanResults(scanId); // retry idempotency (Decision #8)

      const results: ScanResultInput[] = [];
      const scanTasks: Array<() => Promise<ScanResultInput>> = [];

      for (const provider of providers) {
        for (const prompt of prompts) {
          scanTasks.push(() =>
            scanPrompt({
              provider,
              prompt: { id: prompt.id, text: prompt.text },
              company: scan.company,
            })
          );
        }
      }

      // Execute in bounded parallel batches (concurrency = 5) with inter-batch delay to respect provider rate limits
      const BATCH_SIZE = 5;
      for (let i = 0; i < scanTasks.length; i += BATCH_SIZE) {
        const batch = scanTasks.slice(i, i + BATCH_SIZE).map((fn) => fn());
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        if (i + BATCH_SIZE < scanTasks.length) {
          await sleep(1500); // Inter-batch delay to avoid rate limit spikes (e.g. Gemini free tier 5 RPM)
        }
      }

      await createScanResults(scanId, results);
      await saveScanRecommendations(scan.companyId, scanId);
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      const failed = results.filter((r) => r.error).length;
      await trackEvent(EVENTS.SCAN_COMPLETED, scan.company.user.clerkId, {
        scan_id: scanId,
        company_id: scan.companyId,
        prompt_count: prompts.length,
        provider_count: providers.length,
        result_count: results.length,
        failed_count: failed,
      });
      logger.info("Scan completed", {
        scanId,
        companyId: scan.companyId,
        prompts: prompts.length,
        providers: providers.length,
        results: results.length,
        failed,
        attempt: ctx.attempt.number,
      });

      return {
        status: "COMPLETED",
        prompts: prompts.length,
        providers: providers.length,
        results: results.length,
        failed,
      };
    } catch (error) {
      captureJobError(error, "scan-company", scanId);
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "FAILED", completedAt: new Date() },
      });
      await trackEvent(EVENTS.SCAN_FAILED, scan.company.user.clerkId, {
        scan_id: scanId,
      });
      logger.error("Scan failed", { scanId, error });
      throw error; // SDK retry (config default: 3 attempts)
    }
  },
});
