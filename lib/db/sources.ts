import { prisma } from "./prisma";
import type { CitationType, AIProvider } from "@/generated/prisma";

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

const TYPE_CONFIG: Record<
  CitationType,
  { label: string; color: string; badgeVariant: "you" | "competitor" | "corporate" | "editorial" | "ugc" | "other" }
> = {
  YOU: { label: "You", color: "#10b981", badgeVariant: "you" },
  COMPETITOR: { label: "Competitor", color: "#ef4444", badgeVariant: "competitor" },
  CORPORATE: { label: "Corporate", color: "#f97316", badgeVariant: "corporate" },
  EDITORIAL: { label: "Editorial", color: "#3b82f6", badgeVariant: "editorial" },
  UGC: { label: "UGC", color: "#06b6d4", badgeVariant: "ugc" },
  OTHER: { label: "Other", color: "#64748b", badgeVariant: "other" },
};

export async function getSourcesSummary(
  companyId: string,
  opts?: { scanId?: string | null; days?: number; provider?: string }
): Promise<SourcesSummaryData> {
  let targetScanId = opts?.scanId ?? null;

  if (!targetScanId) {
    const latestCompletedScan = await prisma.scan.findFirst({
      where: { companyId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: { id: true },
    });
    targetScanId = latestCompletedScan ? latestCompletedScan.id : null;
  }

  if (!targetScanId) {
    return {
      totalSourcesCount: 0,
      breakdown: [],
      topDomains: [],
    };
  }

  const providerFilter =
    opts?.provider && opts.provider !== "all"
      ? (opts.provider.toUpperCase() as AIProvider)
      : undefined;

  const validScanResults = await prisma.scanResult.findMany({
    where: {
      scanId: targetScanId,
      error: null,
      provider: providerFilter,
    },
    select: { id: true },
  });

  const totalValidChecks = validScanResults.length;
  if (totalValidChecks === 0) {
    return {
      totalSourcesCount: 0,
      breakdown: [],
      topDomains: [],
    };
  }

  const validScanResultIds = validScanResults.map((r) => r.id);

  const citations = await prisma.scanResultCitation.findMany({
    where: {
      scanResultId: { in: validScanResultIds },
    },
  });

  if (citations.length === 0) {
    return {
      totalSourcesCount: 0,
      breakdown: [],
      topDomains: [],
    };
  }

  // 1. Group citations by domain
  const domainStats = new Map<
    string,
    {
      domain: string;
      citationType: CitationType;
      totalCitations: number;
      scanResultIds: Set<string>;
    }
  >();

  const typeCounts = new Map<CitationType, number>();

  for (const c of citations) {
    const domain = c.domain.toLowerCase().trim();
    let entry = domainStats.get(domain);
    if (!entry) {
      entry = {
        domain,
        citationType: c.citationType,
        totalCitations: 0,
        scanResultIds: new Set<string>(),
      };
      domainStats.set(domain, entry);
    }
    entry.totalCitations += 1;
    entry.scanResultIds.add(c.scanResultId);

    typeCounts.set(c.citationType, (typeCounts.get(c.citationType) || 0) + 1);
  }

  const totalSourcesCount = domainStats.size;

  // 2. Build Category Breakdown for Donut Chart
  const totalCitationsCount = citations.length;
  const breakdown: SourceTypeBreakdown[] = Array.from(typeCounts.entries())
    .map(([type, count]) => {
      const config = TYPE_CONFIG[type];
      return {
        type,
        label: config.label,
        color: config.color,
        count,
        percentage:
          totalCitationsCount > 0
            ? Math.round((count / totalCitationsCount) * 1000) / 10
            : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  // 3. Build Top Domains Leaderboard Rows
  const topDomains: DomainCitationRow[] = Array.from(domainStats.values())
    .map((stat) => {
      const usedCount = stat.scanResultIds.size;
      const usedPercentage = Math.min(
        100,
        Math.round((usedCount / totalValidChecks) * 100)
      );
      const avgCitations =
        usedCount > 0
          ? Math.round((stat.totalCitations / usedCount) * 10) / 10
          : 1.0;
      const config = TYPE_CONFIG[stat.citationType];

      return {
        rank: 0,
        domain: stat.domain,
        faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
          stat.domain
        )}&sz=32`,
        usedPercentage,
        avgCitations,
        type: stat.citationType,
        typeLabel: config.label,
        typeBadgeVariant: config.badgeVariant,
      };
    })
    .sort((a, b) => {
      if (b.usedPercentage !== a.usedPercentage)
        return b.usedPercentage - a.usedPercentage;
      return b.avgCitations - a.avgCitations;
    });

  topDomains.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  return {
    totalSourcesCount,
    breakdown,
    topDomains,
  };
}
