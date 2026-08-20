# Visibility Scanner Pipeline

## Goal

Implement the actual per-prompt scan execution that spec `11-trigger-dev-jobs.md` deliberately stubbed out. This spec fills in the `scanPrompt` hole: for every configured provider × prompt, ask the AI the buyer question, parse mention/position/sentiment/competitors out of the response, cache the parsed result in Upstash Redis (invariant #3: cache **before** persist), and persist `ScanResult` rows — all inside the existing `runScan` task.

```
RunScanDialog → POST /api/scans (stale-PENDING sweep → create PENDING → tasks.trigger)
   → runScan task → RUNNING → deleteScanResults (retry idempotency, invariant #7)
     → for provider × prompt:
         cache hit  → reuse parsed result, persist row (no provider call)
         cache miss → buildScanPrompt → askWithRetry (bounded, backoff for retryable errors)
                    → parseScanResponse (JSON extraction + normalization)
                    → parse failure / provider failure → ScanResult row with error
                    → success → setCachedScanResult (before persist) → row with data
     → createScanResults (one batch) → COMPLETED
```

Do **not** implement:

- the visibility score algorithm (`lib/scoring/`, its own spec — tracker #3)
- the dashboard UI, scan-status polling, or the cache **read** path (dashboard/scoring specs)
- competitor auto-discovery into the `Competitor` table (competitors spec — this pipeline only *records* `competitorsMentioned` on the result)
- the recommendations engine, weekly reports, or Monday re-scans
- fan-out, queues, per-provider concurrency (deferred — see Decisions #10)
- per-scan request options (provider subset, prompt filters, cache-bypass flags)

Follow:

- `architecture.md` (invariant #1: all scanning runs in Trigger.dev jobs; invariant #2: AI calls go through `lib/providers/`; invariant #3: cache-before-persist, cache-first read; invariant #7: scan idempotency)
- `code-standards.md` (core logic unit-tested, co-located tests, thin modules, no `any`)
- `ai-workflow-rules.md` (Provider Integration Checklist #6 — provider errors surface as failed results, never unhandled; Database Migration Checklist for the `ScanResult.error` column)
- `11-trigger-dev-jobs.md` (the task skeleton this spec fills; the deferred `scanPrompt` contract; the assigned stale-`PENDING` recovery)
- `09-ai-provider-abstraction.md` (`ask()`, `AIResponse`, `AIProviderError.retryable`, `TO_PRISMA_PROVIDER`, `getAvailableProviders()`)
- `10-prompt-library.md` (`getPromptsForCompany` — the prompt set the task iterates)
- `answeros-spec.md` (`ScanResult` model, `lib/utils/cache.ts` + `lib/scan/` file organization, cache TTL 24h)

---

## Prerequisites

Before beginning implementation:

- Read `AGENTS.md`.
- Confirm `11-trigger-dev-jobs.md` is implemented — `runScan` (`id: "scan-company"`) exists in `lib/jobs/scan.ts` with the `scanPrompt` no-op stub, and `POST /api/scans` triggers it.
- Confirm `09` is implemented — `ask()` returns `AIResponse { content, model, tokensUsed, latencyMs }`; `AIProviderError` exposes `retryable`; `TO_PRISMA_PROVIDER` maps `AIProviderName` → Prisma enum; `getAvailableProviders()` returns only configured providers.
- Confirm `10` is implemented — `getPromptsForCompany(companyId)` returns curated + company suggestions.
- **Human step (cannot be automated):** create an Upstash Redis database (https://console.upstash.com) and paste its REST URL + token into `.env.local` as `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (never committed). Until then the cache degrades to a no-op — scanning still works, writing to Postgres only (Decisions #6).

---

## Current State

Reference points already in the codebase:

- `lib/jobs/scan.ts` — `runScan` with the full lifecycle (re-read scan, `RUNNING` + `startedAt`, sequential provider × prompt loop through the `scanPrompt` **no-op stub**, `COMPLETED`/`FAILED` + `completedAt`, `logger`, JSON-serializable return). Imports `getAvailableProviders`, `getPromptsForCompany`, `prisma`
- `app/api/scans/route.ts` — `POST /api/scans`: Clerk auth → `getCompanyByClerkId` → single-active-scan guard (409) → create `PENDING` row → `tasks.trigger<typeof runScan>("scan-company", { scanId })` → 202/502
- `lib/providers/` — `AIProvider.ask(prompt, config?)`, `AIResponse`, `AIProviderError` (with `retryable` + `statusCode`), `TO_PRISMA_PROVIDER`, `getAvailableProviders()`, `getProvider()`, `createMockProvider()` (09)
- `lib/db/prompts.ts` — `getPromptsForCompany(companyId)` (curated + `AI_SUGGESTED`, ordered by category then text) (10)
- `prisma/schema.prisma` — `ScanResult` (`scanId`, `promptId`, `provider`, `mentioned`, `position`, `sentiment`, `reasoning`, `rawResponse`, `competitorsMentioned Json?`), `Scan`/`ScanStatus`, `Sentiment` enum (POSITIVE/NEUTRAL/NEGATIVE), `AIProvider` enum — all present since 05
- `package.json` — **no** `@upstash/redis`; no `lib/utils/cache.ts`, no `lib/scan/`, no `lib/db/results.ts`
- `trigger.config.ts` — `dirs: ["./lib/jobs"]`, `prismaExtension({ mode: "modern" })` (11)

Known gaps this feature fills:

- `scanPrompt` is a no-op — no prompt is ever asked, no result is ever parsed or persisted, so scans complete with zero data
- invariant #3 (cache-before-persist) is unmet — no Redis client, no cache helper, no caching layer
- failed per-prompt checks (rate limit, timeout, bad key) are indistinguishable from clean "not mentioned" results — `ScanResult` has no error field
- a `PENDING` scan whose trigger never dequeued blocks all future scans forever (the 409 guard) — 11 assigned stale-`PENDING` recovery to this spec

---

## Decisions (2026-08-16)

| #  | Decision                                                                                                | Rationale                                                                                                                         |
| -- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Pipeline logic lives in `lib/scan/` (pure modules: `prompt.ts`, `parse.ts`, `config.ts`), orchestrated by `lib/jobs/scan.ts` | Parsing/prompt-building are the unit-testable "core logic" per `code-standards.md`; keeping them out of the task module keeps the job thin and the tests DB/SDK-free |
| 2  | Single `ask()` plain-text call + JSON extracted from the response — **no `askJSON` on the provider layer** | Structured-output support varies across the 4 providers (only OpenAI tool-calls are first-class; JSON mode is not universal). A tolerant parser (fences, prose-wrapped JSON) is one code path, unit-testable, and works on all four providers |
| 3  | Per-prompt retry for `retryable` `AIProviderError` (bounded: 3 total attempts, exponential backoff 1s/3s capped 10s); non-retryable or exhausted retries → `error` row, continue the loop | Answers 11's assigned question: transient provider failures must not fail whole scans. Only unexpected (non-`AIProviderError`) errors fail the scan and trigger the SDK retry |
| 4  | Add `ScanResult.error String?` (user decision)                                                          | A failed check (mentioned=false + error message) must be distinguishable from a clean non-mention, so scoring can exclude and the dashboard can flag it. Conflation via `reasoning` would corrupt scoring |
| 5  | Include Upstash Redis in this spec (user decision) — `@upstash/redis` + `UPSTASH_REDIS_REST_URL`/`TOKEN` + cache-before-persist write path | Invariant #3 requires caching; the pipeline cannot be built correctly without the cache write. Cache-first read (dashboard) arrives with the scoring spec |
| 6  | Cache is best-effort: missing/unavailable Redis → helpers no-op with a logged warning, scan continues to Postgres | Scanning must never be blocked by a cache outage; `architecture.md` states nothing in Redis is irreplaceable (Postgres is the durable source of truth). This is a documented, deliberate deviation-from-ideal behavior, not a silent invariant violation |
| 7  | Cache key: `scan:{companyId}:{promptId}:{provider}` with the `ParsedScanResponse` as the value; TTL 24h (`SCAN_CACHE_TTL_SECONDS = 86400`) | Keyed per company+prompt+provider so re-scans within 24h skip duplicate provider spend. TTL matches `architecture.md` (per-plan configurable post-MVP). Failures are never cached — the next scan retries them |
| 8  | Retry idempotency: `deleteScanResults(scanId)` before the loop; rows accumulate in memory and persist via one `createMany` at the end | A whole-scan retry (SDK default 3 attempts) must not double-write rows (invariant #7). One batched write is efficient for ≤ ~480 rows and keeps the failure path simple — a mid-loop throw marks the scan FAILED and the retry redoes it |
| 9  | Position/sentiment are **model-reported** via the metadata block (position = 1-based rank among recommended options, 1 = first/primary, null when not mentioned) | A model-classified scale is consistent across answer formats and is exactly what the score algorithm needs. No substring/text-index heuristics (false positives, format-dependent) |
| 10 | Keep the single sequential loop from 11 — no fan-out/concurrency in MVP | Unchanged from 11 (Decision #4): 100+ prompts × 4 providers fits the 10-minute success criterion sequentially; queues/`batchTriggerAndWait` are post-MVP |
| 11 | Stale-`PENDING` recovery in `POST /api/scans`: rows `PENDING` longer than 10 minutes are swept to `FAILED` before the 409 guard | 11's open question, closed: a trigger that succeeded but never dequeued can no longer block future scans forever. Route-level sweep is the smallest correct fix (no new job needed) |
| 12 | Injecting the tracked company into the scan prompt (with the metadata request) is accepted for MVP | Real AI-rank products do this; the bias cost is outweighed by reliable structured output. A non-injective alternative (ask + report all companies, match by name/domain) is noted in Future |

---

## Dependencies

Install:

```bash
npm install @upstash/redis
```

`@upstash/redis` is an HTTP/REST client (no TCP sockets) — works in the Trigger.dev Node runtime and serverless. Current major version at time of writing: 1.x (`new Redis({ url, token })`, `get<T>`, `set(key, value, { ex })`). Verify the installed version's API at implementation time.

No other new dependencies. All AI calls reuse the `lib/providers/` layer from 09.

---

## Environment Variables

| Variable                    | Required for     | Notes                                                                                                          |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`    | caching          | From the Upstash console → Redis database → REST API section. Never committed.                                  |
| `UPSTASH_REDIS_REST_TOKEN`  | caching          | Same console panel. Never committed.                                                                           |
| provider keys (`OPENAI_API_KEY`, …) | real scanning    | Already documented in `09-ai-provider-abstraction.md`; the pipeline reads them via `getAvailableProviders()`     |

Provider keys absent → the scan completes with zero provider work (11's existing behavior). Redis vars absent → cache helpers no-op (Decision #6).

---

## Schema Changes

Modify `prisma/schema.prisma` (Database Migration Checklist in `ai-workflow-rules.md`) — one new nullable field on `ScanResult`:

```prisma
model ScanResult {
  id                   String     @id @default(cuid())
  scanId               String
  scan                 Scan       @relation(fields: [scanId], references: [id], onDelete: Cascade)
  promptId             String
  prompt               Prompt     @relation(fields: [promptId], references: [id], onDelete: Cascade)
  provider             AIProvider
  mentioned            Boolean
  position             Int?
  sentiment            Sentiment?
  reasoning            String?
  rawResponse          String?
  competitorsMentioned Json?
  error                String?    // non-null ⇔ this prompt×provider check failed; mentioned is then always false
  createdAt            DateTime   @default(now())

  @@index([scanId])
  @@index([promptId])
}
```

- `error` is **nullable** — null on success (including clean non-mentions); set to a user-safe message when the check failed (provider error or unparseable response)
- no new index needed (rows are already covered by `@@index([scanId])`)
- Migration: `npx prisma migrate dev --name add_scan_result_error`, then `npx prisma generate` (client regenerates into `generated/prisma`)

---

## File Structure

```
lib/
  scan/
    config.ts                 # SCAN_MAX_TOKENS, SCAN_TEMPERATURE, retry/backoff constants
    prompt.ts                 # ScanPromptInput + buildScanPrompt
    parse.ts                  # ParsedScanResponse, ParsedCompetitorMention, parseScanResponse, parseSentiment
    prompt.test.ts            # prompt template tests (co-located)
    parse.test.ts             # JSON extraction + normalization tests (co-located)
  utils/
    cache.ts                  # lazy Upstash Redis client + scanResultKey + get/setCachedScanResult
    cache.test.ts             # key scheme, TTL, degraded no-op tests (co-located)
  db/
    results.ts                # thin ScanResult helpers: deleteScanResults, createScanResults, getResultsForScan
  jobs/
    scan.ts                   # runScan — real scanPrompt (cache → ask → parse → persist), askWithRetry
app/
  api/
    scans/
      route.ts                # POST /api/scans + stale-PENDING sweep before the 409 guard
```

No `"use client"` anywhere — all modules are server-only by construction.

---

## Scan Config — `lib/scan/config.ts`

```ts
/** Token budget for scan calls: the completion plus the metadata block needs
 *  more room than the provider layer's 2048 default. */
export const SCAN_MAX_TOKENS = 4096;
/** Keep the provider default (0.2): deterministic, factual answers for scanning. */
export const SCAN_TEMPERATURE = 0.2;
/** 1 initial call + 2 retries, for retryable AIProviderError only (Decision #3). */
export const SCAN_PROVIDER_MAX_ATTEMPTS = 3;
export const SCAN_RETRY_BASE_MS = 1000;
export const SCAN_RETRY_MAX_MS = 10_000;
```

## Scan Prompt — `lib/scan/prompt.ts`

```ts
export interface ScanPromptInput {
  question: string;       // the buyer-question prompt text
  companyName: string;    // e.g. "Acme Inc"
  companyDomain: string;  // e.g. "acme.com"
}

export function buildScanPrompt({ question, companyName, companyDomain }: ScanPromptInput): string {
  return [
    `You are answering a question from someone choosing software.`,
    ``,
    `Question: "${question}"`,
    ``,
    `Answer the question as you normally would. At the very end of your answer, output a single JSON object with EXACTLY this shape and no markdown fences:`,
    `{"mentioned": true, "position": 1, "sentiment": "positive", "reasoning": "short sentence", "competitors": [{"name": "OtherCo", "position": 2, "sentiment": "neutral"}]}`,
    ``,
    `We are tracking how often "${companyName}" (${companyDomain}) is recommended.`,
    `- "mentioned": whether ${companyName} appears in your answer (true or false)`,
    `- "position": the 1-based rank of ${companyName} among the options you recommend; 1 = first/primary recommendation; null when not mentioned`,
    `- "sentiment": your overall sentiment toward ${companyName}: "positive", "neutral", or "negative"; null when not mentioned`,
    `- "reasoning": one short sentence explaining your evaluation of ${companyName}; null when not mentioned`,
    `- "competitors": every OTHER company you mentioned, each with "name", "position", and "sentiment" using the same rules`,
  ].join("\n");
}
```

Notes:

- The question is interpolated inside quotes — curated prompts are plain sentences, so no escaping is needed in MVP (see Future for a structured variant)
- The tracked company is injected deliberately (Decision #12); the metadata contract is the single parse target (Decision #2)

## Response Parser — `lib/scan/parse.ts`

Pure, import-free module (no Prisma, no Redis) so it is trivially unit-testable:

```ts
export type ScanSentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export interface ParsedCompetitorMention {
  name: string;
  position: number | null;
  sentiment: ScanSentiment | null;
}

export interface ParsedScanResponse {
  mentioned: boolean;
  position: number | null;
  sentiment: ScanSentiment | null;
  reasoning: string | null;
  competitors: ParsedCompetitorMention[];
}

/** ok:false means the response contained no usable metadata JSON object. */
export type ParseResult =
  | { ok: true; data: ParsedScanResponse }
  | { ok: false; error: string };

const SENTIMENT_MAP: Record<string, ScanSentiment> = {
  positive: "POSITIVE",
  neutral: "NEUTRAL",
  negative: "NEGATIVE",
};

export function parseSentiment(value: unknown): ScanSentiment | null {
  if (typeof value !== "string") return null;
  return SENTIMENT_MAP[value.trim().toLowerCase()] ?? null;
}

function parsePosition(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

/** 1. whole response is JSON; 2. markdown-fenced block; 3. first { to last }. */
function extractJsonObject(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const inner = fenced[1].trim();
    if (inner.startsWith("{") && inner.endsWith("}")) return inner;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return null;
}

export function parseScanResponse(content: string): ParseResult {
  const json = extractJsonObject(content);
  if (!json) return { ok: false, error: "Response contained no JSON metadata object" };

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Response JSON could not be parsed" };
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Metadata is not a JSON object" };
  }
  const obj = raw as Record<string, unknown>;

  const mentioned = obj.mentioned === true || obj.mentioned === "true";
  const sentiment = parseSentiment(obj.sentiment);
  const position = mentioned ? parsePosition(obj.position) : null;

  const competitors: ParsedCompetitorMention[] = [];
  if (Array.isArray(obj.competitors)) {
    for (const c of obj.competitors) {
      if (typeof c !== "object" || c === null) continue;
      const comp = c as Record<string, unknown>;
      const name = typeof comp.name === "string" ? comp.name.trim() : "";
      if (!name) continue;
      competitors.push({
        name,
        position: parsePosition(comp.position),
        sentiment: parseSentiment(comp.sentiment),
      });
      if (competitors.length >= 10) break; // bounded, like the suggestion cap in 10
    }
  }

  const reasoning =
    typeof obj.reasoning === "string" && obj.reasoning.trim() ? obj.reasoning.trim() : null;

  return { ok: true, data: { mentioned, position, sentiment, reasoning, competitors } };
}
```

Normalization contract (the unit-test surface):

| Field         | Accepted input                                | Stored as                                             |
| ------------- | --------------------------------------------- | ----------------------------------------------------- |
| `mentioned`   | `true` / `false` / `"true"` / `"false"`       | boolean (`"false"` → `false`, anything else → `false`) |
| `position`    | integer ≥ 1                                   | `number \| null` (float/0/negative/absent → null)      |
| `sentiment`   | `"positive"` / `"neutral"` / `"negative"`     | `ScanSentiment \| null` (case/whitespace-tolerant)     |
| `reasoning`   | non-empty string                              | trimmed string \| null                                 |
| `competitors` | array of `{ name, position, sentiment }`      | normalized array, invalid entries dropped, capped at 10 |

## Cache Layer — `lib/utils/cache.ts`

```ts
import { Redis } from "@upstash/redis";
import type { ParsedScanResponse } from "@/lib/scan/parse";

/** Default cache TTL (architecture.md: 24h; per-plan configurable post-MVP). */
export const SCAN_CACHE_TTL_SECONDS = 24 * 60 * 60;

/**
 * Lazy Upstash client. Null when UPSTASH_REDIS_REST_URL/TOKEN are absent —
 * every helper then degrades to a no-op (Decision #6): a scan must never
 * fail because caching is unavailable.
 */
let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (!redisInitialized) {
    redisInitialized = true;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) redis = new Redis({ url, token });
  }
  return redis;
}

/** Cache key per company + prompt + provider (Decision #7). */
export function scanResultKey(companyId: string, promptId: string, provider: string): string {
  return `scan:${companyId}:${promptId}:${provider}`;
}

export async function getCachedScanResult(key: string): Promise<ParsedScanResponse | null> {
  try {
    return (await getRedis()?.get<ParsedScanResponse>(key)) ?? null;
  } catch {
    return null; // non-fatal (Decision #6)
  }
}

export async function setCachedScanResult(key: string, result: ParsedScanResponse): Promise<void> {
  try {
    await getRedis()?.set(key, result, { ex: SCAN_CACHE_TTL_SECONDS });
  } catch {
    // non-fatal (Decision #6)
  }
}
```

Notes:

- The client is constructed lazily on first use (not at import) so tests can stub env vars and re-import
- `@upstash/redis` JSON-serializes object values automatically; `redis.get<ParsedScanResponse>` parses them back
- The dashboard's cache-first **read** path is out of scope (scoring spec); this module only serves the write path the pipeline needs

## Scan Result Helpers — `lib/db/results.ts`

Thin Prisma helpers following the `lib/db/companies.ts` / `lib/db/prompts.ts` pattern:

```ts
import { prisma } from "./prisma";
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
    data: results.map((r) => ({ ...r, scanId })),
  });
}

/** Read helper for verification and the scoring spec. */
export async function getResultsForScan(scanId: string) {
  return prisma.scanResult.findMany({
    where: { scanId },
    orderBy: [{ provider: "asc" }, { promptId: "asc" }],
  });
}
```

## Scan Task — `lib/jobs/scan.ts`

Replace the `scanPrompt` no-op stub with the real pipeline and keep the existing lifecycle (re-read scan, `RUNNING` + `startedAt`, `COMPLETED`/`FAILED` + `completedAt`, `logger`, JSON-serializable return). Changes:

1. `deleteScanResults(scanId)` before the loop (Decision #8)
2. accumulate `ScanResultInput[]` in memory, `createScanResults(scanId, results)` after the loop
3. extend the return/output shape with `results` and `failed` counts

```ts
import { task, logger, AbortTaskRunError } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { getPromptsForCompany } from "@/lib/db/prompts";
import { deleteScanResults, createScanResults } from "@/lib/db/results";
import type { ScanResultInput } from "@/lib/db/results";
import { AIProviderError } from "@/lib/providers/errors";
import { getAvailableProviders } from "@/lib/providers/registry";
import { TO_PRISMA_PROVIDER } from "@/lib/providers/types";
import type { AIProvider, AIResponse } from "@/lib/providers/types";
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

/** One provider × prompt check → one ScanResultInput (Decision #7, #8, #9). */
async function scanPrompt(input: {
  provider: AIProvider;
  prompt: { id: string; text: string };
  company: { id: string; name: string; domain: string };
}): Promise<ScanResultInput> {
  const { provider, prompt, company } = input;
  // TO_PRISMA_PROVIDER is Record<AIProviderName, string> — cast to the Prisma enum
  const prismaProvider = TO_PRISMA_PROVIDER[provider.name] as import("@/generated/prisma").AIProvider;
  const cacheKey = scanResultKey(company.id, prompt.id, provider.name);

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
    };
  } catch (error) {
    // Provider Integration Checklist #6: provider failures surface as error rows,
    // never unhandled exceptions. Anything that isn't an AIProviderError is
    // unexpected and fails the scan (retried by the SDK).
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
      };
    }
    throw error;
  }
}

