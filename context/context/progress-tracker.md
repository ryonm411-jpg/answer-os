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

## In Progress

- None yet.

## Next Up

1. Install and configure Clerk for authentication
2. Set up Prisma with Neon PostgreSQL
3. Create the database schema from `answeros-spec.md`
4. Implement domain onboarding flow
5. Build the AI provider abstraction layer
6. Implement the prompt library (curated + AI suggestions)
7. Set up Trigger.dev background jobs for scanning
8. Build the visibility scanner pipeline
9. Implement the visibility score algorithm
10. Build the dashboard UI
11. Set up Stripe subscriptions
12. Implement weekly email reports via Resend
13. Add PostHog analytics and Sentry monitoring
14. Deploy to Vercel production

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

## Session Notes

- Specification interview completed across 4 rounds — all key decisions captured in `answeros-spec.md`
- Context files filled with project details — ready to begin Phase 1 implementation
- Design System & UI Foundation (`01-design-system.md`) completed: initialized shadcn/ui, installed 16 UI components, created `cn()` helper, configured CSS tokens, and verified clean build.
