# Dashboard UI

## Goal

Replace the current dashboard placeholder with the authenticated AnswerOS workspace that lets a company understand its latest AI-search visibility at a glance and decide what to do next.

The dashboard is a server-first composition of the existing company and scoring data. It presents the latest completed scan, the weighted visibility score, factor details, mention metrics, prompt performance, competitor mentions, historical scores, and stored recommendations without moving business logic or score calculation into the browser.

```
Protected editor layout
  → app/(editor)/editor/page.tsx              [server component]
    → company + dashboard read model           [Postgres via lib/db]
      → DashboardContent                        [interactive client boundary]
        → score card / factors / metrics / charts / prompts / recommendations
        → existing domain + Run Scan dialogs
```

Do **not** implement:

- scan execution, provider calls, Trigger.dev tasks, or scan polling/realtime
- the recommendations-generation engine or AI-generated recommendation content
- competitor onboarding, auto-discovery, or a separate competitor-management page
- Stripe, reports, analytics, or monitoring integrations
- a client-side visibility-score calculation
- a new visibility API route unless a later client interaction genuinely requires one
- a charting dependency; use existing primitives and a small accessible SVG/CSS visualization

Follow:

- `CLAUDE.md` — **read first**; it `@`-imports `AGENTS.md`, including the Next.js-version warning and project workflow rules
- `context/project-overview.md` — dashboard goals and MVP scope
- `context/architecture.md` — server-side score invariant, ownership model, and storage boundaries
- `context/ui-context.md` — dark theme, dashboard shell, colors, responsive layout, and component conventions
- `context/code-standards.md` — server components by default, thin data helpers, `components/dashboard/`, and no hardcoded colors
- `context/ai-workflow-rules.md` — scope discipline and documentation requirements
- `context/progress-tracker.md` — current implementation state
- `context/features-specs/07-wire-dashboard.md` — existing company loading and dialog wiring
- `context/features-specs/13-visibility-score.md` — score output, factors, summaries, and the honest 95-point MVP ceiling

---

## Prerequisites

Before beginning implementation:

- Read `CLAUDE.md` (mandatory).
- Confirm the authenticated editor route and shell are working:
  - `app/(editor)/layout.tsx`
  - `app/(editor)/editor/page.tsx`
  - `components/editor/editor-layout.tsx`
  - `components/editor/dashboard-content.tsx`
- Confirm the existing domain and scan actions remain available through `useDialogs`:
  - Add Domain
  - Edit Domain
  - Remove Domain
  - Run Scan
- Confirm `lib/db/scoring.ts` exposes `getCompanyScore(companyId)` and that it reads only the latest `COMPLETED` scan.
- Confirm `ScanResult.error` is present and failed checks are excluded from score factors and denominators.
- Confirm no chart library is installed. Do not add one for this feature; the trend visualization must use existing React/SVG/CSS capabilities.

There are no required schema changes or new environment variables for the dashboard UI.

---

## Current State

The current route already resolves the signed-in user's company server-side and passes it to `DashboardContent`, but the company state renders a centered placeholder with domain actions only.

Existing data and UI contracts:

- `getCompanyByClerkId(clerkId)` resolves the user's company and enforces the one-company MVP model.
- `getCompanyScore(companyId)` returns `{ score, factors, summary }` for the latest completed scan, or `null` when no completed scan exists.
- `ScoreSummary` contains `results`, `validResults`, `mentions`, and `errors`.
- `VisibilityFactors` contains `mentionRate`, `averageRank`, `sentiment`, `competitorShare`, and `sourceAuthority` as normalized `0–1` values.
- `ScanResult` contains prompt/provider outcome data, model-reported rank and sentiment, competitor mentions, and an optional error.
- `Recommendation` rows already exist in Prisma with `priority`, `estimatedImpact`, `category`, `description`, and `completed`.
- `Competitor` rows already exist, but the pipeline currently records free-text competitor mentions in `ScanResult.competitorsMentioned`; it does not calculate independent competitor visibility scores.
- `RunScanDialog` submits to `POST /api/scans`, refreshes the route on success, and keeps its own inline error state.

