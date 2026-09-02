# Feature Spec 24 — Deploy to Vercel (Production)

> **Status:** Proposed next implementation unit
> **Created:** August 28, 2026
> **Depends on:** `05-prisma.md`, `11-trigger-dev-jobs.md`, `12-visibility-scanner-pipeline.md`, `16-stripe-subscriptions.md`, `17-free-tier.md`, `21-posthog-sentry-analytics-monitoring.md`, `23-ai-provider-strategy.md`

---

## 1. Goal

Deploy AnswerOS to production on Vercel with all integrations alive (Clerk, Neon, Trigger.dev, Upstash Redis, Stripe, PostHog, Sentry). This matches success criterion #7 in `answeros-spec.md`.

AnswerOS is a serverless Next.js app whose long-running AI scanning work is delegated to Trigger.dev cloud workers. "Deployment" is therefore **two deployments that must stay in sync**:

1. **Vercel** — web app, `/api/*` route handlers, server components.
2. **Trigger.dev cloud** — the `scan-company` background tasks in `lib/jobs/` (project `proj_wcqhshlgjgctdeuuitnc`).

Vercel API routes trigger tasks via `tasks.trigger(...)`; Trigger.dev executes them asynchronously so scans never hit Vercel's serverless HTTP timeout (architecture decision in `architecture_overview.md`, section 11).

The authoritative flow for the redeployment moment is:

```text
Set env vars in Vercel
    → deploy Trigger.dev worker
    → prisma migrate deploy on the production Neon branch
    → deploy the app to Vercel
    → run the post-deploy verification checklist
```

---

## 2. Mandatory Context Reads

Before implementing this feature, read these files in order:

1. `CLAUDE.md` — **read first**; it `@`-imports `AGENTS.md` and contains the repository's agent instructions and Next.js-version warning.
2. `context/project-overview.md` — product goals and the "deployed to Vercel" success criteria.
3. `context/architecture.md` — system boundaries, invariants, storage model, hosted services.
4. `context/code-standards.md` — env-var rules, file organization, testing and build requirements.
5. `context/ai-workflow-rules.md` — protected files, env-var documentation, build discipline.
6. `context/progress-tracker.md` — current phase and deployment status (Vercel production is currently "Next Up #2").
7. `context/features-specs/05-prisma.md` — Neon connection strings (`DATABASE_URL` / `DIRECT_URL`) and `prisma migrate deploy`.
8. `context/features-specs/11-trigger-dev-jobs.md` — Trigger.dev project/secret and worker deployment.
9. `context/features-specs/16-stripe-subscriptions.md` — production Stripe keys, webhook secret, `APP_URL`.
10. `context/features-specs/17-free-tier.md` — free-tier AI provider keys (`_MOCK_TOCKEN` suffix semantics).
11. `context/features-specs/21-posthog-sentry-analytics-monitoring.md` — PostHog/Sentry env vars and `VERCEL_ENV` behavior.
12. `context/features-specs/23-ai-provider-strategy.md` — provider tier gating and key configuration.

Do not begin implementation until `CLAUDE.md` has been read.

---

## 3. Current State

Reference points in the repository:

- The app builds locally: `npm run build` (`next build`) passes clean.
- `generated/` (the Prisma client) is gitignored and **not committed** — Vercel must generate it at build time.
- `prisma.config.ts` reads `DATABASE_URL` / `DIRECT_URL`; `.env.local` is gitignored.
- `trigger.config.ts` defines the Trigger.dev project and points jobs at `lib/jobs/`.
- No `vercel.json` exists; the project relies on Next.js defaults.
- `next.config.ts` wraps config in `withSentryConfig` (org `answeros`, project `javascript-nextjs`), enabling source-map upload and automatic Vercel Cron Monitors.
- Sentry environment is derived from `VERCEL_ENV`; PostHog and Sentry degrade to no-ops when their env vars are missing.
- CI (`.github/workflows/ci.yml`) runs `npx prisma generate`, `npx prisma migrate deploy`, `tsc --noEmit`, `npm run lint`, `npm run build` against a throwaway Postgres service — an up-to-date reference for the production build steps.
- Weekly email reports (Resend) and any scheduled scans are not yet implemented.

