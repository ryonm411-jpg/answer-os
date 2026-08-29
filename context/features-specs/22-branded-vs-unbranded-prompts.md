# Branded vs Unbranded Prompts — Separate Visibility Scoring & Non-Injective Scanning

> **Status:** Proposed next implementation unit
> **Created:** August 27, 2026
> **Depends on:** `10-prompt-library.md`, `12-visibility-scanner-pipeline.md`, `13-visibility-score.md`, `15-prompt-opportunity-and-management.md`

---

## 1. Goal

Separate AnswerOS's prompt set into two distinct types — **branded** (the company is explicitly named in the question) and **unbranded** (the buyer is searching for solutions without mentioning any company name) — and scan each type with a fundamentally different approach:

- **Branded prompts** (e.g., *"Is Slickwraps good?"*, *"Where to buy Slickwraps laptop skins?"*) — the company name is already in the question, so the current injective scan prompt works as-is.
- **Unbranded prompts** (e.g., *"What are the best laptop skin companies?"*, *"Best laptop skins for MacBook"*) — the company name must **not** be injected into the scan prompt, because the entire point is to discover whether AI models organically recommend the company when buyers are searching for solutions.

**Concrete example — why this matters:**

| Prompt | Type | Current scan behavior | Problem |
| --- | --- | --- | --- |
| *"Where to buy Slickwraps laptop skins?"* | Branded | Injects Slickwraps (redundant — already in question) | None — works correctly |
| *"What are the best laptop skin companies?"* | Unbranded | Injects Slickwraps → AI is primed to mention it | **Inflated mention rate** — the AI wouldn't necessarily recommend Slickwraps without being told to look for it |

This spec fixes the unbranded row by not injecting the company name, letting the AI answer naturally, and then matching the tracked company by name/domain in the response.

### Recommendations philosophy

Recommendations must follow an **evidence → diagnosis → action** pattern. Never make unsupported claims like *"Do X and you will rank #1."* Instead:

| ❌ Avoid | ✅ Prefer |
| --- | --- |
| "Add FAQ schema and you'll rank #1" | "We observed your brand is not mentioned in AI answers for 80% of unbranded prompts. This suggests competitors have stronger content signals. Recommended action: add FAQ schema to your top 5 product pages." |
| "Improve your visibility by 50%" | "We observed your brand appears in 12% of organic prompts vs. 45% for the top competitor. This suggests a content gap. Recommended action: create comparison landing pages for your top 3 competitor matchups." |
| "Do X and you will rank #1" | "We observed X. This suggests Y. Recommended action: Z." |

This applies to all recommendations generated from branded and unbranded scan data. The distinction between branded and unbranded visibility scores provides the evidence foundation for more specific, grounded recommendations.

