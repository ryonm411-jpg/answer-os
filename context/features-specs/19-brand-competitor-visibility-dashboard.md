# Brand & Competitor Visibility Dashboard — Multi-Brand Visibility Trend & Competitor Leaderboard

> **Status:** Proposed specification
> **Created:** August 25, 2026
> **Depends on:** `07-wire-dashboard.md`, `13-visibility-score.md`, `14-dashboard-ui.md`, `18-all-models-tab.md`

---

## 1. Goal

Upgrade the AnswerOS Overview Dashboard to match modern AI-search monitoring dashboards (as shown in the visual specification reference):

1. **Top Bar Workspace Filters**:
   - Brand pill selector (e.g. `Skinit`)
   - Date Range filter dropdown (e.g. `Last 14 days`, `Last 30 days`, `Last 90 days`, `All time`)
   - AI Model filter dropdown (e.g. `All Models`, or single provider selection like ChatGPT, Claude, Gemini, etc.)
   - Header help trigger (`?`)

2. **Visibility Trend Card (Left Section)**:
   - Header title: **Visibility** — *Percentage of chats mentioning each brand*
   - Header action: **Export** button (downloads CSV/PNG report of line chart data)
   - Multi-brand line graph plotting visibility percentages ($0\%$ to $100\%$) across time (`Sep 24` to `Oct 3`) for the primary brand and top competitor brands.
   - Interactive hover cursor + floating tooltip card displaying the exact date header (`2025-10-01`) and a breakdown list containing each brand's icon, name, and exact visibility percentage on that date.

3. **Competitors Leaderboard Table (Right Section)**:
   - Header title: **Competitors** — *Brands with highest visibility*
   - Header action: **Show All ↗** link to navigate or expand full competitor analytics view.
   - Table displaying rank position (`#`), `Brand` (with logo/favicon + name), `Visibility (%)`, `Sentiment (0-100)`, and `Position (avg rank)` with info tooltips (`(i)`) explaining each metric.

---

## 2. Mandatory Context Reads

Before implementing this feature, read these files in order:

1. `CLAUDE.md` — agent rules and Next.js guidelines.
2. `context/project-overview.md` — product goals and core user experience.
3. `context/architecture.md` — server-first scoring invariant and data boundaries.
4. `context/ui-context.md` — editor shell layout, color tokens, and component conventions.
5. `context/code-standards.md` — server component separation, helper module guidelines.
6. `context/features-specs/13-visibility-score.md` — visibility calculation formulas and score factors.
7. `context/features-specs/14-dashboard-ui.md` — current dashboard layout & read model contract.
8. `context/features-specs/18-all-models-tab.md` — AI model provider filtering and preference contracts.

---

## 3. Current State

Reference points in the workspace:

- `components/dashboard/trend-graph.tsx` — currently renders a single-brand score trend line chart using SVG paths for historical scans.
- `components/dashboard/competitor-mentions.tsx` — currently renders a basic competitor mention list with mention counts and share percentage.
- `lib/db/dashboard.ts` — contains `getDashboardData()`, `getCompanyScoreHistory()`, and `getCompetitorMentionsForScan()`.
- `lib/scoring/calculator.ts` — contains visibility scoring calculations (`calculateVisibilityScore`).

Known gaps this specification resolves:
- Trend graph only plots the primary brand's score, not competitor brands over time.
- No date-range filter (`Last 14 days`, `Last 30 days`, etc.) or model-specific filter applied to the trend chart.
- Hover tooltip on trend graph does not display a multi-brand breakdown list for the hovered date node.
- Competitor table lacks sentiment scores, average position rankings, and explanatory info tooltips (`(i)`).
- No CSV data export trigger on the Visibility chart.

---

## 4. Decisions

| # | Decision | Rationale |
| - | -------- | --------- |
| 1 | **Multi-Brand Trend Tracking**: Store and calculate per-scan visibility percentages for both the primary brand and top competitor brands across historical scans | Enables side-by-side visibility comparison over time (e.g. Skinit vs MightySkins vs DecalGirl) |
| 2 | **Interactive Hover Card**: Render a rich SVG cursor line + HTML floating popover on hover with exact brand breakdown on date nodes | Provides instant date-by-date visual inspection without cluttering the main chart area |
| 3 | **Filter Bar Controls**: Add `DateRangePicker` (`14d`, `30d`, `90d`, `all`) and `ModelFilter` (`all` or specific `AIProvider`) to the top navbar/header section | Allows users to inspect visibility trends across specific timeframes or specific AI engines |
| 4 | **Competitor Metrics Table**: Calculate `Visibility (%)`, `Sentiment (0-100)`, and `Position (avg position)` per competitor from `ScanResult.competitorsMentioned` data | Gives users actionable competitive intelligence matching standard search monitoring tools |
| 5 | **CSV Export**: Include a client-side CSV generator for the Visibility trend dataset | Allows users to download raw time-series data for reporting and analysis |

---

## 5. Data Model & Aggregation Extensions

### 5.1 Dashboard Multi-Brand Trend Read Model

Extend `lib/db/dashboard.ts` to compute multi-brand visibility time-series data:

