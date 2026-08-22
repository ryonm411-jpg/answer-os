# Stripe Subscriptions & Payments

> **Status:** Proposed next implementation unit
> **Created:** August 21, 2026
> **Depends on:** `03-auth.md`, `05-prisma.md`, `06-domain-apis.md`, `07-wire-dashboard.md`

---

## 1. Goal

Set up the AnswerOS billing foundation for one flat monthly Stripe subscription.

A signed-in user with a monitored company must be able to:

1. start a hosted Stripe Checkout session for the configured monthly price
2. return to AnswerOS after Checkout
3. see the subscription status stored by the server
4. open the Stripe Customer Portal for payment details and cancellation
5. receive reliable subscription-state updates through a verified Stripe webhook
6. have paid, resource-consuming actions protected by server-side entitlement checks

The MVP has one recurring price, one subscription per company, no tiers, no usage-based billing, and no freemium plan.

The authoritative flow is:

```text
Authenticated user
    → company-scoped billing page
    → POST /api/billing/checkout
    → Stripe Checkout
    → Stripe webhook
    → PostgreSQL Subscription row
    → server-side entitlement checks
```

The browser redirect from Checkout is only a user-experience signal. It must never activate access by itself.

---

## 2. Mandatory Context Reads

Before implementing this feature, read these files in order:

1. `CLAUDE.md` — **read first**; it `@`-imports `AGENTS.md` and contains the repository's agent instructions and Next.js-version warning.
2. `context/project-overview.md` — product goals, MVP pricing, and user flow.
3. `context/architecture.md` — ownership model, PostgreSQL source of truth, and Stripe webhook invariant.
4. `context/ui-context.md` — dark billing-page layout, tokens, responsive behavior, and component conventions.
5. `context/code-standards.md` — API envelopes, webhook validation, server/client boundaries, and strict TypeScript rules.
6. `context/ai-workflow-rules.md` — scope discipline, migration workflow, and environment-variable rules.
7. `context/progress-tracker.md` — current phase, completed work, and open billing questions.
8. `context/features-specs/03-auth.md` — Clerk authentication and protected routes.
9. `context/features-specs/05-prisma.md` — Prisma 7, Neon adapter, and migration conventions.
10. `context/features-specs/06-domain-apis.md` — authenticated company ownership resolution.
11. `context/features-specs/07-wire-dashboard.md` — current editor shell and server/client API patterns.

Do not begin implementation until `CLAUDE.md` has been read.

---

## 3. Current State

Reference points in the repository:

- Clerk authentication is installed and protects the editor route through `proxy.ts` and `auth.protect()`.
- `Company` is the one-company-per-user billing owner in the MVP.
- `prisma/schema.prisma` contains `User`, `Company`, and the application data models, but no subscription or Stripe event models.
- PostgreSQL is the durable source of truth; Redis is not appropriate for billing state.
- There is no Stripe dependency, Stripe server helper, billing page, checkout route, portal route, or Stripe webhook route.
- `.env*` files are ignored by Git and must remain uncommitted.
- The existing API convention is `{ data }` for success and `{ error: { message } }` for failures.
- The current sign-up flow sends users to `/onboarding`, where a company is created before the editor is shown.

### Sequencing clarification

The original product flow lists Checkout before domain onboarding, while the current application model attaches subscriptions to `Company` and creates the company during onboarding. For this implementation unit, billing is company-scoped and Checkout requires an existing company. The current `/onboarding` flow remains intact; the editor can direct a company without an active subscription to `/billing` or show a billing CTA.

If pre-company Checkout is required later, introduce a separate user-level checkout ownership model deliberately. Do not silently attach a company subscription to an unauthenticated or client-supplied identifier.

---

