# Feature Spec 25 — Landing Page (Marketing)

> **Status:** Proposed next implementation unit
> **Created:** September 2, 2026
> **Depends on:** `01-design-system.md`, `03-auth.md`, `08-domain-onboarding.md`, `13-visibility-score.md`, `14-dashboard-ui.md`, `21-posthog-sentry-analytics-monitoring.md`, `24-deploy-vercel.md`

---

## 1. Goal

Replace the current `/` redirect stub with a marketing landing page that sells AnswerOS and explains **how the website works and how to use it** — value proposition, the product flow, the visibility score, and the path from sign-up to first scan to acting on recommendations. This is the first step of the core user flow in `context/project-overview.md`: *"User visits the marketing site at `/`, sees the value proposition, clicks 'Get Started'."*

The page targets B2B SaaS companies and must make the AEO value prop legible in seconds:

> Current SEO asks "How do I rank #1 on Google?" — AnswerOS asks "How do I become the answer ChatGPT gives?"

The landing page is **static marketing content with clear CTAs**. It does not render live product data, dashboards, or any company state.

```
app/page.tsx                                  [server component]
  ├── components/landing/landing-navbar.tsx   [brand + Sign in / Get Started]
  ├── components/landing/landing-hero.tsx     [value prop, primary CTA]
  ├── components/landing/how-it-works.tsx     [6-step product walkthrough]
  ├── components/landing/score-explainer.tsx  [visibility score + factors]
  ├── components/landing/feature-grid.tsx     [7 providers, branded/organic, etc.]
  ├── components/landing/who-its-for.tsx      [B2B SaaS positioning]
  ├── components/landing/pricing-teaser.tsx   [single monthly plan]
  ├── components/landing/faq.tsx              [how-to-oriented Q&A]
  └── components/landing/landing-footer.tsx
```

Do **not** implement:

- the product itself (scans, scoring, recommendations) — all of it already exists behind `/editor`
- sign-up / onboarding / billing flows — these exist and are linked, not rebuilt
- blog, docs site, changelog, or a full marketing stack
- content generation or competitor landing pages
- a `vercel.json` `crons` block or any background jobs

---

## 2. Mandatory Context Reads

Before implementing this feature, read these files in order:

