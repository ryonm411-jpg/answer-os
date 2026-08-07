# AI Provider Abstraction Layer

## Goal

Build `lib/providers/` — the single abstraction layer every AI provider call flows through. It exposes one uniform `AIProvider` interface over OpenAI, Anthropic, Gemini, and Perplexity (using the Vercel AI SDK as the shared client), plus a mock provider for development and unit tests.

This is the foundation the visibility scanner pipeline builds on: when the scan job (future spec) asks "what does ChatGPT say about this prompt?", it calls `ask()` on a provider — never a vendor SDK directly.

Do **not** implement:

- the scan job / scan pipeline
- prompt parsing into structured data (mentions, position, sentiment)
- rate limiting or Redis caching
- the prompt library

Follow:

- `architecture.md` (invariant #2: AI provider calls always go through the abstraction layer; `lib/providers/` boundary)
- `code-standards.md` (strict TS, `enum`/`interface` for constrained sets, server-side only, no `any`, no direct SDK imports outside `lib/providers/`)
- `ai-workflow-rules.md` (Provider Integration Checklist, unit-test core logic with Vitest)
- `answeros-spec.md` (the `AIProvider` / `AIResponse` interface contracts defined in "AI Provider Abstraction")

---

## Prerequisites

Before beginning implementation:

- Read `AGENTS.md`.
- Confirm `07-wire-dashboard.md` is implemented (the project's data layer patterns — thin `lib/` modules — are the model for this feature).
- The Prisma `AIProvider` enum already exists (`OPENAI`, `ANTHROPIC`, `GEMINI`, `PERPLEXITY`) — no schema migration needed.

## Current State

Reference points already in the codebase:

- `prisma/schema.prisma` — `enum AIProvider` with all four providers; `ScanResult.provider` references it
- `context/answeros-spec.md` — defines the target contracts:
  - `type AIProviderName = "openai" | "anthropic" | "gemini" | "perplexity"`
  - `interface AIProvider { readonly name; ask(prompt, config?): Promise<AIResponse> }`
  - `interface AIResponse { content; model; tokensUsed; latencyMs }`
- `context/context/ai-workflow-rules.md` — Provider Integration Checklist (implement interface → add to `AIProviderName` → Prisma enum → env vars → scan job rotation → errors surface as `FAILED`)
- `context/context/code-standards.md` — "All AI provider calls go through `lib/providers/` abstraction layer — never import provider SDKs directly in routes or components"; testing with Vitest, tests co-located with source
- No AI dependencies in `package.json` yet; no `lib/providers/` directory yet

Known gaps this feature fills:

- there is no provider abstraction layer at all — future scan code would otherwise import vendor SDKs directly (violating invariant #2)
- no way to enumerate configured providers for a scan run
- no typed, catchable error taxonomy for provider failures (the scan job must map failures to `FAILED` scan results)

---

## Decisions (2026-08-06)

| #  | Decision                                             | Rationale                                                                 |
| -- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| 1  | Use the Vercel AI SDK (`ai`) as the shared client    | One uniform API across all four providers; server-only `generateText`; token usage built in; smallest amount of custom glue |
| 2  | Implement all 4 providers + a `MockProvider`         | Matches the "4 AI providers from day one" product decision; mock enables dev/tests without API keys |
| 3  | `ask()` returns plain text (`AIResponse.content`)    | Structured output (mention/position/sentiment JSON) belongs to the visibility scanner pipeline spec — the abstraction stays a generic completion client, per `answeros-spec.md` |
| 4  | Include Vitest unit tests in this spec               | Matches the code-standards testing policy (core logic tested, co-located tests) |

---

## Dependencies

Install:

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai-compatible
npm install -D vitest
```

Add the `"test": "vitest run"` script to `package.json`. No other runtime dependencies are introduced.

## Environment Variables

| Variable            | Provider  | Required for | Notes                                             |
| ------------------- | --------- | ------------ | ------------------------------------------------- |
| `OPENAI_API_KEY`    | OpenAI    | real calls   | Auto-read by `@ai-sdk/openai`                     |
| `ANTHROPIC_API_KEY` | Anthropic | real calls   | Auto-read by `@ai-sdk/anthropic`                  |
| `GEMINI_API_KEY`    | Gemini    | real calls   | Auto-read by `@ai-sdk/google`                     |
| `PERPLEXITY_API_KEY`| Perplexity| real calls   | Passed explicitly to the openai-compatible client |
| `OPENAI_MODEL` / `ANTHROPIC_MODEL` / `GEMINI_MODEL` / `PERPLEXITY_MODEL` | all | optional      | Override the default model per provider (resolved by `resolveModel`) |

Values are never committed. Document them in Vercel when deploying. Missing keys do **not** break imports — `getProvider()` throws a typed `AIProviderError` at call time (see Error Handling).

---

## File Structure

```
lib/providers/
  types.ts        # AIProviderName, AIProviderConfig, AIProvider, AIResponse, MockOverrides, TO_PRISMA_PROVIDER
  errors.ts       # AIProviderError class + toProviderError (SDK error → typed error mapping)
  config.ts       # DEFAULT_MODELS, resolveModel, maxTokens, temperature, timeout — the tuning knobs
  registry.ts     # getProvider, getAvailableProviders, isProviderConfigured, createMockProvider
  openai.ts       # OpenAIProvider + isConfigured()
  anthropic.ts    # AnthropicProvider + isConfigured()
  gemini.ts       # GeminiProvider + isConfigured()
  perplexity.ts   # PerplexityProvider + isConfigured() (via @ai-sdk/openai-compatible)
  mock.ts         # MockProvider (deterministic, scriptable)
  index.ts        # public exports (types, errors, registry, providers)
  config.test.ts  # default-model / config / mapping shape tests
  mock.test.ts    # MockProvider contract tests
  registry.test.ts# registry behavior tests (co-located, per code-standards)
```

No `"use client"` anywhere — this module is server-only by construction.

---

## Types & Interface (`types.ts`)

Implement the contracts from `answeros-spec.md` exactly:

```ts
export type AIProviderName = "openai" | "anthropic" | "gemini" | "perplexity";

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIProvider {
  readonly name: AIProviderName;
  ask(prompt: string, config?: Partial<AIProviderConfig>): Promise<AIResponse>;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}
```

`AIProviderConfig.timeoutMs` is an addition over `answeros-spec.md` — each provider applies it as an `abortSignal` deadline (default in `config.ts`).

`AIProviderConfig.apiKey` is kept for parity with `answeros-spec.md` but is **unused in MVP** — SDK factories read API keys from the environment. Per-call key override is out of scope (see Out of Scope).

`AIProviderError` is a class and lives in `errors.ts`, not `types.ts` — types stays free of implementations.

### Prisma enum mapping

`ScanResult.provider` is the Prisma `AIProvider` enum (uppercase `OPENAI`, …), while `AIProviderName` is lowercase. `types.ts` owns the mapping:

```ts
export const TO_PRISMA_PROVIDER: Record<AIProviderName, string> = {
  openai: "OPENAI",
  anthropic: "ANTHROPIC",
  gemini: "GEMINI",
  perplexity: "PERPLEXITY",
};
```

The scan job uses `TO_PRISMA_PROVIDER[provider.name]` when persisting `ScanResult.provider`.

---

## Config (`config.ts`)

Single place for the tuning knobs. Defaults are env-overridable so model choices can change without code edits:

```ts
export const DEFAULT_MODELS: Record<AIProviderName, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-latest",
  gemini: "gemini-2.5-flash",
  perplexity: "sonar",
};

export const DEFAULT_MAX_TOKENS = 2048;
export const DEFAULT_TEMPERATURE = 0.2; // low temperature: consistent, factual answers for scanning
export const DEFAULT_TIMEOUT_MS = 30_000;
```

Optional per-provider env overrides: `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `GEMINI_MODEL`, `PERPLEXITY_MODEL`. Exact final model IDs are verified during implementation (see Open Questions).

`resolveModel(name)` in `config.ts` implements the precedence chain: per-call `config.model` > env override (`OPENAI_MODEL`, …) > `DEFAULT_MODELS`.

---

## Provider Implementations

Each provider is a small class wrapping the Vercel AI SDK. Pattern (identical shape for all four):

```ts
export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  private readonly sdk = createOpenAI(); // reads OPENAI_API_KEY from env

  async ask(prompt: string, config: Partial<AIProviderConfig> = {}) {
    const startedAt = performance.now();
    try {
      const result = await generateText({
        model: this.sdk(config.model ?? resolveModel("openai")),
        prompt,
        maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: config.temperature ?? DEFAULT_TEMPERATURE,
        abortSignal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
      return {
        content: result.text,
        model: result.response.modelId,
        tokensUsed: result.usage.totalTokens,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (err) {
      throw toProviderError("openai", err);
    }
  }
}
```

Shared helpers have fixed homes: `resolveModel(name)` in `config.ts`, `toProviderError(name, err)` in `errors.ts`. Each provider module also exports `isConfigured(): boolean` (checks its env key) for the registry. The four classes stay thin and nearly identical.

| File          | SDK package                 | Provider factory                | Env key          | Default model       |
| ------------- | --------------------------- | ------------------------------- | ---------------- | ------------------- |
| `openai.ts`   | `@ai-sdk/openai`            | `createOpenAI()`                | `OPENAI_API_KEY` | `gpt-4o`            |
| `anthropic.ts`| `@ai-sdk/anthropic`         | `createAnthropic()`             | `ANTHROPIC_API_KEY` | `claude-3-5-sonnet-latest` |
| `gemini.ts`   | `@ai-sdk/google`            | `createGoogleGenerativeAI()`    | `GEMINI_API_KEY` | `gemini-2.5-flash`  |
| `perplexity.ts` | `@ai-sdk/openai-compatible` | `createOpenAICompatible({ name: "perplexity", baseURL: "https://api.perplexity.ai", apiKey: process.env.PERPLEXITY_API_KEY })` | `PERPLEXITY_API_KEY` | `sonar` |

Notes:

- There is no official `@ai-sdk/perplexity` package — Perplexity is called through `@ai-sdk/openai-compatible` pointed at `https://api.perplexity.ai` with model `sonar`.
- `apiKey` may be omitted for OpenAI/Anthropic/Gemini (the SDKs auto-read their standard env var); Perplexity requires explicit `apiKey` since the openai-compatible factory has no standard var.
- Per-provider `isConfigured()` helpers (e.g. `process.env.OPENAI_API_KEY` present) drive the registry.

---

## Mock Provider (`mock.ts`)

Deterministic, scriptable provider used in dev (when no keys exist) and in unit tests:

```ts
// types.ts
export interface MockOverrides {
  content?: string;
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  error?: AIProviderError; // when set, ask() rejects with it
}

// mock.ts
export class MockProvider implements AIProvider {
  constructor(
    readonly name: AIProviderName,
    private readonly overrides?: MockOverrides
  ) {}

  async ask(prompt: string): Promise<AIResponse> { ... }
}
```

- Returns canned `AIResponse` values (defaults: a short echo-style content string, model `"mock"`, `tokensUsed` derived from prompt length, small `latencyMs`)
- If `overrides.error` is set, `ask()` rejects with it — lets scan-pipeline tests exercise the `FAILED` path
- Supports a `mock-<name>` alias so callers can get a mock OpenAI/Anthropic/Gemini/Perplexity with the right `name`

`createMockProvider(name, overrides?)` is exported from the registry for convenience.

---

## Registry (`registry.ts`)

Thin, lazy, server-only:

```ts
export function getProvider(name: AIProviderName): AIProvider;
// Throws AIProviderError("Missing OPENAI_API_KEY …", { provider: "openai", retryable: false })
// when the provider's env key is absent. Never crashes at import time.

export function getAvailableProviders(): AIProvider[];
// Returns the real providers whose env key is configured. The scan job iterates this list once per run.

export function isProviderConfigured(name: AIProviderName): boolean;
// Delegates to the per-provider isConfigured() export.

export function createMockProvider(name: AIProviderName, overrides?: MockOverrides): AIProvider;
```

`getProvider` and `getAvailableProviders` cache one instance per provider name (lazy singletons) — a scan over 100+ prompts reuses the same SDK client instead of re-constructing it per call.

`index.ts` re-exports the public surface: `AIProviderName`, `AIProvider`, `AIResponse`, `AIProviderConfig`, `TO_PRISMA_PROVIDER`, `AIProviderError`, `getProvider`, `getAvailableProviders`, `isProviderConfigured`, `createMockProvider`, and config defaults.

---

## Error Handling

`errors.ts` defines `AIProviderError` (class) and `toProviderError(name, err)` (mapping helper). All provider failures surface as `AIProviderError` via `toProviderError(name, err)`. The scan job catches `AIProviderError` and maps it to a `FAILED` scan result — never an unhandled exception (Provider Integration Checklist #6).

| Cause                                        | `retryable` | `statusCode`        |
| ------------------------------------------- | ----------- | ------------------- |
| 429 (rate limit)                            | `true`      | `429`               |
| 5xx (provider outage)                       | `true`      | server status       |
| 400 / 401 / 403 (bad request / bad key)     | `false`     | client status       |
| timeout (abort signal fired)                | `true`      | —                   |
| network failure                             | `true`      | —                   |
| malformed/invalid response from provider    | `false`     | —                   |

- Map from the AI SDK's `APICallError`/`InvalidResponseError`/`AbortError` types when possible; fall back to a generic message.
- Never expose raw SDK stack traces to callers.
- Retry/backoff policy itself belongs to the scan job spec — this layer only classifies (`retryable`) and throws.
- Route handlers must never call providers directly (invariant #1: all AI scanning runs in Trigger.dev background jobs).

---

## Testing (Vitest)

Add `vitest` as a devDependency and a `"test": "vitest run"` script. Co-located tests:

| File                    | Covers                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| `config.test.ts`        | default models map has all 4 keys; defaults within sane bounds; `TO_PRISMA_PROVIDER` maps every name to its Prisma value |
| `mock.test.ts`          | `ask()` resolves with the `AIResponse` contract shape; `overrides.error` rejects with `AIProviderError` |
| `registry.test.ts`      | `getProvider` throws typed error when key missing (use `vi.stubEnv` to clear vars); `getAvailableProviders` filters; `createMockProvider` returns `MockProvider` |

Provider classes are thin wrappers over the AI SDK — no network calls in unit tests (SDK behavior is tested by the SDK's own suite; our tests exercise our contracts via the mock).

---

## Validation

- `npm test` — Vitest unit tests pass
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- `context/context/progress-tracker.md` updated (spec entry + session note)

---

## Out of Scope

Do not implement:

- the scan job, provider rotation loop, or retry/backoff (Trigger.dev spec)
- per-call API key override (`config.apiKey` is accepted for interface parity but unused in MVP)
- structured output / JSON parsing of responses (visibility scanner pipeline spec)
- prompt library generation (prompt library spec)
- rate limiting counters or Redis caching (cache spec)
- cost tracking dashboards or per-provider spend tracking
- streaming (`ask()` is a plain completion call)
- any UI, API routes, or database writes

This feature is the provider abstraction layer and its unit tests — nothing more.

---

## Future

Reserved extensions (do not implement):

- optional structured-output mode (`askJSON`) when the scanner pipeline needs it
- per-provider concurrency limits / rate-limit-aware scheduling
- cost tracking fields on `AIResponse`
- additional providers (e.g. DeepSeek, Mistral) via the checklist

---

## Definition of Done

- `lib/providers/` exists with `types.ts`, `errors.ts`, `config.ts`, `registry.ts`, `openai.ts`, `anthropic.ts`, `gemini.ts`, `perplexity.ts`, `mock.ts`, `index.ts`
- dependencies installed (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`; `vitest` as dev) and `"test": "vitest run"` script added
- `AIProvider` / `AIResponse` match `answeros-spec.md` exactly (plus `timeoutMs` on config)
- all four providers are implemented with the Vercel AI SDK (`ai` + `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible` for Perplexity)
- `getProvider` throws a typed `AIProviderError` when an API key is missing — never at import time
- `getProvider` / `getAvailableProviders` cache one instance per provider (lazy singletons)
- `TO_PRISMA_PROVIDER` maps each `AIProviderName` to its Prisma `AIProvider` enum value
- `getAvailableProviders()` returns only configured providers
- errors are classified with `retryable` flags; no raw stack traces leak to callers
- `MockProvider` + `createMockProvider` work with scripted responses and errors (`MockOverrides` in `types.ts`)
- Vitest added; unit tests cover config, mock, and registry (env stubbed with `vi.stubEnv`)
- no direct vendor SDK imports outside `lib/providers/`
- new env vars (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`) documented in this spec
- `npm test`, `npm run lint`, and `npm run build` all pass
- `progress-tracker.md` reflects the completed work