---

## 4. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | The Vercel **Build Command is `npx prisma generate && next build`** | `generated/` is gitignored, so the Prisma client must be generated before `next build`; without it the build fails on Prisma imports |
| 2 | Deploy the app and the Trigger.dev worker together, keeping the scan-company trigger/task contract in sync | A Vercel app and a worker on mismatched code (e.g. payload `{ scanId }` vs `{ scanId, providers }`) breaks scans |
| 3 | Apply production migrations with `npx prisma migrate deploy` against the production Neon branch before/at deploy; never use `migrate dev` in production | `migrate deploy` applies existing migrations without generating new ones; `migrate dev` is a local-only workflow (matches `05-prisma.md` and CI) |
| 4 | Env vars are set manually per Vercel environment; no `syncEnvVars` from Vercel → Trigger.dev | Keeps each runtime's secret set explicit and auditable; `11-trigger-dev-jobs.md` lists `syncEnvVars` as deployment wiring |
| 5 | Secrets use Vercel's "Sensitive" environment variable option where offered | Sensitive vars are write-only, protecting e.g. `SENTRY_AUTH_TOKEN`, Stripe keys, provider keys, Neon URLs |
| 6 | Free-tier provider keys follow the `_MOCK_TOCKEN` suffix convention from `17-free-tier.md`; premium keys are optional and gated | Missing keys don't break the build — `getProvider()` throws a typed `AIProviderError` at call time; configure only the providers that should be active |
| 7 | No `vercel.json` for the MVP web app | Next.js defaults satisfy the app; a `crons` block is reserved for the future weekly-report feature |
| 8 | Post-deploy verification is a manual checklist against live production (roots, scans, billing webhook, analytics, Sentry) | Integration/E2E tests are post-MVP; production smoke checks are the acceptance gate |

---

## 5. Vercel Project Settings

Recommended settings in the Vercel dashboard (Project → Settings):

| Setting | Value | Notes |
| --- | --- | --- |
| Framework Preset | Next.js | Auto-detected |
| Install Command | `npm ci` | Reproducible installs; matches CI |
| Build Command | `npx prisma generate && next build` | Required — see Decision #1 |
| Output Directory | Default (Next.js) | Leave as-is |
| Node.js Version | 20 | Matches `package.json` / CI (`node-version: 20`) |
| Root Directory | `/` | Repo root |
| Builds / Deployments Trigger | Git push to default branch | Auto-deploy production on main; automatic preview per PR/commit |
| Environment Variables | See section 6 | Group by Production / Preview; mark secrets as Sensitive |

The production URL (e.g. `https://answeros.com`) is the canonical `APP_URL` / `NEXT_PUBLIC_APP_URL` used for Stripe redirects and Clerk.

---

## 6. Environment Variables

Secrets are never committed. Set them in Vercel for the Production environment (and Preview where noted). Do not hand-set Vercel-provided vars like `VERCEL_ENV`.

### Clerk

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production + Preview | Public publishable key |
| `CLERK_SECRET_KEY` | Production | **Production instance** secret, not the dev-key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Production | e.g. `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Production | e.g. `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Production | e.g. `/editor` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Production | e.g. `/onboarding` |

### Database (Neon)

| Variable | Scope | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Production | **Pooled** endpoint for the app runtime (`-pooler` host) |
| `DIRECT_URL` | Production | **Direct** endpoint for `prisma migrate deploy` (no `-pooler`) |

### AI Providers (free tier)

