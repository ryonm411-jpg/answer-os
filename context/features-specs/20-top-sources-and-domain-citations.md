# Top Sources & Domain Citations Analytics — AI Source Breakdown & Domain Categorization

> **Status:** Proposed specification
> **Created:** August 26, 2026
> **Depends on:** `07-wire-dashboard.md`, `09-ai-provider-abstraction.md`, `12-visibility-scanner-pipeline.md`, `14-dashboard-ui.md`, `19-brand-competitor-visibility-dashboard.md`

---

## 1. Goal

Upgrade AnswerOS to track, categorize, and visualize the **web sources and domain citations** that AI models (ChatGPT, Claude, Gemini, Perplexity, Sonar, etc.) utilize when generating recommendations and answers for monitored buyer prompts.

As shown in the visual specification reference, the **Top Sources** feature adds two core analytics components to the Overview Dashboard:

1. **Top Sources Distribution Card (Donut Visualizer)**:
   - Header: **Top Sources** — *Sources across active models*
   - Center Stat: Total unique domain sources discovered (e.g. `108 Sources`).
   - SVG Donut Chart visualizing the proportional breakdown of citation source types:
     - 🟧 **Corporate** (Brand sites, manufacturer stores, custom product landing pages)
     - 🟦 **Editorial** (Tech blogs, review publications, news outlets, product comparison sites)
     - 🟨 / 🩵 **UGC** (User-Generated Content: Reddit, YouTube, tech forums, community discussions)
     - ⬜ / ⬛ **Other** (E-commerce marketplaces like Amazon, general reference hubs, unclassified domains)

2. **Sources & Domain Leaderboard Table**:
   - Header action: **Show All ↗** link to open full expanded sources drawer/modal.
   - Comprehensive domain breakdown table with the following columns:
     - **Domain**: Domain name with favicon/icon (e.g. `skinit.com`, `mightyskins.com`, `amazon.com`, `reddit.com`, `youtube.com`, `wrappz.com`).
     - **Used (%)**: Percentage of valid AI response checks that cited or relied on this domain.
     - **Avg. Citations**: Average number of citations per response when the domain is cited.
     - **Type (Category Badge)**:
       - 🟩 `You` (Primary company domain)
       - 🟥 `Competitor` (Tracked competitor domains)
       - 🟧 `Corporate` (External corporate / merchant sites)
       - 🟦 `Editorial` (Reviews, press, editorial media)
       - 🩵 `UGC` (Reddit, YouTube, forums, user discussions)
       - ⬜ `Other` (Marketplaces, general reference)

---

## 2. Mandatory Context Reads

Before implementing this feature, read these files in order:

1. `CLAUDE.md` — agent rules and Next.js conventions.
2. `context/project-overview.md` — product goals and core user experience.
3. `context/architecture.md` — system structure, server-first scoring invariant, and data boundaries.
4. `context/ui-context.md` — theme tokens, typography, colors, and component conventions.
5. `context/code-standards.md` — server component separation and helper module rules.
6. `context/features-specs/12-visibility-scanner-pipeline.md` — background scan execution and AI raw response processing.
7. `context/features-specs/14-dashboard-ui.md` — dashboard read model contracts and layout structure.
8. `context/features-specs/19-brand-competitor-visibility-dashboard.md` — multi-brand trend and competitor leaderboard integration.

---

## 3. Current State & Known Gaps

### Current State
- `ScanResult` rows store `rawResponse` (text output from AI models) and parsed JSON metadata (`mentioned`, `position`, `sentiment`, `competitorsMentioned`).
- Web search / citation metadata from live web-enabled models (e.g. Perplexity Sonar, Gemini search grounding, OpenAI web search tools) is contained within `rawResponse` or response metadata objects.

### Gaps Resolved by This Specification
- No database model or query logic exists to parse, extract, normalize, and store cited web domains per prompt check.
- No source categorization engine exists to classify domains into `Corporate`, `Editorial`, `UGC`, `Competitor`, `You`, or `Other`.
- No visual SVG Donut Chart component exists for source category breakdown on the dashboard.
- No Domain Citations table exists showing `Used (%)`, `Avg. Citations`, and domain type badges.

---

## 4. Key Architectural Decisions

| # | Decision | Rationale |
| - | -------- | --------- |
| 1 | **Domain Citation Extraction Pipeline**: Extract explicit URLs/citations from AI response groundings, markdown links `[text](url)`, and URL patterns during scan parsing | Captures the actual ground-truth web sources used by LLMs to form recommendations |
| 2 | **Automatic Domain Classification Engine**: Classify domains into standard taxonomy (`You`, `Competitor`, `UGC`, `Editorial`, `Corporate`, `Other`) using domain patterns + database relationships | Provides instant domain type insight (e.g. identifying whether AI relies on Reddit vs editorial review sites) |
| 3 | **Persisted Citation Records**: Store normalized citation entries in a `ScanResultCitation` relation linked to `ScanResult` | Allows high-performance aggregation across date ranges, providers, and prompt categories without re-parsing raw text |
| 4 | **Interactive Donut Visualizer**: Build a lightweight, responsive SVG Donut Chart with center summary count and hover highlighting | Matches modern analytics dashboard aesthetics with smooth interactivity and dark theme styling |
| 5 | **Domain Citations Leaderboard Table**: Render table with domain favicons, `Used (%)` progress metrics, `Avg. Citations` averages, and color-coded type pills | Delivers high-density actionable intelligence on search authority sources |

