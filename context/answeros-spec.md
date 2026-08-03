# AnswerOS — Product Specification

> **Last updated:** August 2, 2026
> **Status:** Pre-MVP — specification complete, implementation not started

---

## Overview

AnswerOS is the operating system for helping businesses get discovered across AI search engines. Current SEO asks "How do I rank #1 on Google?" — AnswerOS asks "How do I become the answer ChatGPT gives?"

The MVP answers one narrow, immediately understandable question:

> *"Know exactly how AI models talk about your company — and what to do to improve it."*

A B2B SaaS company enters their domain, and AnswerOS automatically scans hundreds of prompts across ChatGPT, Claude, Gemini, and Perplexity to show their visibility: whether they're mentioned, at what position, with what sentiment, and how they compare to competitors. From there, AnswerOS provides a weighted visibility score and actionable recommendations — not just reporting what's wrong, but telling users exactly what to fix.

### Target Customer (MVP)

**B2B SaaS companies.** These are companies that care deeply about whether AI search engines recommend their product for queries like "best CRM" or "best email marketing software." They understand the value proposition immediately.

### Team & Model

- **Solo founder** — one person building, shipping, and iterating
- **Fully proprietary / closed source** — private repo, commercial SaaS
- **Single flat monthly subscription** — one plan for the MVP, no usage-based billing yet

---

## Goals

1. A SaaS company signs up, enters their domain, and within minutes sees a visibility score with AI mention data, competitor comparisons, and actionable recommendations
2. The system reliably scans 100+ prompts across 4 AI providers (OpenAI, Anthropic, Gemini, Perplexity) using async background jobs
3. Users receive automated weekly email reports summarizing visibility changes and new recommendations
4. The product is deployed to production on Vercel with auth, payments, and monitoring fully operational
5. Every recommendation is specific and actionable — not just "improve your visibility" but "generate a comparison page" or "add FAQ schema"

---

## Core User Flow

1. **Landing page** — User visits the marketing site at `/`, sees the value proposition, clicks "Get Started"
2. **Sign up** — User authenticates via Clerk (email/password or Google SSO)
3. **Stripe checkout** — User subscribes to the single monthly plan via Stripe checkout
4. **Onboarding** — User enters their company domain (e.g., `openai.com`). System validates the domain
5. **Competitor entry** — User optionally enters 2-5 competitor domains (e.g., `shopify.com`, `squarespace.com`). System auto-discovers additional competitors from AI responses
6. **Prompt library** — System generates an initial set of prompts based on industry templates + AI suggestions tailored to the user's domain
7. **First scan** — Background job (Trigger.dev) queues the scan. System runs each prompt through 4 AI providers, captures mentions, rank, sentiment, and competitor presence
8. **Dashboard** — User sees their visibility score, mention count, competitor comparison chart, top/missing prompts, and prioritized recommendations
9. **Weekly report** — Every Monday, Trigger.dev re-runs the scan and Resend emails a summary: score change, new mentions, top recommendations
10. **Ongoing** — User returns to the dashboard to track trends, run on-demand scans, and act on new recommendations

---

## Features

### Phase 1 — MVP (Weeks 1-8)

#### Authentication & Billing
- Email/password and Google SSO via Clerk
- Stripe subscription checkout (single monthly plan)
- Authenticated session management

#### Company Onboarding
- Domain entry with validation
- Competitor domain entry (manual, 2-5 seed competitors)
- Auto-discovery of additional competitors from AI scan results
- Prompt library generation (industry templates + AI suggestions based on domain)

#### Visibility Scanner
- Curated prompt library: ~100 hand-seeded prompts organized by industry/category
- AI-generated prompt suggestions tailored to the user's domain
- Scan execution across 4 providers: OpenAI, Anthropic/Claude, Google Gemini, Perplexity
- All scans run asynchronously via Trigger.dev background jobs
- Results cached in Upstash Redis with configurable TTL (MVP default: 24 hours; post-MVP: per-plan configurable)

