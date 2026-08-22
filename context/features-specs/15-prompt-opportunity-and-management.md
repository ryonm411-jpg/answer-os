# Prompt Opportunity Ranking & Prompt Management

> **Status:** Proposed next implementation unit
> **Created:** August 21, 2026
> **Depends on:** `10-prompt-library.md`, `12-visibility-scanner-pipeline.md`, `14-dashboard-ui.md`

---

## 1. Goal

Make AnswerOS's prompt set transparent, relevant, and actionable before a scan runs.

Users should be able to:

* see the exact prompts AnswerOS will test
* understand why each prompt matters
* see the prompt's intent and business category
* review AI-generated suggestions
* add custom prompts
* edit or archive company-owned prompts
* distinguish curated, AI-suggested, and custom prompts
* review the final active prompt set before starting a scan

The feature also introduces an **Opportunity Score** used to prioritize prompts:

```text
Opportunity Score =
  Demand Estimate
  × Competitive Gap
  × Business Relevance
```

Where:

* Demand Estimate = `0..100`
* Competitive Gap = `0..1`
* Business Relevance = `0..100`
* Opportunity Score = `0..100`

The score is a **prioritization metric only**. It is not part of the existing Visibility Score and does not represent guaranteed traffic, conversions, rankings, or revenue.

This feature extends the existing prompt-library and scan infrastructure. It does not replace the existing curated prompt catalog or visibility-scanning pipeline.

---

Follow:

- `CLAUDE.md` — **read first**; it `@`-imports `AGENTS.md`, including the Next.js-version warning and project workflow rules
- `context/project-overview.md` — dashboard goals and MVP scope
- `context/architecture.md` — server-side score invariant, ownership model, and storage boundaries
- `context/ui-context.md` — dark theme, dashboard shell, colors, responsive layout, and component conventions
- `context/code-standards.md` — server components by default, thin data helpers, `components/dashboard/`, and no hardcoded colors
- `context/ai-workflow-rules.md` — scope discipline and documentation requirements
- `context/progress-tracker.md` — current implementation state
- `context/features-specs/07-wire-dashboard.md` — existing company loading and dialog wiring
- `context/features-specs/13-visibility-score.md` — score output, factors, summaries, and the honest 95-point MVP ceiling

---

# 2. Core Concepts

AnswerOS must keep these three concepts separate:

### Category

Describes the company's business/topic area.

Examples:

```text
Barefoot Footwear
CRM
Project Management
Accounting Software
```

### Intent

Describes what the user is trying to accomplish with the question.

Examples:

```text
COMPARISON
PURCHASE_INTENT
ALTERNATIVE
```

### Prompt

The actual question sent to an AI provider.

Example:

```text
What are the best barefoot shoes for running?
```

Therefore:

```text
Category:
Barefoot Footwear

Intent:
PURCHASE_INTENT

Prompt:
"What are the best barefoot shoes for running?"
```

Intent must never replace or redefine the existing `category` field.

---

# 3. Conceptual Reference: Peec Suggested Prompts

Use Peec's Suggested Prompts experience only as a conceptual product reference.

AnswerOS may adopt the interaction concept of:

* understandable prompt cards
* prompt grouping
* prompt suggestions
* prompt review before scanning

Do not copy Peec's branding, proprietary implementation, or visual design.

AnswerOS must differentiate its implementation through:

* seven explicit intent types
* business-profile-grounded generation
* Opportunity Score
* business relevance
* source labels
* ownership controls
* edit/archive controls
* transparent score factors

The experience has four connected parts:

1. **Prompt Cards** — one prompt per readable card.
2. **Intent Categories** — prompts can be grouped or filtered by intent.
3. **Opportunity Ranking** — prompts are ranked using server-side scoring when sufficient data exists.
4. **Prompt Review** — users review the effective prompt set before scanning.

---

# 4. User Experience

## 4.1 Prompt Review Before Scanning

The Run Scan flow must not begin with an opaque prompt set.

Before a scan is dispatched, the user can open a prompt review workspace showing:

* curated prompts
* AI-suggested prompts
* user-created prompts
* prompt text
* intent
* business category
* source
* active/archive state
* demand estimate
* business relevance
* competitive gap when scan data exists
* Opportunity Score when all required factors exist

The review workspace must be available from:

* the editor navigation
* the Run Scan confirmation flow

The final Run Scan action must communicate exactly how many active prompts will be tested.