1. `CLAUDE.md` — **read first**; it `@`-imports `AGENTS.md` (including the Next.js-version warning — this repo's Next.js has breaking changes, and the relevant guide in `node_modules/next/dist/docs/` must be read before writing any code, especially for `metadata`/SEO exports).
2. `context/project-overview.md` — product definition, core user flow (the landing page is step 1), scope, and success criteria.
3. `context/architecture.md` — system boundaries and invariants (landing page must not violate server-first or auth boundaries).
4. `context/ui-context.md` — dark theme tokens, landing page layout patterns, typography, responsive behavior.
5. `context/code-standards.md` — `components/landing/` convention, server components by default, SEO metadata exports, no hardcoded hex values.
6. `context/ai-workflow-rules.md` — scope discipline, protected files, doc-sync rules.
7. `context/progress-tracker.md` — current phase and the queue position of this unit.
8. `context/features-specs/03-auth.md` — Clerk URLs (`/sign-in`, `/sign-up`, `afterSignUpUrl=/onboarding`) that the CTAs must link to.
9. `context/features-specs/13-visibility-score.md` — the honest 95 MVP ceiling and factor weights used in the score explainer.
10. `context/features-specs/14-dashboard-ui.md` — what users actually see after signing in, so landing copy matches reality.
11. `context/features-specs/21-posthog-sentry-analytics-monitoring.md` — analytics conventions if a landing event is added.

---

## 3. Current State

- `app/page.tsx` is a redirect stub: authenticated users go to `/editor`, everyone else is redirected to `/sign-in`. **There is no marketing page.**
- `components/landing/` is referenced in `code-standards.md` but does not exist.
- The dark design system (tokens, shadcn/ui primitives, Geist fonts) is fully in place and used by the auth pages and editor.
- Auth flows are complete: `/sign-in`, `/sign-up` (with `afterSignUpUrl="/onboarding"`), and Clerk `UserButton` patterns exist to reference.
- The product behind the CTAs is complete and demonstrable: onboarding, prompt library, Trigger.dev scans, visibility score (Overall/Branded/Organic), competitor leaderboard, top sources, recommendations, billing, free tier.
- PostHog is wired with 20 event constants in `lib/analytics/events.ts`; `autocapture: false`. No landing-page event exists yet.
- `lib/analytics/posthog-client.tsx` is a client provider used in the root layout — the landing page can fire events through it with zero new wiring.

Known gaps this feature fills:

- anonymous visitors currently bounce straight to `/sign-in` with no product explanation
- no public explanation of how the product works or how to use it
- no SEO-optimized root page (`metadata`, Open Graph)
- no acquisition funnel signal on the public site

---

## 4. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | `/` renders the marketing page for **anonymous** visitors; **signed-in** visitors still redirect to `/editor` | The marketing page is the acquisition surface; returning users must not see it. Keeps `auth()`-based redirect, just flips the anonymous branch from `/sign-in` to the landing page |
| 2 | All CTAs link to existing flows: primary **Get Started** → `/sign-up`, secondary **Sign in** → `/sign-in`; the navbar keeps a persistent **Sign in** link | No new auth code; `afterSignUpUrl="/onboarding"` already routes new users into domain onboarding, and the editor `UserButton` handles logged-in state |
| 3 | Landing page is a server component with static content; client interactivity limited to analytics events and native `<details>`/`<summary>` FAQ toggles | Fast SSR, no client state, no new dependencies; FAQ is pure HTML/CSS so no new shadcn primitive is needed |
| 4 | The **How it works** section is the centerpiece and mirrors the real core user flow: Sign up → Add domain → Review prompts → Run scan → Read visibility report → Act & track | The user asked for a page that explains how the website works / how to use it; the section must match the actual product steps 1:1 so copy never overpromises |
| 5 | The score explainer presents the five factors with their real weights (mention rate 30%, average rank 25%, sentiment 20%, competitor share 15%, source authority 10%) and the honest 95 MVP ceiling, exactly as the dashboard presents it | Copy and product must agree (spec 13 and 14 decisions); no fabricated charts or unsupported claims |
| 6 | Copy is honest about product state: free tier (Gemini, Groq, NVIDIA, OpenRouter) vs premium providers behind a paid plan, "estimated" pre-scan opportunity scores, and Branded vs Organic visibility | Consistent with specs 17, 18, and 22; trust-building copy converts better than hype |
| 7 | Add a `LANDING_VIEWED` event and a `LANDING_CTA_CLICKED` event (with a `cta` property) to `lib/analytics/events.ts`, fired client-side from the landing page; no PII, no `domain` property | Gives the acquisition funnel a start point using the already-wired PostHog provider; follows spec 21's no-PII rule |
| 8 | SEO via `metadata` export (title, description, Open Graph) on `app/page.tsx`, verified against the Next.js 16 docs in `node_modules/next/dist/docs/` before writing | `code-standards.md` requires metadata exports on `page.tsx`; this repo's Next.js version has breaking changes so the docs must be read first |
| 9 | Use only existing design tokens and installed shadcn primitives (Button, Card, Badge, Separator); no new UI, chart, or animation dependency | Matches the installed stack and `ui-context.md`; the score explainer uses styled CSS/SVG, not a charting library |
| 10 | No hardcoded hex values; every color comes from the CSS custom properties in `globals.css` | `code-standards.md` styling rule |

---

## 5. Content Architecture (Copy Outline)

The page is one scrolling page with anchor links in the navbar. Copy below is the source of truth for wording; implementers may tighten phrasing but must not change meaning or add unsupported claims.

### 5.1 Landing Navbar (`landing-navbar.tsx`)

- Brand mark: "AnswerOS" (existing wordmark styling from onboarding layout)
- Anchor links (desktop): How it works · Score · Features · Pricing · FAQ
- Right side: **Sign in** (secondary, ghost) · **Get Started** (primary) → `/sign-up`
- Mobile: collapse to brand + Get Started button (no hamburger in MVP)

### 5.2 Hero (`landing-hero.tsx`)

- Eyebrow: "AI Search Visibility for B2B SaaS"
- Headline (primary): "Become the answer AI search engines give."
- Subhead: "AnswerOS scans hundreds of buyer prompts across ChatGPT, Claude, Gemini, and more to show whether your brand is mentioned, at what position, and with what sentiment — then tells you exactly what to fix."
- Primary CTA: **Get Started — it's free** → `/sign-up`; secondary: **See how it works** → `#how-it-works`
- Trust line (muted): "No credit card required · Free tier included · Set up in minutes"
- Full-viewport, centered, single CTA per `ui-context.md` layout pattern

### 5.3 How it works (`how-it-works.tsx`) — *the core "how to use it" section*

Six numbered steps, each with an icon, title, and 1–2 sentence description. Each step maps to a real product surface:

1. **Create your account** — Sign up with email or Google via Clerk. The free tier is ready immediately; upgrade anytime from billing. *(→ `/sign-up`)*
2. **Add your company domain** — Tell AnswerOS which brand to track. Validation happens at the API boundary; one company per account in MVP. *(→ `/onboarding`)*
3. **Review your AI prompt set** — AnswerOS builds a curated library plus AI-suggested buyer questions ("best CRM for small business", "HubSpot vs Salesforce") with opportunity scores. Archive what's irrelevant; keep what matters. *(→ prompt workspace)*
4. **Run your first scan** — One click queues a background scan across your enabled AI providers (choose from 7 in the All Models tab). Scans run async so nothing blocks; you'll see live status. *(→ `POST /api/scans` + Trigger.dev)*
5. **Read your visibility report** — A weighted 0–100 score (Overall, Branded, and Organic), per-factor breakdown, competitor leaderboard, and top cited sources. *(→ dashboard)*
6. **Act on recommendations and track** — Prioritized, evidence-based fixes (comparison pages, FAQ schema, positioning). Mark them done, re-scan, and watch trends over time. *(→ recommendations list + trend card)*

Honest callout (small, muted): "The first scan typically takes minutes; the MVP score ceiling is 95 out of 100 until richer source data lands."

### 5.4 Score explainer (`score-explainer.tsx`)

- Headline: "A visibility score that's honest and actionable."
- One line: "Your score is computed server-side from real scan results — never estimated client-side."
- Five factors with real weights (from `13-visibility-score.md`):
  - Mention rate — 30%
  - Average rank — 25%
  - Sentiment — 20%
  - Competitor share — 15%
  - Source authority — 10% (labeled "Neutral MVP baseline" like the dashboard)
- Note the 95 ceiling in the same wording the dashboard uses.

### 5.5 Feature grid (`feature-grid.tsx`)

Six cards (Lucide icons, `h-5 w-5`), each 2–3 lines:

- **7 AI providers** — Gemini, Groq, NVIDIA NIM, and OpenRouter on the free tier; OpenAI and more unlock when subscribed. Choose per scan in the All Models tab.
- **Branded vs Organic visibility** — Separate scores for when your brand is named vs. when buyers ask generically. See the gap where competitors win.
- **Competitor leaderboard** — Rank, visibility %, sentiment, and average position for every brand the AI mentions.
- **Top cited sources** — Where AI answers come from: editorial, corporate, UGC. Find the sites that win citations.
- **Recommendations engine** — Prioritized, evidence-based fixes with clear actions, not vague advice.
- **Prompt workspace** — Review curated prompts and AI suggestions before scanning; archive what's off-target.

### 5.6 Who it's for (`who-its-for.tsx`)

- One short block: "For B2B SaaS teams whose buyers ask AI for recommendations — 'best email marketing software', 'top CRM for startups' — and want to be the answer." A small checklist of pains solved (missed mentions, unknown competitor position, no action plan).

### 5.7 Pricing teaser (`pricing-teaser.tsx`)

- Headline: "One plan. Everything included."
- Line: "A single flat monthly subscription after your free tier — no per-scan pricing, no usage anxiety. Manage or cancel from the billing portal anytime."
- CTA: **Get Started** → `/sign-up`
- Do **not** print a dollar amount (exact price is an open question in `progress-tracker.md`). This section stays a teaser linking to the live billing flow.

### 5.8 FAQ (`faq.tsx`)

Native `<details>`/`<summary>` accordion, how-to-oriented questions:

- What does AnswerOS actually scan? *(buyer prompts across AI providers — background jobs, cached 24h)*
- How long does a scan take? *(async, typically minutes; status shown in the dashboard)*
- What is the visibility score? *(weighted 0–100, server-computed, five factors, 95 MVP ceiling)*
- What's included in the free tier? *(free providers + a real scan; premium providers unlock with a subscription)*
- Do I need a credit card to try it? *(no)*
- How is my data handled? *(your domain and scan data; no PII in analytics)*

### 5.9 Footer (`landing-footer.tsx`)

- Brand + one-line tagline, anchor links, Sign in / Get Started, copyright. Dark surface background, `--border-default` top separator.

---

## 6. Component Plan

- New directory `components/landing/` with the components in section 1's diagram (one file per section, matching `code-standards.md` "one file owns one clear responsibility").
- `app/page.tsx` becomes a server component composing the sections and exporting `metadata` (title, description, Open Graph). Per AGENTS.md, read `node_modules/next/dist/docs/` for the correct Next.js 16 metadata conventions before writing.
- No new shadcn primitives expected; Button (primary/secondary variants) is the main interactive primitive. If the FAQ needs styling beyond native `<details>`, use Tailwind utilities on the element, not a new component.
- All colors from CSS custom properties; icons at `h-4`/`h-5`/`h-6` per `ui-context.md`.
- Responsive: stack sections vertically on mobile; hero centered full-viewport; feature grid 1-col mobile → 2-col tablet → 3-col desktop; navbar CTAs collapse to just Get Started on small screens.

---

## 7. Routing & Auth Behavior

| Visitor state | `/` behavior |
| --- | --- |
| Anonymous | Render the landing page |
| Signed in | `redirect("/editor")` (unchanged from current behavior) |

Implementation detail for `app/page.tsx`:

```ts
const { userId } = await auth();
if (userId) redirect("/editor");
// else: render <LandingPage /> composition
```

No changes to `proxy.ts`, auth pages, or onboarding. The `/sign-up` → `/onboarding` flow already exists (spec 03/08).

---

## 8. Analytics & SEO

- Add two constants to `lib/analytics/events.ts`:
  - `LANDING_VIEWED: "landing_viewed"` — fired client-side once per landing page view via the existing `lib/analytics/posthog-client.tsx` provider (module-level guard, mirroring the `PostHogIdentify` pattern from spec 21).
  - `LANDING_CTA_CLICKED: "landing_cta_clicked"` — fired on primary CTA clicks with a `cta` property (`get_started`, `sign_in`, `how_it_works`, `pricing`, `faq`).
- No PII and no `domain` property, per spec 21.
- `metadata` on `app/page.tsx`: `<title>` e.g. "AnswerOS — Become the answer AI search engines give", description summarizing the value prop, Open Graph image (can reuse brand mark; exact asset is an open question).
- `DASHBOARD_VIEWED` etc. remain server-side; the landing page only adds the two new client events.

---

## 9. Validation

- `npx tsc --noEmit`, `npm run lint`, `npm test` (no new tests expected — landing copy/components are presentational; if any pure helper like the anchor list is extracted, it may get a co-located Vitest test), and `npm run build` must pass.
- Manual: anonymous visit to `/` shows the landing page; each anchor scrolls to its section; Get Started lands on `/sign-up`; Sign in lands on `/sign-in`; a signed-in visit to `/` redirects to `/editor`; mobile layout stacks correctly at 375px.
- PostHog: `landing_viewed` fires on view, `landing_cta_clicked` fires with the right `cta` value (or confirm PostHog is intentionally disabled locally).

---

## 10. Out of Scope

Do not implement:

- Blog, changelog, docs site, or marketing automation
- Any new landing routes (`/features`, `/pricing`, `/faq` pages) — single scrolling page only
- Waitlist, email capture forms, or newsletter
- A/B testing, hero animations beyond CSS, or charting libraries
- Changes to onboarding, auth, billing, or the editor
- Weekly email reports / scheduled scans (separate unit — currently `Next Up #1`)

---

## 11. Future

- Standalone `/pricing` and `/faq` pages once pricing is finalized
- Blog/docs sections for SEO content
- OG image asset and social preview cards
- A/B testing the hero headline/CTA once PostHog funnels are live
- `vercel.json` `crons` block (belongs to the weekly-report unit, not this one)

---

## 12. Definition of Done

- `/` renders the marketing landing page for anonymous visitors; signed-in visitors redirect to `/editor`.
- The page explains how the website works and how to use it via the six-step How it works section that matches the real product flow 1:1.
- All copy is honest: real provider tiers, real score weights, 95 MVP ceiling, "estimated" where applicable, no dollar amount in the pricing teaser.
- All components live in `components/landing/`, use design tokens only, and require no new dependencies.
- CTAs route to the existing `/sign-up` and `/sign-in` flows; no new auth code.
- `metadata`/SEO export present and verified against the Next.js 16 docs.
- `LANDING_VIEWED` and `LANDING_CTA_CLICKED` events added per spec 21 conventions (no PII).
- `npx tsc --noEmit`, `npm run lint`, `npm run build` pass; manual smoke checks from section 9 pass.
- `context/context/progress-tracker.md` records the completed landing page.