```ts
export interface BrandVisibilityPoint {
  brandName: string;
  isPrimary: boolean;
  color: string;
  visibilityPercent: number; // 0..100
}

export interface MultiBrandTrendPoint {
  scanId: string;
  date: string; // ISO date format "YYYY-MM-DD"
  formattedDate: string; // e.g. "Sep 24"
  brands: BrandVisibilityPoint[];
}

export interface CompetitorLeaderboardRow {
  rank: number;
  name: string;
  logoUrl?: string;
  visibilityPercent: number; // e.g. 60%
  sentimentScore: number; // e.g. 72
  averagePosition: number; // e.g. 2.7
}
```

### 5.2 Helper Calculations (`lib/db/dashboard.ts`)

1. **`getMultiBrandScoreHistory(companyId, opts: { dateRangeDays: number, provider?: string })`**:
   - Query scans for the company completed within the selected `dateRangeDays`.
   - Filter `ScanResult` rows by `provider` if specified.
   - For each scan, calculate:
     - Primary brand visibility percentage = `(valid checks mentioning primary brand / total valid checks) * 100`.
     - Competitor brand visibility percentage = `(valid checks mentioning competitor X / total valid checks) * 100`.
   - Sort data chronologically and assign standard color palettes to brands.

2. **`getCompetitorLeaderboard(scanId: string | null)`**:
   - Aggregate all valid `ScanResult` rows for the scan.
   - For each competitor mentioned:
     - `visibilityPercent`: Percentage of total checks where competitor was mentioned.
     - `sentimentScore`: Average normalized sentiment score (0–100 scale).
     - `averagePosition`: Average rank position recorded across mentions.

---

## 6. API Contracts

### `GET /api/dashboard/trend`

Query parameters:
- `days` (optional): `14` | `30` | `90` | `365` (default: `14`)
- `provider` (optional): `all` | `openai` | `anthropic` | `gemini` | `perplexity` (default: `all`)

Response envelope:
```json
{
  "data": {
    "trend": [
      {
        "scanId": "scan_123",
        "date": "2026-08-25",
        "formattedDate": "Aug 25",
        "brands": [
          { "brandName": "Skinit", "isPrimary": true, "color": "#10b981", "visibilityPercent": 76.9 },
          { "brandName": "MightySkins", "isPrimary": false, "color": "#f59e0b", "visibilityPercent": 38.5 },
          { "brandName": "DecalGirl", "isPrimary": false, "color": "#06b6d4", "visibilityPercent": 30.0 }
        ]
      }
    ]
  }
}
```

---

## 7. UI Components & Layout

```text
components/dashboard/
├── overview-filter-bar.tsx       # Top bar: Brand pill, Date range picker, Model filter, Help icon
├── visibility-trend-card.tsx     # Left Card: SVG line chart, bezier curves, hover line, export button
├── visibility-hover-tooltip.tsx   # Floating date card with multi-brand percentage breakdown
├── competitor-leaderboard.tsx    # Right Card: Table with Rank, Brand logo+name, Visibility, Sentiment, Position
```

### 7.1 Overview Filter Bar (`components/dashboard/overview-filter-bar.tsx`)
- Displays current company brand pill (e.g. `<Badge>Skinit</Badge>`).
- Dropdown select for Date Range (`Last 14 days`, `Last 30 days`, `Last 90 days`).
- Dropdown select for AI Models (`All Models`, `ChatGPT`, `Claude`, `Gemini`, `Perplexity`).
- Help button `?` triggering explanatory tooltip on how visibility is calculated.

### 7.2 Visibility Trend Card (`components/dashboard/visibility-trend-card.tsx`)
- Title: **Visibility** — `Percentage of chats mentioning each brand`
- **Export** button: Triggers CSV download (`skinit-visibility-report.csv`).
- Smooth SVG cubic bezier curves (`d="M ... C ..."`), distinct color lines per brand.
- Mouse hover listener across the X-axis:
  - Highlights active date line.
  - Places dot indicators on each brand line at that date index.
  - Renders `<VisibilityHoverTooltip>` positioned relative to cursor.

### 7.3 Competitor Leaderboard Table (`components/dashboard/competitor-leaderboard.tsx`)
- Title: **Competitors** — `Brands with highest visibility`
- Top right action: **Show All ↗** button.
- Table columns with info icons `(i)`:
  - `#`: Rank number (1, 2, 3...)
  - `Brand`: Brand icon + Name
  - `Visibility (i)`: e.g. `60%`
  - `Sentiment (i)`: Green/neutral pill, e.g. `72`
  - `Position (i)`: Average rank position, e.g. `2.7`

---

## 8. Verification & Testing

1. **Unit Tests (`lib/db/dashboard.test.ts`)**:
   - Verify calculation of competitor visibility percentages across multi-scan datasets.
   - Verify proper fallback when zero competitor mentions exist.
2. **UI Inspection**:
   - Hover over chart data points to confirm exact date tooltips render with proper colors and values.
   - Test date range selector (`Last 14 days` vs `Last 30 days`) to ensure line chart updates dynamically.
   - Test CSV export button to verify generated file matches rendered chart values.

---

## 9. Definition of Done

- `lib/db/dashboard.ts` exports multi-brand historical trend and competitor leaderboard helpers.
- `GET /api/dashboard/trend` handles `days` and `provider` filter parameters.
- `OverviewFilterBar` rendered in editor navbar/header with active state controls.
- `VisibilityTrendCard` renders multi-line bezier SVG chart with interactive hover tooltip breakdown.
- CSV export button functionality implemented and tested.
- `CompetitorLeaderboard` table displays rank, logo, visibility, sentiment, and position with info tooltips.
- `npm run lint` and `npm run build` pass without errors.
