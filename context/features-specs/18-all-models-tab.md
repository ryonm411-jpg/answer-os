# All Models Tab — Per-Provider Enablement for Scans & Prompt Generation

> **Status:** Proposed next implementation unit
> **Created:** August 23, 2026
> **Depends on:** `09-ai-provider-abstraction.md`, `12-visibility-scanner-pipeline.md`, `16-stripe-subscriptions.md`, `17-free-tier.md`

---

## 1. Goal

Give users a global **All Models** tab in the top horizontal bar (the `EditorNavbar`) that lists every AI model/provider the product supports — free **and** paid — and lets them enable or disable which ones are used for visibility scans and AI prompt generation.

A signed-in user must be able to:

1. click the **All Models** tab in the navbar and see all 7 providers (Gemini, Groq, NVIDIA NIM, OpenRouter, OpenAI, Anthropic, Perplexity) with their tier (Free Tier / Paid), configuration status, and enable state
2. toggle individual providers on/off; the selection applies globally to the next scan and the next prompt generation
3. see premium providers as **locked** (non-interactive toggle + lock icon) while on the free tier, unlocking after subscription
4. reset the selection back to the plan default
5. have the server honor only the intersection of *user-enabled ∩ plan-allowed ∩ configured* — the client never decides which providers may run

The authoritative flow:

```text
Authenticated user
    → clicks All Models tab in navbar
    → GET /api/providers (catalog + plan + config + current selection)
    → toggles provider(s) → PUT /api/providers/preferences
    → ProviderPreference row upserted (company-scoped)
    → POST /api/scans → effective = enabled ∩ tier-allowed ∩ configured → runScan
    → POST /api/prompts/generate → same effective set → generator
```

The default selection for a company that has never customized is **all providers their plan allows** (free tier → free providers; paid → all providers), preserving today's behavior exactly. The tab only narrows the set.

---

## 2. Mandatory Context Reads

Before implementing this feature, read these files in order:

1. `CLAUDE.md` — **read first**; it `@`-imports `AGENTS.md` and contains the repository's agent instructions and Next.js-version warning.
2. `context/project-overview.md` — product goals, pricing, and user flow.
3. `context/architecture.md` — provider abstraction invariant (#2), storage model, and Stripe webhook invariant (#5).
4. `context/ui-context.md` — dark editor shell, navbar layout, tokens, and component conventions.
5. `context/code-standards.md` — API envelopes, server/client boundaries, provider abstraction rule, strict TypeScript.
6. `context/ai-workflow-rules.md` — Provider Integration Checklist, scope discipline, migration workflow.
7. `context/progress-tracker.md` — current phase, completed work, open questions.
8. `context/features-specs/09-ai-provider-abstraction.md` — the `lib/providers/` surface this feature extends.
9. `context/features-specs/16-stripe-subscriptions.md` — the entitlement model (`hasActiveSubscription`).
10. `context/features-specs/17-free-tier.md` — the tier gating (`resolveAllowedProviders`) this feature layers user preference on top of.

Do not begin implementation until `CLAUDE.md` has been read.

---

## 3. Current State

Reference points in the repository:

- `components/editor/editor-navbar.tsx` — the top horizontal bar (`EditorNavbar`). Left: sidebar toggle + domain + scan-status badge. **Center: `hidden md:flex` section currently reserved for a future Search / Command Palette — this is where the All Models tab mounts.** Right: `UserButton`.
- `lib/providers/` — 7 registered providers (`AIProviderName = "openai" | "anthropic" | "gemini" | "perplexity" | "groq" | "nvidia" | "openrouter"`), lazy registry (`getProvider`, `getAvailableProviders`, `isProviderConfigured`), `TO_PRISMA_PROVIDER` mapping, `MockProvider`.
- `lib/providers/tiers.ts` — `FREE_PROVIDERS = ["openai", "gemini", "groq", "nvidia", "openrouter"]`, `PREMIUM_PROVIDERS = ["anthropic", "perplexity"]`, `ALL_PROVIDERS`, and pure `resolveAllowedProviders({ entitled, configured })`.
- `lib/providers/deepseek.ts` — deprecated stub (`isConfigured()` always `false`); `DEEPSEEK` remains in the Prisma `AIProvider` enum but no live provider uses it. **Not part of the catalog** (drift from spec `17`; out of scope to revive here).
- `app/api/scans/route.ts` — resolves `providers = resolveAllowedProviders({ entitled, configured })` and passes `providers` in the Trigger.dev payload; `runScan` filters `getAvailableProviders()` by the payload list (no job changes needed).
- `app/api/prompts/generate/route.ts` — resolves allowed names, but contains a **fallback bug**: `const providerNames = allowedNames.length > 0 ? allowedNames : configured;` — when no free provider is configured on an unpaid account, it falls back to *all* configured providers, which can include premium ones, violating spec `17` Decision #6 (premium providers must never be called for an unpaid company). This feature removes that fallback.
- `lib/prompts/generator.ts` — accepts `opts?.providers: AIProvider[]` and iterates in order with per-attempt fallback; already supports the multi-provider call shape.
- `components/billing/provider-access-list.tsx` — hardcodes a `PROVIDERS_LIST` display catalog (label/description/tier) independent of `lib/providers/`. This feature extracts that catalog into a shared pure module.
- `components/ui/` — has `dropdown-menu.tsx`; **no `popover.tsx`, no `switch.tsx`** (both must be added via the shadcn CLI).
- `prisma/schema.prisma` — `Company` has no provider-preference relation; `AIProvider` enum is `OPENAI ANTHROPIC GEMINI PERPLEXITY DEEPSEEK GROQ NVIDIA OPENROUTER`.
- `lib/api/` — thin fetch helpers with the `{ data }` / `{ error: { message } }` envelope pattern (`scans.ts`, `billing.ts`).

Known gaps this feature fills:

- users cannot control which providers run — a scan/prompt generation uses every tier-allowed provider automatically
- provider selection is not persisted anywhere (PostgreSQL or otherwise)
- there is no navbar surface for provider state; the center section is dead space
- provider display metadata is duplicated and hardcoded in the billing UI

---

## 4. Decisions

| # | Decision | Rationale |
| -- | -------- | --------- |
| 1 | The **All Models** tab is a **per-provider** toggle control, mounted in the `EditorNavbar` center section on `md+` screens | The MVP abstraction is one model per provider (`DEFAULT_MODELS`); selecting individual model IDs (e.g. `gpt-4o` vs `gpt-4-turbo`) is out of scope. The navbar center is the natural, already-reserved home |
| 2 | User selection persists in a new company-scoped Prisma model `ProviderPreference` with an `AIProvider[] enabledProviders` scalar list | PostgreSQL is the source of truth; local storage would be per-browser and untrustworthy for a server-enforced feature (code-standards, architecture.md) |
| 3 | **Default selection = all entitled providers** when no `ProviderPreference` row exists (`null` row → `resolveAllowedProviders` result) | Preserves today's behavior for existing companies and the free-tier design; the tab only narrows |
| 4 | A stored preference row is authoritative once created; it persists across plan changes and is never auto-mutated by entitlement flips | Predictable and testable. Premium providers that become available after subscribing appear in the tab with their toggle off for companies that customized earlier; the "Reset to defaults" action restores full defaults |
| 5 | Premium providers are **locked while unpaid**: shown with a lock icon and a disabled toggle ("Unlocks with paid plan"), mirroring the billing `provider-access-list` pattern (user decision) | Consistent with the free-tier upsell UX; no dead toggles that can never take effect |
| 6 | The server enforces `effective = enabled ∩ tier-allowed ∩ configured`; the client only renders that computation from `GET /api/providers` | Defense in depth — a crafted PUT with premium names while unpaid is harmless because `resolveEffectiveProviders` still excludes them (spec `17` invariant: premium never runs unpaid) |
| 7 | `PUT /api/providers/preferences` accepts any non-empty list of valid provider names (premium included) and upserts the row; empty lists are rejected `422` | Keeps the endpoint a dumb validated store; the empty case is a user-recoverable state surfaced as a clear error rather than silently scanning zero providers |
| 8 | Both routes return `422` "Enable at least one AI model" when a stored preference would produce zero effective providers; the pre-existing no-providers-configured behavior is unchanged | An empty effective set is now user-caused and recoverable (the tab is one click away); infrastructure misconfiguration still follows spec `17` behavior |
| 9 | Remove the `allowedNames.length > 0 ? allowedNames : configured` fallback in `POST /api/prompts/generate` | It lets premium providers run on unpaid accounts when no free key is set — a spec `17` violation fixed as part of this feature |
| 10 | Extract the display catalog (label, description, tier) into a pure client-safe `lib/providers/catalog.ts`; refactor `provider-access-list.tsx` to consume it | One source of truth for provider metadata; both the Models tab and billing UI stay in sync |
| 11 | The tab shows the global preference set; there is no per-scan or per-context override in MVP | One global set is the simplest coherent model; per-scan pickers are a reserved extension |
| 12 | Add shadcn `Popover` and `Switch` primitives via the CLI (do not hand-write) | Follows code-standards: use the shadcn CLI rather than writing primitives from scratch |

---

## 5. Dependencies

No new runtime npm packages. Add two shadcn/ui primitives via the CLI:

```bash
npx shadcn@latest add popover switch
```

Verify nothing else changes in `package.json` beyond shadcn's own additions. Do not install a switch/popover library by hand.

---

## 6. Environment Variables

None new. The feature reuses:

- provider API keys (existing per-provider vars from specs `09` / `17`)
- entitlement via `hasActiveSubscription` (spec `16`)
- `USE_MOCK_PROVIDERS` for dev/test (unchanged)

---

## 7. Data Model

Add a company-scoped preference model:

```prisma
model ProviderPreference {
  id               String       @id @default(cuid())
  companyId        String       @unique
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  enabledProviders AIProvider[]
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}
```

Add the relation to `Company`:

```prisma
model Company {
  // existing fields unchanged
  providerPreference ProviderPreference?
}
```

Notes:

- `AIProvider[]` is a Postgres scalar list of the existing enum — no new enum values.
- `companyId @unique` enforces one preference row per company (same pattern as `Subscription`).
- Generate the migration through Prisma; never hand-edit an applied migration:

```bash
npx prisma migrate dev --name add_provider_preferences
npx prisma generate
```

---

## 8. Provider Abstraction Changes (`lib/providers/`)

### 8.1 Effective-provider helper (`tiers.ts`)

Extend `tiers.ts` with a pure, Prisma-free, React-free helper (unit-testable in isolation):

```ts
/**
 * Server-side only: the provider set that may actually run.
 * `enabled === null` means "no preference stored" → plan default.
 * Otherwise the user's selection is intersected with the tier- and config-allowed set.
 */
export function resolveEffectiveProviders(input: {
  entitled: boolean;
  configured: AIProviderName[];
  enabled: AIProviderName[] | null;
}): AIProviderName[] {
  const tierAllowed = resolveAllowedProviders({ entitled: input.entitled, configured: input.configured });
  if (input.enabled === null) return tierAllowed;
  return tierAllowed.filter((name) => input.enabled.includes(name));
}
```

### 8.2 Display catalog (`catalog.ts`)

New pure module — no `process.env`, no Prisma, no React — so both server routes and client components can import it:

```ts
import type { AIProviderName } from "./types";

export interface ProviderCatalogEntry {
  name: AIProviderName;
  label: string;
  description: string;
}

/** Display metadata for every registered provider (mirrors billing provider-access-list). */
export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  { name: "gemini",     label: "Google Gemini",        description: "Gemini 2.5 / 3.5 Flash search integration (1,500 RPD free)" },
  { name: "groq",       label: "Groq LPU",             description: "Ultra-fast LPU inference (Llama 3.3 70B & Qwen, 1,000 RPD free)" },
  { name: "nvidia",     label: "NVIDIA NIM",           description: "Enterprise NIM catalog (10,000 RPD free)" },
  { name: "openrouter", label: "OpenRouter Free Pool", description: "Open-weight free model router (15+ free models)" },
  { name: "openai",     label: "OpenAI ChatGPT",       description: "GPT-4o general AI model scanning" },
  { name: "anthropic",  label: "Anthropic Claude",     description: "Claude 3.5 Sonnet analysis & recommendations" },
  { name: "perplexity", label: "Perplexity AI",        description: "Sonar real-time answer engine search" },
];
```

- Tier classification is **derived from `tiers.ts`** (`PREMIUM_PROVIDERS.includes(name) ? "premium" : "free"`), not duplicated — the catalog holds display metadata only.
- Refactor `components/billing/provider-access-list.tsx` to consume `PROVIDER_CATALOG` + `FREE_PROVIDERS`/`PREMIUM_PROVIDERS` instead of its hardcoded list, keeping its current visuals.

### 8.3 DB helper (`lib/db/provider-preferences.ts`)

Thin Prisma module owning queries, no rendering decisions:

```ts
// returns null when no row exists (caller applies plan default)
export async function getEnabledProviders(companyId: string): Promise<AIProviderName[] | null>;

// upsert the validated selection; enabled is a lowercase AIProviderName[] mapped to the Prisma enum
export async function upsertProviderPreferences(
  companyId: string,
  enabled: AIProviderName[]
): Promise<AIProviderName[]>;
```

- Map names to the Prisma enum with `TO_PRISMA_PROVIDER` (or `name.toUpperCase()` — all 7 names round-trip by casing); map back with `.toLowerCase()`.
- Prisma scalar lists are written as a whole: `upsert` with `data: { enabledProviders: [...] }` / `update: { enabledProviders: [...] }`.

---

## 9. API Contracts

All routes require Clerk auth and resolve the company with `getCompanyByClerkId(clerkId)` — never a browser-supplied company ID.

Continue using `{ data: {} }` success and `{ error: { message } }` failure envelopes.

### 9.1 `GET /api/providers`

Returns the full catalog with server-computed state for the Models tab.

Flow:

1. authenticate (`401`)
2. resolve company (`404`)
3. resolve `entitled = await hasActiveSubscription(company.id)`
4. resolve `configured = getAvailableProviders().map((p) => p.name)`
5. resolve `enabled = await getEnabledProviders(company.id)` (`null` = no row)
6. for each catalog entry, compute per-provider state (below)

```json
{
  "data": {
    "entitled": true,
    "providers": [
      {
        "name": "gemini",
        "label": "Google Gemini",
        "description": "Gemini 2.5 / 3.5 Flash search integration (1,500 RPD free)",
        "tier": "free",
        "configured": true,
        "enabled": true,
        "locked": false
      }
    ]
  }
}
```

Per-provider state rules:

| Field | Value |
| ----- | ----- |
| `tier` | `"free"` when in `FREE_PROVIDERS`, else `"premium"` |
| `configured` | `isProviderConfigured(name)` |
| `enabled` | no row → `tierAllowed.includes(name)`; row → `enabled.includes(name)` |
| `locked` | `!entitled && tier === "premium"` |

An `enabled: true` provider that is `locked` (stale row from a downgrade) or `configured: false` is still reported honestly; the effective computation in the consuming routes excludes it from actually running.

### 9.2 `PUT /api/providers/preferences`

Upserts the company's selection.

Request body:

```json
{ "enabled": ["gemini", "groq", "nvidia", "openrouter"] }
```

Flow:

1. authenticate (`401`) / resolve company (`404`)
2. validate: parse body; every name must be in `ALL_PROVIDERS` — otherwise `422` with the invalid names
3. reject an empty `enabled` array — `422` "At least one AI model must remain enabled"
4. `upsertProviderPreferences(company.id, enabled)`
5. return `200 { data: { enabled: [...] } }` (the stored list, Prisma-verified)

Locked premium names are accepted and stored; enforcement happens at the effective computation (Decision #6). The UI never sends them while locked.

---

## 10. Enforcement Changes

Both resource-consuming routes now compute the **effective** provider set instead of the tier-allowed set.

### 10.1 `POST /api/scans` (`app/api/scans/route.ts`)

Replace the current resolution (spec `17` §9.1) with:

```ts
const isEntitled = await hasActiveSubscription(company.id);
const configured = getAvailableProviders().map((p) => p.name);
const enabled = await getEnabledProviders(company.id);
const providers = resolveEffectiveProviders({ entitled: isEntitled, configured, enabled });
```

Then:

- if `providers.length === 0` **and a stored preference row exists** → `422` "Enable at least one AI model in the All Models tab to run a scan."
- if `providers.length === 0` and no row exists (nothing configured) → existing behavior unchanged: dispatch and complete with zero provider work (spec `17` §9.1)
- everything else unchanged: stale-`PENDING` sweep, single-active-scan `409`, 0-prompts `422`, `202 { data: { scanId, status: "PENDING", providers } }`

The `runScan` task payload `{ scanId, providers }` and its filtering logic need **no changes** — it already runs exactly the passed set.

### 10.2 `POST /api/prompts/generate` (`app/api/prompts/generate/route.ts`)

Replace the current resolution **and remove the fallback bug** (Decision #9):

```ts
const isEntitled = await hasActiveSubscription(company.id);
const configured = getAvailableProviders().map((p) => p.name);
const enabled = await getEnabledProviders(company.id);
const providers = resolveEffectiveProviders({ entitled: isEntitled, configured, enabled })
  .map((name) => getProvider(name));
```

Then:

- if `providers.length === 0` **and a stored preference row exists** → `422` "Enable at least one AI model in the All Models tab to generate prompts."
- if `providers.length === 0` and no row exists → pass `undefined`; `generatePromptSuggestions` throws `PromptGenerationError("No AI provider configured")` → existing `503` mapping
- otherwise pass `{ providers }` (generator already iterates with per-attempt fallback)

This guarantees premium providers are never called for an unpaid company, restoring spec `17` Decision #6.

### 10.3 Entitlement and access rules (unchanged policy, new layer)

| Layer | Applies |
| ----- | ------- |
| User preference | `ProviderPreference.enabledProviders` — global, persistent, `null` = plan default |
| Tier policy | `resolveAllowedProviders` — premium excluded while unpaid (spec `17`) |
| Configuration | `isProviderConfigured` — key present (or `USE_MOCK_PROVIDERS`) |
| **Effective** | intersection of all three, computed server-side at dispatch time |

Server-side rules that never change:

- the client never decides which providers run; `enabled` from the browser is only one input to the intersection
- mid-scan re-checking is not performed — the effective set is resolved once at dispatch time (spec `17` §14)
- a provider disabled by the user produces no `ScanResult` rows and no provider calls; cached results from earlier scans remain valid (cache key is unaffected by preference)

---

## 11. UI — All Models Tab

Use the existing dark editor shell and shadcn/ui primitives. The tab mounts in the `EditorNavbar` center section (the currently reserved `hidden md:flex` block).

### Suggested structure

```text
components/editor/models-tab.tsx    # navbar tab button + popover panel (client)
components/ui/popover.tsx           # added via shadcn CLI
components/ui/switch.tsx            # added via shadcn CLI
lib/api/providers.ts                # getProviderCatalog() / updateProviderPreferences()
lib/providers/catalog.ts            # shared display metadata (Decision #10)
lib/db/provider-preferences.ts      # DB helper
app/api/providers/route.ts          # GET /api/providers
app/api/providers/preferences/route.ts  # PUT /api/providers/preferences
```

### Tab button

- Labeled **"All Models"** with a Lucide icon (e.g. `Cpu` or `Boxes`) at `h-4 w-4`.
- Shows a compact enabled-count badge: `{enabledCount}/{total}` (e.g. `4/7`). When every entitled provider is enabled, tint the badge emerald (`border-emerald-500/30 bg-emerald-500/10 text-emerald-400`), mirroring the navbar scan-status badge; otherwise neutral/amber.
- `hidden md:flex` inherited from the center section — the tab appears on `md+` screens only in MVP (mobile entry is a reserved extension).

### Popover panel

- Header: `AI Models` + count line ("4 of 7 enabled — used for scans & prompt generation").
- One row per catalog entry, in catalog order (free first, then premium):

  - `Switch` toggle (checked = enabled)
  - Label + Free Tier badge (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`, as in `provider-access-list.tsx`) or a Paid badge for premium
  - Description line (`text-xs text-muted-foreground`)
  - Right side: `On`/`Off` text state; a muted `Not configured` hint when `configured: false`; a Lucide `Lock` at `h-4 w-4` + "Unlocks with paid plan" when `locked`
  - Locked rows: switch `disabled`, row uses `bg-accent/20 border-border/40 text-muted-foreground` (same pattern as `provider-access-list.tsx`)
- Toggle interactions: optimistic update → `PUT /api/providers/preferences`; on failure revert and show an inline `role="alert"` error with the server message.
- The last enabled provider cannot be turned off: disable that switch and show a tooltip ("At least one model must stay enabled").
- Footer: a "Reset to defaults" ghost button (`DELETE`-style reset — see §11.1) and, when any provider is `locked`, a secondary link to `/billing` ("Manage plan").
- No hardcoded hex values; use theme tokens (ui-context). One popover, keyboard accessible (shadcn `Popover`/`Switch` provide focus/ARIA by default).

### 11.1 Reset to defaults

Add `DELETE /api/providers/preferences` which deletes the preference row so the plan default applies again. The tab's "Reset to defaults" calls it, then re-fetches `GET /api/providers`. Responses: `200 { data: { enabled: [...] } }` (the effective default set) / `401` / `404`.

---

## 12. Testing (Vitest)

Co-located tests:

| File | Covers |
| ---- | ------ |
| `lib/providers/tiers.test.ts` (extend) | `resolveEffectiveProviders` — `enabled: null` returns the tier default; stored selection narrows; intersection excludes premium while unpaid even when stored; excludes unconfigured; entitled flip with a stored row does not auto-add premium; empty stored set returns `[]` |
| `lib/providers/catalog.test.ts` (new) | `PROVIDER_CATALOG` contains exactly the 7 `AIProviderName` values; labels/descriptions non-empty; every catalog name is classified `free`/`premium` consistently with `FREE_PROVIDERS`/`PREMIUM_PROVIDERS` |
| `lib/api/providers.test.ts` (new, optional) | Envelope parsing/error propagation for the client helpers (mirror existing `lib/api` tests if any) |

DB/route behavior is covered by manual checks (§13); do not add network- or database-dependent unit tests.

---

## 13. Validation

Run:

```bash
npx prisma validate
npx prisma generate
npm test
npm run lint
npm run build
```

Manual test:

1. sign in and create a company (no preference row yet)
2. open the All Models tab — confirm all free providers show `On`, premium show locked with the lock icon; count badge reads `4/7` (or `5/7` per `FREE_PROVIDERS`)
3. toggle off one free provider — confirm `PUT` persists; run a scan and confirm `202` returns `providers` without it; prompt generation also skips it
4. toggle off providers until one remains — confirm the last switch is disabled with the tooltip
5. attempt `PUT` with an empty list or an unknown name — confirm `422`
6. subscribe via test-mode Stripe; after the webhook flips `entitled` — confirm premium toggles unlock, defaults stay on for companies that never customized, and a customized company can now enable premium manually
7. with a stored preference that disables everything, confirm `POST /api/scans` and `POST /api/prompts/generate` return `422` with the "Enable at least one AI model" message
8. click "Reset to defaults" — confirm the row is deleted and the tab returns to plan defaults
9. on an unpaid account with **no free provider configured but a premium key set**, confirm `POST /api/prompts/generate` returns `503` (fallback bug gone — premium never runs unpaid)
10. cancel the subscription — confirm premium toggles re-lock

Update `context/context/progress-tracker.md` after implementation, migration, and verification are complete.

---

## 14. Out of Scope

Do not implement:

- per-model-ID selection (e.g. choosing `gpt-4o` vs `gpt-4-turbo`) — the abstraction is one model per provider
- per-scan or per-context provider overrides (e.g. different sets for scans vs prompt generation)
- per-provider usage quotas, rate limits, or spend controls
- a mobile entry point for the tab (navbar center is `md+` only; a sidebar link is a reserved extension)
- changes to the `runScan` job, cache keys, scoring, or the parser — the effective set is resolved entirely at the route boundary
- reviving the deprecated `deepseek` provider or reconciling the stale `DEEPSEEK` enum value
- provider health/status monitoring or latency dashboards in the panel

---

## 15. Future

Reserved extensions:

- per-scan provider picker in the Run Scan dialog
- per-model-ID selection UI (with per-provider model lists)
- mobile/sidebar entry point for the Models tab
- additive merge of newly unlocked premium providers into an existing stored selection
- usage metering per provider surfaced in the tab
- "Apply to weekly scheduled scans" toggle

---

## 16. Definition of Done

- Prisma `ProviderPreference` model + `Company.providerPreference` relation exist; migration `add_provider_preferences` applies and client regenerates
- `lib/providers/tiers.ts` exposes pure `resolveEffectiveProviders({ entitled, configured, enabled })` with unit tests
- `lib/providers/catalog.ts` exports `PROVIDER_CATALOG` for all 7 providers; `provider-access-list.tsx` consumes it (no duplicated metadata)
- `lib/db/provider-preferences.ts` implements `getEnabledProviders` (null when no row) and `upsertProviderPreferences`
- `GET /api/providers` returns catalog + per-provider `tier`/`configured`/`enabled`/`locked` + `entitled`
- `PUT /api/providers/preferences` validates names against `ALL_PROVIDERS`, rejects empty lists (`422`), upserts, and returns the stored list
- `DELETE /api/providers/preferences` deletes the row so plan defaults re-apply
- `POST /api/scans` computes the effective set; returns `422` with an actionable message only when a stored preference yields an empty set
- `POST /api/prompts/generate` computes the effective set; the `allowedNames.length > 0 ? allowedNames : configured` fallback is removed (spec `17` Decision #6 restored); `422` on stored-empty, `503` on no-configured
- `runScan` unchanged and still runs exactly the payload `providers`
- All Models tab renders in `EditorNavbar` center on `md+`, with switches, tier badges, locked rows, count badge, optimistic toggles, last-enabled guard, and "Reset to defaults"
- premium providers are never called for an unpaid company — enforced by `resolveEffectiveProviders`, not a client flag
- no new env vars; no secrets committed
- `npm test`, `npm run lint`, and `npm run build` all pass
- `context/context/progress-tracker.md` records the completed implementation
