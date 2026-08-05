# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- **Phase 1 — Core Infrastructure & UI Foundation**

## Current Goal

- Implement authentication flow (email/password + Google SSO via Clerk)
- Set up Prisma with Neon PostgreSQL
- Create the landing page and dashboard shell

## Completed

- Specification written (`context/answeros-spec.md`)
- Context files filled with project details
- Project initialized with Next.js, TypeScript, Tailwind CSS v4
- Installed and configured `shadcn/ui` with Tailwind CSS v4 and dark theme design tokens (`context/features-specs/01-design-system.md`)
- Installed 16 UI primitive components in `components/ui/`
- Installed `lucide-react`, `clsx`, and `tailwind-merge`
- Created reusable `cn()` helper utility in `lib/utils.ts`
- Configured global dark theme custom properties in `app/globals.css` and wrapped app with `TooltipProvider` in `app/layout.tsx`
- Implemented Editor Shell (`context/features-specs/02-editor.md`): Built `EditorNavbar`, `NavigationSidebar`, and `EditorLayout` with full accessibility, backdrop overlay, escape key shortcuts, smooth slide animations, and dark design system tokens.
- Implemented Authentication Flow (`context/features-specs/03-auth.md`): Integrated `@clerk/nextjs` and `@clerk/themes`, configured `ClerkProvider` with dark theme in `app/layout.tsx`, added route protection via Next.js 16 `proxy.ts`, built custom responsive `/sign-in` and `/sign-up` auth pages, protected `/editor` route group with `auth.protect()`, set up server-side redirect logic at `/`, and added `UserButton` to `EditorNavbar`.
- Implemented Dialog System (`context/features-specs/04-dialog.md`): Created `useDialogs` React Context & state hook in `hooks/use-dialogs.ts`, built `AddDomainDialog` (with domain normalization & regex validation), `EditDomainDialog` (with pre-filled input & auto-focus), `RemoveDomainDialog` (with destructive styling confirmation), `RunScanDialog` (with confirmation actions), `DialogContainer`, wrapped `EditorLayout` in `DialogProvider`, and wired triggers in `NavigationSidebar` and `EditorPage`.
- Implemented Prisma & Neon PostgreSQL Data Layer (`context/features-specs/05-prisma.md`): Configured `prisma/schema.prisma` with all 7 core models (`User`, `Company`, `Scan`, `ScanResult`, `Prompt`, `Competitor`, `Recommendation`) and 3 enums (`ScanStatus`, `AIProvider`, `Sentiment`), set up `prisma.config.ts` with `DATABASE_URL` (pooled) and `DIRECT_URL` (direct), built cached Prisma client singleton with `@prisma/adapter-neon` in `lib/db/prisma.ts`, generated initial SQL migration in `prisma/migrations/20260804000000_init/migration.sql`, and verified client generation with `npx prisma generate`.

## In Progress

- None yet.

## Next Up

1. Implement domain onboarding flow
2. Build the AI provider abstraction layer
3. Implement the prompt library (curated + AI suggestions)
4. Set up Trigger.dev background jobs for scanning
5. Build the visibility scanner pipeline
6. Implement the visibility score algorithm
7. Build the dashboard UI
8. Set up Stripe subscriptions
9. Implement weekly email reports via Resend
10. Add PostHog analytics and Sentry monitoring
11. Deploy to Vercel production

## Open Questions

- Exact pricing amount for the monthly subscription
- Specific curated prompt list (100 prompts) — to be finalized during implementation
- Exact domain validation rules (subdomain handling, www prefix normalization)
- Whether to support non-English prompts and scans in MVP
- Logo and brand identity (colors, fonts beyond Geist)
- PostHog vs alternative analytics (will revisit after initial setup)

## Architecture Decisions

| Date       | Decision                                                                | Rationale                                                  |
| ---------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| 2026-08-02 | Product name: AnswerOS                                                  | Short, brandable, matches repo name                        |
| 2026-08-02 | Target: B2B SaaS companies for MVP                                      | Immediately understand the value prop                      |
| 2026-08-02 | Single flat monthly pricing for MVP                                     | Reduce complexity; validate willingness-to-pay first       |
| 2026-08-02 | 4 AI providers from day one (OpenAI, Anthropic, Gemini, Perplexity)   | Comprehensive coverage is the core differentiator          |
| 2026-08-02 | Prompt library: templates + AI suggestions (hybrid)                    | Balance curation quality with personalization              |
| 2026-08-02 | Competitor discovery: hybrid (manual entry + auto-discover)            | User control + system intelligence                         |
| 2026-08-02 | Neon for PostgreSQL                                                    | Serverless-friendly, branching for preview environments    |
| 2026-08-02 | Core logic unit tested only in MVP                                      | Move fast; add integration/E2E tests post-launch           |
| 2026-08-02 | Email + Google SSO via Clerk                                            | Covers 95%+ of SaaS user auth needs                        |
| 2026-08-02 | Cache TTL: 24 hours default, configurable per-plan post-MVP            | Fresh data at acceptable cost for MVP                      |
| 2026-08-02 | Simple landing page + dashboard                                         | Marketing presence without full marketing stack overhead   |
| 2026-08-02 | Dark-first design tokens in `:root` and shadcn UI primitives            | Matches technical, data-dense workspace aesthetic in `ui-context.md` |
| 2026-08-03 | Next.js 16 `proxy.ts` for Clerk middleware                             | Follows Next.js 16 file convention for request proxying    |
| 2026-08-03 | Global `DialogProvider` Context for Dialog System                       | Allows any component in the editor tree to trigger dialogs |
| 2026-08-04 | Prisma v7 + Neon serverless driver adapter in `lib/db/prisma.ts`       | Enables serverless database connection pooling & WebSocket support |

## Session Notes

- Specification interview completed across 4 rounds — all key decisions captured in `answeros-spec.md`
- Context files filled with project details — ready to begin Phase 1 implementation
- Design System & UI Foundation (`01-design-system.md`) completed: initialized shadcn/ui, installed 16 UI components, created `cn()` helper, configured CSS tokens, and verified clean build.
- Completed Authentication implementation (`03-auth.md`): Clerk integration with dark theme, route protection via `proxy.ts`, `auth.protect()` on protected editor layout, sign-in/sign-up pages with desktop info panel, and navbar `UserButton`.
- Completed Dialog System implementation (`04-dialog.md`): Built `useDialogs` hook, 4 core dialog components (`AddDomainDialog`, `EditDomainDialog`, `RemoveDomainDialog`, `RunScanDialog`), `DialogContainer`, wrapped layout with `DialogProvider`, and verified build.
- Completed Prisma & Neon PostgreSQL Data Layer (`05-prisma.md`): Defined 7 core models, 3 enums, custom client output path (`generated/prisma`), `@prisma/adapter-neon` singleton in `lib/db/prisma.ts`, `DATABASE_URL`/`DIRECT_URL` configuration, and initial SQL migration.