#### Visibility Score
- Weighted multi-factor algorithm factoring:
  - Mention presence (is the company mentioned at all?)
  - Rank position (where does the mention appear?)
  - Sentiment (positive/neutral/negative)
  - Competitor share (how often competitors are mentioned instead)
  - Source/authority weighting (Wikipedia > Reddit > niche blog)
  - Citation count

#### Competitor Comparison
- Side-by-side competitor visibility scores
- Mention overlap analysis
- Trend indicators (↑ improving, ↓ declining)
- Click-through to see WHY a competitor ranks higher

#### Recommendations Engine
- Auto-generated, prioritized recommendations based on scan gaps:
  - Missing comparison pages
  - Weak FAQ presence
  - No documentation pages
  - Missing pricing page visibility
  - No structured data / schema
  - Weak or missing Reddit/community presence
  - Competitor has significantly more backlinks
- Each recommendation includes estimated impact score (+X%)

#### Dashboard
- Visibility Score card (large, prominent)
- Mentions overview (total mentions vs scanned prompts)
- Competitor rank comparison chart
- Top performing prompts
- Missing prompts (where competitors appear but you don't)
- Historical trend graph
- Recommendations list (prioritized, with estimated impact)

#### Weekly Email Reports
- Automated: Trigger.dev runs full re-scan every Monday morning
- On-demand: User can trigger a "generate report now" from dashboard
- Email via Resend containing:
  - Current visibility score (+ change from last week)
  - New mentions gained/lost
  - Top 3 recommendations
  - Competitor movement
  - Link to full dashboard

### Phase 2 — Post-MVP (Weeks 9-18)

- Content generation (FAQ pages, blog posts, landing pages, comparison pages, documentation, schema, meta tags)
- Competitor intelligence (deeper tracking: wins, losses, trends over time)
- Prompt library expansion and user-custom prompts

### Phase 3+ — Future

- Google Search Console integration
- Google Analytics integration
- Reddit and YouTube monitoring
- AI Search Console (market-wide prompt tracking)
- Agency workspaces (multi-client management, white-label)
- Public API
- AI marketing agent (autonomous content generation and publishing)
- Local business visibility tracking

---

## Scope

### In Scope (MVP)

- User authentication (email/password + Google SSO via Clerk)
- Company/domain onboarding with validation
- Competitor entry + auto-discovery
- Prompt library (100+ curated prompts + AI-generated suggestions)
- AI prompt scanning across 4 providers (OpenAI, Anthropic, Gemini, Perplexity)
- Async scanning via Trigger.dev
- Redis-cached results via Upstash
- Weighted multi-factor visibility score
- Competitor comparison and analysis
- Actionable recommendation engine
- Dashboard with cards, charts, and history
- Automated weekly email reports (Monday) + on-demand reports via Resend
- Stripe subscriptions (single flat monthly plan)
- PostHog analytics
- Sentry error monitoring
- Deployed to Vercel

### Out of Scope (MVP)

- Content generation (FAQ, blog posts, landing pages, comparison pages, documentation, schema, meta descriptions)
- Reddit/YouTube monitoring or integration
- Google Search Console integration
- Google Analytics integration
- Agency/white-label features (multi-client dashboards)
- AI Search Console (market-wide prompt tracking for unknown domains)
- Public API for third-party developers
- Team/organization accounts
- RBAC / role-based access control
- Usage-based billing
- SSO beyond Google (no GitHub, Microsoft, SAML in MVP)
- Local business-specific features (restaurants, dentists, lawyers)

---

## Success Criteria

1. A signed-up user can enter their domain, run a scan, and see a visibility score with AI mention data within 5 minutes
2. Scans complete across 100+ prompts and 4 AI providers within a reasonable async timeframe (under 10 minutes end-to-end)
3. The visibility score algorithm produces intuitive, directionally correct results (validated against manual checks)
4. Weekly email reports are delivered reliably every Monday without manual intervention
5. `npm run build` passes with no errors
6. Core logic (scoring algorithm, prompt parsing, DB helpers) has unit test coverage
7. The application is deployed to production on Vercel with all integrations live (Clerk, Stripe, Neon, Trigger.dev, Upstash, Resend, PostHog, Sentry)

---

## Tech Stack

| Layer              | Technology                  | Role                                                  |
| ------------------ | --------------------------- | ----------------------------------------------------- |
| Framework          | Next.js 15 (App Router)    | Full-stack: SSR, API routes, server components        |
| Language           | TypeScript (strict mode)    | Type safety across the entire codebase                |
| Styling            | Tailwind CSS v4 + shadcn/ui | Utility-first CSS, pre-built accessible components    |
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

---

## Architecture

### System Boundaries

- `app/` — Next.js App Router: pages, layouts, API route handlers
- `components/` — React components, organized by feature domain
- `lib/` — Business logic, utilities, shared helpers
- `lib/providers/` — AI provider abstraction layer (`interface AIProvider { ask(prompt) }`)
- `lib/db/` — Prisma client, database queries, seed scripts
- `lib/email/` — Resend email templates and sending logic
- `lib/jobs/` — Trigger.dev job definitions (scanning, reporting)
- `lib/scoring/` — Visibility score calculation algorithm
- `types/` — Shared TypeScript types and interfaces

### Storage Model

- **PostgreSQL (Neon):** All relational data — companies, scans, prompts, results, competitors, recommendations, user accounts, subscriptions
- **Upstash Redis:** Cached scan results, rate limit counters, temporary job state
- **No file/blob storage in MVP** — no user-uploaded assets or generated content files

### Auth and Access Model

- Every user signs in via Clerk (email/password or Google SSO)
- Each user has one company (1:1 relationship in MVP)
- Company resources (scans, results, recommendations) are owned by the user
- No shared access, teams, or organizations in MVP

### Invariants

1. Route handlers and server components do not run long-lived work — all AI scanning is delegated to Trigger.dev background jobs
2. AI provider calls always go through the abstraction layer (`lib/providers/`) — no direct API calls from route handlers
3. Scan results are always cached in Redis before being persisted to PostgreSQL
4. The visibility score is always computed server-side — never in the client
5. Stripe webhooks are the source of truth for subscription status — never the client

---

## Database Schema

### Core Tables

```prisma
model User {
  id        String    @id @default(cuid())
  clerkId   String    @unique
  email     String    @unique
  name      String?
  company   Company?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Company {
  id          String        @id @default(cuid())
  userId      String        @unique
  user        User          @relation(fields: [userId], references: [id])
  name        String
  domain      String        @unique
  industry    String?
  competitors Competitor[]
  scans       Scan[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Scan {
  id          String    @id @default(cuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  status      ScanStatus @default(PENDING)
  startedAt   DateTime?
  completedAt DateTime?
  results     ScanResult[]
  createdAt   DateTime  @default(now())
}

enum ScanStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model ScanResult {
  id         String    @id @default(cuid())
  scanId     String
  scan       Scan      @relation(fields: [scanId], references: [id])
  promptId   String
  prompt     Prompt    @relation(fields: [promptId], references: [id])
  provider   AIProvider
  mentioned  Boolean
  position   Int?      // 1-based rank position when mentioned
  sentiment  Sentiment?
  reasoning  String?   // AI's explanation
  rawResponse String?  // Raw AI response for debugging
  competitorsMentioned Json? // [{name, position, sentiment}]
  createdAt  DateTime  @default(now())
}

enum AIProvider {
  OPENAI
  ANTHROPIC
  GEMINI
  PERPLEXITY
}

enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}

model Prompt {
  id          String       @id @default(cuid())
  text        String
  category    String       // e.g., "CRM", "Email Marketing", "Project Management"
  searchVolume Int?        // Estimated monthly search/AI query volume
  results     ScanResult[]
  createdAt   DateTime     @default(now())
}

model Competitor {
  id          String    @id @default(cuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  name        String
  domain      String
  isAutoDiscovered Boolean @default(false)
  createdAt   DateTime  @default(now())
}

model Recommendation {
  id          String    @id @default(cuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  title       String
  description String
  priority    Int       // 1 = highest
  estimatedImpact Int?  // +X% visibility score improvement
  category    String    // e.g., "faq", "comparison", "schema", "documentation"
  completed   Boolean   @default(false)
  createdAt   DateTime  @default(now())
}
```

---

## File Organization

```
answer-os/
├── app/
│   ├── layout.tsx                    # Root layout (ClerkProvider, fonts, metadata)
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Tailwind imports + CSS custom properties
│   ├── (auth)/
│   │   ├── sign-in/                  # Clerk sign-in page
│   │   └── sign-up/                  # Clerk sign-up page
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard layout (nav, sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── scans/
│   │   │   └── page.tsx              # Scan history & details
│   │   ├── competitors/
│   │   │   └── page.tsx              # Competitor management & comparison
│   │   ├── recommendations/
│   │   │   └── page.tsx              # Recommendations list
│   │   └── settings/
│   │       └── page.tsx              # Account & company settings
│   └── api/
│       ├── webhooks/
│       │   ├── clerk/route.ts        # Clerk webhook handler
│       │   └── stripe/route.ts       # Stripe webhook handler
│       ├── scans/
│       │   └── route.ts              # Scan CRUD API
│       └── reports/
│           └── route.ts              # On-demand report generation
├── components/
│   ├── ui/                           # shadcn/ui generated components
│   ├── landing/                      # Landing page components
│   ├── dashboard/                    # Dashboard-specific components
│   │   ├── visibility-score.tsx
│   │   ├── mentions-chart.tsx
│   │   ├── competitor-comparison.tsx
│   │   ├── recommendations-list.tsx
│   │   └── trend-graph.tsx
│   ├── onboarding/                   # Domain entry, competitor setup
│   └── shared/                       # Shared components (loading, empty states, etc.)
├── lib/
│   ├── db/
│   │   └── prisma.ts                 # Prisma client singleton
│   ├── providers/
│   │   ├── types.ts                  # AIProvider interface
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── gemini.ts
│   │   └── perplexity.ts
│   ├── scoring/
│   │   ├── calculator.ts             # Visibility score algorithm
│   │   └── weights.ts                # Score weight constants
│   ├── prompts/
│   │   ├── library.ts                # Curated prompt library
│   │   └── generator.ts             # AI prompt suggestion generator
│   ├── email/
│   │   └── reports.ts                # Weekly report email templates
│   ├── jobs/
│   │   ├── scan.ts                   # Trigger.dev scan job
│   │   └── report.ts                 # Trigger.dev weekly report job
│   └── utils/
│       ├── domain.ts                 # Domain validation
│       └── cache.ts                  # Redis cache helpers
├── types/
│   └── index.ts                      # Shared TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       # Seed prompts library
└── context/                          # Project documentation
    ├── answeros-spec.md              # This file
    ├── project-overview.md
    ├── architecture.md
    ├── code-standards.md
    ├── ui-context.md
    ├── progress-tracker.md
    └── ai-workflow-rules.md
```

---

## AI Provider Abstraction

```typescript
// lib/providers/types.ts
export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'perplexity';

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
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

Each provider implements this interface. Route handlers and jobs call through the abstraction — never directly to provider SDKs. This enables:
- Swapping models without changing business logic
- Adding new providers without touching scan code
- Centralized cost tracking and rate limiting

---

## Visibility Score Algorithm

The weighted multi-factor score ranges from 0–100. Initial weight distribution:

| Factor              | Weight | Description                                           |
| ------------------- | ------ | ----------------------------------------------------- |
| Mention rate        | 30%    | % of scanned prompts where company is mentioned        |
| Average rank        | 25%    | Weighted by position (position 1 > position 3 > N/A)  |
| Sentiment           | 20%    | Positive > neutral > negative                          |
| Competitor share    | 15%    | Your mention rate relative to competitor average       |
| Source authority    | 10%    | Weighting from high-authority mentions (Wikipedia, G2, Forbes, etc.) |

Score calculation is server-side only (`lib/scoring/calculator.ts`). Weights are defined as constants in `lib/scoring/weights.ts` for easy tuning.

---

## Deployment Pipeline

```
GitHub PR
  → GitHub Actions
    → TypeScript type check (tsc --noEmit)
    → ESLint
    → Unit tests (vitest)
    → Build (next build)
    → Deploy to Vercel (preview for PRs, production for main)
    → Prisma migration (auto-applied on production deploy)
```

Environments:
- **Development:** `localhost:3000` with local Neon branch
- **Preview:** Automatic per-PR on Vercel, isolated Neon branch
- **Production:** `answeros.com` on Vercel, Neon production branch

Secrets managed via Vercel environment variables.

---

## Pricing

**MVP:** Single flat monthly subscription via Stripe.

- One plan with full feature access
- Stripe Checkout for signup
- Stripe Customer Portal for cancellation
- No usage-based billing, no tiered plans, no freemium

Post-MVP: Evaluate introducing tiered plans and/or usage-based pricing based on scan volume.

---

## Testing Strategy

**MVP:** Core logic tested only. No UI or E2E tests.

- Unit tests for the visibility score algorithm
- Unit tests for prompt parsing helpers
- Unit tests for database query helpers
- `npm run build` must pass

Framework: Vitest (fast, native ESM, good Next.js compatibility).

---

## Monitoring & Analytics

- **Sentry:** All API route errors, background job failures, and unhandled exceptions
- **PostHog:** Track signups, scan initiations, scan completions, dashboard visits, feature usage, upgrades, retention
- **Vercel Analytics:** Page views, performance metrics

---

## Open Questions

- Exact pricing amount for the single monthly plan
- Specific curated prompt list (100 prompts) — to be finalized during implementation
- Exact domain validation rules (subdomain handling, www prefix normalization)
- Whether to support non-English prompts and scans in MVP
- Logo and brand identity (colors, fonts beyond Geist)
- PostHog vs alternative analytics (will revisit after initial setup)

---

## Decisions Log

| Date       | Decision                                                                 | Rationale                                                  |
| ---------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 2026-08-02 | Product name: AnswerOS                                                   | Short, brandable, matches repo name                        |
| 2026-08-02 | Target: B2B SaaS companies for MVP                                       | Immediately understand the value prop                      |
| 2026-08-02 | Single flat monthly pricing for MVP                                      | Reduce complexity; validate willingness-to-pay first       |
| 2026-08-02 | 4 AI providers from day one (OpenAI, Anthropic, Gemini, Perplexity)    | Comprehensive coverage is the core differentiator          |
| 2026-08-02 | Prompt library: templates + AI suggestions (hybrid)                     | Balance curation quality with personalization              |
| 2026-08-02 | Competitor discovery: hybrid (manual entry + auto-discover)             | User control + system intelligence                         |
| 2026-08-02 | Neon for PostgreSQL                                                     | Serverless-friendly, branching for preview environments    |
| 2026-08-02 | Core logic unit tested only in MVP                                       | Move fast; add integration/E2E tests post-launch           |
| 2026-08-02 | Email + Google SSO via Clerk                                             | Covers 95%+ of SaaS user auth needs                        |
| 2026-08-02 | Cache TTL: 24 hours default, configurable per-plan post-MVP             | Fresh data at acceptable cost for MVP                      |
| 2026-08-02 | Simple landing page + dashboard                                          | Marketing presence without full marketing stack overhead   |