Known gaps this feature fills:

- no score card or factor explanation is visible
- no scan summary is visible after a completed scan
- no prompt, competitor, trend, or recommendation presentation exists
- the dashboard does not distinguish no company, no scan, scanning, failed checks, and usable results
- historical score data is not yet assembled for the trend visualization

---

## Decisions (2026-08-19)

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Keep the page server-first: fetch the company and dashboard read model in `app/(editor)/editor/page.tsx`, then pass serializable props into client components only for dialog triggers and browser interactions | Initial dashboard data does not need client fetching; this preserves fast SSR and keeps Prisma/server-only scoring out of the browser (architecture invariant #4) |
| 2 | The dashboard calls `getCompanyScore(companyId)` directly; do not add `GET /api/visibility` for the initial render | A server component is the only initial consumer, so an API hop would duplicate the boundary without adding value |
| 3 | Add thin read helpers for dashboard-only aggregates, reusing `calculateVisibilityScore` for score history; do not put Prisma queries or aggregation logic inside UI components | Keeps components presentational and follows the existing `lib/db/` repository pattern |
| 4 | Use the latest completed scan as the primary dashboard snapshot. If there are fewer than two completed scans, show the trend panel's “Run another scan to see history” empty state | The scanner has no meaningful historical comparison until multiple completed scans exist; do not imply a trend from one point |
| 5 | Show competitor **mention counts/share** from `competitorsMentioned` and label the panel accordingly. Do not fabricate side-by-side competitor visibility scores from the `Competitor` table | The current pipeline does not calculate independent competitor scores; honest presentation is more important than filling the chart with unsupported numbers |
| 6 | Treat `95` as the MVP perfect ceiling in copy and styling, while retaining the `0–100` score scale | Source authority is intentionally neutral `0.5` until citation data exists; dashboard copy must not present the ceiling as a scoring defect |
| 7 | Use shadcn/ui, Lucide React, Tailwind tokens, and CSS/SVG only. No new UI, chart, animation, or data-fetching dependency | Matches the installed stack and keeps the dashboard lightweight and maintainable |
| 8 | Keep live scan progress and automatic refresh out of this feature. After starting a scan, refresh the server-rendered dashboard once and show the latest persisted state | Real-time run subscriptions/polling need their own data contract and are not present in the current architecture |

---

## Dashboard Data Contract

The server-side page should compose a serializable view model. The exact interface may be named differently, but it must contain the following information:

```ts
interface DashboardData {
  company: {
    id: string;
    name: string;
    domain: string;
  };
  latestScan: {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    createdAt: string;
    completedAt: string | null;
  } | null;
  score: ScoredScan | null;
  trend: Array<{
    scanId: string;
    completedAt: string;
    score: number | null;
  }>;
  promptPerformance: Array<{
    promptId: string;
    text: string;
    category: string;
    mentionRate: number;
    averageRank: number | null;
    competitorMentionCount: number;
  }>;
  competitorMentions: Array<{
    name: string;
    mentions: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    priority: number;
    estimatedImpact: number | null;
    completed: boolean;
  }>;
}
```

Requirements:

- Dates are serialized before crossing from the server component into a client component; do not pass Prisma `Date` objects into client props.
- `score` is `null` when there is no completed scan or when the latest scan has zero valid rows. The UI must not turn this into `0`.
- Error rows are shown in the summary as `errors`, but never included in mention-rate, rank, sentiment, or competitor denominators.
- The view model must be scoped to the authenticated user's company. Never accept a company id from the browser as an authorization mechanism.
- No raw AI response is sent to the client as part of the dashboard view model.
- Empty arrays are valid and should render designed empty states, not runtime errors.

### Read Helpers

Create or extend thin helpers under `lib/db/` as needed:

- `getLatestScanForCompany(companyId)` — latest scan for status display, including `createdAt` and `completedAt`.
- `getCompanyScore(companyId)` — existing latest-completed score helper.
- `getCompanyScoreHistory(companyId, limit)` — completed scans ordered oldest-to-newest, mapping each scan's rows through the pure calculator. Keep the calculation server-side and reuse the same weights/formulas as the headline score.
- `getPromptPerformanceForScan(scanId)` — joins prompt metadata with valid result rows and aggregates mention rate, average rank, and competitor mentions per prompt.
- `getCompetitorMentionsForScan(scanId)` — safely parses `competitorsMentioned` JSON and returns bounded name/count pairs. Do not use unvalidated JSON directly in JSX.
- `getRecommendationsForCompany(companyId, limit)` — returns incomplete recommendations ordered by priority, then creation date.

Helpers should remain query/normalization focused. Do not make one large helper that owns rendering decisions, copy, or Tailwind classes.

---

## Page Composition

Update the existing dashboard route rather than creating a second authenticated dashboard route. The editor shell and navbar remain responsible for navigation; this feature owns the page content inside the shell.

Recommended structure:

```text
app/(editor)/editor/
  page.tsx                         # server data composition
  loading.tsx                      # route-level loading skeleton
components/dashboard/
  dashboard-content.tsx            # client boundary for actions
  dashboard-header.tsx
  visibility-score-card.tsx
  score-factor-breakdown.tsx
  mentions-overview.tsx
  trend-graph.tsx
  prompt-performance.tsx
  competitor-mentions.tsx
  recommendations-list.tsx
  dashboard-empty-state.tsx
  dashboard-no-scan.tsx
  dashboard-scan-state.tsx
```

`components/ui/*` remains generated shadcn/ui code and must not be manually modified.

### Dashboard Header

When a company exists, display:

- company name as the page heading
- monitored domain as secondary text
- a concise “Last scanned” timestamp when a completed scan exists
- primary `Run Scan` button using the existing `run-scan` dialog
- a compact overflow or secondary action area for existing Edit Domain and Remove Domain actions if the current layout needs to move them out of the placeholder

When no company exists, render the dedicated empty state instead of the dashboard grid.

### Visibility Score Card

The score card is the primary visual anchor:

- display the integer score as `score / 100` when `score` is non-null
- display a clear “No score yet” state when `score` is `null`
- use the danger → warning → success gradient defined by `ui-context.md`
- include short explanatory copy: the score combines mention rate, rank, sentiment, competitor share, and source authority
- include the completed scan date
- never imply that the score is a live or real-time number
- when the score is in the high range, do not promise that 100 is currently reachable; the supporting copy may explain the MVP's neutral source-authority factor

The score card may use a circular progress treatment, but it must remain readable without color and expose the numeric value as text.

### Factor Breakdown

Show all five factors from `VisibilityFactors`:

| Factor | Display |
| --- | --- |
| Mention rate | Percentage and progress bar |
| Average rank | Human-readable rank visibility score; explain that earlier positions score higher |
| Sentiment | Positive/neutral/negative-derived percentage; do not expose raw implementation math as jargon |
| Competitor share | Percentage labeled as tracked-company share relative to competitor mentions |
| Source authority | “Neutral in MVP” or equivalent explanatory label because citation data is not captured yet |

Use `Progress`, `Tooltip`, or accessible text to provide context. Factor values are normalized `0–1`; format them as percentages only at the presentation boundary.

### Mentions Overview

Provide a compact metrics card or row showing:

- valid checks completed
- total checks
- tracked-company mentions
- mention rate
- failed checks, when `errors > 0`
- the four provider names only when provider-level data is available; do not show a provider as successful merely because it is configured

Error copy should make clear that failed checks were excluded from the score rather than treated as non-mentions.

### Trend Graph

Render completed scan scores oldest-to-newest:

- use a simple SVG line/area chart or another dependency-free visualization
- include accessible text/table-equivalent values for screen readers and users who do not interpret the graphic
- show the completed date and score on hover/focus where possible
- do not calculate or display a “change” badge unless at least two non-null historical scores exist
- with zero or one point, show the designed history empty state and a `Run Scan` CTA
- skip `null` scores from the plotted line, but communicate that a scan had no usable rows if it is part of the history

### Prompt Performance

Render two related sections or tabs:

1. **Top prompts** — prompts with the highest valid mention rate, with rank as a tie-breaker.
2. **Missing opportunities** — prompts where the company was not mentioned and competitors were mentioned, ordered by competitor mention count and then prompt relevance data available from the database.

Each row should show:

- prompt text, truncated safely with a tooltip or expandable treatment
- category badge
- mention rate or “Not mentioned” state
- average rank when available
- competitor mention indicator for missing opportunities

Do not expose raw model responses in this dashboard view. A detailed scan-results page is a future feature.

### Competitor Mentions

Until independent competitor scoring exists, display a panel titled **Competitor mentions** or equivalent:

- rank competitor names by occurrence in valid result rows
- show mention counts, not unsupported competitor visibility scores
- distinguish “no competitors detected” from “no scan data"
- cap the displayed list to a small dashboard-friendly number and provide no fake click-through
- use the `Competitor` table only for configured display metadata when it matches safely; the score and counts come from `competitorsMentioned`

### Recommendations

Display incomplete `Recommendation` rows:

- order by priority, then newest first
- show title, description, category, and `estimatedImpact` when present
- use visual priority treatment that is understandable without color alone
- show a dedicated empty state when no recommendations exist
- do not generate, mutate, dismiss, or mark recommendations complete in this feature unless an existing, authorized mutation already exists

---

## Dashboard States

Every state must be intentional and visually consistent with `ui-context.md`.

### No Company

Reuse the existing onboarding path:

- explain that a domain is required before visibility can be measured
- primary CTA: `Add Domain`
- do not render score, scan, recommendation, or competitor panels

### Company, No Completed Scan

Display:

- company/domain header
- a “Run your first scan” empty state
- explanation that scans run in the background across the configured AI providers
- primary `Run Scan` CTA
- no misleading zero score or empty chart axes pretending to be data

### Scan Pending or Running

Use the latest persisted scan status:

- show a non-error in-progress banner or card
- disable or guard duplicate `Run Scan` actions consistently with the existing single-active-scan API guard
- explain that the page can be revisited while the scan runs
- do not claim live progress or provider completion without a realtime/status data source
- keep previously completed snapshot data visible if one exists

### Completed Scan With Usable Rows

Render the full dashboard composition described above.

### Completed Scan With All Rows Errored

Treat the score as unavailable, not zero:

- explain that the scan completed but produced no usable checks
- show the error count
- provide `Run Scan` as the recovery action
- avoid rendering empty factor bars that look like a score of zero

### Partial Errors

Render the score from valid rows and show a visible but non-blocking warning that failed checks were excluded. Do not hide the warning in a tooltip only.

### Database or Read Failure

Use the existing Next.js error boundary conventions for an unrecoverable server read failure. Do not catch a database error and render a fabricated empty dashboard.

---

## Responsive Behaviour

Follow `ui-context.md`:

- mobile: single-column cards; header actions wrap; trend and prompt content remain readable without horizontal page overflow
- tablet: two-column card grid where content supports it
- desktop: score/factor region and overview metrics at the top, followed by a responsive two-column content grid for trend, prompts, competitors, and recommendations
- tables or dense prompt lists may scroll horizontally inside their own bordered panel, never the entire page
- dashboard shell/sidebar behavior remains owned by `EditorLayout` and `NavigationSidebar`

Use `min-w-0` on grid children containing long prompt text or charts.

---

## Accessibility

Support:

- semantic headings with one page-level `h1`
- keyboard-accessible Run Scan, domain actions, tooltips, and chart focus targets
- visible focus states from the shared design system
- text alternatives for every chart and score visualization
- `aria-label` or visible labels for icon-only actions
- `role="status"` for non-blocking scan-state updates and `role="alert"` for actionable errors
- sufficient contrast for score states; never communicate status through color alone
- reduced-motion-friendly CSS; no required animation for understanding the data

---

## Loading and Error Boundaries

Create a route-level `loading.tsx` that mirrors the dashboard geometry using `Skeleton` components:

- header skeleton
- score card skeleton
- factor/metrics skeletons
- chart and list skeletons

Skeletons must not contain fake values such as `72` or fabricated prompt names.

If a client action fails, keep the existing dialog open and show its inline error. Do not replace the whole dashboard with a client-side error message.

---

## Testing

MVP remains focused on core logic rather than browser E2E tests:

- keep dashboard aggregation/normalization helpers pure where possible and add co-located Vitest tests for:
  - valid/error row filtering
  - prompt mention-rate and rank aggregation
  - competitor JSON parsing and count bounding
  - score-history ordering and null-score handling
  - recommendation ordering
- verify TypeScript props prevent Prisma objects, raw JSON, or `Date` objects from crossing into client components
- visual/manual verification covers every dashboard state below

No browser automation framework or chart dependency is required for this feature.

---

## Validation

- `npm test` — existing unit tests plus dashboard aggregation tests pass
- `npm run lint` — no ESLint errors
- `npm run build` — passes with no type errors
- manual with no company:
  - sign in → dashboard shows Add Domain empty state
- manual with a company and no completed scan:
  - dashboard shows first-scan state and Run Scan action
- manual with a completed scan:
  - score, factors, mentions, prompt performance, competitor mentions, trend, and recommendations render from persisted data
  - error rows are excluded from score math and clearly reported
  - score 95 is presented as the MVP ceiling, not a broken 100-point scale
- manual with a scan containing only errors:
  - score remains unavailable and the recovery action is visible
- manual after starting a scan:
  - existing Run Scan dialog submits successfully, page refreshes, and no duplicate client fetch layer is introduced
- responsive check at mobile, tablet, and desktop widths
- keyboard and screen-reader sanity check for actions, score, lists, and chart alternative text
- `context/context/progress-tracker.md` updated with the implementation result

---

## Out of Scope

Do not implement:

- scan execution or provider integration
- scan-status polling, Trigger.dev realtime subscriptions, or live provider progress
- a new scoring algorithm, client-side score calculation, or score API route for the initial server render
- source-authority/citation capture
- independent competitor score calculation, competitor CRUD, or auto-discovery
- recommendation generation, AI recommendation calls, or recommendation mutation flows
- scan-history/detail routes or raw AI-response exploration
- weekly reports, Stripe, PostHog, Sentry, or deployment configuration
- a charting, animation, state-management, or data-fetching package
- light mode or a new visual theme

---

## Future

Reserved extensions:

- live scan progress using a documented Trigger.dev realtime client contract
- scan history and per-provider result detail pages
- independent competitor scores and side-by-side comparison
- score deltas and trend arrows after the history contract stabilizes
- recommendation completion and recommendation detail flows
- citation/source-authority data, making 100 reachable
- dashboard filters by provider, prompt category, date range, and scan
- exportable reports and scheduled report previews

---

## Definition of Done

- `app/(editor)/editor/page.tsx` remains a server component and composes company/dashboard data server-side.
- The current placeholder is replaced by reusable dashboard components under `components/dashboard/`.
- No score, factor, or authorization logic is implemented in client components.
- The score card renders the server-computed `ScoredScan` output and handles `null` honestly.
- All five factors and the mentions summary are visible with accessible explanations.
- Trend, prompt performance, competitor mentions, and recommendation panels have real persisted-data states and intentional empty states.
- Competitor data is labeled as mentions/counts until independent competitor scoring exists.
- Existing Add/Edit/Remove Domain and Run Scan dialog flows continue to work.
- Loading, no-company, no-scan, running, partial-error, all-error, and read-failure states are covered.
- Tailwind tokens, shadcn/ui, and Lucide React are used; no hardcoded component colors or new UI dependencies are introduced.
- No raw AI responses, Prisma objects, `Date` instances, or unvalidated JSON cross into client props.
- `npm test`, `npm run lint`, and `npm run build` pass.
- `progress-tracker.md` records the completed dashboard implementation after the feature is built.