export const runScan = task({
  id: "scan-company",
  run: async (payload: { scanId: string }, { ctx }) => {
    const { scanId } = payload;

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { company: true },
    });
    if (!scan) throw new AbortTaskRunError("Scan not found");

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    try {
      const [prompts, providers] = await Promise.all([
        getPromptsForCompany(scan.companyId),
        Promise.resolve(getAvailableProviders()),
      ]);

      await deleteScanResults(scanId); // retry idempotency (Decision #8)

      const results: ScanResultInput[] = [];
      for (const provider of providers) {
        for (const prompt of prompts) {
          results.push(
            await scanPrompt({
              provider,
              prompt: { id: prompt.id, text: prompt.text },
              company: scan.company,
            })
          );
        }
      }

      await createScanResults(scanId, results);
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      const failed = results.filter((r) => r.error).length;
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
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: "FAILED", completedAt: new Date() },
      });
      logger.error("Scan failed", { scanId, error });
      throw error; // SDK retry (config default: 3 attempts)
    }
  },
});
```

Contract notes:

- `scan.company` is available because the `findUnique` includes `company` — its `name` and `domain` feed `buildScanPrompt`
- `getAvailableProviders()` returns `[]` when no keys are configured — the scan completes with zero results (unchanged from 11)
- `getResultsForScan` is not used by the task itself; it exists for verification and the scoring spec
- the error message stored in `error` is the `AIProviderError.message` (typed, user-safe — no stack traces)

## API — `POST /api/scans` stale-PENDING sweep

11 assigned stale-`PENDING` recovery to this spec (Decision #11). Add one `updateMany` between resolving the company and the existing 409 guard:

```ts
// Stale-PENDING recovery (12, Decision #11): a trigger that was accepted but
// never dequeued must not block future scans forever.
const STALE_PENDING_MS = 10 * 60 * 1000;
await prisma.scan.updateMany({
  where: {
    companyId: company.id,
    status: "PENDING",
    createdAt: { lt: new Date(Date.now() - STALE_PENDING_MS) },
  },
  data: { status: "FAILED", completedAt: new Date() },
});
```

Everything else in the route is unchanged (401/404/409/502/202). The sweep is per-company, so it only touches the caller's own rows.

---

## Testing (Vitest)

Co-located unit tests for the pure logic only — no network, no DB, no Redis (consistent with the repo):

| File                    | Covers                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/scan/parse.test.ts`| `extractJsonObject` paths: whole-response JSON, ```json fenced, prose-wrapped, missing `{`/`}` → `{ ok: false }`; `JSON.parse` failure → `{ ok: false }`; `mentioned` coercion; `position` normalization (1 kept, 0/1.5/-1/absent → null, null when not mentioned); `parseSentiment` mapping + unknown → null; `reasoning` trimmed/empty → null; `competitors` — non-array → `[]`, invalid entries dropped, capped at 10 |
| `lib/scan/prompt.test.ts` | `buildScanPrompt` contains the question text, company name, company domain, and the JSON field names (`mentioned`, `position`, `sentiment`, `competitors`)                                             |
| `lib/utils/cache.test.ts` | `scanResultKey` scheme (`scan:{companyId}:{promptId}:{provider}`); `SCAN_CACHE_TTL_SECONDS === 86400`; degraded no-op when env vars are absent (`vi.resetModules` + `vi.stubEnv` + dynamic import, mirroring `registry.test.ts`) |

Task, route, and DB helpers are verified via `npm run build` + the manual scan flow below — consistent with the current repo (no DB-backed unit tests yet).

---

## Validation

- `npx prisma migrate dev --name add_scan_result_error` — applies cleanly; verify the migration SQL (checklist in `ai-workflow-rules.md`)
- `npx prisma generate` — client regenerates without errors
- `npm test` — Vitest unit tests pass
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- manual (two-terminal workflow from 11: `npm run dev` + `npx trigger.dev@latest dev`):
  - sign in → company exists → Run Scan dialog → Start Scan → `POST /api/scans` returns `202`
  - `Scan` transitions PENDING → RUNNING → COMPLETED (check `prisma studio` or the Trigger.dev run page)
  - `ScanResult` rows are created with parsed `mentioned`/`position`/`sentiment`/`competitorsMentioned`/`rawResponse` and null `error`
  - re-running the scan within 24h: results persisted from cache (no provider calls — verify via Trigger.dev logs or provider spend), a fresh scan row, no duplicate rows per prompt × provider
  - with `UPSTASH_REDIS_REST_URL`/`TOKEN` unset: scan still completes (cache no-ops)
  - with a provider key removed: that provider's prompt checks record `error` rows, the scan still COMPLETES with `failed > 0`
  - a `PENDING` row manually aged past 10 minutes is swept to `FAILED` on the next trigger attempt
- `context/context/progress-tracker.md` updated (spec entry + session note)

---

## Out of Scope

Do not implement:

- the visibility score algorithm (`lib/scoring/calculator.ts` + `weights.ts`, its own spec)
- the cache-first **read** path (dashboard/scoring spec reads the latest COMPLETED scan's rows)
- dashboard UI, scan-status polling, "scanning" states, result tables (dashboard spec)
- competitor auto-discovery writing to the `Competitor` table (competitors spec) — this pipeline only records `competitorsMentioned` JSON
- the recommendations engine and `Recommendation` writes
- weekly reports / Monday re-scans (`lib/jobs/report.ts`)
- queues, `batchTriggerAndWait`, per-provider concurrency, `concurrencyKey` (Future)
- per-scan request options (provider subset, prompt filters, cache-bypass) in `POST /api/scans`
- cache invalidation endpoints or per-plan TTL
- `askJSON` / structured-output mode on the provider layer
- substring-fallback mention detection when metadata parsing fails

---

## Future

Reserved extensions (do not implement):

- cache-first read path for the dashboard/scoring (scoring spec)
- per-plan configurable TTL
- a non-injective scan prompt variant (ask + report all companies, match the tracked company by name/domain) if model bias becomes measurable
- structured-output `askJSON` on the provider layer once all four providers support it first-class
- per-provider fan-out via `batchTriggerAndWait` or named queues with rate-limit-aware scheduling
- flushing result batches per provider instead of one `createMany` when concurrency lands
- automatic retry of `error` rows on the next on-demand scan (they already retry naturally via cache-miss)
- substring fallback for mention detection when the metadata block is missing

---

## Definition of Done

- `ScanResult.error String?` added; migration `add_scan_result_error` applied; client regenerated
- `@upstash/redis` installed; `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` documented (human step: Upstash DB)
- `lib/scan/config.ts` — `SCAN_MAX_TOKENS` (4096), `SCAN_TEMPERATURE` (0.2), retry/backoff constants
- `lib/scan/prompt.ts` — `buildScanPrompt` includes the question, company name/domain, and the JSON metadata contract
- `lib/scan/parse.ts` — `parseScanResponse` returns `{ ok, data | error }`; normalization per the contract table; `ScanSentiment` type
- `lib/utils/cache.ts` — lazy Upstash client; `scanResultKey` (`scan:{companyId}:{promptId}:{provider}`); `getCachedScanResult`/`setCachedScanResult` with 24h TTL; all ops non-fatal (Decision #6)
- `lib/db/results.ts` — `deleteScanResults`, `createScanResults` (batch), `getResultsForScan`
- `lib/jobs/scan.ts` — real `scanPrompt`: cache-first, `askWithRetry` (bounded backoff for retryable errors only), parse, cache-before-persist, `error` rows for provider/parse failures, unexpected errors still fail the scan; `deleteScanResults` before the loop; results persisted in one `createMany`; output includes `results` + `failed`
- `app/api/scans/route.ts` — stale-`PENDING` (>10 min) rows swept to `FAILED` before the 409 guard
- no vendor SDK imports outside `lib/providers/`; no `"use client"` anywhere in `lib/scan/`, `lib/utils/cache.ts`, `lib/db/results.ts`, `lib/jobs/`
- unit tests cover parsing, prompt building, and cache key/TTL/no-op behavior
- `npm test`, `npm run lint`, and `npm run build` all pass
- manual scan flow verified end-to-end (see Validation)
- `progress-tracker.md` reflects the completed work