## 4. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Use one Stripe recurring Price configured through `STRIPE_PRICE_ID`; do not hardcode a dollar amount in application code | The exact monthly amount is still an open product question, and Stripe should own price/tax/currency configuration |
| 2 | Use Stripe-hosted Checkout rather than embedding payment fields or adding Stripe.js | Keeps PCI-sensitive payment UI inside Stripe and avoids a browser payment dependency for the MVP |
| 3 | Store one `Subscription` row per company, keyed by `companyId`, with Stripe customer and subscription identifiers | The MVP has one company per user and one flat plan; company ownership matches the product's resource boundary |
| 4 | Stripe webhooks are the only authority that grants, changes, or revokes paid access | Checkout redirects can be skipped, replayed, or forged; this preserves architecture invariant #5 |
| 5 | Verify the raw webhook body with `STRIPE_WEBHOOK_SECRET` before parsing or writing data | Stripe signature verification requires the untouched request body |
| 6 | Record processed Stripe event IDs in PostgreSQL and process webhook updates idempotently | Stripe may retry delivery and events can be delivered more than once |
| 7 | Treat `ACTIVE` and `TRIALING` subscriptions as entitled; a subscription scheduled to cancel remains entitled until its current period ends | Matches Stripe subscription semantics and avoids revoking access before the paid period ends |
| 8 | Require the configured `STRIPE_PRICE_ID` in addition to an entitled status | A subscription for an unexpected price must not grant access to the MVP plan |
| 9 | Enforce entitlement in server-side resource-consuming mutations, initially scan dispatch and AI prompt generation; do not trust a client status flag | Protects provider spend while allowing onboarding and prompt review to remain usable before payment |
| 10 | Use the existing editor shell for the billing page and add billing navigation/action affordances there | Avoids a second application shell and follows current route conventions |
| 11 | Keep Stripe SDK imports inside `lib/stripe/`; route handlers call narrow helpers | Keeps vendor-specific code behind one server-only boundary and makes the routes testable |

---

## 5. Dependencies

Install the Stripe server SDK:

```bash
npm install stripe
```

Do not install `@stripe/stripe-js` or Stripe React components for the hosted Checkout MVP.

Verify the installed SDK API at implementation time. The expected server-side surface is:

- `new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: ... })`
- `stripe.checkout.sessions.create(...)`
- `stripe.billingPortal.sessions.create(...)`
- `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`

No new UI, state-management, data-fetching, or payment-form dependency is required.

---

## 6. Environment Variables

Document the following variables locally and in the deployment environment. Never commit their values:

| Variable | Required for | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | server-side Stripe API calls | Use a test-mode key locally and a live-mode key only in production; never expose it to client code |
| `STRIPE_PRICE_ID` | Checkout and entitlement validation | The single recurring monthly Price configured in Stripe |
| `STRIPE_WEBHOOK_SECRET` | webhook signature verification | The signing secret for the AnswerOS Stripe webhook endpoint; test and production values differ |
| `APP_URL` | Checkout and Customer Portal return URLs | Canonical origin such as `http://localhost:3000` or the production URL; do not derive trusted redirects from arbitrary request headers |

`STRIPE_PUBLISHABLE_KEY` is not required because payment collection is hosted by Stripe. Add it only if a later feature introduces embedded Stripe Elements.

---

## 7. Data Model

Extend the existing `Company` model with an optional one-to-one subscription relation:

```prisma
model Company {
  // existing fields remain unchanged
  subscription Subscription?
}
```

Add a constrained status enum. Values are intentionally normalized to Prisma-style uppercase names while preserving Stripe's meanings:

```prisma
enum SubscriptionStatus {
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  PAUSED
}
```

Add the following models:

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  companyId            String             @unique
  company              Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  stripeCustomerId     String             @unique
  stripeSubscriptionId String             @unique
  stripePriceId        String
  status               SubscriptionStatus
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  canceledAt           DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@index([status])
}

