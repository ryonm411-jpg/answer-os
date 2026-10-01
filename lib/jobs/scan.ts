import { task, logger, AbortTaskRunError } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { getPromptsForCompany } from "@/lib/db/prompts";
import { deleteScanResults, createScanResults } from "@/lib/db/results";
import { saveScanRecommendations } from "@/lib/db/recommendations";
import type { ScanResultInput } from "@/lib/db/results";
import { AIProviderError } from "@/lib/providers/errors";
import { getAvailableProviders } from "@/lib/providers/registry";
import { getProviderProfile } from "@/lib/providers/profiles";
import { TO_PRISMA_PROVIDER } from "@/lib/providers/types";
import type { AIProvider, AIProviderName, AIResponse } from "@/lib/providers/types";
import type { PromptType } from "@/generated/prisma";
import { buildScanPrompt, buildUnbrandedScanPrompt } from "@/lib/scan/prompt";
import { parseScanResponse, parseUnbrandedScanResponse } from "@/lib/scan/parse";
import {
  SCAN_MAX_TOKENS,
  SCAN_TEMPERATURE,
  SCAN_RETRY_BASE_MS,
  SCAN_RETRY_MAX_MS,
} from "@/lib/scan/config";
import { scanResultKey, getCachedScanResult, setCachedScanResult } from "@/lib/utils/cache";
import { extractCitations } from "@/lib/scan/citations";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { captureJobError } from "@/lib/monitoring/sentry";
import * as Sentry from "@sentry/nextjs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV !== "development" || !!process.env.SENTRY_DSN,
});

/** Bounded retries for retryable provider errors using provider profile limits. */
async function askWithRetry(provider: AIProvider, prompt: string): Promise<AIResponse> {
  const profile = getProviderProfile(provider.name);
  let lastError: unknown;
  // Groq free tier: allow up to 2 attempts so a transient 429 can recover after backoff.
  // NVIDIA free tier: allow up to 2 attempts so transient cold-start timeouts can recover.
  // Other free-tier providers still fail fast (maxAttempts=1).
  const maxAttempts =
    provider.name === "groq" || provider.name === "nvidia"
      ? 2
      : profile.tier === "free"
      ? 1
      : profile.maxRetries;
  // Groq free tier: 900 tokens/request → ~8 safe requests per minute under 8k TPM.
  const maxTokens = provider.name === "groq" ? 900 : SCAN_MAX_TOKENS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await provider.ask(prompt, {
        maxTokens,
        temperature: SCAN_TEMPERATURE,
        timeoutMs: profile.requestTimeoutMs,
      });
    } catch (error) {
      lastError = error;
      const retryable = error instanceof AIProviderError && error.retryable;
      if (!retryable || attempt === maxAttempts - 1) throw error;

      const isRateLimit =
        error instanceof AIProviderError &&
        (error.statusCode === 429 ||
          error.message.includes("429") ||
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("quota"));

      // Groq rate limits: back off for 15s to let the TPM window recover before retrying.
      // Other free-tier rate limits: fail fast (no multi-attempt backoff).
      if (isRateLimit && profile.tier === "free" && provider.name !== "groq") {
        throw error;
      }

      const backoff = isRateLimit
        ? provider.name === "groq"
          ? 15_000 // 15s: safely clear Groq's 1-minute TPM sliding window
          : Math.min(2_000 * (attempt + 1), 5_000)
        : Math.min(SCAN_RETRY_BASE_MS * 2 ** attempt, SCAN_RETRY_MAX_MS);

      logger.warn("Provider call retrying", {
        provider: provider.name,
        attempt: attempt + 1,
        isRateLimit,
        backoffMs: backoff,
      });
      await sleep(backoff);
    }
  }
  throw lastError;
}

