# AnswerOS

## Overview

AnswerOS is the operating system for helping businesses get discovered across AI search engines. Current SEO asks "How do I rank #1 on Google?" — AnswerOS asks "How do I become the answer ChatGPT gives?"

A B2B SaaS company enters their domain, and AnswerOS automatically scans hundreds of prompts across ChatGPT, Claude, Gemini, and Perplexity to show their visibility: whether they're mentioned, at what position, with what sentiment, and how they compare to competitors. AnswerOS provides a weighted visibility score and actionable recommendations — not just reporting what's wrong, but telling users exactly what to fix.

**Target:** B2B SaaS companies who care about whether AI recommends their product.
**Team:** Solo founder building a fully proprietary, closed-source SaaS.
**Pricing:** Single flat monthly subscription via Stripe for MVP.

## Goals

1. A SaaS company signs up, enters their domain, and within minutes sees a visibility score with AI mention data, competitor comparisons, and actionable recommendations
2. The system reliably scans 100+ prompts across 4 AI providers (OpenAI, Anthropic, Gemini, Perplexity) using async background jobs
3. Users receive automated weekly email reports summarizing visibility changes and new recommendations
4. The product is deployed to production on Vercel with auth, payments, and monitoring fully operational
5. Every recommendation is specific and actionable — not just "improve your visibility" but "generate a comparison page" or "add FAQ schema"

## Core User Flow

1. **Landing page** — User visits the marketing site at `/`, sees the value proposition, clicks "Get Started"
2. **Sign up** — User authenticates via Clerk (email/password or Google SSO)
3. **Stripe checkout** — User subscribes to the single monthly plan via Stripe checkout
4. **Onboarding** — User enters their company domain and optionally 2–5 competitor domains
5. **Prompt library** — System generates prompts based on industry templates + AI suggestions
6. **First scan** — Background job queues the scan across 4 AI providers, captures mentions, rank, sentiment, and competitor presence
7. **Dashboard** — User sees visibility score, mention count, competitor comparison chart, top/missing prompts, and prioritized recommendations
8. **Weekly report** — Every Monday, Trigger.dev re-runs the scan and Resend emails a summary
9. **Ongoing** — User returns to track trends, run on-demand scans, and act on recommendations

## Features

### Visibility Scanner

- Curated prompt library: ~100 hand-seeded prompts organized by industry/category
- AI-generated prompt suggestions tailored to user domain
- Scan execution across 4 providers: OpenAI, Anthropic, Gemini, Perplexity
- All scans run asynchronously via Trigger.dev background jobs
- Results cached in Upstash Redis (default 24h TTL, configurable per-plan post-MVP)

### Visibility Score

- Weighted multi-factor algorithm (0–100): mention rate (30%), average rank (25%), sentiment (20%), competitor share (15%), source authority (10%)
- Computed server-side only

### Competitor Comparison

- Side-by-side competitor visibility scores with mention overlap analysis
- Trend indicators (↑ improving, ↓ declining)
- Click-through to see why a competitor ranks higher

### Recommendations Engine

- Auto-generated, prioritized recommendations with estimated impact scores (+X%)
- Covers: missing comparison pages, weak FAQ, no docs, missing pricing, missing schema, weak community presence, backlink gaps

### Dashboard

- Visibility Score card, mentions overview, competitor rank comparison, top/missing prompts, historical trend graph, prioritized recommendations

### Weekly Email Reports

- Automated Monday scans via Trigger.dev + Resend delivery
- On-demand report generation from dashboard

## Scope

### In Scope (MVP)

- User auth (email + Google SSO via Clerk)
- Company/domain onboarding with validation
- Competitor entry + auto-discovery
- Prompt library (100+ curated + AI suggestions)
- AI prompt scanning across 4 providers
- Async scanning via Trigger.dev + Redis cache
- Weighted multi-factor visibility score
- Competitor comparison and analysis
- Actionable recommendation engine
- Dashboard with cards, charts, history
- Automated weekly + on-demand email reports via Resend
- Stripe subscriptions (single flat monthly plan)
- PostHog analytics + Sentry monitoring
- Deployed to Vercel

### Out of Scope (MVP)

- Content generation (FAQ, blog, landing pages, comparison pages, documentation, schema, meta descriptions)
- Reddit/YouTube monitoring
- Google Search Console / Google Analytics integration
- Agency/white-label features
- AI Search Console (market-wide prompt tracking)
- Public API
- Team/organization accounts, RBAC
- Usage-based billing
- SSO beyond Google
- Local business-specific features

## Success Criteria

1. A user can sign up, enter their domain, run a scan, and see a visibility score within 5 minutes
2. Scans complete across 100+ prompts and 4 providers in under 10 minutes end-to-end
3. Visibility score produces directionally correct, intuitive results
4. Weekly email reports delivered reliably every Monday without manual intervention
5. `npm run build` passes with no errors
6. Core logic (scoring, prompt parsing, DB helpers) has unit test coverage
7. Deployed to production on Vercel with all integrations live