Users may:

1. inspect generated prompts
2. add a custom prompt
3. edit an AI-suggested prompt
4. edit a custom prompt
5. archive an AI-suggested prompt
6. archive a custom prompt
7. leave curated prompts unchanged
8. start a scan using the active prompt set

Curated prompts are read-only to company users.

If there are zero active effective prompts, Run Scan must be blocked with an actionable message.

---

# 5. Prompt Examples

These examples illustrate the taxonomy for a barefoot-shoe company such as Xero Shoes.

They are examples for classification and acceptance testing, not a hardcoded company-specific catalog.

| Intent          | Example                                                |
| --------------- | ------------------------------------------------------ |
| Commercial      | `Best barefoot shoes`                                  |
| Comparison      | `Xero Shoes vs Vivobarefoot`                           |
| Problem         | `Best shoes for people who want natural foot movement` |
| Product         | `Best minimalist hiking shoes`                         |
| Brand           | `Are Xero Shoes good?`                                 |
| Alternative     | `Best Xero Shoes alternatives`                         |
| Purchase intent | `Best zero-drop shoes for running`                     |

The same taxonomy must work for B2B SaaS and other supported industries.

---

# 6. Prompt Intent Taxonomy

Use a constrained `PromptIntent` enum.

Do not use arbitrary free-form intent strings in the database or API.

| Value             | Meaning                                          | Typical signals                  |
| ----------------- | ------------------------------------------------ | -------------------------------- |
| `COMMERCIAL`      | Broad category-level discovery or best-of query  | "best", "top", "leading"         |
| `COMPARISON`      | Direct comparison between products or brands     | "X vs Y", "compare"              |
| `PROBLEM`         | A need, pain point, or desired outcome           | "for people who...", "how to..." |
| `PRODUCT`         | Product/category discovery focused on a use case | "best minimalist hiking shoes"   |
| `BRAND`           | Evaluation of a named company or product         | "is X good?", "X review"         |
| `ALTERNATIVE`     | Replacement or competitor-alternative discovery  | "alternatives to X"              |
| `PURCHASE_INTENT` | Query close to a buying decision                 | "buy", "price", "where to get"   |

The UI label for `PURCHASE_INTENT` is **Purchase intent**.

The enum remains `PURCHASE_INTENT`.

## Classification Rules

* AI generation must return a valid intent for every suggestion.
* User-created prompts require explicit intent selection.
* Do not silently infer an intent when a user creates a prompt.
* Unknown AI intents should normally cause that generated item to be rejected.
* `PRODUCT` may be used only as a parser fallback when the system can safely recover a malformed item; the event must be logged as a non-fatal warning.
* Intent is metadata. It does not determine scan results.

---

# 7. Business Profile Requirement

Prompt generation must be grounded in a structured Business Profile.

The generator must not generate prompts from the domain name alone.

At minimum, the profile must contain:

```ts
export interface BusinessProfile {
  productDescription: string;
  category: string;
}
```

Where:

* `productDescription` describes what the company sells or the problem it solves.
* `category` describes the primary business/topic area.

The profile may later be expanded with additional fields such as:

* target customers
* products
* services
* use cases
* key topics
* geography
* competitors

For this MVP, `productDescription` and `category` are required.

## Business Relevance Requirement

The generator must use the Business Profile when generating prompts and estimating business relevance.

The generator must not generate unrelated prompts merely because they are common questions in an unrelated industry.

For example, if the company is Xero Shoes, prompts about CRM software must not be generated unless CRM is actually part of the company's identified offering.

If the Business Profile is missing or empty, generation must fail with a clear validation error rather than falling back to `industry`.

---

# 8. Prompt Generation Pipeline

Prompt generation follows this sequence:

```text
Authenticated Company
        ↓
Business Profile
        ↓
Existing Active Prompts
        ↓
AI Prompt Generation
        ↓
JSON Validation
        ↓
Text Normalization
        ↓
Intent Validation
        ↓
Business Relevance Validation
        ↓
Deduplication
        ↓
Score Metadata Validation
        ↓
Persist New AI Suggestions
        ↓
Prompt Review Workspace
```

Generation must be additive.

Regeneration must never:

* delete custom prompts
* overwrite custom prompts
* delete reviewed AI suggestions
* overwrite edited AI suggestions
* replace the company's entire prompt set

Repeated generation must be safe.