/** One provider × prompt check → one ScanResultInput (Decision #7, #8, #9). */
async function scanPrompt(input: {
  provider: AIProvider;
  prompt: { id: string; text: string; promptType?: PromptType };
  company: { id: string; name: string; domain: string; competitors?: Array<{ domain: string }> };
}): Promise<ScanResultInput> {
  const { provider, prompt, company } = input;
  const competitorDomains = company.competitors?.map((c) => c.domain) ?? [];
  const prismaProvider = TO_PRISMA_PROVIDER[provider.name] as import("@/generated/prisma").AIProvider;
  const profile = getProviderProfile(provider.name);
  const providerKey =
    process.env.USE_MOCK_PROVIDERS === "true" ? `mock:${provider.name}` : provider.name;
  const cacheKey = scanResultKey(company.id, prompt.id, providerKey);

  // Cache-first: a 24h-hit skips the provider call entirely but still persists (Decision #7).
  const cached = await getCachedScanResult(cacheKey);
  if (cached) {
    return {
      promptId: prompt.id,
      provider: prismaProvider,
      model: profile.model,
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
    const isBranded = prompt.promptType === "BRANDED";

    const questionText =
      profile.tier === "free" && prompt.text.length > 500
        ? prompt.text.slice(0, 500)
        : prompt.text;

    const scanText = isBranded
      ? buildScanPrompt({
          question: questionText,
          companyName: company.name,
          companyDomain: company.domain,
        })
      : buildUnbrandedScanPrompt({
          question: questionText,
          companyName: company.name,
          companyDomain: company.domain,
        });

    const finalScanText = scanText;

    // Pre-dispatch token/request budgeting: check estimated payload size
    const estimatedInputTokens = Math.ceil(finalScanText.length / 4);
    if (estimatedInputTokens > profile.tokensPerMinute) {
      return {
        promptId: prompt.id,
        provider: prismaProvider,
        model: profile.model,
        mentioned: false,
        position: null,
        sentiment: null,
        reasoning: null,
        rawResponse: null,
        competitorsMentioned: null,
        error: `Payload size (${estimatedInputTokens} tokens) exceeds provider budget (${profile.tokensPerMinute} TPM)`,
        citations: [],
      };
    }

    const response = await askWithRetry(provider, finalScanText);

    const citations = extractCitations(
      response.content,
      company.domain,
      competitorDomains
    );

    const parsed = isBranded
      ? parseScanResponse(response.content)
      : parseUnbrandedScanResponse(response.content, company.name, company.domain);

    if (!parsed.ok) {
      return {
        promptId: prompt.id,
        provider: prismaProvider,
        model: profile.model,
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
      model: profile.model,
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
    const errorMsg =
      error instanceof AIProviderError
        ? error.message
        : error instanceof Error
        ? error.message
        : String(error);

    return {
      promptId: prompt.id,
      provider: prismaProvider,
      model: profile.model,
      mentioned: false,
      position: null,
      sentiment: null,
      reasoning: null,
      rawResponse: null,
      competitorsMentioned: null,
      error: errorMsg,
      citations: [],
    };
  }
}

export const runScan = task({
  id: "scan-company",
  retry: {
    maxAttempts: 1,
  },
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

      // Provider-aware bounded concurrency execution with real-time incremental persistence & circuit breakers
      for (const provider of providers) {
        const profile = getProviderProfile(provider.name);
        const concurrency = profile.maxConcurrency;
        let consecutiveRateLimits = 0;
        let circuitBrokenReason: string | null = null;

        for (let i = 0; i < prompts.length; i += concurrency) {
          const batchPrompts = prompts.slice(i, i + concurrency);

          let batchResults: ScanResultInput[];
          if (circuitBrokenReason) {
            const prismaProvider = TO_PRISMA_PROVIDER[provider.name] as import("@/generated/prisma").AIProvider;
            batchResults = batchPrompts.map((p) => ({
              promptId: p.id,
              provider: prismaProvider,
              model: profile.model,
              mentioned: false,
              position: null,
              sentiment: null,
              reasoning: null,
              rawResponse: null,
              competitorsMentioned: null,
              error: circuitBrokenReason!,
              citations: [],
            }));
          } else {
            batchResults = await Promise.all(
              batchPrompts.map((prompt) =>
                scanPrompt({
                  provider,
                  prompt: { id: prompt.id, text: prompt.text, promptType: prompt.promptType },
                  company: scan.company,
                })
              )
            );

            // Circuit breaker check: track consecutive rate limit or quota failures
            const rateLimitErrors = batchResults.filter(
              (r) =>
                r.error &&
                (r.error.includes("429") ||
                  r.error.toLowerCase().includes("rate limit") ||
                  r.error.toLowerCase().includes("quota") ||
                  r.error.toLowerCase().includes("budget"))
            );

            if (rateLimitErrors.length > 0) {
              consecutiveRateLimits += rateLimitErrors.length;
              if (consecutiveRateLimits >= 3 && profile.tier === "free") {
                circuitBrokenReason = `Provider ${provider.name} rate limit exceeded (circuit broken)`;
                logger.warn("Provider rate limit circuit broken, short-circuiting remaining prompts", {
                  provider: provider.name,
                  consecutiveRateLimits,
                });
              }
            } else {
              consecutiveRateLimits = 0;
            }
          }

          results.push(...batchResults);

          // Persist batch results incrementally as each prompt check finishes
          await createScanResults(scanId, batchResults);

          if (i + concurrency < prompts.length && !circuitBrokenReason) {
            // Groq free tier: 900 tokens/req at 8k TPM → ~8 req/min max.
            // Wait 9s between batches to stay comfortably under the sliding window.
            // Other free-tier providers (Gemini): 300ms is sufficient.
            const delayMs = provider.name === "groq" ? 9_000 : profile.tier === "free" ? 300 : 100;
            await sleep(delayMs);
          }
        }
      }

      await saveScanRecommendations(scan.companyId, scanId);
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      const failed = results.filter((r) => r.error).length;
      if (scan.company.user?.clerkId) {
        await trackEvent(EVENTS.SCAN_COMPLETED, scan.company.user.clerkId, {
          scan_id: scanId,
          company_id: scan.companyId,
          prompt_count: prompts.length,
          provider_count: providers.length,
          result_count: results.length,
          failed_count: failed,
        });
      }
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
      if (scan?.company?.user?.clerkId) {
        await trackEvent(EVENTS.SCAN_FAILED, scan.company.user.clerkId, {
          scan_id: scanId,
        });
      }
      logger.error("Scan failed", { scanId, error });
      return {
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