---

## 5. Domain Classification Taxonomy Rules

Domains are classified dynamically into six canonical categories based on company domain context and URL patterns:

1. **`You`**: Primary user company domain (e.g. `skinit.com` when scanning for Skinit).
2. **`Competitor`**: Any domain matching a registered competitor domain for the company (e.g. `mightyskins.com`, `dbrand.com`, `xtremeskins.co.uk`).
3. **`UGC` (User-Generated Content)**:
   - Known community & social discussion platforms: `reddit.com`, `youtube.com`, `quora.com`, `x.com`, `twitter.com`, `tiktok.com`, `forum.*`, `medium.com`, `subscribers.*`, `discord.com`.
4. **`Editorial`**:
   - Review, news, tech, and publication sites: `techcrunch.com`, `theverge.com`, `tomsguide.com`, `wirecutter.com`, `rtings.com`, `cnet.com`, `pcmag.com`, `forbes.com`, `engadget.com`, `digitaltrends.com`, `macrumors.com`, `9to5mac.com`.
5. **`Corporate`**:
   - Official brand, manufacturer, e-commerce, or direct product seller websites (e.g. `wrappz.com`, `toastmade.com`, `decalgirl.com`).
6. **`Other`**:
   - E-commerce mega-marketplaces (`amazon.com`, `ebay.com`, `walmart.com`, `etsy.com`), general encyclopedias (`wikipedia.org`), search engines, or unclassified domains.

---

## 6. Data Model & Database Schema Extensions

### 6.1 Prisma Schema Migration (`prisma/schema.prisma`)

Add `CitationType` enum and `ScanResultCitation` model:

```prisma
enum CitationType {
  YOU
  COMPETITOR
  CORPORATE
  EDITORIAL
  UGC
  OTHER
}

model ScanResultCitation {
  id           String       @id @default(cuid())
  scanResultId String
  scanResult   ScanResult   @relation(fields: [scanResultId], references: [id], onDelete: Cascade)
  domain       String       // Normalized domain, e.g. "reddit.com"
  url          String?      // Exact target URL if present
  title        String?      // Source page title if provided by AI search grounding
  citationType CitationType @default(OTHER)
  createdAt    DateTime     @default(now())

  @@index([scanResultId])
  @@index([domain])
  @@index([citationType])
}
```

### 6.2 Read Model Contracts (`lib/db/sources.ts`)

```ts
export interface SourceTypeBreakdown {
  type: CitationType;
  label: string;
  color: string;
  count: number;
  percentage: number; // 0..100
}

export interface DomainCitationRow {
  rank: number;
  domain: string;
  faviconUrl: string;
  usedPercentage: number; // e.g. 72% (cited in 72% of valid checks)
  avgCitations: number;    // e.g. 1.2 average citations per response
  type: CitationType;
  typeLabel: string;
  typeBadgeVariant: "you" | "competitor" | "corporate" | "editorial" | "ugc" | "other";
}

export interface SourcesSummaryData {
  totalSourcesCount: number;
  breakdown: SourceTypeBreakdown[];
  topDomains: DomainCitationRow[];
}
```

---

## 7. API Contracts

### `GET /api/dashboard/sources`

Retrieves aggregated top sources and domain citation metrics for the user's active company.

**Query Parameters**:
- `scanId` (optional): Specific scan ID, or defaults to the latest completed scan.
- `days` (optional): `14` | `30` | `90` | `365` (default: `14`).
- `provider` (optional): `all` | `openai` | `anthropic` | `gemini` | `perplexity` | `groq` | `nvidia` | `openrouter` (default: `all`).

