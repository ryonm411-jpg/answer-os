# Domain APIs

## Goal

Implement the API layer for domain onboarding and management — the server-side counterpart to the dialogs built in `04-dialog.md`.

The user's tracked domain is stored on the `Company` model (`domain @unique`, 1:1 with `User`). These APIs back the three domain dialogs and replace their mock submissions:

- Add Domain (onboarding) → `AddDomainDialog`
- Edit Domain → `EditDomainDialog`
- Remove Domain → `RemoveDomainDialog`

Follow `architecture.md` (auth & access model, invariant #6: domain validation enforced at the API boundary) and `code-standards.md` (API Routes section).

Do **not** implement: scan execution, prompt library, competitor APIs, or Trigger.dev work. The Run Scan dialog stays mocked.

---

## Resource Model

- The user's domain lives on `Company.domain` (`String @unique`).
- Each user has exactly one company (1:1).
- Deleting a company cascades to `Competitor`, `Scan`, and `Recommendation` rows (schema `onDelete: Cascade`) — this matches the Remove Domain dialog copy ("Previous scan history will be permanently deleted").
- The Clerk webhook → User row sync is deferred (`05-prisma.md` Future), so these routes must ensure the `User` row exists before creating a company. Upsert by `clerkId`, seeding `email` from the Clerk session.

---

## Endpoints

One route handler file per the file organization convention (`app/api/scans/route.ts` pattern):

```
app/api/companies/route.ts
```

| Method | Path             | Action                                     | Used by             |
| ------ | ---------------- | ------------------------------------------ | ------------------- |
| GET    | `/api/companies` | Return the current user's company (or null) | Editor shell load   |
| POST   | `/api/companies` | Create the user's company (Add Domain)     | AddDomainDialog     |
| PATCH  | `/api/companies` | Update the user's domain                    | EditDomainDialog    |
| DELETE | `/api/companies` | Delete the company and all scan history     | RemoveDomainDialog  |

All handlers:

- require a Clerk session (`auth()` from `@clerk/nextjs/server`) → `401 { error: "Unauthorized" }` otherwise
- parse and validate request input before any logic runs
- verify ownership: `company.userId` must equal the authenticated user's id
- return consistent `{ data, error }` response shapes

### GET /api/companies

- Resolve the authenticated user's `User` row by `clerkId` (ensure it exists).
- Return `200 { data: company }` with the user's company, or `200 { data: null }` when no company exists yet (no 404 — "no company yet" is a valid state during onboarding).

### POST /api/companies

- Body: `{ domain: string }`
- Normalize + validate the domain → `400 { error }` with the same inline message the dialogs show.
- Ensure the `User` row exists (upsert by `clerkId`; `email` from the session, `name` from session if available).
- If the user already has a company → `409 { error: "A domain is already set for this account." }`
- Create the company with `domain` set and `name` defaulting to the normalized domain (no separate name field in MVP onboarding).
- Duplicate domain owned by another user → Prisma `P2002` → `409 { error: "This domain is already being tracked." }`
- Return `201 { data: company }`.

### PATCH /api/companies

- Body: `{ domain: string }`
- Normalize + validate the domain → `400 { error }` (same messages as POST).
- No company for the user → `404 { error: "No domain set for this account." }`
- Duplicate domain → `P2002` → `409 { error: "This domain is already being tracked." }`
- Return `200 { data: company }`.

### DELETE /api/companies

- No company for the user → `404 { error: "No domain set for this account." }`
- Delete the company (cascades to competitors, scans, recommendations).
- Return `200 { data: { id } }` with the deleted company id.

---

## Shared Domain Validation (`lib/utils/domain.ts`)

Move the domain helpers out of `hooks/use-dialogs.tsx` into a shared, server-safe module so the client and API validate identically (invariant #6):

- `normalizeDomain(raw)` — trim, lowercase, strip `http(s)://`, strip `www.`, strip trailing slash
- `validateDomain(domain)` — returns an error message string, or empty string if valid (existing regex: labels + TLD of 2+ chars)

Update `hooks/use-dialogs.tsx` and the three domain dialogs to import from `lib/utils/domain.ts` instead of defining them locally. The API must re-validate the normalized value server-side — never trust client-side validation alone.

---

## DB Helpers (`lib/db/companies.ts`)

Keep route handlers thin (code-standards: validate input, delegate to `lib/`, return response). Thin query wrappers using the shared `prisma` singleton:

- `ensureUser(clerkId, email, name?)` — upsert `User`
- `getCompanyByUserId(userId)` — include nothing extra (scans/competitors load later in their own specs)
- `createCompany(userId, domain)` — name defaults to domain
- `updateCompanyDomain(companyId, domain)`
- `deleteCompany(companyId)`

---

## Dialog Wiring

Replace the mock `setTimeout` submissions in the domain dialogs with `fetch` calls; keep the existing `setLoading` / `setFormError` / `closeDialog` flow:

- **AddDomainDialog** — `POST /api/companies`; on `200/201` close; on `400/409` show `error` inline.
- **EditDomainDialog** — `PATCH /api/companies`; same error handling, plus `404` surfaced inline.
- **RemoveDomainDialog** — `DELETE /api/companies`; on success close; on `404` show error inline.
- Run Scan dialog stays mocked (scan pipeline arrives with the Trigger.dev spec).

Add a small `lib/api/` fetch helper (or inline `fetch` wrappers) for the `{ data, error }` response shape so dialogs don't hand-roll parsing. No client-side data fetching library — plain `fetch` is sufficient for MVP.

---

## Editor Integration

The editor shell currently hardcodes `domainName="shopify.com"`:

- In `app/(editor)/layout.tsx` (server component), look up the company via `lib/db/companies.ts` and pass the real domain to `EditorLayout` (`domainName ?? undefined` → empty state).
- After successful dialog mutations, call `router.refresh()` so the navbar domain re-renders from the server — no client-side state duplication.

---

## Future

Reserved (do not implement):

- Clerk webhook → User row sync (replaces the upsert in `ensureUser`)
- Competitor APIs (`/api/competitors`) — manual entry + auto-discovery
- Scan APIs (`/api/scans`) — arrives with the Trigger.dev background jobs spec
- Domain availability / DNS checks
- Multi-domain support per user (breaks the 1:1 company invariant — post-MVP only)

---

## Check When Done

- `app/api/companies/route.ts` implements GET/POST/PATCH/DELETE with auth, ownership checks, and `{ data, error }` shapes
- `lib/utils/domain.ts` contains the shared `normalizeDomain` / `validateDomain`; dialogs import from it
- `lib/db/companies.ts` exposes the five query helpers
- Add/Edit/Remove dialogs call the real API; loading and inline errors work
- Editor navbar shows the user's actual domain (and empty state when none)
- Run Scan dialog still mocked
- `npm run build` passes with no type errors
- `npm run lint` passes
