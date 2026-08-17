# Trigger.dev Background Jobs for Scanning

## Goal

Set up Trigger.dev as the background-job runtime for the visibility scanner. This spec covers the **infrastructure**: correcting the scaffolded `trigger.config.ts` (deprecated `@trigger.dev/sdk/v3` imports, wrong task directory), defining the `runScan` background task with the full scan-lifecycle management, and wiring the trigger path so the UI can actually start a scan:

```
RunScanDialog → POST /api/scans → tasks.trigger("scan-company", { scanId })
   → runScan task → mark RUNNING → (scan work) → mark COMPLETED / FAILED
```

This is **setup + trigger wiring only**. The actual per-prompt scan execution (calling `ask()`, parsing mention/position/sentiment, Redis caching, persisting `ScanResult` rows) is the **visibility scanner pipeline** spec (tracker item #2) — the `runScan` task here includes the loop scaffolding and a clearly-marked stub where that spec plugs in.

Do **not** implement:

- per-prompt scanning, response parsing, Redis caching, or `ScanResult` persistence (visibility scanner pipeline spec)
- the weekly report job (`lib/jobs/report.ts`, its own spec)
- fan-out, queues, or per-provider concurrency (deferred — see Decisions #4)
- scheduled (cron) scans
- Trigger.dev cloud deployment / Vercel integration beyond documenting the required env vars

Follow:

- `AGENTS.md` — **read first**; it points at the Trigger.dev agent skills installed in `.agents/skills/`. Load `trigger-authoring-tasks` (and `trigger-getting-started` for the human setup steps) before writing task code, and read the version-pinned reference at `node_modules/@trigger.dev/sdk/skills/trigger-authoring-tasks/SKILL.md`
- `architecture.md` (invariant #1: routes never run long-lived work — scanning is delegated to Trigger.dev background jobs; the `lib/jobs/` boundary)
- `code-standards.md` (thin route handlers, `{ data }` / `{ error: { message } }` envelopes, strict TS)
- `ai-workflow-rules.md` (scope discipline — this unit stays inside its boundary)
- `answeros-spec.md` (`lib/jobs/scan.ts` file organization; the `Scan` / `ScanResult` / `ScanStatus` model contracts)
- `09-ai-provider-abstraction.md` (the provider surface the task consumes: `getAvailableProviders()`, `ask()`, `AIProviderError`)
- `10-prompt-library.md` (`getPromptsForCompany` — the prompt set the task iterates)

---

## Prerequisites

Before beginning implementation:

- Read `AGENTS.md` (mandatory — includes the Trigger.dev skills pointer and the Next.js-version warning).
- Load the `trigger-authoring-tasks` skill and read the bundled SKILL reference (`node_modules/@trigger.dev/sdk/skills/trigger-authoring-tasks/SKILL.md`); it matches the installed SDK 4.5.10 exactly.
- Confirm `09-ai-provider-abstraction.md` is implemented (`lib/providers/` exports `getAvailableProviders()`, `getProvider()`, `ask()`, `AIProviderError`).
- Confirm `10-prompt-library.md` is implemented (`lib/db/prompts.ts` exports `getPromptsForCompany(companyId)`).
- **Human step (cannot be automated):** the user must be authenticated with the Trigger.dev CLI (`npx trigger.dev@latest login`) and provide the **DEV** secret key from the dashboard's API Keys page. The `project` ref is already in the repo (see Current State).

---

## Current State

Reference points already in the codebase:

- `trigger.config.ts` — scaffolded with `project: "proj_wcqhshlgjgctdeuuitnc"`, `runtime: "node"`, `maxDuration: 3600`, retries enabled (`maxAttempts: 3`). **Problems:** imports `defineConfig` from `@trigger.dev/sdk/v3` (deprecated alias — must be `@trigger.dev/sdk`), and `dirs: ["./src/trigger"]` (the project has no `src/` application code; the documented home for jobs is `lib/jobs/`)
- `src/trigger/example.ts` — scaffold `helloWorldTask` on the v3 alias; to be deleted (this spec replaces it)
- `@trigger.dev/sdk` ^4.5.10 + `@trigger.dev/build` ^4.5.10 already installed (matching versions); `.gitignore` already contains `.trigger`; `tsconfig.json` already includes `trigger.config.ts`
- `prisma/schema.prisma` — `Scan` (`status`, `startedAt`, `completedAt`, `results`), `ScanResult` (all fields), `ScanStatus` enum (`PENDING`/`RUNNING`/`COMPLETED`/`FAILED`), `AIProvider` enum — all present since 05
- `lib/db/prisma.ts` — Prisma v7 + Neon driver-adapter singleton (used directly by tasks; no separate client needed)
- `lib/providers/` — `getAvailableProviders()`, `getProvider()`, `ask()`, `AIProviderError` (09)
- `lib/db/prompts.ts` — `getPromptsForCompany(companyId)` returns curated + company suggestions (10)
- `lib/db/companies.ts` — `getCompanyByClerkId(clerkId)` (the ownership-resolve helper the route reuses)
- `app/api/domain/route.ts` — the `{ data }` / `{ error: { message } }` envelope, Clerk `auth()` pattern
- `components/dialogs/run-scan-dialog.tsx` — "Start Scan" currently runs a mock `setTimeout`; `hooks/use-dialogs.tsx` exposes `setLoading` / `closeDialog`
- `lib/api/domain.ts` — the client-side fetch-helper pattern (`request<T>` that throws the server's `error.message`) this spec mirrors in `lib/api/scans.ts`. Note: `request` is **module-private** in `domain.ts` — copy it into `lib/api/scans.ts` (do not import across files)

Known gaps this feature fills:

- `trigger.config.ts` points at a task directory that is not the project's documented jobs home, and imports the deprecated SDK alias
- there is no `lib/jobs/` directory and no scan task — nothing can run scans asynchronously (invariant #1 is currently unmet)
- `RunScanDialog` fakes a scan start with a timeout — no real trigger path exists
- `TRIGGER_SECRET_KEY` is not documented anywhere, so nothing can trigger tasks from the app

---

## Decisions (2026-08-07)

| #  | Decision                                                                                                | Rationale                                                                                                                        |
| -- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Task files live in `lib/jobs/` (user decision)                                                          | Matches `architecture.md` and `answeros-spec.md` (`lib/jobs/scan.ts`, `lib/jobs/report.ts`). The scaffold's `src/trigger/` was CLI-generated and is not the documented convention; `trigger.config.ts` `dirs` is updated to `./lib/jobs` and the scaffold is deleted. |
| 2  | Import from `@trigger.dev/sdk` (v4) — never the `@trigger.dev/sdk/v3` alias                             | The `/v3` subpath is a deprecated alias in SDK 4.x (per the bundled skill reference). Both `trigger.config.ts` and the scaffold use it today. |
| 3  | Setup + trigger wiring only (user decision)                                                             | Tracker splits "Set up Trigger.dev background jobs" (#1) from "Build the visibility scanner pipeline" (#2). Execution logic is deliberately out of scope here. |
| 4  | Single `runScan` task, sequential iteration (user decision)                                             | Simplest correct structure for the first cut; 100+ prompts × 4 providers within the 10-minute success criterion is feasible sequentially. Fan-out / queues / concurrency are post-MVP tuning (Future). |
| 5  | Use `prismaExtension({ mode: "modern" })` from `@trigger.dev/build/extensions/prisma` in `trigger.config.ts` | Prisma 7 + Neon driver adapter = TypeScript-only client with no Rust query engine — exactly the modern mode's target ("zero config", marks `@prisma/client` external). Do not use legacy/engine-only modes. |
| 6  | The `Scan` DB row is the source of truth; the trigger payload is just `{ scanId }`                      | The task re-reads the scan + company + prompts from the DB, so retries and manual dashboard replays are always consistent. Payload stays tiny and JSON-serializable. |
| 7  | Route rejects a second scan while one is already `PENDING` or `RUNNING` for the company (409)           | Mirrors invariant #7 (idempotency): only one active scan per company at a time prevents double-cost and double-write races until the pipeline spec defines overwrite semantics. |
| 8  | Lifecycle is managed by the task itself (RUNNING → COMPLETED / FAILED); the route only creates the `PENDING` row and triggers — with one exception: if `tasks.trigger` itself throws, the route marks the row `FAILED` because the task never started | Keeps the route thin (code-standards) and makes the task the single owner of long-lived state transitions (invariant #1). The trigger-failure exception is unavoidable — the task cannot clean up after itself when it never ran. |

---

## Dependencies

No new dependencies — `@trigger.dev/sdk` and `@trigger.dev/build` are already installed at matching versions.

Two corrections to existing code:

1. **Deprecated import alias:** change every `import ... from "@trigger.dev/sdk/v3"` to `import ... from "@trigger.dev/sdk"` (`trigger.config.ts`, and anywhere the scaffold imported it).
2. **`prismaExtension` lives under a subpath:** `import { prismaExtension } from "@trigger.dev/build/extensions/prisma";` — it is **not** exported from the package root (`@trigger.dev/build` root exports only `binaryForRuntime` / `esbuildPlugin`). Verified against the installed 4.5.10 package exports.

---

## Environment Variables

| Variable             | Required for        | Notes                                                                                         |
| -------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `TRIGGER_SECRET_KEY` | triggering from app | **DEV** key from the Trigger.dev dashboard → API Keys. Needed by `tasks.trigger()` in the route and by the local dev server. Never committed. |
| provider keys        | real scanning       | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY` — already documented in `09-ai-provider-abstraction.md`; the task reads them through `getAvailableProviders()` |

`TRIGGER_API_URL` is only needed for self-hosting — out of scope.

---

## Config — `trigger.config.ts`

Rewrite the existing file (keep the current `project`, `runtime`, `logLevel`, `maxDuration`, and retry block — they are correct):

```ts
import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_wcqhshlgjgctdeuuitnc",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  // Jobs live in lib/jobs/ (architecture.md), not the CLI scaffold's src/trigger.
  dirs: ["./lib/jobs"],
  build: {
    extensions: [prismaExtension({ mode: "modern" })],
  },
});
```

Notes:

- **Delete `src/trigger/`** (the `example.ts` scaffold) — it is on the deprecated alias and outside `dirs`.
- `dirs: ["./lib/jobs"]` — every exported `task()` in `lib/jobs/` registers; `.test` / `.spec` files under it are auto-excluded by the CLI. Keep non-task helpers out of `lib/jobs/` where possible (they belong in `lib/` and can be imported by tasks).
- `prismaExtension({ mode: "modern" })` — for Prisma 7 + driver adapters (Decision #5). `@prisma/client` is marked external; the generated client + Neon adapter are already produced by the project's own `prisma generate` pipeline. Verify at implementation time that the extension resolves the custom output path (`generated/prisma`) — if the bundle misses the generated client, fall back to shipping it via the `additionalFiles` extension.
- The `ai` SDK packages and `@neondatabase/serverless` / `ws` must be available to the task bundle — Trigger.dev bundles dependencies automatically; native/WASM packages would need `build.external` (none apply here).
- **Implementation-time verification:** task code in `lib/jobs/` imports through the `@/*` tsconfig path alias — confirm Trigger.dev's esbuild bundler resolves tsconfig `paths` for both `trigger dev` and cloud deploy (the project's `tsconfig.json` includes `trigger.config.ts` and maps `@/*` → `./*`; if resolution fails in deploy, use relative imports inside `lib/jobs/`).

---

## File Structure

```
lib/
  jobs/
    scan.ts               # runScan task: lifecycle + per-provider/prompt loop scaffold (pipeline stub)
app/
  api/
    scans/
      route.ts            # POST /api/scans — create PENDING scan + trigger runScan
lib/
  api/
    scans.ts              # client-side triggerScan() fetch helper (mirrors lib/api/domain.ts)
```

`src/trigger/` is deleted. No `"use client"` anywhere in `lib/jobs/` — server-only by construction.

---

## Scan Task — `lib/jobs/scan.ts`

The task owns the scan lifecycle (Decision #8). Payload is `{ scanId }`; everything else is re-read from the DB (Decision #6).

```ts
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
async function scanPrompt(
  _provider: AIProvider,
  _prompt: { id: string; text: string },
  _scanId: string
): Promise<void> {
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
```

Contract notes:

- `run` returns a JSON-serializable output (the result shape shown above).
- `getAvailableProviders()` returns an empty array when no keys are configured — the scan completes with zero provider work rather than failing; the dashboard/empty state handles that (reporting is a later spec).
- Errors inside `scanPrompt` should eventually be caught per-prompt by the pipeline spec (FAILED results, not whole-scan failure); for this setup cut, any throw marks the scan FAILED and triggers the SDK retry.
- Retry semantics: throwing a regular error retries the **whole** scan (config default: 3 attempts) and re-sets `startedAt` on each attempt — acceptable for setup. Use `AbortTaskRunError` (imported above) for permanently non-retryable cases (e.g., scan row missing). The pipeline spec should decide whether provider/rate-limit failures should retry per-prompt rather than whole-scan.
- `logger` (not `console`) for structured run logs visible in the dashboard.

**Known gap (open question):** if `tasks.trigger` succeeds but the run never dequeues (queue/TTL issue), the row stays `PENDING` forever and the route's 409 guard blocks future scans. The pipeline spec should add stale-`PENDING` recovery (e.g., a threshold-based cleanup or a `PENDING` → `FAILED` sweep).

---

## API — `POST /api/scans`

Thin route, following the `app/api/domain/route.ts` pattern (Clerk auth → resolve company → delegate → `{ data }` / `{ error: { message } }` envelope):

```ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { getCompanyByClerkId } from "@/lib/db/companies";
import type { runScan } from "@/lib/jobs/scan"; // type-only — never the task instance
```

Status codes:

| Status | Condition                                                          |
| ------ | ------------------------------------------------------------------ |
| `401`  | unauthenticated                                                     |
| `404`  | authenticated user has no company                                   |
| `409`  | a scan for this company is already `PENDING` or `RUNNING` (Decision #7) |
| `502`  | `tasks.trigger` failed (the scan row is marked `FAILED` first)      |
| `202`  | `{ data: { scanId, status: "PENDING" } }` — scan accepted, running in the background |

Flow:

1. `auth()` → `401` when no session.
2. `getCompanyByClerkId(clerkId)` → `404` when no company ("no company" is a valid onboarding state, matching the `07` convention — but you cannot scan without one).
3. Guard: `prisma.scan.findFirst({ where: { companyId, status: { in: ["PENDING", "RUNNING"] } } })` → `409` when found.
4. Create the row: `prisma.scan.create({ data: { companyId, status: "PENDING" } })`.
5. Trigger: `await tasks.trigger<typeof runScan>("scan-company", { scanId })` — **type-only import** of `runScan`; never import the task instance into route code (it would bundle the task into the app).
6. On trigger failure: mark the row `FAILED` and return `502` `{ error: { message } }` — never a raw stack trace.
7. Success: `202` with the envelope above.

Body is empty in MVP — scan options (providers, prompt filter, cache bypass) arrive with the pipeline spec (see Future).

---

## RunScanDialog Wiring

Replace the mock `setTimeout` in `components/dialogs/run-scan-dialog.tsx` with a real call:

- Add `lib/api/scans.ts` mirroring `lib/api/domain.ts` — **copy the module-private `request<T>` helper into this file** (it is not exported from `domain.ts`):

```ts
// request<T> helper copied from lib/api/domain.ts (same shape: JSON headers,
// throws the server's error.message on !ok, unwraps `data`)

type ApiEnvelope<T> = { data?: T; error?: { message?: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // ... identical to lib/api/domain.ts ...
}

/** Start a visibility scan. → POST /api/scans. Throws the server's error.message on failure. */
export function triggerScan() {
  return request<{ scanId: string; status: string }>("/api/scans", {
    method: "POST",
  });
}
```

- In `handleConfirm`:

```ts
const handleConfirm = async () => {
  setLoading(true);
  try {
    await triggerScan();
    closeDialog(); // success — scan runs in the background (existing dialog copy already says so)
  } catch (err) {
    // Keep the dialog open and render the message inline (a small destructive
    // <p> above the footer, mirroring the AddDomainDialog error element).
    setError(err instanceof Error ? err.message : "Failed to start scan");
  } finally {
    setLoading(false);
  }
};
```

- Add a local `const [error, setError] = React.useState("")` to the dialog (the `use-dialogs` `formState.error` is domain-specific and rendered by the AddDomain dialog — do not reuse it here). Clear it on dialog close (`closeDialog()`), and render `{error && <p className="text-sm text-destructive">{error}</p>}` above the footer.
- The dialog's existing copy ("Scanning may take several minutes. You can continue using AnswerOS while the scan runs in the background.") already matches the async model — no copy change needed.
- Dashboard refresh/polling of scan status is out of scope (dashboard spec).

---

## Development Workflow

Two human steps (per `trigger-getting-started` — cannot be automated):

1. `npx trigger.dev@latest login` — opens a browser; the user signs in (create an account at https://cloud.trigger.dev first if needed).
2. Paste the **DEV** `TRIGGER_SECRET_KEY` from the dashboard's API Keys page into `.env.local` (never committed).

Then, in two terminals:

```bash
npm run dev            # Next.js app (already has .env.local with DATABASE_URL, Clerk, provider keys)
npx trigger.dev@latest dev   # registers lib/jobs/ tasks with the dashboard
```

Verify:

- the CLI picks up `runScan` (`id: "scan-company"`) from `./lib/jobs`
- a test run can be fired from the task's test page in the dashboard
- from the app: sign in → company exists → open the Run Scan dialog → Start Scan → `POST /api/scans` returns `202`, and the `Scan` row transitions PENDING → RUNNING → COMPLETED (check `prisma studio` or the dashboard run page)

---

## Testing (Vitest)

No new unit tests in this spec — consistent with the repo: task and route logic are DB- and SDK-coupled, and the repo has no DB-backed unit tests yet (routes are verified via `npm run build` + manual/API checks). The pipeline spec's parsing/scoring logic will carry the unit tests.

Keep the existing suite green: `npm test`, `npm run lint`.

---

## Validation

- `npx trigger.dev@latest dev` — registers `scan-company` from `./lib/jobs`; no v3-alias imports remain anywhere (`grep -r "sdk/v3" .` finds nothing outside node_modules)
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- `npx prisma generate` still clean (no schema change in this spec)
- manual: `POST /api/scans` returns `202`, scan lifecycle transitions correctly (see Development Workflow)
- `context/context/progress-tracker.md` updated (spec entry + session note)

---

## Out of Scope

Do not implement:

- per-prompt scanning, response parsing (mention/position/sentiment), Redis caching, `ScanResult` persistence (visibility scanner pipeline spec)
- the weekly report job / Monday re-scan (`lib/jobs/report.ts`, scheduled tasks spec)
- queues, `batchTriggerAndWait` fan-out, per-provider concurrency, `concurrencyKey` (Future)
- cron/scheduled scans
- scan-status polling or "scanning" UI states in the dashboard (dashboard spec)
- Trigger.dev cloud deploy wiring, Vercel integration, or `syncEnvVars` (deployment spec)
- per-scan options (provider selection, prompt filters, cache-bypass flags)
- self-hosting (`TRIGGER_API_URL`)
- auto-triggering the first scan from onboarding (product decision — the explicit Start Scan action is the MVP trigger)

---

## Future

Reserved extensions (do not implement):

- the visibility scanner pipeline: `scanPrompt` implementation, JSON parsing, Redis cache-first writes, `ScanResult` upserts with overwrite semantics (invariant #7)
- per-provider fan-out via `batchTriggerAndWait` or a named queue with `concurrencyLimit` once volume demands it
- the weekly report job via `schedules.task` (Monday re-scan + Resend)
- on-demand "scan now" for an existing company from the dashboard
- trigger options surfaced through the API (provider subset, prompt category filters, cache bypass)
- `syncEnvVars` from Vercel and cloud deploy verification (including that `prismaExtension` bundles the `generated/prisma` client correctly on the cloud runtime)
- a `concurrencyKey` per company to harden the single-active-scan guard at the worker level

---

## Definition of Done

- `trigger.config.ts` imports `defineConfig` from `@trigger.dev/sdk` (no `v3` alias), `dirs: ["./lib/jobs"]`, and includes `prismaExtension({ mode: "modern" })` from `@trigger.dev/build/extensions/prisma`
- `src/trigger/` scaffold deleted; no `@trigger.dev/sdk/v3` imports remain in app code
- `lib/jobs/scan.ts` defines `runScan` (`id: "scan-company"`, payload `{ scanId }`) that: re-reads the scan + company, sets `RUNNING` + `startedAt`, iterates `getAvailableProviders()` × `getPromptsForCompany(...)` through the `scanPrompt` stub, sets `COMPLETED` + `completedAt` (or `FAILED` on error), uses `logger`, and returns JSON-serializable output
- `POST /api/scans` creates a `PENDING` scan, guards against a concurrent active scan (`409`), triggers via `tasks.trigger<typeof runScan>` with a type-only import, marks the row `FAILED` on trigger failure (`502`), and returns `202 { data: { scanId, status: "PENDING" } }`; `401`/`404` handled
- `lib/api/scans.ts` + `RunScanDialog` wire the real trigger (mock `setTimeout` removed); failures surfaced inline, dialog copy unchanged
- `TRIGGER_SECRET_KEY` (DEV) documented and set locally; `npx trigger.dev@latest dev` registers `scan-company`
- no vendor SDK imports outside `lib/providers/`; no `"use client"` in `lib/jobs/`
- `npm test`, `npm run lint`, and `npm run build` all pass
- `progress-tracker.md` reflects the completed work
