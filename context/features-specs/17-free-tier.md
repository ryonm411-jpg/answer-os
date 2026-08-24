# Free Tier — DeepSeek 3 + OpenAI (Mock Tokens), Premium Providers Locked Until Paid

> **Status:** Proposed next implementation unit
> **Created:** August 22, 2026
> **Depends on:** `09-ai-provider-abstraction.md`, `12-visibility-scanner-pipeline.md`, `16-stripe-subscriptions.md`

---

## 1. Goal

Give AnswerOS a **free version** so users can try the product before paying.

The free tier uses two AI providers — **DeepSeek 3** and **OpenAI** — configured through dedicated API keys named with the `_MOCK_TOCKEN` suffix (a naming convention for the free-tier keys, **not** mock/demo responses — they are real API keys). All other providers (Anthropic, Gemini, Perplexity) are **locked** until the user has an active paid subscription.

A signed-in user without a paid subscription must be able to:

1. run a visibility scan using only the free providers (DeepSeek 3 + OpenAI)
2. generate AI prompt suggestions using only the free providers
3. see which providers are available on their current plan and which are locked behind payment
4. unlock the full provider set (Anthropic, Gemini, Perplexity) by subscribing via the existing Stripe billing flow

The authoritative flow:

```text
Authenticated user (free tier)
    → free providers = [DEEPSEEK, OPENAI] only
    → POST /api/scans → scan job iterates only free providers
    → POST /api/prompts/generate → generator uses a free provider
    → subscribe via /billing
    → webhook-backed Subscription row
    → premium providers unlocked for subsequent scans
```