Duplicate active prompts are skipped.

---

# 9. Prompt Generation Contract

Extend the existing generation input:

```ts
export interface GeneratePromptSuggestionsInput {
  companyName: string;
  domain: string;
  industry: string | null;
  businessProfile: BusinessProfile;
  competitors: {
    name: string;
    domain: string;
  }[];
  count?: number;
}
```

The generator must receive the business profile.

The AI must be instructed to generate prompts that are relevant to:

* the company's actual offering
* its category
* its products/services
* its buyers
* relevant use cases
* relevant competitors
* relevant buyer intents

The generator must produce prompts across the seven intent categories where applicable.

It should not generate only generic "best" queries.

---

# 10. Prompt Suggestion Contract

```ts
export interface PromptSuggestion {
  text: string;
  category: string;
  intent: PromptIntent;
  demandScore: number;
  businessRelevance: number;
}
```

The AI output must be structured JSON.

The server must validate every generated item.

Filtering must:

* normalize prompt text
* reject empty or very short prompts
* validate intent
* validate category
* clamp scores to `0..100`
* deduplicate against active curated prompts
* deduplicate against active company prompts
* enforce the configured generation maximum
* reject clearly irrelevant prompts
* never overwrite user-created prompts
* never overwrite edited AI suggestions

Malformed AI output must be non-fatal to the application.

Invalid items should be discarded rather than persisted.

---

# 11. Prompt Relevance Validation

The server must perform a basic relevance check before persisting AI suggestions.

At minimum, the generated prompt must be consistent with:

* the Business Profile category
* the Business Profile product description
* the selected intent

The first implementation may use the generator's validated `businessRelevance` score as the primary signal, but the server must enforce:

```text
0 <= businessRelevance <= 100
```

A future classifier may provide a stronger independent relevance check.

## Acceptance Test

Given:

```text
Company:
Xero Shoes

Category:
Barefoot Footwear

Product:
Minimalist and barefoot footwear
```

The system must generate relevant prompts such as:

```text
Best barefoot shoes
Xero Shoes vs Vivobarefoot
Best minimalist hiking shoes
Are Xero Shoes good?
Best zero-drop shoes for running
```

It must not generate unrelated prompts such as:

```text
What is the best CRM software for small businesses?
```

unless CRM is actually part of the company's Business Profile.

---

# 12. Opportunity Score

Create a pure server-side calculator at:

```text
lib/scoring/opportunity.ts
```

or an equivalent `lib/scoring/` module.

It must not import:

* Prisma
* React
* provider SDKs

## Contract

```ts
export interface OpportunityScoreInput {
  demandScore: number | null;
  competitiveGap: number | null;
  businessRelevance: number | null;
}

export interface OpportunityScoreResult {
  score: number | null;
  demandScore: number | null;
  competitiveGap: number | null;
  businessRelevance: number | null;
  isEstimated: boolean;
}

export function calculateOpportunityScore(
  input: OpportunityScoreInput
): OpportunityScoreResult;
```

## Formula

```text
score =
  round(
    (demandScore / 100)
    × competitiveGap
    × (businessRelevance / 100)
    × 100
  )
```

Equivalent simplified form:

```text
score = round(demandScore × competitiveGap × businessRelevance / 100)
```

## Distinction Between Scores

> **Visibility Score**: *"How visible is my company across AI answers?"* (Overall site-wide benchmark, 0–100, honest 95 ceiling)
>
> **Opportunity Score**: *"Which prompts represent the biggest opportunity for my company?"* (Per-prompt prioritization metric, 0–100)

Requirements:

* clamp numeric inputs to documented ranges
* return `null` if any required factor is unavailable
* do not manufacture missing factors as zero or provisional placeholders
* do not manufacture a competitive gap before scan data exists
* round only at the final score boundary
* return `0..100`
* remain deterministic and unit-testable

---

# 13. Demand Estimate

`demandScore` estimates how meaningful a prompt is as a search or AI-assistant question.

It is **not guaranteed search volume**.

MVP priority:

1. trusted future search-volume data normalized to `0..100`
2. AI-generated demand estimate
3. neutral fallback of `50` for legacy prompts with no estimate

The current application does not have a search-volume provider.

Do not add a third-party demand provider as part of this feature.

The UI must distinguish estimated demand from measured search volume.

Recommended UI label:

> **Demand estimate**

not:

> Search volume

