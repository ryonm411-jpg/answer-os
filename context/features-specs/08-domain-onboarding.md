# Domain Onboarding

## Goal

Build a dedicated onboarding flow at `/onboarding` that guides a newly signed-up user through entering their company domain.

Scope for this feature:

- a standalone, single-step onboarding page (domain entry only)
- redirect logic that keeps onboarding exclusive to users who do **not** have a company yet
- a real API-backed submit using the existing domain endpoint

Do **not** implement competitor entry, domain ownership verification, prompt generation, or scanning — those arrive in their own specs.

Follow:

- `architecture.md` (auth & access model, invariant #6: domain validation enforced at the API boundary)
- `code-standards.md` (server components by default, thin route handlers, delegate to `lib/`)
- `ui-context.md` (dark-first tokens, `components/ui/` primitives, radius scale)
- `06-domain-apis.md` (endpoint contract)
- `07-wire-dashboard.md` (data layer, shared validation, client fetch helper)

---

## Prerequisites

Before beginning implementation:

- Read `AGENTS.md`.
- Confirm `07-wire-dashboard.md` is implemented (this feature builds on its data layer).

---

## Current State

Reference points already in the codebase:

- `app/(editor)/layout.tsx` — protected by `auth.protect()`, fetches the company via `getCompanyByClerkId`, passes `domainName` to `EditorLayout`
- `app/(editor)/editor/page.tsx` — server component; renders `DashboardContent` with either the empty state (Add Domain) or the company state
- `POST /api/domain` — accepts `{ domain }`, defaults `name` to the normalized domain; returns `201` / `400` / `401` / `409` with the `{ data }` / `{ error: { message } }` envelope
- `lib/db/companies.ts` — `getCompanyByClerkId` (no user-row creation), `createCompany`, `ensureUser`, etc.
- `lib/api/domain.ts` — `createCompany(domain)` client helper that throws `error.message` on failure
- `lib/utils/domain.ts` — shared `normalizeDomain`, `isValidDomain`, `validateDomain`
- `components/dialogs/add-domain-dialog.tsx` — the existing Add Domain dialog (empty-state + sidebar path)
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — plain `<SignUp />` with default post-signup redirect

Known gaps this feature fills:

- there is no dedicated onboarding route — a brand-new user lands on the dashboard empty state instead of a guided flow
- post-signup redirect is not configured to send new users to onboarding

---

## Routing

Create a new top-level route group for the onboarding flow:

```
app/onboarding/
  layout.tsx    # standalone, minimal layout — no editor shell
  page.tsx      # server component — access control + render
```

`/onboarding` lives **outside** the `(editor)` route group: it does not use the editor navbar or sidebar. It is a focused, single-purpose page.

### Route Layout

`app/onboarding/layout.tsx` — a minimal standalone layout:

- centered content column (`max-w-md`-ish), full-viewport height, dark theme tokens (`bg-background`, `text-foreground`)
- brand mark at the top (AnswerOS wordmark, consistent with `app/(auth)/layout.tsx` styling)
- no `DialogProvider` wrapper — onboarding does not use the dialog system
- no `ClerkProvider` needed here — the root `app/layout.tsx` already provides it

### Route Page (server component)

`app/onboarding/page.tsx`:

1. resolve the Clerk session with `auth()` from `@clerk/nextjs/server` — call `auth.protect()` so unauthenticated users are redirected to sign-in (matches `app/(editor)/layout.tsx`)
2. call `getCompanyByClerkId(clerkId)` from `lib/db/companies.ts`
3. **if a company already exists** → `redirect("/editor")` (already onboarded)
4. otherwise render `<OnboardingForm />`

This keeps the invariant: the onboarding page is only reachable by an authenticated user with **no** company.

---

## Onboarding Form

Create:

`components/onboarding/onboarding-form.tsx`

A client component (`"use client"`) that owns the form interaction. Follow the established dialog form patterns in `components/dialogs/add-domain-dialog.tsx` (same validation + submit flow), but as a standalone page form — not a dialog.

### Fields

- **Domain** — single text input, `Label` + `Input` from `components/ui/`, placeholder like `acme.com`

No company-name input. `POST /api/domain` defaults `name` to the normalized domain (`07-wire-dashboard.md`).

### Submit Flow

1. normalize the input with `normalizeDomain` from `lib/utils/domain.ts`
2. validate with `validateDomain` — on failure show the message inline
3. call `createCompany(domain)` from `lib/api/domain.ts` (`POST /api/domain`)
4. on success → `router.push("/editor")` (the dashboard now has a company and renders the company state)
5. on failure → surface `error.message` inline, keep the form filled, do not navigate

### Validation

Use the shared `lib/utils/domain.ts` rules — do not copy validation into the form (invariant #6: client and API validate identically).

- trim whitespace
- normalize protocol / `www.` / trailing slash
- reject invalid formats with the shared message

### Loading State

While `isLoading`:

- disable the input and submit button
- swap the button label to a loading state (e.g. `"Adding…"`, matching the Add Domain dialog)
- guard against double-submit (reuse the same pattern as the dialogs: set loading before the request, clear on settle)

### Error Handling

Display user-friendly messages inline:

- validation errors → inline field error (shared `validateDomain` message)
- `409` duplicate domain / one-company limit → inline message from the server
- `400` / network failure → generic message, keep the form usable

Do not expose raw server errors or stack traces.

---

## Post-Signup Wiring

Route new users to onboarding after they create an account:

- in `app/(auth)/sign-up/[[...sign-up]]/page.tsx`, pass `afterSignUpUrl="/onboarding"` to the `<SignUp />` component

Do not change the root `/` redirect logic in `app/page.tsx` — a returning signed-in user without a company still lands on the dashboard empty state, which remains a valid secondary entry point (its Add Domain dialog already works and is out of scope here).

---

## What Stays Unchanged

- `app/(editor)/layout.tsx` and `app/(editor)/editor/page.tsx` — no changes; the dashboard empty state stays as the in-app fallback for users who arrive without a company through `/`
- `components/dialogs/add-domain-dialog.tsx` and the `useDialogs` dialog system — untouched; they remain the quick-add path from the empty state and sidebar
- `app/api/domain/route.ts` — no changes; onboarding reuses `POST /api/domain`
- `lib/db/companies.ts` — no new helpers required; `getCompanyByClerkId` + `createCompany` cover the flow

---

## Out of Scope

Do not implement:

- competitor entry (manual or auto-discovery) — deferred to a Competitors spec
- domain ownership verification (DNS TXT, meta tag, HTML file)
- industry / company-name collection
- prompt library generation on completion
- first-scan kickoff
- onboarding progress steps, steppers, or multi-step wizard UI
- onboarding analytics/telemetry events

This feature is a single-step domain entry page.

---

## Future

Reserved extensions (do not implement):

- competitor entry step (2–5 optional seed competitors) after domain success
- domain ownership verification step
- post-onboarding first-scan kickoff
- onboarding progress tracking / completion metrics

---

## Definition of Done

- `/onboarding` renders a standalone page with a brand header and centered domain form
- unauthenticated users are redirected to sign-in (`auth.protect()`)
- a user who already has a company is redirected to `/editor`
- submitting a valid domain creates the company via `POST /api/domain` and redirects to `/editor`
- invalid domains show the shared validation message inline
- duplicate-domain (`409`) and network errors show inline without navigating
- loading state disables the form and shows a loading label
- shared `lib/utils/domain.ts` validation is used — no local copies
- sign-up routes new users to `/onboarding` via `afterSignUpUrl`
- existing dashboard empty state and Add Domain dialog still work
- no TypeScript errors
- no ESLint errors
- `npm run build` passes
