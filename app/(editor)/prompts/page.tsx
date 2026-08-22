import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getPromptsForCompany } from "@/lib/db/prompts";
import { getLatestCompletedScan } from "@/lib/db/scoring";
import { getPromptCompetitiveGap } from "@/lib/db/competitive-gap";
import { calculateOpportunityScore } from "@/lib/scoring/opportunity";
import { PromptWorkspace } from "@/components/prompts/prompt-workspace";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const company = await getCompanyByClerkId(userId);
  if (!company) {
    redirect("/onboarding");
  }

  const rawPrompts = await getPromptsForCompany(company.id);
  const latestScan = await getLatestCompletedScan(company.id);

  // Check if a scan is currently running or pending
  const activeScan = await prisma.scan.findFirst({
    where: {
      companyId: company.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });

  const enrichedPrompts = await Promise.all(
    rawPrompts.map(async (prompt) => {
      let gap: number | null = null;
      if (latestScan) {
        const gapResult = await getPromptCompetitiveGap(prompt.id, latestScan.id);
        gap = gapResult.competitiveGap;
      }

      const demandScore = prompt.demandScore ?? 50;
      const businessRelevance = prompt.businessRelevance ?? 80;

      const oppResult = calculateOpportunityScore({
        demandScore,
        competitiveGap: gap,
        businessRelevance,
      });

      return {
        id: prompt.id,
        text: prompt.text,
        category: prompt.category,
        intent: prompt.intent,
        source: prompt.source,
        searchVolume: prompt.searchVolume,
        demandScore,
        businessRelevance,
        competitiveGap: oppResult.competitiveGap,
        opportunityScore: oppResult.score,
        isEstimated: !latestScan || oppResult.score === null,
        editable: prompt.source !== "CURATED" && prompt.companyId === company.id,
        createdAt: prompt.createdAt.toISOString(),
        updatedAt: prompt.updatedAt.toISOString(),
      };
    })
  );

  return (
    <PromptWorkspace
      initialPrompts={enrichedPrompts}
      companyName={company.name}
      initialProductDescription={company.productDescription ?? ""}
      initialIndustry={company.industry ?? ""}
      isScanActive={Boolean(activeScan)}
    />
  );
}