---

# 14. Competitive Gap

Competitive gap is calculated from valid results in the latest completed scan.

```text
companyMentionRate =
  tracked-company mentions / valid checks

competitorPresenceRate =
  checks with at least one competitor mention / valid checks

competitiveGap =
  clamp(
    0.5 + competitorPresenceRate - companyMentionRate,
    0,
    1
  )
```

Interpretation:

* `1` = competitors consistently appear while the tracked company does not
* `0.5` = neutral/uncertain competitive position
* `0` = company is performing strongly and competitors provide little immediate gap

Error rows are excluded from the denominators.

If no completed scan exists:

```text
competitiveGap = null
```

Do not use a fabricated `0.5` gap for the actual score.

---

# 15. Business Relevance

`businessRelevance` represents how closely a prompt aligns with the company's:

* product
* category
* buyer
* use case
* intent

It is normalized to `0..100`.

AI-generated prompts receive a bounded relevance estimate derived from the Business Profile.

User-created prompts receive an initial intent-based estimate:

| Intent            | Initial relevance |
| ----------------- | ----------------: |
| `PURCHASE_INTENT` |                95 |
| `COMMERCIAL`      |                90 |
| `ALTERNATIVE`     |                90 |
| `COMPARISON`      |                85 |
| `BRAND`           |                80 |
| `PRODUCT`         |                80 |
| `PROBLEM`         |                75 |

These are estimates, not measured values.

The server validates and clamps all relevance values.

Browser-provided score values are never trusted.

---

# 16. Pre-Scan Score Behavior

Before the first completed scan exists, Competitive Gap is unknown.

Therefore:

```text
competitiveGap = null
opportunityScore = null
isEstimated = false
```

The UI displays:

> **Awaiting scan data**

rather than inventing an Opportunity Score or using a provisional 0.5 gap.

Demand and Business Relevance are displayed individually as estimates:

```text
Demand estimate:     80  (Estimated)
Competitive gap:     —   (Awaiting scan data)
Business relevance:  95  (Estimated)

Opportunity Score:   Awaiting scan data
```

Do not use a provisional `0.5` competitive gap or display an estimated Opportunity Score before the first scan completes. This prevents placeholder numbers from being mistaken for actual competitive intelligence.

---

# 17. Post-Scan Opportunity Score

After a completed scan:

* calculate Competitive Gap
* calculate Opportunity Score
* mark the score as measured when all factors are available

Example:

```text
Opportunity Score
87 / 100

Demand estimate
91

Competitive gap
0.92

Business relevance
95
```

If any required factor remains unavailable:

```text
Opportunity Score
Score unavailable

Reason:
Competitive data unavailable
```

Never silently convert missing data into zero.

---

# 18. Ranking Behavior

Default ordering:

```text
Opportunity Score DESC
```

For scored prompts, ties are broken by:

1. Competitive Gap descending
2. Demand descending
3. Prompt text ascending

Unscored prompts appear after scored prompts.

Before the first scan, prompts may be ordered by:

1. Business Relevance descending
2. Demand descending
3. Prompt text ascending

They must be clearly labeled as:

> **Estimated priority**

not as a measured Opportunity Score.

Filtering by:

* intent
* category
* source
* active state

is presentation logic.

Authorization remains server-side.

---

# 19. Data Model

Extend the existing `Prompt` model.

**Do not create a second prompt table.**

Before changing the schema, inspect the existing Prisma model and preserve all existing fields, relations, indexes, and behavior unless explicitly changed by this specification.

Expected additions:

```prisma
enum PromptIntent {
  COMMERCIAL
  COMPARISON
  PROBLEM
  PRODUCT
  BRAND
  ALTERNATIVE
  PURCHASE_INTENT
}
```

The existing `PromptSource` enum must preserve its current values:

```text
CURATED
AI_SUGGESTED
USER_CUSTOM
```

If `USER_CUSTOM` already exists, do not add it again.

Add to the existing `Prompt` model:

```prisma
intent             PromptIntent @default(PRODUCT)
demandScore        Int?
businessRelevance  Int?
archivedAt         DateTime?
updatedAt          DateTime @updatedAt
```

Preserve existing fields such as:

```text
id
companyId
company
source
text
category
searchVolume
results
createdAt
```

Add indexes where appropriate:

```prisma
@@index([companyId])
@@index([category])
@@index([intent])
@@index([archivedAt])
```

