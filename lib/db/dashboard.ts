import { prisma } from "./prisma";
import { getCompanyScore } from "./scoring";
import { calculateVisibilityScore, type ScoredScan, type ScoreResultRow } from "@/lib/scoring/calculator";

export interface PromptPerformanceItem {
  promptId: string;
  text: string;
  category: string;
  mentionRate: number; // 0..1
  averageRank: number | null; // 1-based average rank or null if not mentioned
  competitorMentionCount: number;
  totalValidChecks: number;
  mentionedChecks: number;
}

export interface CompetitorMentionItem {
  name: string;
  mentions: number;
  share: number; // 0..1 relative to total competitor mentions
}

export interface DashboardRecommendationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  estimatedImpact: number | null;
  completed: boolean;
  createdAt: string;
}

export interface DashboardTrendPoint {
  scanId: string;
  completedAt: string;
  score: number | null;
}

export interface LatestScanSummary {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
  completedAt: string | null;
  totalChecks: number;
  validChecks: number;
  errorChecks: number;
}

export interface DashboardData {
  company: {
    id: string;
    name: string;
    domain: string;
  };
  latestScan: LatestScanSummary | null;
  latestCompletedScanId: string | null;
  score: ScoredScan | null;
  trend: DashboardTrendPoint[];
  promptPerformance: {
    topPrompts: PromptPerformanceItem[];
    missingOpportunities: PromptPerformanceItem[];
  };
  competitorMentions: CompetitorMentionItem[];
  recommendations: DashboardRecommendationItem[];
}

/** Get the latest scan metadata for status display */
export async function getLatestScanForCompany(companyId: string): Promise<LatestScanSummary | null> {
  const scan = await prisma.scan.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { results: true },
      },
    },
  });

  if (!scan) return null;

  const validChecks = await prisma.scanResult.count({
    where: { scanId: scan.id, error: null },
  });

  const errorChecks = Math.max(0, scan._count.results - validChecks);

  return {
    id: scan.id,
    status: scan.status,
    createdAt: scan.createdAt.toISOString(),
    completedAt: scan.completedAt ? scan.completedAt.toISOString() : null,
    totalChecks: scan._count.results,
    validChecks,
    errorChecks,
  };
}

