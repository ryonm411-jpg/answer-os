# PostHog Analytics & Sentry Monitoring

## Goal

Integrate **PostHog** (product analytics) and **Sentry** (error monitoring + performance tracking) into AnswerOS. This covers the full stack: server-side Next.js instrumentation, client-side pageview/event tracking, user identification, and error/performance capture for API routes, Trigger.dev background jobs, and React rendering.

PostHog provides the product signal — who signs up, who scans, who upgrades, feature adoption. Sentry provides the operational safety net — uncaught exceptions, slow API routes, background job failures, and React rendering errors.

This is **infrastructure only** — no new product features, no new pages, no new database models. The analytics and monitoring are invisible to end users.

Do **not** implement:

- new product features or UI changes
- custom PostHog dashboards (use PostHog's UI directly)
- Sentry release health tracking (add post-MVP if needed)
- Vercel Analytics (out of scope for this spec; add separately if desired)

Follow:

- `architecture.md` — PostHog and Sentry are listed as required tech stack layers
- `code-standards.md` — server-only modules, strict TypeScript, no `any`, tests for core logic
- `project-overview.md` — listed as in-scope for MVP
- `answeros-spec.md` — section 7 success criteria; the product must have PostHog and Sentry live in production

---

## Prerequisites

Before beginning implementation:

- Read `AGENTS.md`.
- Review `context/context/architecture.md` (PostHog and Sentry are listed in the stack table).
- Review `context/context/code-standards.md` (server-only modules, no `any`, co-located tests).
- Confirm the project builds and all tests pass (`npm run build && npm test`).
- Create a PostHog account at [posthog.com](https://posthog.com) — free tier covers MVP needs (1M events/month).
- Create a Sentry account at [sentry.io](https://sentry.io) — free tier covers MVP needs (5K errors/month, 10K performance units).
- Obtain the PostHog project API key (`POSTHOG_KEY`) and ingestion host (`POSTHOG_HOST`).
- Obtain the Sentry DSN (`SENTRY_DSN`) and organization/project slugs for the Sentry CLI.

---

## Current State

Reference points already in the codebase:

- `context/answeros-spec.md` — lists PostHog and Sentry as in-scope (section: In Scope MVP), and states them as required for success criteria #7
- `context/context/architecture.md` — stack table lists PostHog (analytics) and Sentry (monitoring) as required layers
- `context/context/project-overview.md` — lists both under In Scope
- `app/layout.tsx` — root layout with `ClerkProvider` wrapping the tree — this is where Sentry's `ErrorBoundary` and PostHog's `<PostHogProvider>` will be injected
- `lib/` — no `lib/analytics/` or `lib/monitoring/` directory exists yet
- No PostHog or Sentry packages are installed in `package.json`
- No environment variables for either service exist yet

Known gaps this feature fills:

- There is no error monitoring anywhere — unhandled exceptions in API routes, background jobs, and React components are silently lost
- There is no product analytics — no visibility into signups, scan usage, feature adoption, or funnel drop-off
- Background job failures (Trigger.dev) are not captured anywhere for debugging
- Performance data (API route latency, render times) is not collected

---

## Decisions (2026-08-26)

| #  | Decision                                                                                       | Rationale                                                                                                                 |
| -- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1  | Use `posthog-js` for client-side and `posthog-node` (server) for server-side analytics         | Official SDK pair; `posthog-node` is designed for Node.js server environments (API routes, Trigger.dev tasks)              |
| 2  | Use `@sentry/nextjs` as the single Sentry integration                                         | Official Next.js SDK wraps both client and server instrumentation; handles App Router, API routes, and edge runtime automatically |
| 3  | Wrap the root layout with both providers (PostHog client + Sentry ErrorBoundary)               | Ensures all pages and components inherit analytics and error boundaries from the top of the tree                           |
| 4  | PostHog identified users by Clerk `userId` (not Clerk's internal ID)                          | Clerk's `userId` is stable, DB-joined to Company, and safe to expose in client-side analytics; avoids PII leakage        |
| 5  | Sentry environment is derived from `VERCEL_ENV` (development / preview / production)          | Matches Vercel's standard deploy flow; no custom env var needed                                                           |
| 6  | PostHog capture is disabled in development (`opt_out_capturing_by_default: true`, opted-in on production only) | Prevents development noise from corrupting production analytics; overrides available per-call for testing                  |
| 7  | Sentry sample rates: 100% errors in dev/staging, 20% in production; 10% traces in production  | High fidelity in dev, cost-controlled in production for a solo-founder MVP                                                |
| 8  | Analytics and monitoring modules live in `lib/analytics/` (PostHog) and `lib/monitoring/` (Sentry) | Matches the existing `lib/` convention; thin wrappers that other modules import from                                       |

---

## Dependencies

Install:

```bash
npm install posthog-js posthog-node @sentry/nextjs
```

No additional dev dependencies are needed — `@sentry/nextjs` includes its own CLI for source map uploads.

---

## Environment Variables

| Variable               | Service  | Required for            | Notes                                                                 |
| ---------------------- | -------- | ----------------------- | --------------------------------------------------------------------- |
| `POSTHOG_KEY`          | PostHog  | server + client         | Project API key (not personal API key). Found in Project Settings → API Keys. |
| `POSTHOG_HOST`         | PostHog  | server + client         | `https://us.i.posthog.com` (US cloud) or `https://eu.i.posthog.com` (EU cloud). Default to US. |
| `SENTRY_DSN`           | Sentry   | server + client         | DSN URL from Project Settings → Client Keys (DSN).                    |
| `SENTRY_ORG`           | Sentry   | build (sourcemap upload)| Sentry organization slug (from URL or Settings).                      |
| `SENTRY_PROJECT`       | Sentry   | build (sourcemap upload)| Sentry project slug (from URL or Settings).                           |
| `SENTRY_AUTH_TOKEN`    | Sentry   | build (sourcemap upload)| Auth token with `org:read` + `project:releases` scopes.               |

Values are never committed. Documented in Vercel when deploying. Missing values should degrade gracefully (analytics/monitoring silently disabled) — not crash the app.

---

## File Structure

```
lib/
  analytics/
    posthog.ts         # PostHog server-side singleton + typed capture helpers
    posthog-client.ts  # Client-side PostHog initialization + identify/capture wrappers
    events.ts          # Event name constants + property shape definitions
    posthog.test.ts    # Unit tests for server-side helpers
  monitoring/
    sentry.ts          # Sentry server-side helpers (captureException wrappers, tag helpers)
    sentry-client.ts   # Client-side Sentry initialization (re-exported from @sentry/nextjs)
    sentry.test.ts     # Unit tests for server-side helpers

app/
  layout.tsx           # Updated: wrap with Sentry ErrorBoundary + PostHogProvider

instrumentation.ts     # NEW: Next.js instrumentation hook for Sentry server init
sentry.client.config.ts   # NEW: Sentry client-side config
sentry.server.config.ts   # NEW: Sentry server-side config
sentry.edge.config.ts     # NEW: Sentry edge runtime config

trigger.config.ts      # Updated: add Sentry client init at task entry (optional, for task-level error capture)
```

---

## PostHog Integration

### Server-Side Singleton (`lib/analytics/posthog.ts`)

A lazy, singleton `PostHog` instance initialized from env vars. Exports thin capture helpers:

```ts
import { PostHog } from "posthog-node";

const posthogClient =
  process.env.POSTHOG_KEY && process.env.POSTHOG_HOST
    ? new PostHog(process.env.POSTHOG_KEY, {
        host: process.env.POSTHOG_HOST,
      })
    : null;

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthogClient?.identify({ distinctId: userId, properties });
}

export function trackEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>
) {
  posthogClient?.capture({ event, distinctId, properties });
}

export function shutdownPosthog() {
  return posthogClient?.shutdown();
}
```

Key behaviors:

- **Graceful no-op:** If `POSTHOG_KEY` or `POSTHOG_HOST` is missing, all helpers are silent no-ops — the app works without analytics.
- **`distinctId`:** Always the Clerk `userId` (the CUID from the `User` table). PostHog associates events with this ID.
- **No PII:** Never send `email`, `name`, or `domain` as PostHog event properties. Use `userId` only for identification.

### Client-Side Initialization (`lib/analytics/posthog-client.ts`)

Uses `posthog-js` (browser SDK). Lazily initialized in a React provider component:

```ts
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,    // we capture manually for server-controlled timing
      capture_pageleave: true,
      autocapture: false,         // explicit events only — avoids noise from clicks
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

Key behaviors:

- **Disabled by default in dev:** PostHog defaults to not capturing when `NEXT_PUBLIC_POSTHOG_KEY` is undefined.
- **`autocapture: false`:** Explicit events only — no automatic click/scroll capture.
- **`capture_pageview: false`:** We'll capture page views explicitly via Next.js route changes to get accurate SPA navigation tracking.
- **`person_profiles: "identified_only":** Only creates person profiles when `posthog.identify()` is called — avoids anonymous profile bloat.

### Event Constants (`lib/analytics/events.ts`)

Central file defining all tracked event names and their expected property shapes:

```ts
export const EVENTS = {
  // Auth & Onboarding
  USER_SIGNED_UP: "user_signed_up",
  USER_SIGNED_IN: "user_signed_in",
  ONBOARDING_COMPLETED: "onboarding_completed",
  DOMAIN_ADDED: "domain_added",

  // Scans
  SCAN_INITIATED: "scan_initiated",
  SCAN_COMPLETED: "scan_completed",
  SCAN_FAILED: "scan_failed",

  // Prompts
  PROMPT_GENERATED: "prompt_generated",
  PROMPT_ADDED: "prompt_added",
  PROMPT_ARCHIVED: "prompt_archived",

  // Billing
  CHECKOUT_INITIATED: "checkout_initiated",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  PLAN_UPGRADED: "plan_upgraded",

  // Feature Usage
  DASHBOARD_VIEWED: "dashboard_visited",
  MODELS_TAB_OPENED: "models_tab_opened",
  EXPORT_CSV: "export_csv",

  // Errors (client-side)
  CLIENT_ERROR: "client_error",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
```

### Where to Capture Events

| Event                    | Where to Capture                        | Trigger                                         |
| ------------------------ | --------------------------------------- | ----------------------------------------------- |
| `USER_SIGNED_UP`         | `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | PostHog `onSignUp` callback (or `afterSignUpUrl` hook) |
| `USER_SIGNED_IN`         | PostHog `onSignIn` callback             | After successful sign-in                        |
| `ONBOARDING_COMPLETED`   | `components/onboarding/onboarding-form.tsx` | After `createCompany` succeeds               |
| `DOMAIN_ADDED`           | `components/dialogs/add-domain-dialog.tsx` | After `POST /api/domain` succeeds             |
| `SCAN_INITIATED`         | `POST /api/scans` route                 | After scan record created + task triggered      |
| `SCAN_COMPLETED`         | `lib/jobs/scan.ts` (runScan task)       | After all prompts processed, status → COMPLETED |
| `SCAN_FAILED`            | `lib/jobs/scan.ts` (runScan task)       | After unrecoverable failure, status → FAILED    |
| `PROMPT_GENERATED`       | `POST /api/prompts/generate` route      | After AI suggestions saved                     |
| `PROMPT_ADDED`           | `POST /api/prompts` (if manual add)     | After prompt persisted                         |
| `PROMPT_ARCHIVED`        | `POST /api/prompts/:id/archive` (if exists) | After prompt archived                     |
| `CHECKOUT_INITIATED`     | `POST /api/billing/checkout` route      | After Stripe session created                   |
| `SUBSCRIPTION_ACTIVATED` | `POST /api/webhooks/stripe` route       | After `checkout.session.completed` event       |
| `DASHBOARD_VIEWED`       | `app/(editor)/editor/page.tsx` (Server Component) | On dashboard render (once per page load) |
| `MODELS_TAB_OPENED`      | `components/editor/models-tab.tsx`      | On popover open                                 |
| `EXPORT_CSV`             | Trend chart CSV export (if implemented)  | On export click                                 |

Server-side events (scan, billing, prompts) use the server PostHog singleton directly. Client-side page views use the `posthog-js` browser SDK via `usePostHog()` hook or the `PostHogProvider`.

### User Identification

In the root layout or a top-level effect, identify the user to PostHog after Clerk auth resolves:

```ts
// In app/(editor)/layout.tsx or a useEffect in the editor layout
useEffect(() => {
  if (user?.id) {
    posthog.identify(user.id);
  }
}, [user?.id]);
```

This runs once per session and associates all subsequent events with the Clerk `userId`.

---

## Sentry Integration

### Client Config (`sentry.client.config.ts`)

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0,   // no replay in MVP
  replaysOnErrorSampleRate: 0,   // no replay in MVP
  enabled: process.env.NODE_ENV !== "development" || !!process.env.SENTRY_DSN,
});
```

### Server Config (`sentry.server.config.ts`)

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV !== "development" || !!process.env.SENTRY_DSN,
});
```

### Edge Config (`sentry.edge.config.ts`)

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV !== "development" || !!process.env.SENTRY_DSN,
});
```

### Instrumentation Hook (`instrumentation.ts`)

Next.js 16 uses `instrumentation.ts` at the project root to initialize server-side instrumentation:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

**Note:** Check Next.js 16 docs in `node_modules/next/dist/docs/` — the instrumentation API may have changed. Follow whatever the installed version documents.

### Root Layout Update (`app/layout.tsx`)

Wrap the component tree with Sentry's `ErrorBoundary` and PostHog's `PostHogProvider`:

```tsx
import { PostHogProvider } from "@/lib/analytics/posthog-client";
import { ErrorBoundary } from "@sentry/nextjs"; // or @sentry/react if ErrorBoundary is there

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ theme: dark }} localization={localization}>
      <PostHogProvider>
        <ErrorBoundary fallback={<div>Something went wrong.</div>}>
          <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
            <body className="min-h-full flex flex-col bg-background text-foreground">
              <TooltipProvider>{children}</TooltipProvider>
            </body>
          </html>
        </ErrorBoundary>
      </PostHogProvider>
    </ClerkProvider>
  );
}
```

**Note:** `ErrorBoundary` from `@sentry/nextjs` wraps the client component tree and catches rendering errors. Server-side errors are caught automatically by Sentry's server config.

### Sentry Server Helpers (`lib/monitoring/sentry.ts`)

Thin wrappers for consistent tagging and context enrichment in API routes and background jobs:

```ts
import * as Sentry from "@sentry/nextjs";

export function captureApiError(error: unknown, route: string, userId?: string) {
  Sentry.withScope((scope) => {
    scope.setTag("route", route);
    if (userId) scope.setUser({ id: userId });
    Sentry.captureException(error);
  });
}

export function captureJobError(error: unknown, jobName: string, scanId?: string) {
  Sentry.withScope((scope) => {
    scope.setTag("job", jobName);
    if (scanId) scope.setTag("scanId", scanId);
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}
```

### Where to Instrument Sentry

| Context                   | Where to Capture                           | What                                                                 |
| ------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| API route errors          | `app/api/**/route.ts` catch blocks         | `captureApiError(error, "/api/scans")`                              |
| Background job failures   | `lib/jobs/scan.ts` (runScan catch block)   | `captureJobError(error, "scan-company", scanId)`                    |
| Unhandled server errors   | Sentry server config auto-captures         | Global handler — no manual work needed                               |
| React render errors       | `ErrorBoundary` in root layout             | Catches component crashes; shows fallback UI                        |
| Client-side JS errors     | Sentry client config auto-captures         | Global handler — no manual work needed                               |
| AI provider failures      | `lib/providers/errors.ts` (if adding Sentry) | Optional: `captureMessage` on provider timeout/rate-limit for monitoring |

### Sentry + Trigger.dev

Trigger.dev tasks run in a separate worker process. To capture errors from tasks:

1. Import `@sentry/nextjs` in `lib/jobs/scan.ts`
2. Initialize Sentry at the top of the `runScan` task function (or rely on the global init from `sentry.server.config.ts` if Trigger.dev loads it)
3. Wrap the main scan loop in a try/catch that calls `captureJobError()`

**Important:** Verify that Trigger.dev's worker process loads `instrumentation.ts`. If it does not (common with bundler-based workers), call `Sentry.init()` directly at the top of the task file with the same DSN. Check Trigger.dev docs or test empirically.

---

## Root Layout Provider Order

The provider nesting order in `app/layout.tsx` should be:

```
ClerkProvider
  └─ PostHogProvider (client component — "use client")
      └─ ErrorBoundary (Sentry — client component)
          └─ html > body > TooltipProvider > {children}
```

This order ensures:
1. Clerk auth context is available to all child components
2. PostHog is initialized before any analytics calls
3. Sentry catches errors from PostHog initialization and all downstream components
4. `TooltipProvider` sits inside both (it needs no error boundary)

---

## Development Behavior

- **PostHog:** Disabled by default in development (`NEXT_PUBLIC_POSTHOG_KEY` not set → no-op). To test locally, set the key in `.env.local`.
- **Sentry:** Enabled in development only if `SENTRY_DSN` is set (the `enabled` flag checks this). Errors go to the Sentry dev project. In development without a DSN, Sentry is a silent no-op.
- **Source maps:** Sentry CLI uploads source maps during `next build` (triggered by `@sentry/nextjs`'s build plugin). In development, no upload happens.

---

## Build Integration

`@sentry/nextjs` hooks into `next build` automatically via its webpack/turbopack plugin to upload source maps. No changes to `package.json` scripts are needed — the SDK handles this when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set in the environment.

If build-time source map upload is not desired (e.g., to keep builds fast in dev), the plugin only activates when the env vars are present.

---

## Testing (Vitest)

Co-located tests for the server-side wrappers:

| File                         | Covers                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `lib/analytics/posthog.test.ts` | `trackEvent` / `identifyUser` / `shutdownPosthog` — verify no-op behavior when env vars missing, verify correct PostHog method calls when configured |
| `lib/monitoring/sentry.test.ts` | `captureApiError` / `captureJobError` — verify `Sentry.withScope` is called with correct tags and user context; verify `captureMessage` delegates correctly |

Mock `posthog-node` and `@sentry/nextjs` via `vi.mock()` in each test file. These are thin wrappers — tests verify delegation, not SDK behavior.

---

## Validation

- `npm test` — Vitest unit tests pass
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- `context/context/progress-tracker.md` updated (spec entry + session note)

---

## Out of Scope

Do not implement:

- PostHog session recording or autocapture
- PostHog feature flags (add post-MVP if needed)
- PostHog A/B testing
- Sentry performance monitoring dashboards (use Sentry UI directly)
- Sentry session replay (disabled in config; add post-MVP)
- Sentry Cron Monitoring (no cron jobs in MVP)
- Vercel Analytics (separate spec, if desired)
- Custom error boundary fallback UIs (use Sentry's default for MVP)
- Analytics consent banner / GDPR cookie consent (PostHog handles this natively in EU; add if needed)
- Event-level billing analytics (PostHog UI handles this via `SUBSCRIPTION_ACTIVATED` events)

---

## Future

Reserved extensions (do not implement):

- PostHog feature flags for gradual rollout
- PostHog session recording for UX debugging
- PostHog group analytics (company-level cohort analysis)
- Sentry cron monitoring for scheduled Trigger.dev tasks
- Sentry release health tracking
- Custom Sentry dashboards with alert rules
- Analytics consent banner for GDPR/CCPA compliance

---

## Definition of Done

- `posthog-js`, `posthog-node`, and `@sentry/nextjs` installed
- `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` documented in this spec and set in Vercel env vars
- `lib/analytics/` exists with `posthog.ts`, `posthog-client.ts`, `events.ts`, and `posthog.test.ts`
- `lib/monitoring/` exists with `sentry.ts`, `sentry-client.ts`, and `sentry.test.ts`
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation.ts` created at project root
- `app/layout.tsx` updated with `PostHogProvider` and Sentry `ErrorBoundary`
- PostHog `identify()` called with Clerk `userId` in the editor layout
- All events from the Events table are captured at the specified locations
- API routes wrap catch blocks with `captureApiError()`
- Trigger.dev `runScan` task wraps failure path with `captureJobError()`
- PostHog is disabled (silent no-op) when env vars are missing
- Sentry is disabled (silent no-op) when `SENTRY_DSN` is missing
- No PII (email, name, domain) is sent to PostHog
- Vitest tests pass for `posthog.test.ts` and `sentry.test.ts`
- `npm run build` passes with no errors
- `progress-tracker.md` reflects the completed work
