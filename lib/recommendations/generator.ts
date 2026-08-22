export interface ScanResultForAnalysis {
  promptId: string;
  promptText: string;
  category: string;
  mentioned: boolean;
  position: number | null; // 1-based rank or null
  competitorsMentioned: { name: string }[];
  error: string | null;
}

export interface GeneratedRecommendation {
  title: string;
  description: string;
  category: string;
  priority: number; // 1 = High, 2 = Medium, 3 = Low
  estimatedImpact: number; // e.g. 15 = +15% estimated visibility
}

export interface CompanyAnalysisContext {
  companyName: string;
  domain: string;
}

/**
 * Analyzes completed scan result rows to generate actionable, prioritized recommendations.
 * Covers: missing comparison pages, weak category FAQ, missing pricing/docs, rank #2+ optimization, and schema markup.
 */
export function generateRecommendations(
  context: CompanyAnalysisContext,
  results: ScanResultForAnalysis[]
): GeneratedRecommendation[] {
  const validResults = results.filter((r) => !r.error);
  if (validResults.length === 0) {
    return [
      {
        title: "Ensure AI crawlers can index your primary landing page",
        description: `All prompt checks returned provider errors. Verify that ${context.domain} allows search crawler access in robots.txt and has no active CAPTCHA blocks.`,
        category: "Indexing & Crawlability",
        priority: 1,
        estimatedImpact: 20,
      },
    ];
  }

  const recommendations: GeneratedRecommendation[] = [];
  const seenTitles = new Set<string>();

  const addRecommendation = (rec: GeneratedRecommendation) => {
    const key = rec.title.toLowerCase().trim();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      recommendations.push(rec);
    }
  };

  // 1. Analyze Competitor Wins on Missed Prompts (Comparison Pages)
  const missedResults = validResults.filter((r) => !r.mentioned);
  const competitorWins = new Map<string, number>();

  for (const r of missedResults) {
    for (const comp of r.competitorsMentioned) {
      if (comp.name && comp.name.trim().length > 0) {
        const cName = comp.name.trim();
        // Ignore generic placeholder strings if any
        if (cName.toLowerCase() !== "otherco") {
          competitorWins.set(cName, (competitorWins.get(cName) || 0) + 1);
        }
      }
    }
  }

  // Sort competitors by win count descending
  const sortedCompetitors = Array.from(competitorWins.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  // Generate top 2 comparison page recommendations for top winning competitors
  for (const [compName, winCount] of sortedCompetitors.slice(0, 2)) {
    const impact = Math.min(25, 10 + winCount * 3);
    addRecommendation({
      title: `Create a dedicated ${context.companyName} vs ${compName} comparison page`,
      description: `${compName} was cited in ${winCount} buyer search prompt(s) where ${context.companyName} was not recommended. Publishing a structured comparison page highlighting your key advantages will improve AI model indexing.`,
      category: "Comparison Pages",
      priority: 1,
      estimatedImpact: impact,
    });
  }

  // 2. Analyze Category Performance (FAQ & Schema Recommendations)
  const categoryStats = new Map<
    string,
    { total: number; mentioned: number; missed: number }
  >();

  for (const r of validResults) {
    const cat = r.category || "General";
    const entry = categoryStats.get(cat) || { total: 0, mentioned: 0, missed: 0 };
    entry.total += 1;
    if (r.mentioned) {
      entry.mentioned += 1;
    } else {
      entry.missed += 1;
    }
    categoryStats.set(cat, entry);
  }

  for (const [category, stats] of categoryStats.entries()) {
    const mentionRate = stats.mentioned / stats.total;
    if (mentionRate < 0.5 && stats.missed >= 1) {
      const impact = Math.min(20, 8 + stats.missed * 2);
      addRecommendation({
        title: `Publish a comprehensive ${category} FAQ & Knowledge Base`,
        description: `AI models recommend competitors in ${Math.round(
          (1 - mentionRate) * 100
        )}% of ${category} buyer queries. Adding structured FAQ schema and detailed documentation on ${context.domain} will help LLMs cite your official site.`,
        category: "FAQ & Schema",
        priority: stats.missed >= 2 || mentionRate === 0 ? 1 : 2,
        estimatedImpact: impact,
      });
    }
  }

  // 3. Analyze Rank #2+ Mentioned Prompts (Product Positioning Optimization)
  const secondaryRankResults = validResults.filter(
    (r) => r.mentioned && r.position !== null && r.position > 1
  );

  if (secondaryRankResults.length >= 1) {
    addRecommendation({
      title: `Optimize product positioning to capture #1 AI recommendation spot`,
      description: `Your brand is mentioned in ${secondaryRankResults.length} prompt(s) but ranked behind competitors. Adding explicit feature comparison tables and customer proof points will push ${context.companyName} to the top #1 spot.`,
      category: "Product Positioning",
      priority: 2,
      estimatedImpact: 12,
    });
  }

  // 4. Fallback / Baseline Best Practice Recommendation
  if (recommendations.length === 0) {
    addRecommendation({
      title: `Add Organization & Product Schema.org structured data`,
      description: `Your brand currently has strong AI visibility across tested prompts. Implement JSON-LD Organization and Product schema markup on ${context.domain} to lock in top AI search citations across future model updates.`,
      category: "Schema Markup",
      priority: 3,
      estimatedImpact: 5,
    });
  }

  // Always append a low-priority general optimization tip if space permits
  if (recommendations.length < 5) {
    addRecommendation({
      title: `Publish clear pricing and feature breakdown tables`,
      description: `LLMs rely heavily on transparent pricing structures and feature matrices when generating buyer recommendations. Ensure ${context.domain} includes accessible pricing details.`,
      category: "Pricing & Transparency",
      priority: 3,
      estimatedImpact: 8,
    });
  }

  // Sort by priority ascending (1 highest), then estimatedImpact descending
  return recommendations.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.estimatedImpact - a.estimatedImpact;
  });
}