Do not make prompt text globally unique.

Different companies may own identical prompts.

`companyId = null` remains reserved for global curated prompts.

AI-suggested and user-created prompts must have a non-null `companyId`.

Use a Prisma-generated migration.

Do not manually edit an already-applied migration.

---

# 20. Existing Prompt Preservation

Existing prompts must not be destroyed.

For existing curated prompts:

```text
intent = PRODUCT
archivedAt = null
```

If `demandScore` or `businessRelevance` is null, use documented read-time fallback behavior rather than requiring destructive backfill.

Do not rewrite existing prompt text during migration.

---

# 21. Delete Semantics

The user-facing action may be labeled:

> Delete

but it must perform an archive.

```text
archivedAt = now()
```

Do not hard-delete company prompts.

Reason:

```text
Prompt
   ↓
ScanResult
```

Historical ScanResults must remain readable.

Archived prompts:

* disappear from the active prompt workspace
* are excluded from future scans
* retain historical ScanResults
* may be restored in a future feature

Curated prompts cannot be archived by company users.

The effective prompt set is:

```text
(
  companyId IS NULL
  OR
  companyId = currentCompanyId
)
AND
archivedAt IS NULL
```

The `archivedAt` condition must be applied outside the ownership `OR`.

---

# 22. API Contract

All endpoints require Clerk authentication.

The company must be resolved from the authenticated user.

A browser-provided `companyId` must never be treated as an authorization mechanism.

Continue using:

```ts
{ data }
```

and:

```ts
{ error: { message } }
```

response envelopes.

---

## 22.1 GET `/api/prompts`

Returns the effective active prompt set.

Each prompt:

```ts
{
  id: string;
  text: string;
  category: string;
  intent: PromptIntent;
  source: "CURATED" | "AI_SUGGESTED" | "USER_CUSTOM";

  searchVolume: number | null;
  demandScore: number | null;
  businessRelevance: number | null;
  competitiveGap: number | null;
  opportunityScore: number | null;

  isEstimated: boolean;
  editable: boolean;

  createdAt: string;
  updatedAt: string;
}
```

Rules:

* exclude archived prompts
* curated prompts are not editable
* company-owned prompts are editable
* calculate Competitive Gap server-side
* calculate Opportunity Score server-side
* use the latest completed scan
* do not return raw AI responses
* do not return Prisma `Date` objects

---

## 22.2 POST `/api/prompts`

Creates a `USER_CUSTOM` prompt.

Request:

```ts
{
  text: string;
  category?: string;
  intent: PromptIntent;
}
```

Validation:

* trim whitespace
* collapse repeated whitespace
* require `3..500` characters
* require valid intent
* default category to `Other`
* reject normalized duplicates among active prompts with `409`
* calculate initial demand/relevance metadata server-side
* ignore client-provided score fields

Response:

```text
201 { data: { prompt } }
```

---

## 22.3 PATCH `/api/prompts/:id`

Updates an owned AI-suggested or user-created prompt.

Allowed fields:

```text
text
category
intent
```

Rules:

* verify ownership
* return `404` for missing/foreign prompts
* return `403` for curated prompts
* reject active normalized duplicates with `409`
* invalidate/recalculate score metadata after changes
* refuse mutation during an active scan

---

## 22.4 DELETE `/api/prompts/:id`

Archives an owned prompt.

Rules:

* verify ownership
* return `403` for curated prompts
* return `404` for missing/foreign prompts
* refuse mutation during an active scan
* preserve historical ScanResults

Response:

```text
200 {
  data: {
    id,
    archived: true
  }
}
```

---

## 22.5 POST `/api/prompts/generate`

Generates AI suggestions.

Requirements:

* authenticated
* company-scoped
* requires a non-empty Business Profile
* return `422` if Business Profile is missing
* generation is additive
* duplicate active prompts are skipped
* existing custom prompts are preserved
* edited AI suggestions are preserved
* response contains newly added prompts and count

Repeated generation must be safe.

Example:

```text
Existing:
50 prompts

Generate:
30 candidates

Duplicates:
18

New:
12
```

Only the 12 new prompts are persisted.

---

## 22.6 POST `/api/scans`

Before creating a scan:

1. resolve authenticated company
2. sweep stale pending scans using existing behavior
3. reject another active scan
4. load the effective active prompt set
5. reject if zero prompts exist
6. create the scan
7. trigger the scan job