**Response Envelope**:
```json
{
  "data": {
    "totalSourcesCount": 108,
    "breakdown": [
      { "type": "CORPORATE", "label": "Corporate", "color": "#f97316", "count": 48, "percentage": 44.4 },
      { "type": "EDITORIAL", "label": "Editorial", "color": "#3b82f6", "count": 26, "percentage": 24.1 },
      { "type": "UGC", "label": "UGC", "color": "#06b6d4", "count": 22, "percentage": 20.4 },
      { "type": "OTHER", "label": "Other", "color": "#64748b", "count": 12, "percentage": 11.1 }
    ],
    "topDomains": [
      {
        "rank": 1,
        "domain": "skinit.com",
        "faviconUrl": "https://www.google.com/s2/favicons?domain=skinit.com&sz=32",
        "usedPercentage": 72,
        "avgCitations": 1.2,
        "type": "YOU",
        "typeLabel": "You",
        "typeBadgeVariant": "you"
      },
      {
        "rank": 2,
        "domain": "mightyskins.com",
        "faviconUrl": "https://www.google.com/s2/favicons?domain=mightyskins.com&sz=32",
        "usedPercentage": 49,
        "avgCitations": 1.1,
        "type": "COMPETITOR",
        "typeLabel": "Competitor",
        "typeBadgeVariant": "competitor"
      },
      {
        "rank": 3,
        "domain": "amazon.com",
        "faviconUrl": "https://www.google.com/s2/favicons?domain=amazon.com&sz=32",
        "usedPercentage": 42,
        "avgCitations": 3.0,
        "type": "OTHER",
        "typeLabel": "Other",
        "typeBadgeVariant": "other"
      },
      {
        "rank": 4,
        "domain": "reddit.com",
        "faviconUrl": "https://www.google.com/s2/favicons?domain=reddit.com&sz=32",
        "usedPercentage": 38,
        "avgCitations": 0.7,
        "type": "UGC",
        "typeLabel": "UGC",
        "typeBadgeVariant": "ugc"
      },
      {
        "rank": 5,
        "domain": "youtube.com",
        "faviconUrl": "https://www.google.com/s2/favicons?domain=youtube.com&sz=32",
        "usedPercentage": 34,
        "avgCitations": 2.2,
        "type": "UGC",
        "typeLabel": "UGC",
        "typeBadgeVariant": "ugc"
      },
      {
        "rank": 6,
        "domain": "wrappz.com",
        "faviconUrl": "https://www.google.com/s2/favicons?domain=wrappz.com&sz=32",
        "usedPercentage": 32,
        "avgCitations": 1.6,
        "type": "CORPORATE",
        "typeLabel": "Corporate",
        "typeBadgeVariant": "corporate"
      }
    ]
  }
}
```

---

## 8. UI Components & Layout Structure

```text
components/dashboard/
├── top-sources-card.tsx        # Left Card: Donut SVG chart, center total count, category legend
├── sources-domain-table.tsx    # Right Card: Favicon, Domain name, Used %, Avg. Citations, Type badge
└── sources-modal.tsx           # Interactive full-screen / expanded drawer for all discovered sources
```

### 8.1 Top Sources Card (`components/dashboard/top-sources-card.tsx`)
- Title: **Top Sources** — *Sources across active models*
- Donut Chart SVG:
  - Concentric stroke rings representing proportional category shares (`Corporate`, `Editorial`, `UGC`, `Other`).
  - Center label: `${totalSourcesCount}` with subtext `Sources`.
- Legend Bar:
  - Horizontal or grid pill list with colored dot indicators:
    - 🟧 Corporate
    - 🟦 Editorial
    - 🩵 UGC
    - ⬜ Other

### 8.2 Sources Domain Table (`components/dashboard/sources-domain-table.tsx`)
- Header: **Domain**, **Used**, **Avg. Citations**, **Type**
- Right Action: **Show All ↗** trigger opening `<SourcesModal />`.
- Table Rows:
  - Favicon image (`google.com/s2/favicons?domain=...`) + Domain name string.
  - Used percentage progress bar or bold percentage (e.g. `72%`).
  - Decimal average citations number (e.g. `1.2`).
  - Badge with distinct color tokens:
    - `You`: Green (`bg-emerald-500/15 text-emerald-400 border-emerald-500/30`)
    - `Competitor`: Red/Rose (`bg-rose-500/15 text-rose-400 border-rose-500/30`)
    - `UGC`: Cyan (`bg-cyan-500/15 text-cyan-400 border-cyan-500/30`)
    - `Corporate`: Orange (`bg-amber-500/15 text-amber-400 border-amber-500/30`)
    - `Editorial`: Blue (`bg-blue-500/15 text-blue-400 border-blue-500/30`)
    - `Other`: Gray (`bg-secondary/60 text-muted-foreground border-border`)

---

## 9. Verification & Testing Plan

1. **Unit Tests (`lib/scan/citations.test.ts` & `lib/db/sources.test.ts`)**:
   - Verify URL/domain extraction from raw AI text responses and markdown link tags.
   - Verify classification rules mapping domains (`reddit.com` → `UGC`, competitor → `COMPETITOR`, primary → `YOU`).
   - Verify calculation of `usedPercentage` and `avgCitations` formulas.
2. **Database Migration Verification**:
   - Run `npx prisma validate` and `npx prisma generate` to verify schema integrity.
3. **UI Verification**:
   - Verify Donut chart renders cleanly in dark theme mode without overlapping text.
   - Verify domain favicon fallbacks render when favicons are unavailable.
   - Test `Show All ↗` modal trigger and filter bar integration.

---

## 10. Definition of Done

- `ScanResultCitation` model and `CitationType` enum defined in `prisma/schema.prisma` with migration applied.
- Extraction & classification logic implemented in `lib/scan/citations.ts`.
- Database aggregation helpers implemented in `lib/db/sources.ts`.
- REST API endpoint `GET /api/dashboard/sources` exposed and tested.
- `TopSourcesCard` (SVG Donut Visualizer) and `SourcesDomainTable` components rendered on overview dashboard.
- Unit tests written and passing 100% with `npx vitest run`.
- `npx tsc --noEmit` and `npm run dev` build without errors.