Entitlement remains server-side and webhook-backed (spec `16`, invariant #5). The client never decides which providers are allowed.

---

## 2. Mandatory Context Reads

Before implementing this feature, read these files in order:

1. `CLAUDE.md` — **read first**; it `@`-imports `AGENTS.md` and contains the repository's agent instructions and Next.js-version warning.
2. `context/project-overview.md` — product goals, pricing, and user flow.
3. `context/architecture.md` — provider abstraction invariant (#2), storage model, and Stripe webhook invariant (#5).
4. `context/ui-context.md` — dark billing/plan presentation, tokens, and component conventions.
5. `context/code-standards.md` — API envelopes, server/client boundaries, provider abstraction rule, strict TypeScript.
6. `context/ai-workflow-rules.md` — Provider Integration Checklist, scope discipline, migration workflow.
7. `context/progress-tracker.md` — current phase, completed work, open questions.
8. `context/features-specs/09-ai-provider-abstraction.md` — the `lib/providers/` surface this feature extends.
9. `context/features-specs/12-visibility-scanner-pipeline.md` — the scan job's provider iteration.
10. `context/features-specs/16-stripe-subscriptions.md` — the entitlement model this feature replaces for scans.

Do not begin implementation until `CLAUDE.md` has been read.

---

## 3. Current State

Reference points in the repository:

- `lib/providers/` — abstraction layer with `AIProviderName = "openai" | "anthropic" | "gemini" | "perplexity"`, lazy registry (`getProvider`, `getAvailableProviders`, `isProviderConfigured`), `TO_PRISMA_PROVIDER` mapping, `MockProvider`, and typed `AIProviderError`.
- `lib/providers/registry.ts` — `envKeyNames` maps provider → env var (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`); `isProviderConfigured` returns `true` when `USE_MOCK_PROVIDERS === "true"` or the provider's key is set.
- `lib/providers/openai.ts` — `OpenAIProvider` via `createOpenAI()` (auto-reads `OPENAI_API_KEY`); `isConfigured()` checks `OPENAI_API_KEY`.
- `lib/jobs/scan.ts` — `runScan` task (`id: "scan-company"`, payload `{ scanId }`) iterates `getAvailableProviders()` × `getPromptsForCompany(...)`.
- `app/api/scans/route.ts` — `POST /api/scans` currently returns `402 Payment Required` when the company has no active subscription (spec `16` §12). This blanket gate is what the free tier replaces.
- `app/api/prompts/generate/route.ts` — `POST /api/prompts/generate` currently returns `402` when unpaid. This gate is also replaced.
- `lib/prompts/generator.ts` — picks `opts?.provider ?? getAvailableProviders()[0]` for generation.
- `prisma/schema.prisma` — `enum AIProvider { OPENAI ANTHROPIC GEMINI PERPLEXITY }`; `ScanResult.provider` references it.
- `app/(editor)/billing/page.tsx` + `components/billing/` — billing page with subscription card and status badge.

Known gaps this feature fills:

- no `deepseek` provider exists anywhere (types, registry, config, Prisma enum)
- scans are all-or-nothing: unpaid users are entirely blocked from scanning even though two cheap/free providers are available
- there is no plan-aware provider filtering — a scan uses every configured provider regardless of entitlement
- no way for the UI to show locked providers

---

## 4. Decisions

| #  | Decision | Rationale |
| -- | -------- | --------- |
| 1 | Free tier provides exactly two providers: **DeepSeek 3** (`deepseek`) and **OpenAI** (`openai`) | Product decision — these are the free version's providers; Anthropic, Gemini, and Perplexity remain paid-only |
| 2 | Free-tier API keys are real keys named with the `_MOCK_TOCKEN` suffix: `DEEPSEEK_3_API_KEY_MOCK_TOCKEN` and `OPENAI_API_KEY_MOCK_TOCKEN` | Naming convention chosen by the user for the free-tier keys; they are **not** mock/demo keys — they authenticate real API calls |
| 3 | Add DeepSeek as a first-class provider in `lib/providers/` via `@ai-sdk/openai-compatible` | DeepSeek exposes an OpenAI-compatible API (`https://api.deepseek.com`); reuses the same integration pattern as Perplexity (spec `09`) |
| 4 | Replace the blanket `402` on `POST /api/scans` with provider-tier filtering: unpaid scans run free providers only; paid scans run all configured providers | Gives the free tier a real, working scan instead of a paywall, while keeping provider spend bounded (free-tier keys only) |
| 5 | The scan job payload gains `providers: AIProviderName[]` resolved at dispatch time from entitlement + configured keys | Keeps the entitlement decision in the route (server-side, webhook-backed) and the job deterministic; the job no longer re-reads billing state |
| 6 | `POST /api/prompts/generate` also drops the blanket `402`; the generator is passed an explicitly allowed free provider when unpaid | Prompt generation is part of the free experience; it must never call a locked provider on the free tier |
| 7 | Add `DEEPSEEK` to the Prisma `AIProvider` enum via migration | `ScanResult.provider` must be able to persist DeepSeek results |
| 8 | Provider gating is a pure, unit-testable helper (`resolveAllowedProviders`) in `lib/providers/` | Keeps the tier logic deterministic and server-only, matching the project's pure-module testing convention |
| 9 | The free tier remains a **single flat plan**; no separate free/paid price IDs, no usage quotas in MVP | Extends spec `16`'s single-price model; quotas are out of scope |

---

## 5. Dependencies

No new runtime dependencies are required — `@ai-sdk/openai-compatible` is already installed (used by Perplexity). Verify it is present before implementing:

```bash
npm ls @ai-sdk/openai-compatible
```

If it is missing, install it:

```bash
npm install @ai-sdk/openai-compatible
```

---

## 6. Environment Variables

| Variable | Provider | Required for | Notes |
| -------- | -------- | ------------ | ----- |
| `DEEPSEEK_3_API_KEY_MOCK_TOCKEN` | DeepSeek | real calls on the free tier | DeepSeek 3 API key; real key, `_MOCK_TOCKEN` suffix is the free-tier naming convention |
| `OPENAI_API_KEY_MOCK_TOCKEN` | OpenAI | real calls on the free tier | OpenAI API key for the free tier; real key, same naming convention |
| `OPENAI_API_KEY` | OpenAI | real calls on paid/production | Existing standard key remains supported; `OPENAI_API_KEY_MOCK_TOCKEN` is preferred when both are set (free-tier key is the default app key) |
| `DEEPSEEK_MODEL` | DeepSeek | optional | Overrides the default DeepSeek model via `resolveModel` (default: `deepseek-chat` — verify exact current identifier at implementation time) |
| `USE_MOCK_PROVIDERS` | all | dev/test | Existing switch; when `"true"` the registry returns `MockProvider` for every name including `deepseek` (unchanged behavior) |

Key resolution precedence for OpenAI: `OPENAI_API_KEY_MOCK_TOCKEN` → `OPENAI_API_KEY` (free-tier key preferred). DeepSeek reads only `DEEPSEEK_3_API_KEY_MOCK_TOCKEN`.

Values are never committed. Document them in Vercel when deploying. Missing keys do **not** break imports — `getProvider()` throws a typed `AIProviderError` at call time (spec `09`).

---

## 7. Data Model

Add `DEEPSEEK` to the existing `AIProvider` enum:

```prisma
enum AIProvider {
  OPENAI
  ANTHROPIC
  GEMINI
  PERPLEXITY
  DEEPSEEK
}
```

Generate the migration through Prisma; never hand-edit an applied migration:

```bash
npx prisma migrate dev --name add_deepseek_provider
npx prisma generate
```

No new tables or columns. `ScanResult.provider` can now be `DEEPSEEK`.

---

## 8. Provider Abstraction Changes (`lib/providers/`)

### 8.1 Types (`types.ts`)

- Extend the union: `export type AIProviderName = "openai" | "anthropic" | "gemini" | "perplexity" | "deepseek";`
- Extend the mapping: `TO_PRISMA_PROVIDER` gains `deepseek: "DEEPSEEK"`.

### 8.2 Config (`config.ts`)

- `DEFAULT_MODELS` gains `deepseek: "deepseek-chat"` (verify the exact current DeepSeek 3 model identifier at implementation time — `deepseek-chat` is the stable alias for DeepSeek-V3; add to Open Questions if uncertain).
- `envKeyMap` in `resolveModel` gains `deepseek: process.env.DEEPSEEK_MODEL`.
- Add a shared free-tier key resolver, e.g.:

```ts
export function openaiApiKey(): string | undefined {
  return (
    process.env.OPENAI_API_KEY_MOCK_TOCKEN?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    undefined
  );
}

export function deepseekApiKey(): string | undefined {
  return process.env.DEEPSEEK_3_API_KEY_MOCK_TOCKEN?.trim() || undefined;
}
```

### 8.3 DeepSeek provider (`deepseek.ts`)

New file following the Perplexity pattern (spec `09`) — OpenAI-compatible client:

```ts
export function isConfigured(): boolean {
  return Boolean(deepseekApiKey());
}

export class DeepSeekProvider implements AIProvider {
  readonly name = "deepseek" as const;

  async ask(prompt: string, config: Partial<AIProviderConfig> = {}): Promise<AIResponse> {
    const startedAt = performance.now();
    try {
      const sdk = createOpenAICompatible({
        name: "deepseek",
        baseURL: "https://api.deepseek.com",
        apiKey: deepseekApiKey(),
      });

      const modelId = resolveModel("deepseek", config.model);
      const result = await generateText({
        model: sdk(modelId),
        prompt,
        maxOutputTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: config.temperature ?? DEFAULT_TEMPERATURE,
        abortSignal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });

      return {
        content: result.text,
        model: result.response.modelId ?? modelId,
        tokensUsed: result.usage.totalTokens ?? 0,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (err) {
      throw toProviderError("deepseek", err);
    }
  }
}
```

### 8.4 OpenAI provider (`openai.ts`)

- `isConfigured()` returns `Boolean(openaiApiKey())`.
- Construct the SDK with an explicit key so the free-tier key is used: `createOpenAI({ apiKey: openaiApiKey() })`. (`createOpenAI` accepts `apiKey`; when `openaiApiKey()` is `undefined` it falls back to the standard `OPENAI_API_KEY` auto-read behavior.)

### 8.5 Registry (`registry.ts`)

- `envKeyNames` gains `deepseek: "DEEPSEEK_3_API_KEY_MOCK_TOCKEN"`.
- `isProviderConfigured` gains the `deepseek` case delegating to `isConfigured()` from `deepseek.ts`.
- `getProvider` gains the `deepseek` case constructing `new DeepSeekProvider()`.
- The `USE_MOCK_PROVIDERS === "true"` short-circuit already returns `MockProvider` for any name — `deepseek` works automatically.

### 8.6 Tier gating helper (`tiers.ts` or `config.ts`)

Pure, Prisma-free, React-free — unit-testable in isolation:

```ts
export const FREE_PROVIDERS: AIProviderName[] = ["deepseek", "openai"];
export const PREMIUM_PROVIDERS: AIProviderName[] = ["anthropic", "gemini", "perplexity"];
export const ALL_PROVIDERS: AIProviderName[] = [...FREE_PROVIDERS, ...PREMIUM_PROVIDERS];

/** Server-side only: which provider names may this entitlement level use? */
export function resolveAllowedProviders(input: {
  entitled: boolean;
  configured: AIProviderName[];
}): AIProviderName[] {
  const tier = input.entitled ? ALL_PROVIDERS : FREE_PROVIDERS;
  return tier.filter((name) => input.configured.includes(name));
}
```

`configured` comes from `getAvailableProviders().map((p) => p.name)` at the route boundary. The helper stays pure so tier policy can be tested without env vars or Prisma.

---

## 9. Scan Entitlement Change

### 9.1 `POST /api/scans` (`app/api/scans/route.ts`)

Remove the blanket `402` gate (spec `16` §12). Replace it with:

1. authenticate + resolve company (unchanged: `401` / `404`)
2. resolve entitlement: `const isEntitled = await hasActiveSubscription(company.id);`
3. resolve configured providers: `const configured = getAvailableProviders().map((p) => p.name);`
4. resolve allowed providers: `const providers = resolveAllowedProviders({ entitled: isEntitled, configured });`
5. keep stale-`PENDING` sweep and single-active-scan guard (unchanged: `409`)
6. keep the 0-active-prompts guard (unchanged: `422`)
7. create the `Scan` row (unchanged)
8. trigger with the providers list: `tasks.trigger<typeof runScan>("scan-company", { scanId: scan.id, providers })`
9. return `202 { data: { scanId, status: "PENDING", providers } }` — include `providers` so the UI can show what ran

If `providers` is empty (e.g., no free keys configured and unpaid), the scan still dispatches and completes with zero provider work — matching the existing `getAvailableProviders() === []` behavior from spec `12` §22.6. Do not invent a new error for the empty case.

### 9.2 Scan job (`lib/jobs/scan.ts`)

- Payload type becomes `{ scanId: string; providers: AIProviderName[] }`.
- Replace `Promise.resolve(getAvailableProviders())` with filtering the payload list against the registry:

```ts
const allConfigured = getAvailableProviders();
const providers = allConfigured.filter((p) => payload.providers.includes(p.name));
```

- Logging: keep the existing `providers: providers.length` summary line; it now reflects the allowed set.

### 9.3 `POST /api/prompts/generate` (`app/api/prompts/generate/route.ts`)

Remove the blanket `402` gate. Replace with provider selection:

1. authenticate + resolve company (unchanged)
2. resolve entitlement + configured providers (same as §9.1)
3. pick an allowed provider for generation: prefer a free provider when unpaid, any configured provider when paid:

```ts
const allowed = resolveAllowedProviders({ entitled: isEntitled, configured });
const provider = allowed.length > 0 ? getProvider(allowed[0]) : undefined;
```

4. pass it explicitly: `generatePromptSuggestions(input, provider ? { provider } : undefined)` — the generator already supports `opts.provider` (spec `10`), so this is a minimal change
5. keep the active-scan `409` guard and the missing `productDescription` `422` guard (unchanged)

If `allowed` is empty, `generatePromptSuggestions` throws `PromptGenerationError("No AI provider configured")` → existing `503` mapping.

---

## 10. Entitlement and Access Rules

| State | Scan providers | Prompt generation provider | Notes |
| ----- | -------------- | -------------------------- | ----- |
| No subscription row | `deepseek`, `openai` (whichever is configured) | first allowed free provider | Free tier is fully usable |
| `ACTIVE` / `TRIALING` + configured price | all configured (`deepseek`, `openai`, `anthropic`, `gemini`, `perplexity`) | any configured provider | Unlocks premium providers |
| `PAST_DUE`, `UNPAID`, `CANCELED`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`, `PAUSED` | `deepseek`, `openai` | first allowed free provider | Back to free tier; `cancelAtPeriodEnd` keeps paid access until period end (unchanged, spec `16`) |
| unexpected price | `deepseek`, `openai` | first allowed free provider | Non-entitled per spec `16`; falls back to free tier |
| `USE_MOCK_PROVIDERS === "true"` | mock instances of allowed names | mock | Dev/test unaffected |

Server-side rules that never change:

- a client-provided `providers`, `entitled`, or `status` value is ignored — the route resolves everything server-side
- the webhook is the sole authority for paid status (invariant #5)
- premium providers are never called for an unpaid company — enforcement is the route's `resolveAllowedProviders` result, not a client flag
- onboarding, prompt browsing/management, and the billing page remain available before payment (unchanged, spec `16` §12)

---

## 11. Billing / Plan UI

Use the existing dark editor shell and shadcn/ui primitives (spec `16` §13 as the base). No new layout.

### Suggested structure

```text
components/billing/
  plan-card.tsx          # free vs paid plan card
  provider-access-list.tsx # per-provider rows with lock/unlock state
lib/api/billing.ts       # unchanged; maybe adds a plan view model
```

### Plan presentation

- **Free plan card:** "Free" — includes DeepSeek 3 + OpenAI scans and AI prompt suggestions. `Subscribe` CTA.
- **Paid plan card:** the existing single monthly plan — "Unlocks Anthropic, Gemini, Perplexity (plus DeepSeek + OpenAI)". `Subscribe` / `Manage billing` per subscription state (reuse `subscription-card.tsx`).
- **Provider access list:** five rows (DeepSeek, OpenAI, Anthropic, Gemini, Perplexity). Free tier shows DeepSeek + OpenAI as available and the other three with a lock icon + "Unlocks with paid plan". Paid tier shows all available.
- Read the plan state server-side via the existing `getBillingStatusForCompany(companyId)` (spec `16` §9); pass only serializable values to client components.
- Locked rows use `--accent-muted`/`--text-muted` tokens and a Lucide `Lock` icon at `h-4 w-4`. No hardcoded hex values (code-standards).
- One page-level `h1`; visible text in addition to status color (accessibility, spec `16` §13).

---

## 12. Testing (Vitest)

Co-located tests:

| File | Covers |
| ---- | ------ |
| `lib/providers/tiers.test.ts` | `FREE_PROVIDERS` / `PREMIUM_PROVIDERS` / `ALL_PROVIDERS` contents; `resolveAllowedProviders` — entitled includes premium when configured, unpaid excludes premium, configured filtering, empty-configured returns `[]` |
| `lib/providers/config.test.ts` (extend) | `DEFAULT_MODELS` contains `deepseek`; `deepseekApiKey()` prefers `DEEPSEEK_3_API_KEY_MOCK_TOCKEN` (use `vi.stubEnv`); `openaiApiKey()` prefers `OPENAI_API_KEY_MOCK_TOCKEN` over `OPENAI_API_KEY`; `TO_PRISMA_PROVIDER` maps `deepseek` → `DEEPSEEK` |
| `lib/providers/registry.test.ts` (extend) | `isProviderConfigured("deepseek")` with/without `DEEPSEEK_3_API_KEY_MOCK_TOCKEN`; `getProvider("deepseek")` returns `DeepSeekProvider` when configured, throws typed `AIProviderError` when not; `USE_MOCK_PROVIDERS` returns `MockProvider` for `deepseek` |
| `lib/providers/deepseek.test.ts` | `DeepSeekProvider` contract shape via the mock pattern (no network); `isConfigured()` key checks |

Existing scan/route behavior is covered by manual checks (§13); do not add network-dependent tests.

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

1. set `DEEPSEEK_3_API_KEY_MOCK_TOCKEN` and `OPENAI_API_KEY_MOCK_TOCKEN` (and no `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `PERPLEXITY_API_KEY`)
2. sign in, create a company through onboarding
3. run a scan — confirm it completes with results only for `DEEPSEEK` and `OPENAI` providers
4. generate prompts — confirm it succeeds using a free provider
5. open Billing — confirm the free plan card shows DeepSeek + OpenAI available and Anthropic/Gemini/Perplexity locked
6. subscribe via test-mode Stripe checkout; wait for the webhook-backed `ACTIVE` row
7. run another scan — confirm all configured providers are included
8. cancel / let the subscription lapse — confirm the next scan returns to free-provider-only

Update `context/context/progress-tracker.md` after implementation, migration, and verification are complete.

---

## 14. Out of Scope

Do not implement:

- usage quotas, scan-count limits, or rate limiting per tier
- a separate free vs paid Stripe Price — the free tier is entitlement absence, not a second product (spec `16`)
- new billing products, coupons, or trials
- mid-scan entitlement re-checking — the provider list is resolved once at dispatch time
- per-provider cost tracking or spend dashboards
- a hard app-wide paywall middleware (per spec `16` §12, add deliberately if ever needed)
- changes to visibility scoring — it is computed from whatever `ScanResult` rows exist, which now include `DEEPSEEK` automatically
- content generation or any feature from the MVP out-of-scope list

---

## 15. Future

Reserved extensions:

- tiered plans with per-plan provider lists and scan quotas
- per-provider env-key configuration table (instead of the two free-tier keys being hardcoded)
- usage metering per provider
- DeepSeek reasoner model toggle (`deepseek-reasoner`) for analysis prompts
- plan-upgrade upsell UI on locked provider rows

---

## 16. Definition of Done

- `AIProviderName` includes `"deepseek"`; `TO_PRISMA_PROVIDER` maps it to `DEEPSEEK`
- `DEFAULT_MODELS` and `resolveModel` support `deepseek` (default `deepseek-chat` + `DEEPSEEK_MODEL` override)
- `lib/providers/deepseek.ts` implements `AIProvider` via `@ai-sdk/openai-compatible` at `https://api.deepseek.com`, keyed by `DEEPSEEK_3_API_KEY_MOCK_TOCKEN`
- `openai.ts` reads `OPENAI_API_KEY_MOCK_TOCKEN` with `OPENAI_API_KEY` fallback; `isConfigured()` reflects the free-tier key
- registry supports `deepseek` (`isProviderConfigured`, `getProvider`, `envKeyNames`)
- Prisma `AIProvider` enum includes `DEEPSEEK`; migration `add_deepseek_provider` applies and client regenerates
- pure `resolveAllowedProviders({ entitled, configured })` helper exists in `lib/providers/` with unit tests
- `POST /api/scans` no longer returns `402`; it resolves allowed providers and passes `providers` in the trigger payload; response includes `providers`
- `runScan` payload is `{ scanId, providers }` and filters `getAvailableProviders()` by the payload list
- `POST /api/prompts/generate` no longer returns `402`; it passes an allowed provider explicitly when one resolves
- premium providers are never called for an unpaid company — enforced by route-side `resolveAllowedProviders`
- billing page shows free vs paid plan cards and a provider access list with lock states
- no secrets committed; new env vars documented in this spec and in the deployment environment
- `npm test`, `npm run lint`, and `npm run build` all pass
- `context/context/progress-tracker.md` records the completed implementation