The scan must use a stable prompt set for its lifetime.

Prompt mutations are blocked while the scan is pending/running.

A future scan-snapshot model may replace this lock.

---

# 23. UI Structure

Use existing:

* shadcn/ui
* Lucide React
* Tailwind tokens
* existing dark-first editor shell

Do not introduce a new UI framework, state-management library, chart library, or data-fetching dependency.

Suggested structure:

```text
app/(editor)/prompts/page.tsx

components/prompts/
  prompt-workspace.tsx
  prompt-card-grid.tsx
  prompt-card.tsx
  prompt-form.tsx
  prompt-source-badge.tsx
  prompt-score-badge.tsx
  prompt-generation-actions.tsx
```

---

# 24. Prompt Workspace

The workspace provides:

* heading explaining that these are prompts AnswerOS will test
* Generate Suggestions action
* Add Prompt action
* active prompt count
* intent/category filters
* source filters
* Opportunity Score sorting after scan
* estimated-priority sorting before scan
* source badges
* score indicators
* edit/archive controls
* empty states
* confirmation before archive
* visible errors
* mobile-friendly layout

The workspace should make it clear which prompts are:

```text
Curated
AI suggested
Custom
```

---

# 25. Prompt Cards

Each card displays:

* full prompt text
* intent
* category
* source
* Opportunity Score when available
* demand estimate
* competitive gap when available
* business relevance
* edit/archive controls when permitted

Do not destructively truncate prompt text.

Cards must remain readable on mobile.

Use text/icons in addition to color for status and score states.

---

# 26. Recommended Prompt Review UX

The user should not be overwhelmed by hundreds of cards.

Display:

```text
137 prompts discovered

Recommended
32

Other relevant prompts
105
```

The system may automatically prioritize the highest-value prompts.

The user can review, filter, edit, or archive prompts before scanning.

The Run Scan button must clearly communicate:

```text
Run Scan — 32 prompts
```

or whatever the current active count is.

---

# 27. Pre-Scan Confirmation

The Run Scan confirmation must show:

* active prompt count
* Review Prompts action
* prompts with estimated metadata
* prompts awaiting scan data
* confirmation that the displayed set is the set that will be scanned

If there are zero active prompts:

```text
Run Scan disabled

Add or activate at least one prompt before scanning.
```

Do not start a background scan with an empty prompt set.

---

# 28. Score Presentation

Opportunity Score:

```text
87 / 100
```

when measured.

Before scan:

```text
Awaiting scan data
```

Demand:

```text
Demand estimate: 91
```

Competitive gap before scan:

```text
Awaiting scan data
```

Business relevance:

```text
Business relevance: 95
```

Never present Opportunity Score as the existing Visibility Score.

The two metrics must remain visually and conceptually distinct.

---

# 29. Data and Security Invariants

1. Effective prompts are always company-scoped.
2. Global curated prompts may be included.
3. Curated prompts are immutable to company users.
4. Company-owned prompts cannot affect another company.
5. Archived prompts are excluded from future scans.
6. Historical ScanResults remain intact.
7. Opportunity Score is calculated server-side.
8. Browser score values are never trusted.
9. Error ScanResults are excluded from competitive-gap calculations.
10. Raw AI responses remain server-side.
11. Provider SDKs remain inside `lib/providers/`.
12. Prompt mutations are blocked during active scans.
13. A scan cannot start with zero active prompts.
14. Prompt generation cannot proceed without a valid Business Profile.
15. Generated prompts must be relevant to the company's Business Profile.

---

# 30. Testing

## 30.1 Pure Logic Tests

Test:

* all seven intent values
* intent display labels
* Opportunity Score formula
* score rounding
* score clamping
* null-factor behavior
* competitive-gap calculation
* company wins
* competitor wins
* ties
* no competitor signal
* error rows
* demand fallback
* business relevance defaults
* prompt normalization
* duplicate detection
* generation parsing
* invalid intent rejection
* invalid score handling

---

## 30.2 API/Database Tests

Verify:

* curated prompts are read-only
* custom prompts are company-scoped
* foreign prompt IDs cannot be accessed
* duplicate active prompts return `409`
* prompt edits invalidate score metadata
* delete archives rather than hard-deletes
* historical ScanResults remain
* generation does not replace existing prompts
* custom prompts survive regeneration
* edited AI suggestions survive regeneration
* archived prompts are excluded from scans
* scans reject zero active prompts
* prompt mutation is blocked during active scans
* generation rejects missing Business Profile

