import { prisma } from "./prisma";
import { generateRecommendations, type ScanResultForAnalysis } from "@/lib/recommendations/generator";

/**
 * Evaluates a completed scan's results and updates actionable recommendations for the company in PostgreSQL.
 * Keeps user-completed recommendations intact while replacing uncompleted recommendations with fresh insights.
 */
export async function saveScanRecommendations(companyId: string, scanId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, domain: true },
  });

  if (!company) return { count: 0, recommendations: [] };

  const results = await prisma.scanResult.findMany({
    where: { scanId },
    select: {
      promptId: true,
      mentioned: true,
      position: true,
      competitorsMentioned: true,
      error: true,
      prompt: {
        select: {
          text: true,
          category: true,
        },
      },
    },
  });

  const analysisRows: ScanResultForAnalysis[] = results.map((r) => ({
    promptId: r.promptId,
    promptText: r.prompt.text,
    category: r.prompt.category,
    mentioned: r.mentioned,
    position: r.position,
    competitorsMentioned: Array.isArray(r.competitorsMentioned)
      ? (r.competitorsMentioned as { name?: unknown }[])
          .map((c) => ({ name: typeof c?.name === "string" ? c.name : "" }))
          .filter((c) => c.name.length > 0)
      : [],
    error: r.error,
  }));

  const generated = generateRecommendations(
    { companyName: company.name, domain: company.domain },
    analysisRows
  );

  return prisma.$transaction(async (tx) => {
    // Delete previous uncompleted recommendations for this company
    await tx.recommendation.deleteMany({
      where: {
        companyId,
        completed: false,
      },
    });

    if (generated.length === 0) {
      return { count: 0, recommendations: [] };
    }

    const data = generated.map((g) => ({
      companyId,
      title: g.title,
      description: g.description,
      category: g.category,
      priority: g.priority,
      estimatedImpact: g.estimatedImpact,
      completed: false,
    }));

    await tx.recommendation.createMany({ data });

    const updated = await tx.recommendation.findMany({
      where: { companyId, completed: false },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return { count: updated.length, recommendations: updated };
  });
}
