# Wire Dashboard

## Goal

Connect the dashboard and navigation to the real backend.

Replace mock and hardcoded domain data with live company data from the data layer, and wire the domain dialogs to the real API.

Do not implement AI scanning, recommendations, or background jobs.

Follow:

- `architecture.md` (auth & access model, invariant #6: domain validation enforced at the API boundary)
- `code-standards.md` (server components by default, thin route handlers, delegate to `lib/`)
- `06-domain-apis.md` (endpoint contracts)

---

## Prerequisites

Before beginning implementation:

- Read `AGENTS.md`.

## Current State

Reference points already in the codebase:

- `app/api/domain/route.ts` — `GET` / `POST` / `PATCH` / `DELETE` with Clerk auth and `{ data }` / `{ error: { message } }` responses
- `lib/utils/domain.ts` — shared `normalizeDomain` and `isValidDomain`
- `hooks/use-dialogs.tsx` — single owner of dialog state (`openDialog`, `closeDialog`, `setFormField`, `setFormError`, `setLoading`)
- `components/dialogs/*` — Add/Edit/Remove domain dialogs still submit via mock `setTimeout`
- `app/(editor)/layout.tsx`, `app/(editor)/editor/page.tsx`, `EditorLayout`, and `EditorNavbar` — hardcode `domainName="shopify.com"`

Known gaps this feature fills:

- `lib/db/companies.ts` does not exist yet — the dashboard needs it to fetch the company server-side
- `POST /api/domain` currently requires a `name` field, but the Add Domain dialog collects only a domain (per `04-dialog.md`) and `06-domain-apis.md` specifies that `name` defaults to the normalized domain
- `hooks/use-dialogs.tsx` still contains local `normalizeDomain` / `validateDomain` copies that duplicate `lib/utils/domain.ts`

---

## Data Access Layer

Create `lib/db/companies.ts` using the shared `prisma` singleton (`lib/db/prisma.ts`):

| Helper                    | Purpose                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `getCompanyByClerkId(clerkId)` | Resolve the user's company by Clerk id, or `null`. Used by the dashboard layout and page. Does not create the user row. |
| `ensureUser(clerkId, email, name?)` | Upsert the Clerk user row (moves the inline upsert out of the API route). |
| `getCompanyByUserId(userId)` | Return the user's company, or `null`.                                  |
| `createCompany(userId, domain, industry?)` | Create a company; `name` defaults to the normalized domain, `industry` optional.           |
| `updateCompanyDomain(companyId, domain)` | Update the tracked domain.                                       |
| `deleteCompany(companyId)` | Delete the company (cascades to scans, competitors, recommendations).  |

Keep the helpers thin — no scan/competitor includes (those arrive in their own specs).

### API Alignment

Refactor `app/api/domain/route.ts` to delegate to the helpers above (code-standards: keep route handlers thin — validate input, delegate to `lib/`, return the response). Align the contracts with `06-domain-apis.md`:

- `POST` accepts `{ domain }` (plus optional `industry`), defaulting `name` to the normalized domain — no separate name field in MVP onboarding
- `GET` returns `200 { data: company | null }` when the user has no company — "no company yet" is a valid onboarding state, not a 404
- `PATCH` accepts `{ domain }` (optional `name` / `industry` tolerated)
- Response envelope stays `{ data }` on success and `{ error: { message } }` on failure, with the existing status codes: `400` validation, `401` unauthorized, `404` no company, `409` duplicate domain / one-company limit

---

## Dashboard Page

`app/(editor)/editor/page.tsx` becomes a Server Component.

Fetch the authenticated user's company:

- resolve the Clerk user id with `auth()` from `@clerk/nextjs/server`
- call `getCompanyByClerkId` → company or `null`

Pass the company to client child components as props. Do not perform client-side fetching for the initial render.

### No Company (Empty State)

Display:

- Heading
- Description
- Primary CTA: "Add Domain"

The Add Domain button opens the Add Domain dialog via `useDialogs` (as today). Keep Edit Domain, Remove Domain, and Run Scan out of this state — there is no domain to edit, remove, or scan yet.

### Company Exists

Render:

- current company name and monitored domain
- Edit Domain / Remove Domain triggers pre-filled with the real company domain
- Run Scan trigger (still mocked — opens `RunScanDialog`)
- remaining dashboard widgets stay placeholder components until their feature specs

Interactive elements (dialog triggers) live in client components that consume `useDialogs` and receive the company as props.

---

## Navigation Wiring

`app/(editor)/layout.tsx` (server component):

- fetch the company with `getCompanyByClerkId`
- pass `domainName={company?.domain}` to `EditorLayout` — no hardcoded value

`EditorLayout` and `EditorNavbar`:

- remove the `domainName = "shopify.com"` default
- render the domain only when present; show nothing when the user has no company
- the navbar's scan-status badge ("Active") stays a placeholder — it is a future feature (`02-editor.md`)

---

## Dialog Wiring

Keep `hooks/use-dialogs.tsx` as the single owner of dialog state (`04-dialog.md`). Do **not** create a parallel `use-domain-actions` hook — the dialogs already share `openDialog`, `setLoading`, `setFormError`, and `closeDialog`.

Create `lib/api/domain.ts` — a thin fetch helper for the `{ data }` / `{ error: { message } }` envelope:

- `createCompany(domain)` → `POST /api/domain`
- `updateCompanyDomain(domain)` → `PATCH /api/domain`
- `removeCompany()` → `DELETE /api/domain`

On non-2xx the helper throws with `error.message` so dialogs can display it inline. No client-side data-fetching library — plain `fetch` is sufficient for MVP.

Wire the dialogs (replace the mock `setTimeout` submissions, keep the existing `setLoading` / `setFormError` / `closeDialog` flow):

| Dialog              | Mutation                  | On success                     | Errors shown inline |
| ------------------- | ------------------------- | ------------------------------ | ------------------- |
| AddDomainDialog     | `createCompany(domain)`   | `router.refresh()` + close     | 400, 409            |
| EditDomainDialog    | `updateCompanyDomain(domain)` | `router.refresh()` + close  | 400, 404, 409       |
| RemoveDomainDialog  | `removeCompany()`         | `router.refresh()` + close     | 404                 |

`router.refresh()` re-renders the server component so the dashboard, navbar, and empty state reflect the new data — no client-side state duplication. After Remove Domain succeeds, the dashboard returns to the empty state.

RunScanDialog stays mocked (scan execution arrives with the Trigger.dev spec).

### Domain Validation Consolidation

`hooks/use-dialogs.tsx` still ships local `normalizeDomain` / `validateDomain` copies. Move the message-based `validateDomain` into `lib/utils/domain.ts` (alongside `normalizeDomain` / `isValidDomain`) and update the dialogs and `use-dialogs.tsx` to import from there. Client and API then validate identically (architecture invariant #6).

---

## Validation

- Dialog-level: normalize + format check using the shared `lib/utils/domain.ts` rules
- Server: re-validates the normalized value and returns `400 { error: { message } }` with the same message
- Duplicate domain (409), one-company limit (409), and unauthorized (401) errors surface from the API response and are shown inline in the dialog
- Do not duplicate server-side checks beyond the shared format validation

---

## Loading States

While a mutation is pending (`isLoading`):

- disable form controls
- disable submit buttons
- display loading indicators / labels ("Adding…", "Saving…", "Removing…")

`setLoading` already guards against duplicate submissions — keep using it.

---

## Error Handling

Gracefully handle:

- network failures — generic message, keep the dialog open
- validation errors — inline field error
- unauthorized responses — surfaced as a user-friendly message (Clerk session is already enforced server-side)
- duplicate domain errors — inline 409 message from the server
- no company (404 on edit/remove) — inline message

Display user-friendly messages. Do not expose raw server errors or stack traces.

---

## Out of Scope

Do not implement:

- AI scanning
- Trigger.dev jobs
- Redis
- Prompt generation
- Recommendations
- Visibility scores
- Charts
- Competitor management
- Run Scan execution

This feature only connects the dashboard and navigation to real company data.

---

## Future

Reserved integrations:

- Run Scan
- Competitors
- Visibility Score
- Recommendations
- Weekly Reports

---

## Definition of Done

- `lib/db/companies.ts` exposes the six helpers; the domain route delegates to them
- `POST /api/domain` accepts `{ domain }` and defaults `name` to the normalized domain
- `GET /api/domain` returns `200 { data: null }` when no company exists
- dashboard page is a server component that loads the real company (or empty state) with no client-side initial fetch
- navbar shows the user's actual domain (or empty state when none)
- Add Domain creates the company, Edit Domain updates it, Remove Domain deletes it
- dashboard refreshes correctly after mutations (`router.refresh()`)
- loading, inline validation, and error states work correctly
- no local validation copies remain in `hooks/use-dialogs.tsx`
- no TypeScript errors
- no ESLint errors
- `npm run build` passes
