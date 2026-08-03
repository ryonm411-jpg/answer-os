# Code Standards

## General

- Keep modules small and single-purpose — one file should own one clear responsibility
- Fix root causes, do not layer workarounds — if a scan fails, fix the scan pipeline, don't add retry band-aids
- Do not mix unrelated concerns in one component or route — a dashboard component should not contain API logic
- Prefer server components by default; add `"use client"` only when browser interactivity requires it
- All AI provider calls go through `lib/providers/` abstraction layer — never import provider SDKs directly in routes or components

## TypeScript

- Strict mode is required throughout the project (enforced by `tsconfig.json`)
- Avoid `any` — use explicit interfaces, narrowly scoped types, or `unknown` when type is genuinely unknown
- Validate unknown external input at system boundaries before trusting it (API routes, webhooks, AI responses)
- Use `enum` for constrained value sets (`ScanStatus`, `AIProvider`, `Sentiment`) for type safety and readability
- Prefer `interface` over `type` for object shapes unless union types are needed

## Next.js

- Default to server components — add `"use client"` only for interactive UI (forms, charts, animations)
- Keep route handlers focused on a single responsibility — validate input, delegate to `lib/`, return response
- Use `app/` directory route groups `(auth)` and `(dashboard)` for layout separation
- API routes live under `app/api/` and follow RESTful conventions
- Metadata exports in `layout.tsx` and `page.tsx` for SEO

## Styling

- Use Tailwind CSS v4 utility classes exclusively — no separate CSS files beyond `globals.css`
- `globals.css` contains only Tailwind imports and CSS custom property tokens — no component styles
- Use shadcn/ui components from `components/ui/` for all interactive elements (buttons, inputs, cards, dialogs, etc.)
- Follow the border radius scale defined in `ui-context.md`
- Lucide React icons at `h-4 w-4` for inline, `h-5 w-5` for buttons
- No hardcoded hex values in components — use Tailwind classes or CSS custom properties

## API Routes

- Validate and parse request input (body, query params, headers) before any logic runs
- Enforce auth and ownership before any mutation — check Clerk session and verify the resource belongs to the user
- Return consistent, predictable response shapes: `{ data, error }` or standard HTTP status codes
- Stripe webhook route is unauthenticated — verify signature via Stripe SDK instead
- Clerk webhook route is authenticated by Clerk's signing secret

## Data and Storage

- All relational metadata (users, companies, scans, results, prompts, competitors, recommendations) lives in PostgreSQL via Prisma
- Cached scan results live in Upstash Redis with a 24-hour TTL by default
- No large content is stored directly in the database — AI raw responses are stored as JSONB text fields (bounded by provider token limits)
- No file/blob storage in MVP — no user uploads, no generated content files

## File Organization

- `app/` — Next.js App Router pages, layouts, and API routes
- `components/ui/` — shadcn/ui generated components (do not manually modify these)
- `components/landing/` — Marketing landing page components
- `components/dashboard/` — Dashboard-specific components (visibility score, charts, recommendations)
- `components/onboarding/` — Domain entry and competitor setup flow
- `components/shared/` — Reusable components (loading spinners, empty states, error boundaries)
- `lib/` — All business logic, providers, utilities, and helpers
- `types/` — Shared TypeScript types and interfaces
- `prisma/` — Schema definition, migrations, and seed scripts
- `context/` — Project documentation (spec, architecture, standards, progress)

## Testing

- Core logic only in MVP: scoring algorithm, prompt parsing, DB helper functions
- Framework: Vitest
- Test files co-located with source: `calculator.test.ts` next to `calculator.ts`
- `npm run build` must pass with no errors before merging
- Integration and E2E tests are post-MVP