This separation enables:
1. **Honest organic visibility measurement** — unbranded prompts reveal how often AI models recommend the company *without* being primed, which is the core value proposition for AnswerOS customers.
2. **Separate visibility scores** — a branded visibility score (how well-known is the company when named) vs. an unbranded visibility score (how often is the company organically discovered). Both metrics are valuable and serve different strategic insights.
3. **Removal of scan-prompt bias for unbranded queries** — the current injective approach (spec 12, Decision #12) artificially inflates mention rates for unbranded prompts because the AI is told to look for the company. This spec closes that open question.
4. **More meaningful visibility metric** — by using unbranded prompts like *"What are the best laptop skin companies?"* rather than branded prompts like *"Where to buy Slickwraps laptop skins?"* for primary organic visibility measurement, the score reflects genuine AI recommendation likelihood rather than name recognition.

---

## 2. Mandatory Context Reads

Before implementing, read these files in order:

1. `AGENTS.md` — project agent instructions and Next.js-version warning
2. `context/project-overview.md` — product goals and scope
3. `context/architecture-context.md` — system structure and invariants
4. `context/code-standards.md` — implementation conventions
5. `context/features-specs/10-prompt-library.md` — prompt data model and generation pipeline
6. `context/features-specs/12-visibility-scanner-pipeline.md` — scan prompt construction, Decision #12 (injective acceptance), and the non-injective alternative noted in Future
7. `context/features-specs/13-visibility-score.md` — visibility score algorithm and weighted factors
8. `context/features-specs/15-prompt-opportunity-and-management.md` — prompt intent taxonomy and workspace UI
9. `context/progress-tracker.md` — current implementation state

---

## 3. Current State

### Prompt Model

```prisma
model Prompt {
  id                String       @id @default(cuid())
  companyId         String?
  source            PromptSource @default(CURATED)
  intent            PromptIntent @default(PRODUCT)
  text              String
  category          String
  searchVolume      Int?
  demandScore       Int?
  businessRelevance Int?
  archivedAt        DateTime?
  results           ScanResult[]
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @default(now()) @updatedAt
}
```

No `promptType` or branded/unbranded classification exists.

### Scan Prompt (injective — current behavior)

`lib/scan/prompt.ts` builds a prompt that:
1. Asks the buyer question
2. Tells the AI: *"We are tracking how often "${companyName}" (${companyDomain}) is recommended"*
3. Requests structured JSON metadata with the tracked company's mention, position, sentiment

This is correct for branded prompts (the company is already named in the question) but **biases unbranded prompts** because the AI is primed to look for and mention the company.

### Prompt Generation

`lib/prompts/generator.ts` instructs the AI to generate 50% branded and 50% unbranded queries, but there is no mechanism to tag or distinguish them after generation.

### Open Question (spec 12, Decision #12)

> "Injecting the tracked company into the scan prompt (with the metadata request) is accepted for MVP. A non-injective alternative (ask + report all companies, match by name/domain) is noted in Future."

This spec closes that open question by implementing the non-injective variant for unbranded prompts.

**Example of the two scan approaches:**

For the branded prompt *"Where to buy Slickwraps laptop skins?"*:
- Current behavior (kept): inject Slickwraps → AI answers with Slickwraps-focused result

For the unbranded prompt *"What are the best laptop skin companies?"*:
- Current behavior (broken): inject Slickwraps → AI is primed to mention Slickwraps → inflated mention rate
- New behavior (this spec): do NOT inject Slickwraps → AI answers naturally → if Slickwraps appears, it's a genuine organic mention

---

## 4. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Add a `PromptType` enum (`BRANDED`, `UNBRANDED`) to the `Prompt` model | Explicit classification enables separate scanning strategies and visibility scoring. Inferred from prompt text at generation time and persisted — not recalculated on every read. |
| 2 | Classify prompts using a pure text classifier (no AI call) — check if the company name or domain appears in the prompt text | Simple, deterministic, zero-cost. The generator already produces prompts with or without the company name; classification is a post-generation step. |
| 3 | Unbranded prompts use a non-injective scan prompt variant | Eliminates bias for organic discovery measurement. The AI answers the buyer question without being primed to mention any specific company. |
| 4 | The non-injective scan prompt asks the AI to report ALL companies it mentions in its answer | Structured JSON metadata still captures the same fields (mentioned, position, sentiment, competitors) but the tracked company is identified by name/domain matching after parsing, not by injection. |
| 5 | Branded prompts continue using the current injective scan prompt | No change to existing behavior for prompts that already name the company — injection is redundant but harmless, and the structured metadata contract remains identical. |
| 6 | Calculate separate Visibility Scores: branded, unbranded, and combined | Each score provides distinct strategic insight. Combined score preserves backward compatibility. All three use the same weighted factor formula from spec 13. |
| 7 | A new `buildUnbrandedScanPrompt` function handles the non-injective template | Keeps injective and non-injective templates cleanly separated in `lib/scan/prompt.ts` — each is independently unit-testable. |
| 8 | The non-injective response parser uses domain/name matching to identify the tracked company | After parsing the AI's response for ALL mentioned companies, match the tracked company by domain or name. If not found, `mentioned: false`. |
| 9 | Existing curated prompts are classified by a one-time migration/backfill | ~100 curated prompts need branded/unbranded tags. A migration script classifies them deterministically; no manual tagging. |
| 10 | The prompt workspace UI shows a branded/unbranded badge on each prompt | Users can filter and understand which prompts test organic discovery vs. brand awareness. |

---

## 5. Schema Changes

Modify `prisma/schema.prisma`:

```prisma
enum PromptType {
  BRANDED
  UNBRANDED
}

model Prompt {
  id                String       @id @default(cuid())
  companyId         String?
  company           Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  source            PromptSource @default(CURATED)
  intent            PromptIntent @default(PRODUCT)
  promptType        PromptType   @default(UNBRANDED)  // NEW: branded vs unbranded classification
  text              String
  category          String
  searchVolume      Int?
  demandScore       Int?
  businessRelevance Int?
  archivedAt        DateTime?
  results           ScanResult[]
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @default(now()) @updatedAt

  @@index([companyId])
  @@index([category])
  @@index([intent])
  @@index([promptType])  // NEW: for filtered queries
  @@index([archivedAt])
}
```

Migration:
```bash
npx prisma migrate dev --name add_prompt_type_branded_unbranded
npx prisma generate
```

### Default value

`UNBRANDED` is the default because:
- Most prompts in any library are unbranded (the generator targets 50/50 but curated prompts skew unbranded)
- New user-created prompts should be classified explicitly (the API requires intent selection; adding promptType selection is consistent)
- The safer default avoids accidentally marking organic-discovery prompts as branded (which would inject the company name and corrupt the measurement)

---

## 6. Prompt Classification

### Pure classifier — `lib/prompts/classify.ts`

```ts
import type { PromptType } from "@/generated/prisma";

/**
 * Classify a prompt as BRANDED or UNBRANDED based on whether the company
 * name or domain appears in the prompt text.
 *
 * Rules:
 * - Case-insensitive match against companyName and companyDomain
 * - Domain match strips protocol, "www.", and trailing slashes
 * - Returns BRANDED if either matches; UNBRANDED otherwise
 */
export function classifyPromptType(
  text: string,
  companyName: string,
  companyDomain: string
): PromptType;
```

Implementation notes:
- Normalize company name: lowercase, trim
- Normalize domain: lowercase, strip `https://`, `http://`, `www.`, trailing `/`
- Check if normalized text contains the normalized company name OR the normalized domain (or bare domain without TLD for short names)
- Edge case: a prompt like "best crm" should NOT match a company named "CRM Corp" — use word boundary matching (regex `\b`) to avoid substring false positives

### Classification during generation

Update `lib/prompts/generator.ts` to call `classifyPromptType` after `filterSuggestions` and include `promptType` in the returned `PromptSuggestion`:

```ts
export interface PromptSuggestion {
  text: string;
  category: string;
  intent: PromptIntent;
  promptType: PromptType;  // NEW
  demandScore: number;
  businessRelevance: number;
}
```

### Backfill migration

Run a one-time backfill script to classify existing prompts:
- All existing curated prompts: classify using `classifyPromptText` against each company's name/domain (curated prompts are global, so use a reasonable default or skip — curated prompts are mostly unbranded buyer questions)
- Actually, curated prompts have `companyId = null` and are not company-specific. They should all default to `UNBRANDED` (they are generic buyer questions like "What is the best CRM for startups?"). The few that contain brand names (e.g., "Compare HubSpot vs Salesforce") are industry-generic and do not refer to the tracked company.
- Company-owned AI-suggested and user-custom prompts: classify using `classifyPromptType(text, company.name, company.domain)`

The backfill runs as a Prisma migration data step or a standalone script in `prisma/seed.ts` (idempotent: only updates rows where `promptType` is the default `UNBRANDED` and should be `BRANDED`).

---

## 7. Non-Injective Scan Prompt

### New function — `lib/scan/prompt.ts`

```ts
export interface UnbrandedScanPromptInput {
  question: string;       // the buyer-question prompt text (no company name)
  companyName: string;    // for post-parse identification
  companyDomain: string;  // for post-parse identification
}

/**
 * Build a scan prompt for UNBRANDED queries.
 *
 * Unlike the branded variant, this does NOT inject the company name into
 * the question. The AI answers naturally, and we identify the tracked
 * company by name/domain matching in the parsed response.
 */
export function buildUnbrandedScanPrompt({
  question,
  companyName,
  companyDomain,
}: UnbrandedScanPromptInput): string;
```

Template:

```ts
return [
  `You are answering a buyer request for product or service recommendations.`,
  ``,
  `Question: "${question}"`,
  ``,
  `Answer the question as you normally would — recommend the best options based on your knowledge. Do not mention any specific company unless it genuinely belongs in your answer.`,
  ``,
  `At the very end of your answer, output a single JSON object with EXACTLY this shape and no markdown fences:`,
  `{"mentionedCompanies": [{"name": "CompanyName", "domain": "example.com", "position": 1, "sentiment": "positive", "reasoning": "short sentence"}]}`,
  ``,
  `Rules for the JSON metadata:`,
  `- "mentionedCompanies": an array of EVERY company you mentioned in your answer (excluding generic categories like "open source" or "cloud providers")`,
  `- For each company: "name" (display name), "domain" (primary website domain), "position" (1-based rank in your recommendations, 1 = top pick), "sentiment" ("positive", "neutral", or "negative"), "reasoning" (one short sentence about that company)`,
  `- Include ALL companies, not just the tracked one`,
  `- If you did not mention any specific companies, return {"mentionedCompanies": []}`,
  `- We will match companies by name and domain after parsing — do not alter your answer to favor any specific company`,
].join("\n");
```

### Branded scan prompt (unchanged)

The existing `buildScanPrompt` remains exactly as-is for `BRANDED` prompts.

### Scan job routing — `lib/jobs/scan.ts`

The `scanPrompt` function already receives the prompt. Extend it to check `prompt.promptType`:

```ts
async function scanPrompt(input: {
  provider: AIProvider;
  prompt: { id: string; text: string; promptType: PromptType };
  company: { id: string; name: string; domain: string; competitors?: Array<{ domain: string }> };
}): Promise<ScanResultInput> {
  const scanText = input.prompt.promptType === "BRANDED"
    ? buildScanPrompt({ question: input.prompt.text, companyName: input.company.name, companyDomain: input.company.domain })
    : buildUnbrandedScanPrompt({ question: input.prompt.text, companyName: input.company.name, companyDomain: input.company.domain });

  const response = await askWithRetry(input.provider, scanText);
  // ... parse and extract as before, but for UNBRANDED, use parseUnbrandedScanResponse
}
```

The `getPromptsForCompany` query already returns all prompt fields including the new `promptType`.

---

## 8. Non-Injective Response Parser

### New function — `lib/scan/parse.ts`

```ts
export interface ParsedUnbrandedScanResponse {
  companies: ParsedCompanyMention[];
}

export interface ParsedCompanyMention {
  name: string;
  domain: string;
  position: number | null;
  sentiment: ScanSentiment | null;
  reasoning: string | null;
}

/**
 * Parse a non-injective scan response that lists ALL mentioned companies.
 * Then identify which (if any) matches the tracked company.
 */
export function parseUnbrandedScanResponse(
  content: string,
  trackedCompanyName: string,
  trackedCompanyDomain: string
): ParseResult;
```

Implementation:
1. Extract the JSON object from the response (same `extractJsonObject` as branded parsing)
2. Parse `mentionedCompanies` array
3. For each company, normalize name and domain
4. Match the tracked company: domain match (primary) or case-insensitive name match (fallback)
5. If a match is found, return `mentioned: true` with that company's position/sentiment/reasoning, and all other companies as `competitors`
6. If no match, return `mentioned: false` with all companies as the competitor list (they were mentioned but the tracked company was not)

### Match strategy

```ts
function matchesTrackedCompany(
  candidate: { name: string; domain: string },
  trackedName: string,
  trackedDomain: string
): boolean {
  // Domain match (most reliable)
  const normalizeDomain = (d: string) =>
    d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  if (normalizeDomain(candidate.domain) === normalizeDomain(trackedDomain)) return true;

  // Name match (case-insensitive, trimmed)
  if (candidate.name.trim().toLowerCase() === trackedName.trim().toLowerCase()) return true;

  return false;
}
```

### Output mapping

When the tracked company IS found in the `mentionedCompanies` array:
```ts
{
  ok: true,
  data: {
    mentioned: true,
    position: matchedCompany.position,
    sentiment: matchedCompany.sentiment,
    reasoning: matchedCompany.reasoning,
    competitors: otherCompanies,
  }
}
```

When the tracked company is NOT found:
```ts
{
  ok: true,
  data: {
    mentioned: false,
    position: null,
    sentiment: null,
    reasoning: null,
    competitors: allMentionedCompanies, // they were mentioned, tracked company was not
  }
}
```

This output shape is identical to `ParsedScanResponse` — the rest of the pipeline (scoring, caching, persistence) is unchanged.

---

## 9. Separate Visibility Scores

### Extend `lib/scoring/calculator.ts`

Add a `promptType` filter parameter to the score calculator:

```ts
export interface ScoreCalculatorInput {
  rows: ScoreResultRow[];
  promptType?: PromptType | "ALL";  // NEW: default "ALL" for backward compat
}

export interface ScoreSummary {
  score: number | null;
  mentionRate: number;
  averageRank: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  competitorShare: number;
  sourceAuthority: number;
  validRows: number;
  totalRows: number;
  promptType: PromptType | "ALL";  // NEW
}
```

When `promptType` is provided, filter `rows` to only include results from prompts of that type before calculating.

### Extend `lib/db/scoring.ts`

```ts
export async function getCompanyScore(
  companyId: string,
  promptType?: PromptType | "ALL"
): Promise<ScoreSummary>;
```

Joins `ScanResult` → `Prompt` and filters by `prompt.promptType` when specified.

### Extend `lib/db/dashboard.ts`

Add to the `DashboardData` view model:

```ts
export interface DashboardData {
  // ... existing fields ...
  brandedScore: ScoreSummary | null;    // NEW: score for branded prompts only
  unbrandedScore: ScoreSummary | null;  // NEW: score for unbranded prompts only
  brandedPromptCount: number;           // NEW
  unbrandedPromptCount: number;         // NEW
}
```

### Dashboard UI — `components/dashboard/visibility-score-card.tsx`

Show three score cards (or tabs):
- **Overall** — the combined score (existing behavior)
- **Branded** — visibility when the company is named in the question
- **Organic** — visibility when buyers search without naming the company

The "Organic" label is used instead of "Unbranded" for user-facing copy because it better communicates the value: *"How often do AI models recommend you when buyers don't mention your name?"*

---

## 10. Prompt Workspace UI Updates

### Prompt card — `components/prompts/prompt-card.tsx`

Add a source badge showing `Branded` or `Organic` (using the `promptType` field):

```tsx
<Badge variant={prompt.promptType === "BRANDED" ? "default" : "secondary"}>
  {prompt.promptType === "BRANDED" ? "Branded" : "Organic"}
</Badge>
```

### Filter bar — `components/prompts/prompt-workspace.tsx`

Add a prompt type filter alongside existing intent/category/source filters:
- All
- Branded
- Organic

### Prompt creation — `POST /api/prompts`

Require `promptType` in the request body (or infer from text if not provided):

```ts
// Server-side inference: if the text contains the company name, BRANDED; else UNBRANDED
const promptType = classifyPromptType(text, company.name, company.domain);
```

The client may also send `promptType` explicitly, but the server always validates via `classifyPromptType` to prevent browser-provided values from corrupting the classification.

---

## 11. File Structure

```
lib/
  prompts/
    classify.ts              # classifyPromptType (pure, unit-testable)
    classify.test.ts         # classification tests
    generator.ts             # updated: includes promptType in PromptSuggestion
  scan/
    prompt.ts                # updated: new buildUnbrandedScanPrompt export
    prompt.test.ts           # updated: tests for non-injective template
    parse.ts                 # updated: new parseUnbrandedScanResponse
    parse.test.ts            # updated: tests for non-injective parsing
  scoring/
    calculator.ts            # updated: promptType filter
    calculator.test.ts       # updated: promptType-specific scoring tests
  db/
    prompts.ts               # unchanged (query returns promptType automatically)
    scoring.ts               # updated: promptType-aware score query
    dashboard.ts             # updated: branded/unbranded score fields
components/
  dashboard/
    visibility-score-card.tsx # updated: branded/organic/overall tabs
  prompts/
    prompt-card.tsx          # updated: branded/organic badge
    prompt-workspace.tsx     # updated: prompt type filter
app/
  api/
    prompts/
      route.ts               # updated: promptType in response + creation
```

---

## 12. Testing (Vitest)

| File | Covers |
| --- | --- |
| `lib/prompts/classify.test.ts` | Company name match (case-insensitive), domain match (www stripping, protocol stripping), word boundary (no substring false positives), empty inputs, short company names, prompts containing competitor names (should be UNBRANDED), curated generic prompts (UNBRANDED) |
| `lib/scan/prompt.test.ts` | `buildUnbrandedScanPrompt` contains question text, does NOT contain company name/domain, includes `mentionedCompanies` in JSON template, instructs natural answering |
| `lib/scan/parse.test.ts` | `parseUnbrandedScanResponse` — domain match, name match, no match (mentioned: false), multiple companies, empty array, malformed JSON, company with domain but wrong name, competitor name confusion |
| `lib/scoring/calculator.test.ts` | Score calculation with promptType filter — branded-only rows, unbranded-only rows, all rows combined, empty filtered set → score: null |

---

## 13. Validation

- `npx prisma migrate dev --name add_prompt_type_branded_unbranded` — applies cleanly
- `npx prisma generate` — client regenerates
- Backfill script runs and classifies existing prompts
- `npm test` — all unit tests pass (existing + new)
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- Manual verification:
  - Existing branded prompts (e.g., "Is AnswerOS good?") → classified as `BRANDED`
  - Existing unbranded prompts (e.g., "What is the best CRM for startups?") → classified as `UNBRANDED`
  - Scanning a branded prompt → company name injected (existing behavior)
  - Scanning an unbranded prompt → company name NOT injected, AI answers naturally
  - If the AI mentions the tracked company in an unbranded scan → `mentioned: true` via name/domain matching
  - If the AI does NOT mention the company → `mentioned: false`, competitors listed
  - Dashboard shows separate branded/organic visibility scores
  - Prompt workspace shows branded/organic badges and filters
- `context/context/progress-tracker.md` updated

---

## 14. Out of Scope

- Changing the branded scan prompt behavior (it works correctly as-is)
- Auto-classification of prompts by AI (deterministic text matching is sufficient)
- Per-intent branded/unbranded breakdown (only per-type, not per-intent × type)
- Changing the prompt generation ratio (still 50/50; this spec only tags and scans them differently)
- Changing the visibility score formula (same weighted factors, just filtered by prompt type)
- Competitive gap or opportunity score changes (unchanged; they apply per-prompt regardless of type)

---

## 15. Definition of Done

- `PromptType` enum and `promptType` field added to Prisma schema; migration applied
- `lib/prompts/classify.ts` — pure classifier with unit tests
- `lib/prompts/generator.ts` — returns `promptType` in `PromptSuggestion`
- `lib/scan/prompt.ts` — `buildUnbrandedScanPrompt` function with unit tests
- `lib/scan/parse.ts` — `parseUnbrandedScanResponse` with domain/name matching and unit tests
- `lib/jobs/scan.ts` — routes to injective/non-injective prompt based on `promptType`
- `lib/scoring/calculator.ts` — `promptType` filter parameter
- `lib/db/scoring.ts` — `promptType`-aware score query
- `lib/db/dashboard.ts` — branded/unbranded score fields in `DashboardData`
- Dashboard UI shows branded/organic/overall visibility scores
- Prompt workspace shows branded/organic badges and type filter
- Existing prompts backfilled with correct `promptType`
- `npm test`, `npm run lint`, and `npm run build` all pass
- `progress-tracker.md` reflects the completed work
