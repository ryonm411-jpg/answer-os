# Prompt Library (Curated + AI Suggestions)

## Goal

Build the prompt library — the set of questions AnswerOS scans across the four AI providers. It has two halves:

1. **Curated library** — ~100 hand-seeded prompts organized by industry/category, stored as a global catalog in the `Prompt` table and seeded by `prisma/seed.ts`.
2. **AI suggestions** — per-company prompts generated from the user's domain, industry, and competitors, produced by `lib/prompts/generator.ts` through the `lib/providers/` abstraction layer.

Expose both through a thin API surface (`GET /api/prompts`, `POST /api/prompts/generate`) so the scan job and the dashboard can read the effective prompt set for a company, and kick off generation from onboarding after domain entry.

Do **not** implement:

- the scan job / scan pipeline (a future spec reads prompts via `getPromptsForCompany`)
- the dashboard UI — "top/missing prompts", prompt lists, or regenerate buttons (dashboard spec)
- user-custom prompts or per-prompt management (Phase 2)
- Trigger.dev background jobs — generation is a single, short `ask()` call and runs synchronously in the route

Follow:

- `architecture.md` (invariant #2: AI calls go through `lib/providers/` — the generator never touches a vendor SDK; invariant #6: validation at the API boundary)
- `code-standards.md` (thin route handlers, `enum` for constrained sets, Vitest with co-located tests, server-only modules)
- `ai-workflow-rules.md` (Database Migration Checklist, scope discipline)
- `answeros-spec.md` (`lib/prompts/library.ts` + `lib/prompts/generator.ts` file organization, the `Prompt` model)
- `09-ai-provider-abstraction.md` (the provider surface this feature consumes)

---

## Prerequisites

Before beginning implementation:

- Read `AGENTS.md`.
- Confirm `09-ai-provider-abstraction.md` is implemented — the generator calls `getAvailableProviders()` / `getProvider()` / `ask()`, never an SDK directly.
- Confirm `08-domain-onboarding.md` is implemented — the onboarding kickoff wiring extends `components/onboarding/onboarding-form.tsx`.

---

## Current State

Reference points already in the codebase:

- `prisma/schema.prisma` — `Prompt` model: `id`, `text`, `category`, `searchVolume`, `results`, `createdAt`. No `companyId`, no source field; `Company` has no `prompts` relation
- `lib/providers/` — `AIProvider.ask()`, `getAvailableProviders()`, `getProvider(name)`, `createMockProvider(name, overrides)`, `AIProviderError`, `DEFAULT_MAX_TOKENS` / `DEFAULT_TEMPERATURE` (09)
- `lib/db/companies.ts` — `getCompanyByClerkId`, `createCompany` (the thin-helper pattern this feature mirrors in `lib/db/prompts.ts`)
- `app/api/domain/route.ts` — the `{ data }` / `{ error: { message } }` envelope, Clerk auth + ownership pattern
- `components/onboarding/onboarding-form.tsx` — calls `createCompany(domain)` then `router.push("/editor")`; the insertion point for the generation kickoff
- `prisma.config.ts` — `migrations.path` set; **no** `migrations.seed` yet; `tsx` is **not** installed
- `lib/utils/domain.ts` — shared validation helpers (unused here; prompts are not user-supplied in MVP)

Known gaps this feature fills:

- the `Prompt` table cannot hold per-company suggestions — no `companyId`, no source distinction
- there is no curated seed data and no `prisma/seed.ts`
- there is no generation logic, no `lib/prompts/`, and no prompts API
- onboarding never generates prompts, so a first scan would have nothing tailored to the company

---

## Decisions (2026-08-07)

| #  | Decision                                                                                       | Rationale                                                                                                              |
| -- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1  | Extend `Prompt` with nullable `companyId` + a `PromptSource` enum (user decision)              | One table for both halves; curated prompts are global (`companyId = null`), suggestions are company-scoped. The scan job filters `companyId IS NULL OR companyId = ?`. Minimal migration. |
| 2  | On-demand generation API + onboarding kickoff (user decision)                                  | Matches the core flow step "Prompt library — system generates prompts based on industry templates + AI suggestions" between onboarding and first scan. Re-runnable later; suggestions ready before any scan. |
| 3  | API + lib + tests only — no UI (user decision)                                                 | Prompt display ("top/missing prompts") belongs to the dashboard spec; this feature delivers the data layer and endpoint. |
| 4  | Seed is idempotent by guard: skip when curated prompts already exist                            | No unique constraint on `text` (suggestions may repeat across companies), so upsert-by-text is impossible. A destructive deleteMany would cascade into `ScanResult` rows — unsafe. Re-seed is explicit. |
| 5  | Generation uses the first configured provider from `getAvailableProviders()` (or an explicit `provider` override) | Reuses the 09 registry; no new provider config. Dev/test use `createMockProvider` with scripted content. |
| 6  | Suggestions are deduped against the curated catalog and capped (default 20, hard max 50)       | Scans 100+ curated prompts already; capping keeps scan time and cost bounded. Dedupe by normalized text keeps the set clean. |
| 7  | Re-generation replaces the company's previous suggestions in one transaction                    | Idempotent re-runs (invariant #7 spirit): `deleteMany` + `createMany` inside `$transaction`. No orphaned or stale suggestions. |
| 8  | Categories are constrained to the curated `PROMPT_CATEGORIES` list; unknown AI categories map to `"Other"` | Keeps dashboard grouping and future scoring stable; the generator instructs the model to use only known categories. |

---

## Dependencies

No new runtime dependencies — generation uses the `ai` SDK already installed by 09.

For seeding, add `tsx` as a devDependency (the Prisma v7 seed command runs `prisma/seed.ts` through it) and wire it in `prisma.config.ts`:

```ts
// prisma.config.ts
migrations: {
  path: "prisma/migrations",
  seed: "tsx prisma/seed.ts",
},
```

```bash
npm install -D tsx
```

---

## Environment Variables

No new environment variables. Generation uses the provider keys already documented in `09-ai-provider-abstraction.md` (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`).

---

## Schema Changes

Modify `prisma/schema.prisma` (Database Migration Checklist in `ai-workflow-rules.md`):

```prisma
enum PromptSource {
  CURATED
  AI_SUGGESTED
}

model Company {
  // ...existing fields...
  prompts Prompt[]
}

model Prompt {
  id           String       @id @default(cuid())
  companyId    String?      // null = curated global catalog; set = AI-suggested for this company
  company      Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  source       PromptSource @default(CURATED)
  text         String
  category     String
  searchVolume Int?
  results      ScanResult[]
  createdAt    DateTime     @default(now())

  @@index([companyId])
  @@index([category])
}
```

- `text` is intentionally **not** unique — different companies may legitimately share a suggestion; dedupe is enforced in logic, not by constraint
- `onDelete: Cascade` on `company` — deleting a company removes its AI suggestions (no orphans)
- Migration: `npx prisma migrate dev --name add_prompt_source_and_company`, then `npx prisma generate` (client regenerates into `generated/prisma`)

---

## Curated Prompt Library

### Data module — `lib/prompts/curated.ts`

Pure data + constants, server-only, no Prisma imports (so `prisma/seed.ts` can import it without a client dependency):

```ts
export const PROMPT_CATEGORIES = [
  "CRM",
  "Email Marketing",
  "Project Management",
  "Analytics",
  "Payments",
  "Collaboration",
  "Help Desk",
  "Marketing Automation",
  "Data & BI",
  "Security",
  "HR & Recruiting",
  "Other",
] as const;

export interface CuratedPrompt {
  text: string;
  category: string;
  searchVolume?: number;
}

export const CURATED_PROMPTS: CuratedPrompt[] = [ /* ~100 prompts */ ];

export function isKnownCategory(category: string): boolean;
export function normalizePromptText(text: string): string;
```

Guidelines for the final list (finalized during implementation — see Open Questions in `progress-tracker.md`):

- **~100 prompts** across the categories above (~8 per category); every category except `"Other"` must have entries
- Prompts are **plain buyer questions an AI assistant would answer**, e.g. `"What's the best CRM for small business?"`, `"Compare HubSpot vs Salesforce"`, `"Best email marketing software for startups"`
- No company names from AnswerOS or its customers; competitors appear naturally in comparison prompts
- Prompt text normalized: trimmed, single spaces, sentence case — `normalizePromptText` is the single canonical form used for dedupe everywhere
- `searchVolume` is best-effort estimated monthly volume, or omitted (null in DB) when unknown — it is not sourced in MVP

### Seed — `prisma/seed.ts`

```ts
import { prisma } from "../lib/db/prisma";
import { CURATED_PROMPTS } from "../lib/prompts/curated";

// Idempotent by guard: curated prompts have no unique key (text repeats across
// companies), so skip instead of upsert. Deleting + re-inserting would cascade
// into ScanResult rows — never do that.
async function main() {
  const existing = await prisma.prompt.count({ where: { source: "CURATED" } });
  if (existing > 0) {
    console.log(`Prompt library already seeded (${existing} curated prompts). Skipping.`);
    return;
  }
  const created = await prisma.prompt.createMany({
    data: CURATED_PROMPTS, // source defaults to CURATED, companyId null
  });
  console.log(`Seeded ${created.count} curated prompts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); });
```

Run with `npx prisma db seed`. Forced re-seed (dev only): `prisma.prompt.deleteMany({ where: { source: "CURATED" } })` manually, then re-run — documented in the script header, not automated.

---

## File Structure

```
prisma/
  seed.ts                       # curated prompt seeding (idempotent guard)
lib/
  prompts/
    curated.ts                  # PROMPT_CATEGORIES, CuratedPrompt, CURATED_PROMPTS, normalizePromptText, isKnownCategory
    library.ts                  # getPromptsForCompany / getCompanySuggestions composition helpers
    generator.ts                # generatePromptSuggestions + parseSuggestions + filterSuggestions
    errors.ts                   # PromptGenerationError
    curated.test.ts             # data integrity tests (co-located)
    generator.test.ts           # parse/filter/generation tests via MockProvider (co-located)
  db/
    prompts.ts                  # thin Prisma helpers: list + transactional replace
app/
  api/
    prompts/
      route.ts                  # GET /api/prompts — effective prompt set for the company
      generate/
        route.ts                # POST /api/prompts/generate — regenerate AI suggestions
```

No `"use client"` anywhere in `lib/prompts/` — server-only by construction.

---

## Data Access Layer — `lib/db/prompts.ts`

Thin Prisma helpers following the `lib/db/companies.ts` pattern:

| Helper                     | Purpose                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `getPromptsForCompany(companyId)` | Curated prompts + this company's AI suggestions, ordered by `category` then `text`. The scan job and dashboard read this. |
| `getCompanySuggestions(companyId)` | Only the company's `AI_SUGGESTED` prompts.                                                       |
| `replaceCompanySuggestions(companyId, suggestions)` | `$transaction([deleteMany(companyId + AI_SUGGESTED), createMany(...)])` — idempotent regeneration. |

- `getPromptsForCompany` queries `where: { OR: [{ companyId: null }, { companyId }] }`
- `replaceCompanySuggestions` inserts `{ companyId, source: "AI_SUGGESTED", text, category, searchVolume: null }`
- Keep these thin — no scan-result includes (those arrive with the scan spec)

---

## Prompt Library Logic — `lib/prompts/library.ts`

Pure composition helpers over the data access layer, kept server-side:

- `normalizePromptText` (re-exported from `curated.ts`) — trim, collapse whitespace, lowercase for comparison
- `isKnownCategory` / category fallback (`"Other"`) used by the generator pipeline

`lib/prompts/library.ts` stays small; the query helpers live in `lib/db/prompts.ts` (data), the AI pipeline in `generator.ts` (logic).

---

## AI Suggestion Generator — `lib/prompts/generator.ts`

### Types

```ts
export interface PromptSuggestion {
  text: string;
  category: string;
}

export interface GeneratePromptSuggestionsInput {
  companyName: string;
  domain: string;
  industry: string | null;
  competitors: { name: string; domain: string }[];
  count?: number; // default 20, hard max 50
}
```

### Flow

1. **Pick provider** — `opts.provider` if given, else `getAvailableProviders()[0]`. If none is configured, throw `PromptGenerationError("No AI provider configured")` — never crash at import time (same discipline as 09).
2. **Build the generation prompt** — system instructions: write plain, natural buyer questions a person would ask an AI assistant about the given category space; reference the company name, domain, industry, and competitor names; return **only** a JSON array of `{ "text": string, "category": string }` objects; categories must come from `PROMPT_CATEGORIES`. Include 2–3 curated few-shot examples from the most relevant categories.
3. **Call the provider** — `provider.ask(generationPrompt, { maxTokens: 4096, temperature: 0.8 })` — a higher temperature than the scanning default (0.2) because suggestion generation wants variety; token budget sized for ~20–50 JSON entries. Wrap failures: `AIProviderError` propagates as-is; anything else maps to `PromptGenerationError`.
4. **Parse** — `parseSuggestions(content)` extracts the JSON array from the plain-text response (tolerates markdown fences and surrounding prose).
5. **Filter** — `filterSuggestions(raw, curatedTexts, max)`:
   - drop items with empty/whitespace text, non-string fields, or text shorter than 3 chars
   - dedupe by `normalizePromptText` within the batch
   - drop any suggestion whose normalized text matches a curated prompt (from `CURATED_PROMPTS`)
   - map unknown categories to `"Other"`
   - cap at `count` (default 20, hard max 50)

### Parsing helpers (unit-tested)

```ts
export function parseSuggestions(content: string): PromptSuggestion[];
export function filterSuggestions(
  raw: PromptSuggestion[],
  curatedTexts: Set<string>, // normalized curated texts
  max: number
): PromptSuggestion[];
```

### Errors — `lib/prompts/errors.ts`

```ts
export class PromptGenerationError extends Error {}
```

Distinct from `AIProviderError` (provider call failure) — `PromptGenerationError` covers "no provider configured" and unexpected failures. Malformed or empty AI output is **not** an error: `parseSuggestions` / `filterSuggestions` degrade to an empty list, and the route returns a successful `200` so the scan proceeds on curated prompts alone. The route maps `AIProviderError` → `502` and `PromptGenerationError` → `503`.

---

## API Routes

Both routes follow the domain-route pattern: Clerk auth first, thin body handling, delegate to `lib/`, `{ data }` / `{ error: { message } }` envelope.

### GET /api/prompts

Returns the effective prompt set for the authenticated user's company (curated + AI suggestions).

- `401` — unauthenticated
- `200` — `{ data: { prompts: [{ id, text, category, source, searchVolume, createdAt }] } }`, ordered by `category` then `text`; an **empty array** when the user has no company yet — "no company" is a valid state, not an error, matching the `GET /api/domain` convention in `07-wire-dashboard.md`

No query filters in MVP — the set is at most ~120 rows.

### POST /api/prompts/generate

Regenerates the company's AI suggestions.

- `401` — unauthenticated
- `404` — user has no company
- `503` — no AI provider configured (`PromptGenerationError`)
- `502` — provider call failed (`AIProviderError`, with a user-friendly message; never a raw stack trace)
- `200` — `{ data: { prompts: PromptSuggestion[], count } }` — the newly persisted suggestions. Zero usable suggestions is a successful `200` with an empty array, not an error — the scan proceeds on curated prompts alone

Flow:

1. resolve Clerk user → company via `getCompanyByClerkId`
2. load the company's competitors (`prisma.competitor.findMany({ where: { companyId } })`)
3. build `GeneratePromptSuggestionsInput` from company name/domain/industry + competitors
4. `generatePromptSuggestions(input)` — one synchronous `ask()` call (short-lived; invariant #1 is about scan workloads, not a single completion)
5. `replaceCompanySuggestions(company.id, suggestions)` — transactional replace (decision #7)
6. respond

Body is empty in MVP — `count` is not user-configurable yet (see Future).

---

## Onboarding Kickoff

Wire `components/onboarding/onboarding-form.tsx` (the only UI touch in this feature):

- after `createCompany(domain)` succeeds, fire `POST /api/prompts/generate` **without awaiting** — best-effort and non-blocking:

```ts
// after createCompany succeeds, before/parallel to navigation
fetch("/api/prompts/generate", { method: "POST" }).catch(() => {});
router.push("/editor");
```

- failures are silent — if no provider key is configured, or the call fails, onboarding still completes and the user lands on the dashboard; generation is re-runnable later (regenerate hookup belongs to the dashboard spec)
- the loading state and error handling of the form itself are unchanged

---

## Testing (Vitest)

Co-located tests, following 09's pattern. All logic tested is pure or uses `MockProvider` — no network calls, no DB required:

| File                    | Covers                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `curated.test.ts`       | `CURATED_PROMPTS` has ≥ 100 entries; ≥ 8 categories populated (excluding `"Other"`); all texts non-empty; normalized texts unique; every category in `PROMPT_CATEGORIES`; `searchVolume` ≥ 0 when present; `normalizePromptText` handles trimming/casing/whitespace |
| `generator.test.ts`     | `parseSuggestions` — plain JSON, fenced JSON, JSON embedded in prose, invalid JSON → `[]`, malformed/empty items dropped; `filterSuggestions` — dedupes, drops curated duplicates, caps at `max`, maps unknown categories to `"Other"`; `generatePromptSuggestions` with `createMockProvider("openai", { content })` returns filtered suggestions and respects `count`; no configured provider → `PromptGenerationError` (use `vi.stubEnv` to clear keys, mirroring `registry.test.ts`) |

DB helpers (`lib/db/prompts.ts`) and routes are verified via `npm run build` + manual/API checks — consistent with the current repo (no DB-backed unit tests exist yet).

---

## Validation

- `npx prisma migrate dev --name add_prompt_source_and_company` — applies cleanly; verify the migration SQL (checklist in `ai-workflow-rules.md`)
- `npx prisma generate` — client regenerates without errors
- `npx prisma db seed` — seeds the curated library; re-running skips (guard works)
- `npm test` — Vitest unit tests pass
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- `context/context/progress-tracker.md` updated (spec entry + session note)

---

## Out of Scope

Do not implement:

- the scan job / scan pipeline (reads prompts via `getPromptsForCompany` in its own spec)
- dashboard UI — prompt lists, "top/missing prompts" widgets, regenerate buttons (dashboard spec)
- user-custom prompts, prompt toggling, or per-prompt CRUD (Phase 2)
- category management UI
- `searchVolume` data sourcing (nullable in MVP)
- rate limiting or caching (Redis spec)
- Trigger.dev background generation (single short `ask()` runs synchronously)
- multi-language prompts
- competitor auto-discovery (competitors spec)
- consistent snapshot semantics if a scan runs mid-regeneration (scan spec concern)

---

## Future

Reserved extensions (do not implement):

- regenerate trigger in the editor/dashboard UI (dashboard spec)
- user-custom prompts and per-category toggling (Phase 2, `answeros-spec.md`)
- catalog expansion across more industries/categories
- `count` and provider selection surfaced as request options
- generation via background job when counts grow
- per-category weighting inputs for the visibility score
- suggestion quality scoring / dedupe against historical suggestions across companies

---

## Definition of Done

- `Prompt` has nullable `companyId`, `PromptSource` enum, and the `Company.prompts` back-relation; migration applied; client regenerated
- `prisma/seed.ts` + `lib/prompts/curated.ts` seed ≥ 100 curated prompts across ≥ 8 categories; seed is idempotent (skips when curated prompts exist)
- `tsx` installed; `migrations.seed` configured in `prisma.config.ts`; `npx prisma db seed` works
- `lib/db/prompts.ts` exposes `getPromptsForCompany`, `getCompanySuggestions`, `replaceCompanySuggestions` (transactional)
- `lib/prompts/generator.ts` generates suggestions via `lib/providers/` only (invariant #2), parses and filters output, throws `PromptGenerationError` when no provider is configured
- `GET /api/prompts` returns the company's effective prompt set with the `{ data }` envelope; `401` handled, empty array when no company (07 convention)
- `POST /api/prompts/generate` persists suggestions transactionally; `401`/`404`/`502`/`503` handled; empty result is a successful `200`
- onboarding kicks off generation best-effort after company creation (non-blocking, failures silent)
- no vendor SDK imports outside `lib/providers/`
- unit tests cover curated data integrity, parsing, filtering, and MockProvider-driven generation
- `npm test`, `npm run lint`, and `npm run build` all pass
- `progress-tracker.md` reflects the completed work
