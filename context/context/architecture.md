# Architecture Context

## Stack

| Layer              | Technology                  | Role                                                  |
| ------------------ | --------------------------- | ----------------------------------------------------- |
| Framework          | Next.js 15 (App Router)    | Full-stack: SSR, API routes, server components        |
| Language           | TypeScript (strict mode)    | Type safety across the entire codebase                |
| UI                 | Tailwind CSS v4 + shadcn/ui | Utility-first CSS, pre-built accessible components    |
| Icons              | Lucide React                | Stroke-based icon library                             |
| Animation          | Framer Motion               | Micro-interactions, page transitions, chart animations|
| Auth               | Clerk (email + Google SSO)  | User authentication, session management               |
| Database           | Prisma + PostgreSQL (Neon)  | ORM + serverless Postgres with branching              |
| Background Jobs    | Trigger.dev                 | Async prompt scanning, report generation              |
| Cache              | Upstash Redis               | Scan result caching, rate limit counters              |
| AI Providers       | OpenAI, Anthropic, Gemini, Perplexity | LLM APIs for prompt scanning               |
| Payments           | Stripe                      | Subscription checkout, billing portal                 |
| Email              | Resend                      | Transactional emails, weekly reports                  |
| Analytics          | PostHog                     | Product analytics, signup tracking, feature usage     |
| Monitoring         | Sentry                      | Error tracking, performance monitoring                |
| Hosting            | Vercel                      | Deployment, preview environments, serverless functions|

## System Boundaries

- `app/` — Next.js App Router: pages, layouts, API route handlers
- `components/` — React components, organized by feature domain (landing, dashboard, onboarding, shared)
- `lib/` — Business logic, utilities, shared helpers
- `lib/providers/` — AI provider abstraction layer (`AIProvider` interface with `.ask(prompt)` method)
- `lib/db/` — Prisma client singleton, database query helpers, seed scripts
- `lib/email/` — Resend email templates and sending logic for weekly reports
- `lib/jobs/` — Trigger.dev job definitions (scan execution, weekly report generation)
- `lib/scoring/` — Visibility score calculation algorithm and weight constants
- `lib/prompts/` — Curated prompt library and AI-driven prompt suggestion generator
- `types/` — Shared TypeScript types and interfaces

## Storage Model

- **PostgreSQL (Neon):** All relational data — users, companies, scans, scan results, prompts, competitors, recommendations, subscriptions. This is the source of truth for all persistent data.
- **Upstash Redis:** Ephemeral cache layer — scan result caching (24h default TTL), rate limit counters, temporary job state. Nothing in Redis is irreplaceable; all data can be reconstructed from PostgreSQL or re-scanned.

## Auth and Access Model

- Every user signs in via Clerk (email/password or Google SSO)
- Each user has exactly one company (1:1 relationship in MVP)
- Company resources (scans, results, recommendations) are owned by the user
- No shared access, teams, organizations, or RBAC in MVP
- Stripe webhooks are the source of truth for subscription status — never the client

## Invariants

1. Route handlers and server components do not run long-lived work — all AI scanning is delegated to Trigger.dev background jobs
2. AI provider calls always go through the abstraction layer (`lib/providers/`) — no direct API calls from route handlers or components
3. Scan results are always cached in Redis before being persisted to PostgreSQL — cache-first read path
4. The visibility score is always computed server-side — never calculated or exposed as client-side logic
5. Stripe webhooks are the sole authority for subscription status — the database row is updated only by the webhook handler
6. Domain validation is enforced at the API boundary before any scan is queued
7. Each scan is idempotent — re-running a scan overwrites previous results for the same company+prompt+provider combination
