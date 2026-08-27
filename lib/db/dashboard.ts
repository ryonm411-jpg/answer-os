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

export interface ProviderMetricItem {
  name: string;
  model: string;
}

export interface LatestScanSummary {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
  completedAt: string | null;
  totalChecks: number;
  validChecks: number;
  errorChecks: number;
  coverageRate: number; // 0..1 valid checks ratio
  activeProviders?: ProviderMetricItem[];
}

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
  multiBrandTrend: MultiBrandTrendPoint[];
  competitorLeaderboard: CompetitorLeaderboardRow[];
  promptPerformance: {
    topPrompts: PromptPerformanceItem[];
    missingOpportunities: PromptPerformanceItem[];
  };
  competitorMentions: CompetitorMentionItem[];
  recommendations: DashboardRecommendationItem[];
}

/** Get the latest scan metadata for status display */
export async function getLatestScanForCompany(companyId: string): Promise<LatestScanSummary | null> {
  // Stale scan recovery: mark PENDING/RUNNING scans older than 10 minutes as FAILED
  const STALE_SCAN_MS = 10 * 60 * 1000;
  await prisma.scan.updateMany({
    where: {
      companyId,
      status: { in: ["PENDING", "RUNNING"] },
      createdAt: { lt: new Date(Date.now() - STALE_SCAN_MS) },
    },
    data: { status: "FAILED", completedAt: new Date() },
  });

  const scan = await prisma.scan.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      results: {
        select: { provider: true },
        distinct: ["provider"],
      },
      _count: {
        select: { results: true },
      },
    },
  });

  if (!scan) return null;

  const validChecks = await prisma.scanResult.count({
    where: { scanId: scan.id, error: null },
  });

  const totalChecks = scan._count.results;
  const errorChecks = Math.max(0, totalChecks - validChecks);
  const coverageRate = totalChecks > 0 ? validChecks / totalChecks : 1.0;

  const PRISMA_TO_PROVIDER_ITEM: Record<string, ProviderMetricItem> = {
    OPENAI: { name: "ChatGPT", model: "OpenAI" },
    ANTHROPIC: { name: "Claude", model: "Anthropic" },
    GEMINI: { name: "Gemini", model: "Google" },
    PERPLEXITY: { name: "Perplexity", model: "Sonar" },
    GROQ: { name: "Groq LPU", model: "Llama 3.3 70B" },
    NVIDIA: { name: "NVIDIA NIM", model: "Enterprise NIM" },
    OPENROUTER: { name: "OpenRouter", model: "Free Pool" },
  };

  const activeProviders = scan.results
    .map((r) => PRISMA_TO_PROVIDER_ITEM[r.provider as string])
    .filter(Boolean) as ProviderMetricItem[];

  return {
    id: scan.id,
    status: scan.status,
    createdAt: scan.createdAt.toISOString(),
    completedAt: scan.completedAt ? scan.completedAt.toISOString() : null,
    totalChecks,
    validChecks,
    errorChecks,
    coverageRate,
    activeProviders,
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

  const multiBrandTrend = await getMultiBrandScoreHistory(companyId);
  const competitorLeaderboard = await getCompetitorLeaderboard(latestCompletedScanId);
  const promptPerformance = await getPromptPerformanceForScan(latestCompletedScanId);
  const competitorMentions = await getCompetitorMentionsForScan(latestCompletedScanId);
  const recommendations = await getRecommendationsForCompany(companyId);

  return {
    company,
    latestScan,
    latestCompletedScanId,
    score,
    trend,
    multiBrandTrend,
    competitorLeaderboard,
    promptPerformance,
    competitorMentions,
    recommendations,
  };
}

const BRAND_COLORS = [
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#eab308", // yellow
  "#ef4444", // red
  "#3b82f6", // blue
  "#14b8a6", // teal
];