| Variable | Scope | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY_MOCK_TOCKEN` | Production | Free-tier default OpenAI key (preferred over plain key when both set) |
| `OPENAI_API_KEY` | Production | Paid/premium fallback OpenAI key |
| `GEMINI_API_KEY` | Production | Gemini |
| `GROQ_API_KEY` | Production | Groq |
| `NVIDIA_NIM_API_KEY` | Production | NVIDIA NIM |
| `OPEN_ROUTER_API_KEY` | Production | OpenRouter |

### AI Providers (premium, subscription-gated)

| Variable | Scope | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Production | Anthropic |
| `PERPLEXITY_API_KEY` | Production | Perplexity |

Optional per-provider model overrides (e.g. `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `GEMINI_MODEL`, `PERPLEXITY_MODEL`, `GROQ_MODEL`, `NVIDIA_MODEL`, `OPENROUTER_MODEL`, `DEEPSEEK_MODEL`) and the `USE_MOCK_PROVIDERS="true"` switch exist, but the latter is for tests only and must not be set in production.

### Cache (Upstash Redis) — recommended

| Variable | Scope | Notes |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Production | Until set, scans degrade to Postgres-only writes (open question in tracker) |
| `UPSTASH_REDIS_REST_TOKEN` | Production | |

### Trigger.dev

| Variable | Scope | Notes |
| --- | --- | --- |
| `TRIGGER_SECRET_KEY` | Production | Worker/client key for Trigger.dev project `proj_wcqhshlgjgctdeuuitnc`; keep in sync with the deployed worker |

### Stripe

| Variable | Scope | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Production | **Live-mode** key in production (test-mode locally) |
| `STRIPE_WEBHOOK_SECRET` | Production | Signing secret for the deployed `/api/webhooks/stripe` endpoint |
| `STRIPE_PRICE_ID` | Production | Live-mode monthly Price |
| `APP_URL` | Production | Canonical origin for Checkout/Portal return URLs |
| `NEXT_PUBLIC_APP_URL` | Production | Client-visible canonical origin |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | Publishable key |

### PostHog

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Production + Preview | Key name read by `lib/analytics/posthog.ts` and `instrumentation-client.ts` |
| `NEXT_PUBLIC_POSTHOG_HOST` | Production + Preview | e.g. `https://us.i.posthog.com` |

Note: `lib/analytics/posthog-client.tsx` reads `NEXT_PUBLIC_POSTHOG_KEY` and early-returns if absent. When adding that key, prefer the canonical `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` used by the rest of the code.

### Sentry

| Variable | Scope | Notes |
| --- | --- | --- |
| `SENTRY_DSN` | Production + Preview | DSN for server/edge/client configs |
| `SENTRY_AUTH_TOKEN` | Production | Required at **build time** for source-map upload |
| `SENTRY_ORG` | Production | `answeros` (also hardcoded in `next.config.ts`) |
| `SENTRY_PROJECT` | Production | `javascript-nextjs` (also hardcoded in `next.config.ts`) |

Sentry environment comes from `VERCEL_ENV` automatically (10% traces in `production`).

---

## 7. Database Migrations at Deploy

Schema changes are applied to the production Neon branch with `prisma migrate deploy`:

```bash
npx prisma migrate deploy
```

- Same command CI already runs in `.github/workflows/ci.yml`.
- Runs against production `DATABASE_URL` / `DIRECT_URL` (spec `05-prisma.md`).
- Never run `npx prisma migrate dev` against production.
- After a schema change, confirm the rebuilt client in the Vercel build includes the new models.

---

## 8. Deploy Order

Execute in this order on a first production deploy or a coordinated change:

1. **Infra first:** provision the Neon production branch; create the Clerk production instance; set up Stripe live mode (Product, Price, webhook endpoint registered for `/api/webhooks/stripe`); provision Upstash; confirm the Trigger.dev project.
2. **Set env vars** in Vercel (Production + Preview) per section 6.
3. **Deploy the Trigger.dev worker:** `npx trigger.dev@latest deploy` (after verifying `TRIGGER_SECRET_KEY`) so `scan-company` runs the approved code.
4. **Apply migrations:** `npx prisma migrate deploy` to the production database.
5. **Deploy the app:** merge to the default branch (auto-deploy) or `vercel --prod`.
6. **Verify:** run the section 9 checklist.

