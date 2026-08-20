# Visibility Score Algorithm

## Goal

Implement the weighted multi-factor 0–100 visibility score as pure, server-side core logic. This is `lib/scoring/` — the one piece spec `12-visibility-scanner-pipeline.md` deliberately deferred. It turns a completed scan's `ScanResult` rows into the single number the whole product is built around, honoring the weight table in `project-overview.md` (mention rate 30%, average rank 25%, sentiment 20%, competitor share 15%, source authority 10%).

```
runScan (12) → COMPLETED scan + ScanResult rows
   → getCompanyScore(companyId)            [server-only — invariant #4]
     → latest COMPLETED scan → getResultsForScan (12)
     → map rows → ScoreResultRow[]          [error rows excluded]
     → calculateVisibilityScore            [pure, Prisma-free]
       → per-factor scores (0–1) × SCORE_WEIGHTS → clamp 0–100, round
   → dashboard score card (next spec, tracker #2)
```

Do **not** implement:

- the dashboard UI, score card, factor breakdown, trend graph, or empty states (dashboard spec)
- previous-scan deltas / trend arrows (dashboard/competitor specs)
- the recommendations engine (its own spec — consumes this score later)
- a `GET /api/visibility` (or any) scoring API route
- competitor comparison pages / mention-overlap analysis (competitors spec)
- caching the score or cache-first reads of `ScanResult` rows (see Decision #3)
- real source-authority weighting or citation counting (Future — the pipeline captures no source data; see Decision #6)
- auto-discovery writing to the `Competitor` table (competitors spec)
- any schema change, environment variable, or new dependency

Follow:

- `CLAUDE.md` — **read first** (the repo's agent-instructions entry point; it `@`-imports `AGENTS.md`, which carries the Next.js-version warning and the Trigger.dev skills pointer)
- `architecture.md` (`lib/scoring/` boundary; invariant #4: the visibility score is always computed server-side, never client-side)
- `code-standards.md` (core logic unit-tested, co-located tests, thin modules, no `any`)
- `ai-workflow-rules.md` (scope discipline — this unit stays inside its boundary)
- `12-visibility-scanner-pipeline.md` (`ScanResult` shape, `error` row contract, `getResultsForScan`, `ScanSentiment`/`ParsedCompetitorMention` from `lib/scan/parse.ts`)
- `answeros-spec.md` (weight table, `lib/scoring/calculator.ts` + `lib/scoring/weights.ts` file organization)

---

## Prerequisites

Before beginning implementation:

- Read `CLAUDE.md` (mandatory — see the Follow list above for why).
- Confirm `12-visibility-scanner-pipeline.md` is implemented — `lib/db/results.ts` exports `getResultsForScan(scanId)`, `ScanResult.error String?` exists, and completed scans actually persist parsed `ScanResult` rows (the pipeline's `scanPrompt` is real, not the stub from 11).
- Confirm the end-to-end scan flow works (11 + 12): `POST /api/scans` → `runScan` → `COMPLETED` scan with rows, so there is data to score.
- **No human steps.** Scoring adds no dependencies, no environment variables, and no schema changes — it is compute-only over existing Postgres data.

---

## Current State

Reference points already in the codebase:

- `prisma/schema.prisma` — `ScanResult` (`mentioned Boolean`, `position Int?`, `sentiment Sentiment?`, `competitorsMentioned Json?`, `error String?`) and `Scan` (`status`, `completedAt`) — all present since 05/12. `Prompt.category` exists for future per-category breakdowns. `Competitor` exists but is **not** consulted by scoring (Decision #5)
- `lib/db/results.ts` — `getResultsForScan(scanId)` (ordered by provider then promptId), built by 12 for exactly this spec
- `lib/scan/parse.ts` — `ScanSentiment` (`"POSITIVE" | "NEUTRAL" | "NEGATIVE"`, value-identical to the Prisma `Sentiment` enum) and `ParsedCompetitorMention` (`{ name, position, sentiment }`)
- `lib/db/prisma.ts` — Prisma v7 + Neon driver-adapter singleton (used directly by helpers)
- `package.json` — Vitest wired via `npm test` (09); `.test.ts` files co-located with sources (code-standards)
- **no `lib/scoring/` directory yet** — nothing computes a score anywhere in the codebase

Known gaps this feature fills:

- the product's headline number does not exist — weights exist only as prose in `project-overview.md` and `answeros-spec.md`
- invariant #4 is vacuously true (no score is computed anywhere, client or server) — this spec makes it real
- scans already produce rich per-check data (mention/position/sentiment/competitors) that nothing aggregates

---

## Decisions (2026-08-19)

| #  | Decision                                                                                                | Rationale                                                                                                                         |
| -- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Pure, Prisma-free calculator in `lib/scoring/` (`weights.ts` constants + `calculator.ts`); thin `lib/db/scoring.ts` orchestrator fetches rows and maps them | Scoring is the repo's canonical "core logic" (code-standards: unit-tested, no DB/SDK in the unit surface). Invariant #4 (server-side only) holds by construction — nothing here is ever imported by a client |
| 2  | Error rows (non-null `error`) are excluded from every factor and from denominators                          | A failed check (provider error, unparseable response) is neither a clean mention nor a clean non-mention (12's contract). Including errors would silently punish companies for infra failures |
| 3  | The score reads the latest `COMPLETED` scan's rows from Postgres — no cache-first read                     | The cache keys from 12 are `scan:{companyId}:{promptId}:{provider}` — company-scoped overwrites, not scan-scoped. Mixing cached entries across scans could misrepresent a partial or degraded scan. Postgres is the durable source of truth (architecture.md) and one `findMany` is cheap at on-demand frequency. Revisited only if weekly-report load demands it (Future) |
| 4  | Factor semantics: see the formulas below. Weights are the tuning surface, formulas are the contract       | `answeros-spec.md` calls weights "constants for easy tuning" — the numbers change, the math doesn't. Each factor is a documented 0–1 quantity so its contribution is legible |
| 5  | Competitor share uses `competitorsMentioned` from the pipeline (any other company mentioned), **not** the `Competitor` table | Result rows are not linked to `Competitor` rows (names are free-text from responses), and auto-discovery into that table is an unimplemented spec. Presence of any competitor counts; names/positions aren't needed for the share math |
| 6  | Source authority = constant neutral 0.5 in MVP (**user decision**)                                          | The pipeline captures no citations/sources, so authority cannot be derived. Weight stays 10% per the product spec; every company gets a flat 5 points. Honest maximum score is therefore **95** until the pipeline captures real source data (Future). Do not "fix" the ceiling by bumping the constant — it is the documented consequence of an unknown factor |
| 7  | Output shape `{ score, factors, summary }` — factor scores (0–1) plus a row summary                       | `factors` powers the dashboard's factor breakdown without recomputation; `summary` (results / validResults / mentions / errors) powers the mentions overview with the same single query |
| 8  | Final score = `Math.round(100 × weighted sum)`, clamped to 0–100                                          | One canonical integer for cards, emails, and future deltas; factors stay raw for display |
| 9  | Zero valid rows (empty scan or all rows errored) → `score: null`                                          | A scan with no usable checks cannot be scored. The dashboard shows an empty state instead of a misleading 0 |
| 10 | No new dependencies, env vars, or schema changes                                                           | Scoring is compute-only over existing data; the 12 cache write path (invariant #3) is untouched |

---

## Dependencies

None. No packages, no environment variables, no Prisma schema changes, no migration.

---

## File Structure

```
lib/
  scoring/
    weights.ts                # SCORE_WEIGHTS + SCORE_WEIGHT_TOTAL (tuning surface)
    weights.test.ts           # documented values + sum-to-1 (co-located)
    calculator.ts             # ScoreResultRow, ScoredScan, calculateVisibilityScore (pure)
    calculator.test.ts        # factor math + edge cases + worked example (co-located)
  db/
    scoring.ts                # getLatestCompletedScan + getCompanyScore(companyId)
```

No `"use client"` anywhere — all modules are server-only by construction (invariant #4).

---

## Score Weights — `lib/scoring/weights.ts`

Single source of truth for the factor mix, matching the product spec exactly:

```ts
/**
 * Visibility score weights — the only tuning surface (answeros-spec).
 * Source: project-overview.md "Visibility Score" feature table.
 */
export const SCORE_WEIGHTS = {
  mentionRate: 0.3,
  averageRank: 0.25,
  sentiment: 0.2,
  competitorShare: 0.15,
  sourceAuthority: 0.1,
} as const;

/** Sum of all weights — asserted to equal 1 in weights.test.ts. */
export const SCORE_WEIGHT_TOTAL =
  SCORE_WEIGHTS.mentionRate +
  SCORE_WEIGHTS.averageRank +
  SCORE_WEIGHTS.sentiment +
  SCORE_WEIGHTS.competitorShare +
  SCORE_WEIGHTS.sourceAuthority;
```

Notes:

- changing a number here reweights every company in the product — `weights.test.ts` pins both the documented values and the sum-to-1 invariant
- no per-plan tuning in MVP (post-MVP is noted in Future)

## Score Calculator — `lib/scoring/calculator.ts`

Pure module (no Prisma, no Redis, no SDKs) so it is trivially unit-testable:

```ts
import { SCORE_WEIGHTS } from "./weights";
import type { ScanSentiment } from "@/lib/scan/parse";

/** Prisma-free row shape — the calculator never imports lib/db (Decision #1). */
export interface ScoreResultRow {
  mentioned: boolean;
  position: number | null;        // 1-based rank of the tracked company when mentioned (12)
  sentiment: ScanSentiment | null; // toward the tracked company when mentioned
  competitorsMentioned: string[]; // names of every OTHER company mentioned (12)
  error: string | null;           // non-null ⇒ check failed; excluded everywhere (Decision #2)
}

export interface VisibilityFactors {
  mentionRate: number;     // 0–1
  averageRank: number;     // 0–1
  sentiment: number;       // 0–1
  competitorShare: number; // 0–1
  sourceAuthority: number; // 0–1 — constant neutral in MVP (Decision #6)
}

export interface ScoreSummary {
  results: number;       // all rows in the scan
  validResults: number;  // rows without an error (the scoring denominator)
  mentions: number;      // rows where mentioned === true
  errors: number;        // rows with a non-null error
}

export interface ScoredScan {
  score: number | null;          // null ⇒ nothing to score (Decision #9)
  factors: VisibilityFactors | null;
  summary: ScoreSummary;
}

const NEUTRAL = 0.5; // "no data" default for competitorShare, and sourceAuthority (Decision #6)
const RANK_DEFAULT_SCORE = 0.5; // mentioned but position unknown → mid-visibility

const SENTIMENT_SCORE: Record<ScanSentiment, number> = {
  POSITIVE: 1,
  NEUTRAL: 0.5,
  NEGATIVE: 0,
};

/** Rank decay: position 1 → 1.0, 2 → 0.5, 3 → 0.33 — earlier is better (answeros-spec). */
function rankScore(position: number | null): number {
  if (position !== null && position >= 1) return 1 / position;
  return RANK_DEFAULT_SCORE;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateVisibilityScore(rows: ScoreResultRow[]): ScoredScan {
  const summary: ScoreSummary = {
    results: rows.length,
    validResults: rows.filter((r) => !r.error).length,
    mentions: rows.filter((r) => r.mentioned).length,
    errors: rows.filter((r) => r.error !== null).length,
  };

  if (summary.validResults === 0) {
    return { score: null, factors: null, summary }; // Decision #9
  }

  const valid = rows.filter((r) => !r.error);
  const mentions = valid.filter((r) => r.mentioned);

  // Mention rate (30%): clean mentions over clean checks.
  const mentionRate = mentions.length / valid.length;

  // Average rank (25%): mean rank decay over mentions; 0 when never mentioned
  // (no rank data ≠ mid score — the company wasn't ranked at all).
  const averageRank =
    mentions.length > 0 ? mean(mentions.map((r) => rankScore(r.position))) : 0;

  // Sentiment (20%): mean over mentions that reported a sentiment; 0 when none
  // (no tone data ≠ neutral tone — there were no mentions to have tone).
  const sentiments: ScanSentiment[] = [];
  for (const r of mentions) if (r.sentiment) sentiments.push(r.sentiment);
  const sentiment = sentiments.length > 0 ? mean(sentiments.map((s) => SENTIMENT_SCORE[s])) : 0;

  // Competitor share (15%): tracked mentions vs mentions of ANY other company.
  // No data at all → neutral (neither you nor competitors were named).
  const competitorPresence = valid.filter((r) => r.competitorsMentioned.length > 0).length;
  const competitorShare =
    mentions.length + competitorPresence > 0
      ? mentions.length / (mentions.length + competitorPresence)
      : NEUTRAL;

  // Source authority (10%): constant neutral in MVP (Decision #6).
  const sourceAuthority = NEUTRAL;

  const factors: VisibilityFactors = {
    mentionRate,
    averageRank,
    sentiment,
    competitorShare,
    sourceAuthority,
  };

  const weighted =
    factors.mentionRate * SCORE_WEIGHTS.mentionRate +
    factors.averageRank * SCORE_WEIGHTS.averageRank +
    factors.sentiment * SCORE_WEIGHTS.sentiment +
    factors.competitorShare * SCORE_WEIGHTS.competitorShare +
    factors.sourceAuthority * SCORE_WEIGHTS.sourceAuthority;

  const score = Math.min(100, Math.max(0, Math.round(100 * weighted)));

  return { score, factors, summary };
}
```

Normalization contract (the unit-test surface):

| Factor            | Rule                                                                                                        | Edge cases                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `mentionRate`     | `mentioned / non-error rows`                                                                                | error rows excluded (Decision #2); 0 valid rows → `score: null` (Decision #9)                                |
| `averageRank`     | `mean(1/position)` over mentioned rows                                                                      | mentioned + null position → 0.5 default; zero mentions → **0** (not neutral)                                   |
| `sentiment`       | `mean(POSITIVE=1, NEUTRAL=0.5, NEGATIVE=0)` over mentions with a sentiment                                  | mentions with null sentiment skipped; no sentiments → **0** (not neutral)                                      |
| `competitorShare` | `mentions / (mentions + rows mentioning any competitor)`                                                    | neither mentioned nor competitor-named → 0.5 neutral; you dominate → 1.0; they dominate → approaches 0      |
| `sourceAuthority` | constant `0.5` (Decision #6, user decision)                                                                 | applies to every company equally                                                                            |
| final score       | `clamp(0…100, round(100 × Σ(factor × weight)))`                                                             | weights sum to 1 (pinned by `weights.test.ts`); honest ceiling is **95** (see note below)                    |

> **Note on the 95 ceiling:** with `sourceAuthority` pinned at neutral 0.5, a perfect scan scores 30 + 25 + 20 + 15 + 5 = **95**, never 100. This is the intended, documented consequence of Decision #6 — an unknown factor contributes its neutral midpoint. When the pipeline starts capturing citation/source data (Future), the constant is replaced by a real factor and 100 becomes reachable. Dashboard copy should treat 95 as "perfect" in MVP rather than flagging it as a defect.

**Worked example** (sanity check the math against the unit test):

| Row | error | mentioned | position | sentiment | competitorsMentioned |
| --- | ----- | --------- | -------- | --------- | -------------------- |
| R1  | –     | true      | 1        | POSITIVE  | []                   |
| R2  | –     | true      | 3        | NEUTRAL   | [2 names]            |
| R3  | –     | false     | null     | null      | [1 name]             |
| R4  | "rate limited" | false | null | null | null                 |

- valid = 3, mentions = 2 → `mentionRate` = 2/3 ≈ 0.667
- `averageRank` = (1/1 + 1/3) / 2 ≈ 0.667
- `sentiment` = (1 + 0.5) / 2 = 0.75
- competitorPresence = 2 (R2, R3) → `competitorShare` = 2/4 = 0.5
- `sourceAuthority` = 0.5
- weighted = 0.667×0.3 + 0.667×0.25 + 0.75×0.2 + 0.5×0.15 + 0.5×0.1 ≈ 0.6417 → **score 64**

Contrast cases worth pinning in tests:

- **Never mentioned, no competitors named:** mentionRate 0, rank 0, sentiment 0, share 0.5, source 0.5 → 0 + 0 + 0 + 7.5 + 5 = **13** (the floor — a company that never appears can't be confused with a negatively-reviewed one)
- **Never mentioned, competitors everywhere:** 0 + 0 + 0 + 0 + 5 = **5** (competition actively suppresses share)
- **Mentioned everywhere, rank 1, positive, no competitors:** 30 + 25 + 20 + 15 + 5 = **95** (the honest ceiling)

## Aggregate Helper — `lib/db/scoring.ts`

Thin server-side orchestrator following the `lib/db/results.ts` pattern — it owns the Prisma queries and the row mapping, the calculator stays pure:

```ts
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
```

Contract notes:

- only `name` is extracted from `competitorsMentioned` — competitor share counts presence, not competitor position/sentiment (Decision #5)
- `r.sentiment` is the Prisma `Sentiment` enum — structurally identical string literals to `ScanSentiment`, so no cast is needed
- the dashboard (next spec) is a server component; it can call `getCompanyScore` directly. Add a `GET /api/visibility` route only if/when a client actually needs to fetch the number

---

## Testing (Vitest)

Co-located unit tests for the pure logic only — no network, no DB, no Redis (consistent with the repo):

| File                      | Covers                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/scoring/weights.test.ts` | `SCORE_WEIGHTS` equals the documented 30/25/20/15/10 table; `SCORE_WEIGHT_TOTAL === 1`                                                                                                 |
| `lib/scoring/calculator.test.ts` | empty `[]` → `score: null`; all-error rows → `score: null`; error rows excluded from `mentionRate` and the denominator; `averageRank` decay (pos 1 vs pos 3), null-position default 0.5, zero mentions → 0; `sentiment` mapping POSITIVE/NEUTRAL/NEGATIVE, nulls skipped, no sentiments → 0; `competitorShare` — no data → 0.5, you dominate → 1, they dominate → near 0, both present → partial; `score` clamped to [0, 100]; rounding; the worked example above → **64**; the two contrast cases → **13** and **5**; the perfect case → **95**; `summary` counts (results/validResults/mentions/errors) |

The orchestrator (`lib/db/scoring.ts`) is verified via `npm run build` + the manual flow below — consistent with the repo's current no-DB-unit-tests stance.

---

## Validation

- `npm test` — all unit tests pass (new scoring suites + existing 46)
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- no migration, no new env vars (nothing to configure)
- manual (dev server up with a company that has a completed scan — the 11/12 two-terminal workflow):
  - sanity-check directionality: temporarily log `getCompanyScore(companyId)` from a server component or via `npx tsx -e` against a seeded company; a company with high mention rate / rank 1 / positive sentiment must score near 95, a never-mentioned one near 5–13
  - full visual verification lands with the dashboard spec (tracker #2), which renders the score card from this output
- `context/context/progress-tracker.md` updated (spec entry + session note)

---

## Out of Scope

Do not implement:

- the dashboard visibility score card, factor breakdown, trend graph, loading/empty states (dashboard spec)
- previous-scan deltas / trend arrows (dashboard/competitor specs)
- per-prompt-category score breakdowns (Future)
- `GET /api/visibility` or any scoring API route — the server-component dashboard calls `getCompanyScore` directly
- competitor comparison pages and mention-overlap analysis (competitors spec)
- the recommendations engine — it runs off this score but is its own spec
- caching the score, or cache-first reads of `ScanResult` rows (Decision #3)
- real source-authority weighting / citation counting (Future — needs pipeline capture)
- writing auto-discovered competitors to the `Competitor` table (competitors spec)

---

## Future

Reserved extensions (do not implement):

- **real source authority:** the pipeline captures cited sources (URLs/domains) per mention → authority tiering (Wikipedia/G2/Forbes > niche blog) replaces the neutral constant; un-pins the 95 ceiling
- per-category score breakdown using `Prompt.category` ("CRM", "email marketing", …)
- a delta helper that reuses the calculator on two scans → "+X this week" for trend arrows and weekly emails
- cache-first reads with **scan-scoped** keys if weekly reports repeatedly read rows (Decision #3 revisit)
- per-plan weight tuning (weights are already constants — swap the object per plan)
- recency/partial-scan weighting if error rates grow and every factor ends up penalized

---

## Definition of Done

- `lib/scoring/weights.ts` — `SCORE_WEIGHTS` matches the documented 30/25/20/15/10 table; `SCORE_WEIGHT_TOTAL === 1`
- `lib/scoring/calculator.ts` — `ScoreResultRow` / `ScoredScan` / `VisibilityFactors` / `ScoreSummary` types; `calculateVisibilityScore` pure and Prisma-free; factors per Decision #4; clamp + round per Decision #8; `score: null` on zero valid rows per Decision #9
- `lib/db/scoring.ts` — `getLatestCompletedScan` + `getCompanyScore(companyId)`, both server-only (invariant #4)
- source authority is a documented constant neutral 0.5 (Decision #6, user decision) — not a half-remembered 1.0 "so we can hit 100"
- co-located Vitest suites cover weights, factor math, edge cases, the worked example (64), contrast cases (13, 5), and the ceiling (95)
- `npm test`, `npm run lint`, and `npm run build` all pass
- no new dependencies, env vars, or schema changes; no `"use client"` anywhere in `lib/scoring/` or `lib/db/scoring.ts`
- `progress-tracker.md` reflects the spec (and, once implemented, the completed work)