---

# 31. Business Relevance Acceptance Tests

### Test A — Relevant company

Given:

```text
Company:
Xero Shoes

Category:
Barefoot Footwear

Product Description:
Minimalist and barefoot footwear for running,
hiking, walking, and everyday use.
```

Generated prompts may include:

```text
Best barefoot shoes
Best minimalist hiking shoes
Xero Shoes vs Vivobarefoot
Are Xero Shoes good?
Best zero-drop shoes for running
Best barefoot shoes for beginners
```

They must be classified appropriately.

### Test B — Irrelevant prompt

The system must reject or prevent prompts such as:

```text
What is the best CRM software for small businesses?
```

because they do not match the Business Profile.

### Test C — B2B SaaS

Given:

```text
Category:
CRM Software
```

CRM prompts should be generated.

The same generation pipeline must therefore work across different industries.

---

# 32. Manual Acceptance Checks

1. Create a company.
2. Configure a Business Profile.
3. Open the Prompt workspace.
4. Generate suggestions.
5. Confirm suggestions contain multiple relevant intents.
6. Confirm suggestions are relevant to the Business Profile.
7. Confirm unrelated prompts are not generated.
8. Add a custom prompt for each intent.
9. Edit a custom prompt.
10. Confirm normalized duplicate protection.
11. Archive a custom prompt.
12. Confirm it disappears from the active set.
13. Confirm historical ScanResults remain intact.
14. Attempt to edit a curated prompt.
15. Confirm the action is rejected/unavailable.
16. Generate suggestions again.
17. Confirm custom prompts remain.
18. Confirm reviewed AI suggestions remain.
19. Start a scan.
20. Confirm the scan prompt count matches the active prompt set.
21. Complete the scan.
22. Confirm Competitive Gap becomes available.
23. Confirm Opportunity Score becomes available.
24. Confirm Opportunity Score is distinct from Visibility Score.
25. Confirm incomplete factors display honestly rather than becoming fabricated zeros.

---

# 33. Validation

The implementation must satisfy:

```text
npm test
npm run lint
npm run build
```

Prisma migration must be generated and applied through the repository's normal migration workflow.

No new runtime dependency should be added.

No provider SDK should be imported outside:

```text
lib/providers/
```

Record implementation progress separately in:

```text
context/context/progress-tracker.md
```

Do not modify the existing Visibility Score algorithm as part of this feature.

---

# 34. Out of Scope

The following are explicitly out of scope:

* third-party search-volume providers
* guaranteed search-volume measurements
* traffic forecasts
* conversion forecasts
* changing the Visibility Score
* independent competitor visibility scores
* raw AI response exploration
* prompt detail pages
* prompt version history
* restore UI
* bulk import/export
* team permissions
* shared prompt workspaces
* live scan progress
* Trigger.dev realtime subscriptions
* automatic content generation
* automatic SEO recommendations from prompts
* category taxonomy redesign
* third-party demand integrations

---

# 35. Definition of Done

The feature is complete when:

* users can see the effective prompt set before scanning
* prompts are grouped/filterable by intent
* prompts have a clear source
* users can add custom prompts
* users can edit company-owned prompts
* users can archive company-owned prompts
* curated prompts remain immutable
* user-created prompts require one of seven intents
* AI suggestions contain validated intent
* AI suggestions contain demand estimates
* AI suggestions contain business relevance
* prompt generation requires a valid Business Profile
* generated prompts are grounded in the Business Profile
* unrelated prompts are rejected
* generation is additive
* regeneration preserves custom and reviewed AI prompts
* duplicate active prompts are skipped
* Opportunity Score is calculated server-side
* Competitive Gap comes from completed scan data
* Opportunity Score is unavailable before competitive data exists
* estimated and measured states are clearly distinguished
* archived prompts remain available to historical results
* archived prompts are excluded from future scans
* prompt ownership is enforced server-side
* prompt mutation is blocked during active scans
* scans cannot start with zero prompts
* `npm test` passes
* `npm run lint` passes
* `npm run build` passes

The result should provide a trustworthy prompt-management layer that answers:

> **Which questions should AnswerOS test for this company, why do they matter, and where is the biggest opportunity?**

It must not simply generate a large collection of generic AI questions.