---

## 9. Validation

Run to confirm the build is sound before merging:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm test
```

Post-deploy production smoke checks:

1. Root `/` marketing page renders; `/sign-in` and `/sign-up` authenticate against the production Clerk instance.
2. Onboarding writes a company to production Postgres (`GET /api/domain` returns the row).
3. `POST /api/scans` returns `202` and the `scan-company` task completes on Trigger.dev (`lib/jobs/scan.ts` Sentry capture path).
4. Dashboard shows a visibility score after a completed scan.
5. Stripe Checkout opens with the live `STRIPE_PRICE_ID`; `POST /api/webhooks/stripe` returns `200` for a live secret-signed event; subscription status persists.
6. Sentry shows `production`-environment events (or is confirmed intentionally disabled); PostHog captures `SCAN_INITIATED` / `SCAN_COMPLETED` (or confirmed disabled).
7. No AI provider key was left as a dev/mock value that silently fails in production.

---

## 10. Rollback & Troubleshooting

- **Failed build:** usually a missing/typo'd build env var (e.g. `SENTRY_AUTH_TOKEN` for source-map upload, or `DATABASE_URL` absent for `prisma generate`). Add the var and redeploy.
- **`/api/scans` errors on dispatch:** usually a stale `TRIGGER_SECRET_KEY` or a worker/Vercel contract mismatch — redeploy the worker and match the key in Vercel.
- **Scans fail but dashboard renders:** inspect `scan-company` logs in the Trigger.dev dashboard; failures route through `captureJobError`.
- **Webhook `400`s:** the `STRIPE_WEBHOOK_SECRET` for the deployed origin is wrong (local vs prod secret mismatch).
- **Rollback:** instant Vercel rollback to a prior deployment; redeploy the previous worker version and re-check the contract.

---

## 11. Out of Scope

Do not implement:

- Weekly email reports (Resend) and scheduled scans (separate feature spec; would add a `vercel.json` `crons` block or a Trigger.dev scheduled task)
- Vercel Analytics (page views / performance) — called out as optional in `21-posthog-sentry-analytics-monitoring.md`
- `syncEnvVars` from Vercel → Trigger.dev
- Auto-provisioning of isolated Neon branches per Vercel preview deployment
- IaC (Terraform/Pulumi), zero-downtime multi-region routing, or load testing

---

## 12. Future

Reserved extensions:

- `vercel.json` `crons` block for the weekly-report scan
- Vercel Analytics and Web Analytics integration
- Neon branching automation for preview deployments (see `05-prisma.md`)
- `syncEnvVars` / secret centralization between Vercel and Trigger.dev
- Separate staging environment and Smoke/E2E tests

---

## 13. Definition of Done

- The app deploys to Vercel production with Build Command `npx prisma generate && next build` passing.
- All required env vars are set in Vercel Production (incl. `SENTRY_AUTH_TOKEN` for source maps); `VERCEL_ENV` correctly reports `production`.
- The Trigger.dev `scan-company` worker is deployed and its trigger/task contract matches the deployed app.
- `prisma migrate deploy` applied the schema to the production Neon branch.
- A real end-to-end flow works in production: sign in → onboard → run a scan (Trigger.dev completes it) → visibility score renders.
- Live Stripe Checkout + webhook persist a subscription; unpaid scan/prompt generation is server-side gated.
- PostHog and Sentry are live (or confirmed intentionally disabled) with correct `VERCEL_ENV`-derived environments.
- No secrets or mock/dev provider keys are committed; the `_MOCK_TOCKEN` free-tier keys are real production keys.
- `npm test`, `npm run lint`, and `npm run build` pass.
- `context/context/progress-tracker.md` records the completed deployment and any remaining provider/model questions.