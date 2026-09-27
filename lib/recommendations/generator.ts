import { normalizeEntityName } from "../utils/entity";

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
  estimatedImpact: number | null; // null: unsupported numeric percentage claims are eliminated (spec §13)
}

export interface CompanyAnalysisContext {
  companyName: string;
  domain: string;
}

/**
 * Analyzes completed scan result rows to generate actionable, prioritized recommendations.
 * Grounded strictly in empirical ScanResult data without unsupported numeric impact claims.
 */
export function generateRecommendations(
  context: CompanyAnalysisContext,
  results: ScanResultForAnalysis[]
): GeneratedRecommendation[] {
  const validResults = results.filter((r) => !r.error);
  if (validResults.length === 0) {
    return [
      {
        title: "Ensure AI search crawlers can index your website",
        description: `All search checks encountered provider connection issues. Verify that ${context.domain} is publicly accessible and allows web crawler access.`,
        category: "Indexing & Crawlability",
        priority: 1,
        estimatedImpact: null,
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

  // 1. Analyze Competitor Wins on Missed Searches (Comparison Pages)
  const missedResults = validResults.filter((r) => !r.mentioned);
  const competitorWins = new Map<string, number>();

  for (const r of missedResults) {
    for (const comp of r.competitorsMentioned) {
      if (comp.name && comp.name.trim().length > 0) {
        const cName = normalizeEntityName(comp.name);
        const lower = cName.toLowerCase();
        // Ignore synthetic or placeholder names
        if (lower && lower !== "otherco" && lower !== "other company" && lower !== "unknown competitor" && lower !== "other" && lower !== "n/a") {
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
    addRecommendation({
      title: `Create a dedicated ${context.companyName} vs ${compName} comparison page`,
      description: `Observed: ${compName} was cited in ${winCount} AI search question(s) where ${context.companyName} was not mentioned. Why it matters: AI models frequently cite comparison articles when evaluating alternatives. Action: Publish a clear comparison page on ${context.domain} highlighting key strengths and differences.`,
      category: "Comparison Pages",
      priority: 1,
      estimatedImpact: null,
    });
  }

  // 2. Analyze Category Performance (FAQ & Question Knowledge Bases)
  const categoryStats = new Map<
    string,
    { total: number; mentioned: number; missed: number }
  >();

  for (const r of validResults) {
    const rawCat = r.category?.trim();
    const cat = (!rawCat || rawCat.toLowerCase() === "other") ? "Product & Buying Questions" : rawCat;
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
      addRecommendation({
        title: `Publish answers for ${category} questions`,
        description: `Observed: ${context.companyName} was absent in ${stats.missed} of ${stats.total} tested ${category} searches. Why it matters: AI engines synthesize answers from clear, structured knowledge and FAQ pages. Action: Add structured FAQ content addressing common use cases and compatibility on ${context.domain}.`,
        category: "FAQ & Schema",
        priority: stats.missed >= 2 || mentionRate === 0 ? 1 : 2,
        estimatedImpact: null,
      });
    }
  }

  // 3. Analyze Rank #2+ Mentioned Prompts (Positioning Optimization)
  const secondaryRankResults = validResults.filter(
    (r) => r.mentioned && r.position !== null && r.position > 1
  );

  if (secondaryRankResults.length >= 1) {
    addRecommendation({
      title: `Strengthen core product positioning for top AI recommendations`,
      description: `Observed: Your brand was mentioned in ${secondaryRankResults.length} search(es) but ranked behind alternatives. Why it matters: AI models prioritize options with explicit use-case proof points. Action: Add specific differentiator tables and verified specifications to ${context.domain}.`,
      category: "Product Positioning",
      priority: 2,
      estimatedImpact: null,
    });
  }

  // 4. Fallback / Baseline Best Practice Recommendation
  if (recommendations.length === 0) {
    addRecommendation({
      title: `Add structured Schema.org markup to key product pages`,
      description: `Observed: Strong current AI visibility across tested questions. Why it matters: Structured JSON-LD metadata helps AI crawlers parse your company details accurately. Action: Ensure Product and Organization schema markup are present on ${context.domain}.`,
      category: "Schema Markup",
      priority: 3,
      estimatedImpact: null,
    });
  }

  // Always append a low-priority general optimization tip if space permits
  if (recommendations.length < 5) {
    addRecommendation({
      title: `Publish clear pricing and product specifications`,
      description: `Observed: General buyer discovery queries look for explicit details. Why it matters: AI assistants reference transparent pricing and specifications when recommending options. Action: Ensure ${context.domain} has clear, accessible product information.`,
      category: "Pricing & Transparency",
      priority: 3,
      estimatedImpact: null,
    });
  }

  // Sort by priority ascending (1 highest)
  return recommendations.sort((a, b) => a.priority - b.priority);
}