/** Get multi-brand visibility score history across scans within date range */
export async function getMultiBrandScoreHistory(
  companyId: string,
  opts?: { dateRangeDays?: number; provider?: string }
): Promise<MultiBrandTrendPoint[]> {
  const days = opts?.dateRangeDays ?? 14;
  const providerFilter = opts?.provider && opts.provider !== "all" ? opts.provider.toUpperCase() : null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });
  const primaryBrandName = company?.name || "Primary Brand";

  const scans = await prisma.scan.findMany({
    where: {
      companyId,
      status: "COMPLETED",
      completedAt: { gte: startDate },
    },
    orderBy: { completedAt: "desc" },
    take: 30,
    include: {
      results: {
        where: providerFilter ? { provider: providerFilter as import("@/generated/prisma").AIProvider } : undefined,
      },
    },
  });

  const chronologicalScans = [...scans].reverse();

  // Find all distinct top competitor names across these scans
  const competitorMentionCounts = new Map<string, number>();
  for (const scan of chronologicalScans) {
    for (const r of scan.results) {
      if (r.error === null && Array.isArray(r.competitorsMentioned)) {
        for (const item of r.competitorsMentioned as { name?: unknown }[]) {
          if (typeof item?.name === "string" && item.name.trim().length > 0) {
            const name = item.name.trim();
            competitorMentionCounts.set(name, (competitorMentionCounts.get(name) || 0) + 1);
          }
        }
      }
    }
  }

  // Pick top 6 competitors by frequency
  const topCompetitorNames = Array.from(competitorMentionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  // Map competitor names to distinct colors
  const competitorColorMap = new Map<string, string>();
  topCompetitorNames.forEach((name, index) => {
    competitorColorMap.set(name, BRAND_COLORS[index % BRAND_COLORS.length]);
  });

  const allSameDay =
    chronologicalScans.length > 1 &&
    chronologicalScans.every(
      (s) =>
        (s.completedAt || s.createdAt).toISOString().split("T")[0] ===
        (chronologicalScans[0].completedAt || chronologicalScans[0].createdAt)
          .toISOString()
          .split("T")[0]
    );

  return chronologicalScans.map((scan) => {
    const validResults = scan.results.filter((r) => r.error === null);
    const totalValidChecks = validResults.length;

    const primaryMentions = validResults.filter((r) => r.mentioned).length;
    const primaryVisibility = totalValidChecks > 0
      ? Math.round((primaryMentions / totalValidChecks) * 1000) / 10
      : 0;

    const brands: BrandVisibilityPoint[] = [
      {
        brandName: primaryBrandName,
        isPrimary: true,
        color: "#10b981",
        visibilityPercent: primaryVisibility,
      },
    ];

    for (const compName of topCompetitorNames) {
      let compMentions = 0;
      for (const r of validResults) {
        if (Array.isArray(r.competitorsMentioned)) {
          const mentioned = (r.competitorsMentioned as { name?: unknown }[]).some(
            (c) => typeof c?.name === "string" && c.name.trim().toLowerCase() === compName.toLowerCase()
          );
          if (mentioned) compMentions += 1;
        }
      }

      const compVisibility = totalValidChecks > 0
        ? Math.round((compMentions / totalValidChecks) * 1000) / 10
        : 0;

      brands.push({
        brandName: compName,
        isPrimary: false,
        color: competitorColorMap.get(compName) || "#a1a1aa",
        visibilityPercent: compVisibility,
      });
    }

    const scanDate = scan.completedAt || scan.createdAt;
    const dateStr = scanDate.toISOString().split("T")[0];
    const formattedDate = allSameDay
      ? scanDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : scanDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return {
      scanId: scan.id,
      date: dateStr,
      formattedDate,
      brands,
    };
  });
}

/** Get competitor leaderboard rows for a scan */
export async function getCompetitorLeaderboard(scanId: string | null): Promise<CompetitorLeaderboardRow[]> {
  if (!scanId) return [];

  const results = await prisma.scanResult.findMany({
    where: { scanId, error: null },
  });

  const totalValidChecks = results.length;
  if (totalValidChecks === 0) return [];

  const compStats = new Map<
    string,
    {
      name: string;
      mentions: number;
      sentiments: number[];
      positions: number[];
    }
  >();

  for (const r of results) {
    if (Array.isArray(r.competitorsMentioned)) {
      for (const item of r.competitorsMentioned as { name?: unknown; position?: unknown; sentiment?: unknown }[]) {
        if (typeof item?.name === "string" && item.name.trim().length > 0) {
          const cName = item.name.trim();
          let entry = compStats.get(cName);
          if (!entry) {
            entry = { name: cName, mentions: 0, sentiments: [], positions: [] };
            compStats.set(cName, entry);
          }
          entry.mentions += 1;

          if (typeof item.sentiment === "string") {
            const upper = item.sentiment.toUpperCase();
            if (upper === "POSITIVE") entry.sentiments.push(85);
            else if (upper === "NEGATIVE") entry.sentiments.push(15);
            else entry.sentiments.push(50);
          } else if (typeof item.sentiment === "number") {
            entry.sentiments.push(Math.min(100, Math.max(0, item.sentiment)));
          } else {
            entry.sentiments.push(50);
          }

          if (typeof item.position === "number" && item.position > 0) {
            entry.positions.push(item.position);
          }
        }
      }
    }
  }

  const rows: CompetitorLeaderboardRow[] = Array.from(compStats.values()).map((stat) => {
    const visibilityPercent = Math.round((stat.mentions / totalValidChecks) * 100);
    const avgSentiment = stat.sentiments.length > 0
      ? Math.round(stat.sentiments.reduce((a, b) => a + b, 0) / stat.sentiments.length)
      : 50;
    const avgPosition = stat.positions.length > 0
      ? Math.round((stat.positions.reduce((a, b) => a + b, 0) / stat.positions.length) * 10) / 10
      : 3.0;

    return {
      rank: 0,
      name: stat.name,
      visibilityPercent,
      sentimentScore: avgSentiment,
      averagePosition: avgPosition,
    };
  });

  rows.sort((a, b) => {
    if (b.visibilityPercent !== a.visibilityPercent) return b.visibilityPercent - a.visibilityPercent;
    if (b.sentimentScore !== a.sentimentScore) return b.sentimentScore - a.sentimentScore;
    return a.averagePosition - b.averagePosition;
  });

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