model StripeWebhookEvent {
  id          String   @id // Stripe event id, e.g. evt_...
  type        String
  processedAt DateTime @default(now())
  createdAt   DateTime @default(now())
}
```

Preserve every existing field, relation, index, and cascade behavior. Generate the migration through Prisma; never hand-edit an applied migration:

```bash
npx prisma migrate dev --name add_stripe_subscription
npx prisma generate
```

### Model rules

- `companyId` is unique: one company has at most one current subscription row.
- `stripeCustomerId` and `stripeSubscriptionId` are unique Stripe identifiers.
- A canceled historical subscription remains represented by the row; a later Checkout for the same company updates the row to the new Stripe subscription identifier through a webhook transaction.
- `stripePriceId` is stored from the Stripe subscription item and checked against `STRIPE_PRICE_ID` before granting entitlement.
- Stripe Unix-second timestamps are converted to JavaScript `Date` values at the webhook boundary.
- No payment-card details, invoice PDFs, client secrets, or raw Stripe payloads are stored in PostgreSQL.
- The event table stores only the minimum idempotency metadata needed for webhook processing.

---

## 8. Stripe Server Boundary

Create a server-only helper module:

```text
lib/stripe/server.ts
```

Responsibilities:

- lazily construct and cache the Stripe client after validating `STRIPE_SECRET_KEY`
- expose the configured price ID and application URL through validated server-only helpers
- map Stripe subscription statuses to `SubscriptionStatus`
- normalize a Stripe subscription into a database-safe `Subscription` update shape
- expose `isSubscriptionEntitled(subscription)` with the `ACTIVE`/`TRIALING` and configured-price checks
- expose a safe billing view model that contains status, period dates, cancellation state, and entitlement, but never secret keys or raw Stripe objects

Do not import `stripe` directly from React components. Do not expose Stripe customer IDs or subscription IDs unless a future support UI explicitly needs them.

Suggested pure contracts:

```ts
export interface BillingStatus {
  status: SubscriptionStatus | null;
  entitled: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function isSubscriptionEntitled(input: {
  status: SubscriptionStatus;
  stripePriceId: string;
  configuredPriceId: string;
}): boolean;
```

The entitlement helper must be deterministic and unit-testable without importing Prisma, React, or a Stripe client.

---

## 9. Database Helpers

Create a thin repository module:

```text
lib/db/subscriptions.ts
```

It should own Prisma queries and no rendering decisions.

Required helpers:

- `getSubscriptionForCompany(companyId)` — return the current subscription or `null`.
- `getBillingStatusForCompany(companyId)` — map the row to the safe serializable billing view model.
- `hasActiveSubscription(companyId)` — server-side entitlement check using the stored row and configured price.
- `upsertSubscriptionFromStripe(companyId, normalizedSubscription)` — transaction-safe webhook write.
- `recordStripeWebhookEvent(eventId, type)` or an equivalent transaction helper — deduplicate event processing.

The webhook update must be atomic with event recording:

```text
verify event
  → begin transaction
    → insert StripeWebhookEvent
    → if duplicate, return already processed
    → upsert Subscription
  → commit
```

If the transaction fails, do not leave an event marked processed so Stripe can retry it.

The helper must resolve `companyId` from verified server-side data. Never accept a browser-provided company ID for a subscription mutation.

---

## 10. API Contracts

All billing routes except the Stripe webhook require Clerk authentication and resolve the company with `getCompanyByClerkId(clerkId)`.

Continue using:

```json
{ "data": {} }
```

and:

```json
{ "error": { "message": "..." } }
```

### 10.1 `POST /api/billing/checkout`

Creates a hosted Checkout session for the authenticated user's company.

Flow:

1. authenticate with Clerk
2. resolve the company from the Clerk user ID
3. reject if no company exists (`404`)
4. read the current subscription from PostgreSQL
5. reject an already-entitled company (`409`)
6. create a Stripe Checkout Session in `subscription` mode
7. return the hosted session URL

Checkout configuration:

```ts
{
  mode: "subscription",
  line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
  success_url: `${APP_URL}/billing?checkout=success`,
  cancel_url: `${APP_URL}/billing?checkout=cancelled`,
  client_reference_id: company.id,
  metadata: { companyId: company.id },
  subscription_data: {
    metadata: { companyId: company.id },
  },
}
```

If the company already has a stored Stripe customer ID, pass it as `customer`. Otherwise pass the authenticated email as `customer_email`; do not persist a customer ID from the browser or from the Checkout redirect. The webhook records the customer ID.

Responses:

- `200 { data: { url: string } }`
- `401` unauthenticated
- `404` company not found
- `409` already entitled or an unresolved active subscription exists
- `500` safe Stripe/server failure

The route must not update subscription entitlement or create a `Subscription` row.

### 10.2 `POST /api/billing/portal`

Creates a Stripe Customer Portal session for the stored customer.

Flow:

1. authenticate and resolve the company
2. load its stored subscription
3. return `404` if no Stripe customer is known
4. call `stripe.billingPortal.sessions.create({ customer, return_url: APP_URL + "/billing" })`
5. return the hosted portal URL

Responses:

- `200 { data: { url: string } }`
- `401` unauthenticated
- `404` company or Stripe customer not found
- `500` safe Stripe/server failure

The portal may support cancellation and payment-method management according to the Stripe Dashboard configuration. Application code must not assume that a cancellation is immediate; the webhook remains authoritative.

### 10.3 `GET /api/billing/subscription`

Return a safe company-scoped billing view for interactive billing UI only. It must read PostgreSQL, not call Stripe on every page load.

Example response:

```json
{
  "data": {
    "status": "ACTIVE",
    "entitled": true,
    "currentPeriodEnd": "2026-09-21T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  }
}
```

Return `status: null` and `entitled: false` when no row exists. Do not return raw Stripe objects, secrets, card data, or unvalidated metadata.

### 10.4 `POST /api/webhooks/stripe`

This route is unauthenticated by design.

Required behavior:

1. read the request body with `request.text()` exactly once
2. read the `stripe-signature` header
3. call `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`
4. return `400` when the signature is missing or invalid
5. handle only documented event types
6. record and apply supported events transactionally and idempotently
7. return `200` after a duplicate event is recognized as already processed
8. return a safe `500` for a transient database/processing failure so Stripe retries

Supported subscription state events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Supporting event:

- `checkout.session.completed` — use it to validate/locate the company and customer context when useful, but do not grant entitlement without the subscription event/state being persisted.

Ignored-but-successful events should return `200` with a small acknowledgment. Do not fail delivery for unrelated Stripe events.

Company resolution order for a subscription event:

1. `subscription.metadata.companyId`, validated against the existing Company row
2. known `stripeCustomerId` lookup in the Subscription table
3. if neither resolves safely, log the event as unprocessable and do not grant access

Do not trust a company ID merely because it came from an unverified request; the event must first pass Stripe signature verification.

---

## 11. Webhook Normalization

Normalize a Stripe subscription into the local representation:

| Stripe field | Local field |
| --- | --- |
| `id` | `stripeSubscriptionId` |
| `customer` | `stripeCustomerId` |
| `status` | `SubscriptionStatus` mapping |
| first subscription item price ID | `stripePriceId` |
| `current_period_start` | `currentPeriodStart` |
| `current_period_end` | `currentPeriodEnd` |
| `cancel_at_period_end` | `cancelAtPeriodEnd` |
| `canceled_at` | `canceledAt` |

Reject or safely ignore a subscription that has no customer ID, no subscription ID, or no first price ID. Do not grant entitlement from malformed or unexpected data.

Map unknown future Stripe statuses to a non-entitled state and log a warning rather than crashing the webhook process. Keep the mapping in one pure helper with unit tests.

For a subscription on an unexpected price:

- persist the observed row/status for support/debugging if the shape is valid
- return `entitled: false`
- do not treat it as the AnswerOS MVP subscription

---

## 12. Entitlement and Access Rules

The following are server-side rules:

- `ACTIVE` + configured price → entitled
- `TRIALING` + configured price → entitled
- `PAST_DUE`, `UNPAID`, `CANCELED`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`, or `PAUSED` → not entitled
- `cancelAtPeriodEnd = true` does not revoke access before `currentPeriodEnd`
- missing subscription row → not entitled
- unexpected price → not entitled
- a client-provided `status`, `companyId`, or `entitled` value is ignored

Initially enforce the entitlement check before:

- `POST /api/scans` creates a scan or calls Trigger.dev (`402 Payment Required` when unpaid)
- `POST /api/prompts/generate` makes an AI provider call (`402 Payment Required` when unpaid)

Prompt browsing, company onboarding, custom prompt management, and the billing page may remain available so an unpaid user can correct setup and subscribe. If product policy later requires a hard app-wide paywall, add it as a deliberate route-guard decision rather than putting subscription logic into `proxy.ts` by accident.

When blocked, return an actionable message such as:

```text
An active AnswerOS subscription is required for this action. Open Billing to subscribe or manage your plan.
```

Do not use a redirect from an API route as the access control mechanism.

---

## 13. Billing UI

Use the existing dark editor shell and existing shadcn/ui primitives. Suggested structure:

```text
app/(editor)/billing/page.tsx
components/billing/
  billing-page.tsx
  subscription-card.tsx
  billing-status-badge.tsx
lib/api/billing.ts
```

### Billing page

The server page should:

- authenticate with `auth.protect()` or the existing protected layout
- resolve the company from Clerk
- read the billing status from PostgreSQL
- pass only serializable values to client components

The client boundary may:

- call the checkout helper and redirect to the returned Stripe URL
- call the portal helper and redirect to the returned Stripe URL
- show inline errors and loading states
- offer a refresh after returning from Checkout

Do not use the `checkout=success` query parameter as proof of payment. Show a neutral “Payment submitted; waiting for confirmation” state until the webhook-backed database row says otherwise.

### States

- **No subscription:** explain the single monthly plan and show `Subscribe`.
- **Checkout pending:** show that Stripe confirmation is being processed; provide a refresh action.
- **Active:** show active status, renewal date, and `Manage billing`.
- **Trialing:** show trial end/current period date and `Manage billing`.
- **Cancel scheduled:** show the access end date and `Manage billing`.
- **Past due/unpaid:** show a clear warning and `Manage billing`; do not claim the account is active.
- **Canceled/incomplete/paused:** show a non-entitled state and `Subscribe` or `Manage billing` as appropriate.
- **Read failure:** use the existing Next.js error boundary conventions; never fabricate an active or canceled state.

### Navigation

Add a Billing navigation item or equivalent account action inside the existing editor shell. Use Lucide React and the established `h-4 w-4` / `h-5 w-5` sizing. Do not modify generated `components/ui/*` files.

### Accessibility and responsive behavior

- use one page-level `h1` and semantic section headings
- use visible text in addition to status color
- expose loading and webhook-wait states with `role="status"`
- expose actionable failures with `role="alert"`
- keep buttons keyboard accessible with visible focus states
- stack the subscription card and action buttons on mobile
- use existing dark theme tokens; no hardcoded component hex colors

---

## 14. Stripe Dashboard Setup

Human setup is required; do not attempt to create live financial products or accounts automatically.

The implementer should document these steps without committing secrets:

1. Create or select a Stripe account in **test mode**.
2. Create one recurring monthly Product and Price.
3. Put the resulting Price ID in `STRIPE_PRICE_ID`.
4. Configure the Customer Portal for cancellation and payment-method updates.
5. Register the local/preview/production webhook endpoint:
   - `POST /api/webhooks/stripe`
6. Subscribe the endpoint to the supported subscription events listed above.
7. Put the endpoint signing secret in `STRIPE_WEBHOOK_SECRET`.
8. Use Stripe CLI forwarding for local manual verification when appropriate:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Do not store Stripe dashboard credentials, webhook signing secrets, or test/live keys in the repository.

---

## 15. Testing

### Pure logic tests

Add co-located tests for:

- Stripe-to-Prisma subscription status mapping
- Unix timestamp to `Date` conversion
- `ACTIVE` and `TRIALING` entitlement
- non-entitled statuses
- unexpected price rejection
- cancellation-at-period-end behavior
- missing subscription/customer/price handling
- safe billing view serialization

Suggested locations:

```text
lib/stripe/status.ts
lib/stripe/status.test.ts
```

### Database/helper tests

Verify:

- one subscription per company
- Stripe IDs remain unique
- duplicate webhook event IDs do not apply the update twice
- failed transactions do not leave a processed event marker
- a webhook can update a canceled row to a replacement subscription
- foreign/unknown company metadata cannot grant entitlement

### Route/manual checks

Verify:

- unauthenticated billing routes return `401`
- checkout requires an existing company
- already-entitled companies cannot create duplicate Checkout sessions
- portal requires a stored Stripe customer
- invalid webhook signatures return `400`
- duplicate valid webhook deliveries return `200` without duplicate writes
- paid state changes only after webhook processing
- unpaid scan and prompt-generation requests return `402`
- no Stripe secret, raw payload, or card data reaches client props

Do not make unit tests depend on live Stripe network calls. Mock the narrow server boundary or use pure normalization helpers.

---

## 16. Validation

Run:

```bash
npx prisma validate
npx prisma generate
npm test
npm run lint
npm run build
```

Manual test in Stripe test mode:

1. sign in and create a company through the existing onboarding flow
2. open Billing and confirm the unpaid state
3. start Checkout and complete a test payment
4. confirm the webhook updates PostgreSQL and the page reports `ACTIVE`
5. confirm scan dispatch and AI prompt generation are allowed only after the webhook-backed state is active
6. open Customer Portal and schedule cancellation
7. confirm `cancelAtPeriodEnd` is shown while access remains active through the period end
8. deliver a duplicate webhook and confirm no duplicate subscription/event rows are created
9. simulate a failed payment/status change and confirm access is no longer entitled

Update `context/context/progress-tracker.md` after the implementation, migration, and verification are complete.

---

## 17. Out of Scope

Do not implement:

- multiple plans, tiers, coupons, or usage-based billing
- metered billing or scan quotas
- trials unless explicitly configured on the single Stripe Price/product
- embedded Payment Element or custom card forms
- invoice generation, tax automation, or revenue reporting
- refunds, disputes, chargebacks, or finance-admin tooling
- team/organization billing
- transferring a subscription between companies
- pre-company Checkout
- custom Stripe Dashboard administration UI
- email receipts or weekly reports (Resend has its own feature spec)
- client-side entitlement as an authorization mechanism
- live-mode account creation or deployment

---

## 18. Future

Reserved extensions:

- tiered plans and plan-specific scan limits
- usage/meter events for prompt/provider checks
- trial and grace-period policy
- webhook delivery audit UI
- billing history and invoice links
- organization-level subscriptions
- Stripe Tax and localized pricing
- customer self-serve plan changes
- hard paywall middleware after the route/access policy is explicitly decided

---

## 19. Definition of Done

- `stripe` is installed as a runtime dependency and imports are isolated to `lib/stripe/`.
- Prisma contains a company-scoped `Subscription` model and idempotent `StripeWebhookEvent` model.
- A generated Prisma migration applies cleanly and the client regenerates.
- `POST /api/billing/checkout` creates a hosted single-price subscription Checkout session without granting access locally.
- `POST /api/billing/portal` creates a portal session for a known Stripe customer.
- `GET /api/billing/subscription` returns a safe serialized billing view.
- `POST /api/webhooks/stripe` verifies raw-body signatures and handles supported subscription events transactionally.
- Duplicate webhook deliveries are harmless.
- Subscription status and configured-price checks are the only basis for entitlement.
- Scan dispatch and AI prompt generation reject unpaid requests server-side.
- Billing UI handles no subscription, pending confirmation, active, cancel-scheduled, past-due, canceled, and read-failure states honestly.
- Checkout redirects never activate access without a webhook-backed database update.
- No secrets, raw Stripe payloads, or payment details cross into client props or are committed.
- `npm test`, `npm run lint`, and `npm run build` pass.
- `context/context/progress-tracker.md` records the completed implementation and any remaining pricing/setup questions.
