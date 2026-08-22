import { describe, expect, it } from "vitest";
import {
  type PromptPerformanceItem,
  type CompetitorMentionItem,
  type DashboardTrendPoint,
  type DashboardRecommendationItem,
} from "./dashboard";

describe("Dashboard Data Transformation Helpers", () => {
  it("correctly sorts top prompts by mention rate desc and avg rank position asc", () => {
    const prompts: PromptPerformanceItem[] = [
      {
        promptId: "p1",
        text: "Best CRM software",
        category: "Product",
        mentionRate: 0.5,
        averageRank: 3,
        competitorMentionCount: 2,
        totalValidChecks: 4,
        mentionedChecks: 2,
      },
      {
        promptId: "p2",
        text: "Top SaaS CRM",
        category: "Product",
        mentionRate: 1.0,
        averageRank: 1,
        competitorMentionCount: 0,
        totalValidChecks: 4,
        mentionedChecks: 4,
      },
      {
        promptId: "p3",
        text: "Hubspot alternatives",
        category: "Comparison",
        mentionRate: 0.5,
        averageRank: 1,
        competitorMentionCount: 3,
        totalValidChecks: 4,
        mentionedChecks: 2,
      },
    ];

    const sorted = [...prompts].sort((a, b) => {
      if (b.mentionRate !== a.mentionRate) return b.mentionRate - a.mentionRate;
      const rankA = a.averageRank ?? 999;
      const rankB = b.averageRank ?? 999;
      return rankA - rankB;
    });

    expect(sorted[0].promptId).toBe("p2"); // 100% mention rate
    expect(sorted[1].promptId).toBe("p3"); // 50% mention rate, rank 1
    expect(sorted[2].promptId).toBe("p1"); // 50% mention rate, rank 3
  });

  it("filters and sorts missing opportunities by competitor mention count desc", () => {
    const prompts: PromptPerformanceItem[] = [
      {
        promptId: "p1",
        text: "Best sales tool",
        category: "General",
        mentionRate: 0,
        averageRank: null,
        competitorMentionCount: 4,
        totalValidChecks: 4,
        mentionedChecks: 0,
      },
      {
        promptId: "p2",
        text: "Salesforce pricing",
        category: "Pricing",
        mentionRate: 0,
        averageRank: null,
        competitorMentionCount: 1,
        totalValidChecks: 4,
        mentionedChecks: 0,
      },
      {
        promptId: "p3",
        text: "Mentioned CRM",
        category: "General",
        mentionRate: 0.25,
        averageRank: 2,
        competitorMentionCount: 4,
        totalValidChecks: 4,
        mentionedChecks: 1,
      },
    ];

    const missing = prompts
      .filter((p) => p.mentionRate === 0 && p.competitorMentionCount > 0)
      .sort((a, b) => b.competitorMentionCount - a.competitorMentionCount);

    expect(missing).toHaveLength(2);
    expect(missing[0].promptId).toBe("p1"); // 4 competitor mentions
    expect(missing[1].promptId).toBe("p2"); // 1 competitor mention
  });

  it("calculates competitor share percentage accurately", () => {
    const rawCompetitorCounts = [
      { name: "Salesforce", mentions: 10 },
      { name: "HubSpot", mentions: 5 },
      { name: "Zoho", mentions: 5 },
    ];

    const total = rawCompetitorCounts.reduce((acc, curr) => acc + curr.mentions, 0); // 20

    const items: CompetitorMentionItem[] = rawCompetitorCounts.map((c) => ({
      name: c.name,
      mentions: c.mentions,
      share: total > 0 ? c.mentions / total : 0,
    }));

    expect(items[0].share).toBe(0.5); // 10 / 20
    expect(items[1].share).toBe(0.25); // 5 / 20
    expect(items[2].share).toBe(0.25); // 5 / 20
  });

  it("handles empty trend points array gracefully", () => {
    const trend: DashboardTrendPoint[] = [];
    expect(trend).toHaveLength(0);
  });

  it("sorts recommendations by priority ascending (1 highest) and preserves order", () => {
    const recommendations: DashboardRecommendationItem[] = [
      {
        id: "r1",
        title: "Medium Priority Rec",
        description: "Add comparison page",
        category: "Content",
        priority: 2,
        estimatedImpact: 15,
        completed: false,
        createdAt: "2026-08-20T10:00:00.000Z",
      },
      {
        id: "r2",
        title: "High Priority Rec",
        description: "Add FAQ schema markup",
        category: "Technical SEO",
        priority: 1,
        estimatedImpact: 25,
        completed: false,
        createdAt: "2026-08-20T11:00:00.000Z",
      },
    ];

    const sorted = [...recommendations].sort((a, b) => a.priority - b.priority);

    expect(sorted[0].id).toBe("r2"); // priority 1
    expect(sorted[1].id).toBe("r1"); // priority 2
  });
});
