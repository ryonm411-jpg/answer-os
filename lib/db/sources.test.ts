import { describe, expect, it } from "vitest";
import type { SourceTypeBreakdown, DomainCitationRow, SourcesSummaryData } from "./sources";

describe("lib/db/sources data structures", () => {
  it("structures breakdown items with valid percentages and color tokens", () => {
    const breakdown: SourceTypeBreakdown[] = [
      { type: "CORPORATE", label: "Corporate", color: "#f97316", count: 48, percentage: 44.4 },
      { type: "EDITORIAL", label: "Editorial", color: "#3b82f6", count: 26, percentage: 24.1 },
      { type: "UGC", label: "UGC", color: "#06b6d4", count: 22, percentage: 20.4 },
      { type: "OTHER", label: "Other", color: "#64748b", count: 12, percentage: 11.1 },
    ];

    const totalCount = breakdown.reduce((acc, b) => acc + b.count, 0);
    expect(totalCount).toBe(108);
    expect(breakdown[0].type).toBe("CORPORATE");
    expect(breakdown[0].color).toBe("#f97316");
  });

  it("sorts domain leaderboard rows by used percentage desc and assigns ranks", () => {
    const domains: DomainCitationRow[] = [
      {
        rank: 1,
        domain: "skinit.com",
        faviconUrl: "https://www.google.com/s2/favicons?domain=skinit.com&sz=32",
        usedPercentage: 72,
        avgCitations: 1.2,
        type: "YOU",
        typeLabel: "You",
        typeBadgeVariant: "you",
      },
      {
        rank: 2,
        domain: "mightyskins.com",
        faviconUrl: "https://www.google.com/s2/favicons?domain=mightyskins.com&sz=32",
        usedPercentage: 49,
        avgCitations: 1.1,
        type: "COMPETITOR",
        typeLabel: "Competitor",
        typeBadgeVariant: "competitor",
      },
      {
        rank: 3,
        domain: "reddit.com",
        faviconUrl: "https://www.google.com/s2/favicons?domain=reddit.com&sz=32",
        usedPercentage: 38,
        avgCitations: 0.7,
        type: "UGC",
        typeLabel: "UGC",
        typeBadgeVariant: "ugc",
      },
    ];

    expect(domains[0].usedPercentage).toBeGreaterThan(domains[1].usedPercentage);
    expect(domains[0].typeBadgeVariant).toBe("you");
    expect(domains[2].typeBadgeVariant).toBe("ugc");
  });

  it("formats SourcesSummaryData payload contract cleanly", () => {
    const summary: SourcesSummaryData = {
      totalSourcesCount: 108,
      breakdown: [
        { type: "CORPORATE", label: "Corporate", color: "#f97316", count: 48, percentage: 44.4 },
      ],
      topDomains: [
        {
          rank: 1,
          domain: "skinit.com",
          faviconUrl: "https://www.google.com/s2/favicons?domain=skinit.com&sz=32",
          usedPercentage: 72,
          avgCitations: 1.2,
          type: "YOU",
          typeLabel: "You",
          typeBadgeVariant: "you",
        },
      ],
    };

    expect(summary.totalSourcesCount).toBe(108);
    expect(summary.breakdown).toHaveLength(1);
    expect(summary.topDomains[0].domain).toBe("skinit.com");
  });
});