/** Get completed scans ordered oldest-to-newest for score history */
export async function getCompanyScoreHistory(companyId: string, limit = 10): Promise<DashboardTrendPoint[]> {
  const scans = await prisma.scan.findMany({
    where: { companyId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: limit,
    include: {
      results: true,
    },
  });

  // Re-order oldest-to-newest for visualization
  const chronological = [...scans].reverse();

  return chronological.map((scan) => {
    const scoreRows: ScoreResultRow[] = scan.results.map((r) => ({
      mentioned: r.mentioned,
      position: r.position,
      sentiment: r.sentiment,
      competitorsMentioned: Array.isArray(r.competitorsMentioned)
        ? (r.competitorsMentioned as { name?: unknown }[])
            .map((c) => (typeof c?.name === "string" ? c.name : ""))
            .filter(Boolean)
        : [],
      error: r.error,
    }));

    const scoreResult = calculateVisibilityScore(scoreRows);

    return {
      scanId: scan.id,
      completedAt: (scan.completedAt || scan.createdAt).toISOString(),
      score: scoreResult.score,
    };
  });
}

/** Get prompt performance metrics for a specific completed scan */
export async function getPromptPerformanceForScan(
  scanId: string | null
): Promise<{ topPrompts: PromptPerformanceItem[]; missingOpportunities: PromptPerformanceItem[] }> {
  if (!scanId) {
    return { topPrompts: [], missingOpportunities: [] };
  }

  const results = await prisma.scanResult.findMany({
    where: { scanId, error: null },
    include: { prompt: true },
  });

  // Group valid checks by promptId
  const promptMap = new Map<
    string,
    {
      promptId: string;
      text: string;
      category: string;
      totalValidChecks: number;
      mentionedChecks: number;
      positions: number[];
      competitorMentionCount: number;
    }
  >();

  for (const r of results) {
    const pId = r.promptId;
    let entry = promptMap.get(pId);
    if (!entry) {
      entry = {
        promptId: pId,
        text: r.prompt.text,
        category: r.prompt.category,
        totalValidChecks: 0,
        mentionedChecks: 0,
        positions: [],
        competitorMentionCount: 0,
      };
      promptMap.set(pId, entry);
    }

    entry.totalValidChecks += 1;
    if (r.mentioned) {
      entry.mentionedChecks += 1;
      if (r.position !== null) {
        entry.positions.push(r.position);
      }
    }

    const comps = Array.isArray(r.competitorsMentioned) ? r.competitorsMentioned : [];
    if (comps.length > 0) {
      entry.competitorMentionCount += 1;
    }
  }

  const allItems: PromptPerformanceItem[] = Array.from(promptMap.values()).map((entry) => {
    const mentionRate = entry.totalValidChecks > 0 ? entry.mentionedChecks / entry.totalValidChecks : 0;
    const averageRank =
      entry.positions.length > 0
        ? entry.positions.reduce((a, b) => a + b, 0) / entry.positions.length
        : null;

    return {
      promptId: entry.promptId,
      text: entry.text,
      category: entry.category,
      mentionRate,
      averageRank,
      competitorMentionCount: entry.competitorMentionCount,
      totalValidChecks: entry.totalValidChecks,
      mentionedChecks: entry.mentionedChecks,
    };
  });

  // Top prompts: mentioned at least once, sorted by mention rate desc, then avg rank asc
  const topPrompts = allItems
    .filter((item) => item.mentionRate > 0)
    .sort((a, b) => {
      if (b.mentionRate !== a.mentionRate) return b.mentionRate - a.mentionRate;
      const rankA = a.averageRank ?? 999;
      const rankB = b.averageRank ?? 999;
      return rankA - rankB;
    })
    .slice(0, 5);

  // Missing opportunities: 0 mentions, but competitors WERE mentioned
  const missingOpportunities = allItems
    .filter((item) => item.mentionRate === 0 && item.competitorMentionCount > 0)
    .sort((a, b) => b.competitorMentionCount - a.competitorMentionCount)
    .slice(0, 5);

  return { topPrompts, missingOpportunities };
}

/** Get competitor mention statistics for a scan */
export async function getCompetitorMentionsForScan(scanId: string | null): Promise<CompetitorMentionItem[]> {
  if (!scanId) return [];

  const results = await prisma.scanResult.findMany({
    where: { scanId, error: null },
  });

  const countMap = new Map<string, number>();
  let totalMentions = 0;

  for (const r of results) {
    if (Array.isArray(r.competitorsMentioned)) {
      for (const item of r.competitorsMentioned as { name?: unknown }[]) {
        if (typeof item?.name === "string" && item.name.trim().length > 0) {
          const cName = item.name.trim();
          countMap.set(cName, (countMap.get(cName) || 0) + 1);
          totalMentions += 1;
        }
      }
    }
  }

  const items: CompetitorMentionItem[] = Array.from(countMap.entries())
    .map(([name, mentions]) => ({
      name,
      mentions,
      share: totalMentions > 0 ? mentions / totalMentions : 0,
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);

  return items;
}

/** Get uncompleted recommendations for a company */
export async function getRecommendationsForCompany(
  companyId: string,
  limit = 5
): Promise<DashboardRecommendationItem[]> {
  const recommendations = await prisma.recommendation.findMany({
    where: { companyId, completed: false },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: limit,
  });

  return recommendations.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    priority: r.priority,
    estimatedImpact: r.estimatedImpact,
    completed: r.completed,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Compose full serializable dashboard read model */
export async function getDashboardData(companyId: string): Promise<DashboardData | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, domain: true },
  });

  if (!company) return null;

  const latestScan = await getLatestScanForCompany(companyId);
  const score = await getCompanyScore(companyId);
  const trend = await getCompanyScoreHistory(companyId);

  // Latest completed scan ID for prompt performance and competitor mentions
  const latestCompletedScan = await prisma.scan.findFirst({
    where: { companyId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { id: true },
  });

  const latestCompletedScanId = latestCompletedScan ? latestCompletedScan.id : null;

  const promptPerformance = await getPromptPerformanceForScan(latestCompletedScanId);
  const competitorMentions = await getCompetitorMentionsForScan(latestCompletedScanId);
  const recommendations = await getRecommendationsForCompany(companyId);

  return {
    company,
    latestScan,
    latestCompletedScanId,
    score,
    trend,
    promptPerformance,
    competitorMentions,
    recommendations,
  };
}
