import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCompanyByClerkId } from "@/lib/db/companies";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const company = await getCompanyByClerkId(clerkId);
  if (!company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  const { id: scanId } = await params;

  let targetScanId = scanId;
  if (scanId === "latest") {
    const latestScan = await prisma.scan.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!latestScan) {
      return NextResponse.json(
        { error: { message: "No scans found" } },
        { status: 404 }
      );
    }
    targetScanId = latestScan.id;
  }

  const scan = await prisma.scan.findFirst({
    where: { id: targetScanId, companyId: company.id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          domain: true,
        },
      },
      results: {
        include: {
          prompt: {
            select: {
              id: true,
              text: true,
              category: true,
              intent: true,
              promptType: true,
              demandScore: true,
              businessRelevance: true,
            },
          },
          citations: {
            select: {
              id: true,
              domain: true,
              url: true,
              title: true,
              citationType: true,
            },
          },
        },
        orderBy: [{ prompt: { text: "asc" } }, { provider: "asc" }],
      },
    },
  });

  if (!scan) {
    return NextResponse.json(
      { error: { message: "Scan not found" } },
      { status: 404 }
    );
  }

  const totalChecks = scan.results.length;
  const validChecks = scan.results.filter((r) => r.error === null);
  const failedChecks = scan.results.filter((r) => r.error !== null);
  const mentions = validChecks.filter((r) => r.mentioned);
  const mentionRate =
    validChecks.length > 0
      ? Math.round((mentions.length / validChecks.length) * 100)
      : 0;
  const coverageRate =
    totalChecks > 0 ? Math.round((validChecks.length / totalChecks) * 100) : 0;

  // Provider and model breakdown telemetry
  const providerStatsMap = new Map<
    string,
    {
      provider: string;
      model: string | null;
      totalChecks: number;
      validChecks: number;
      failedChecks: number;
      mentionsCount: number;
      mentionRate: number;
    }
  >();

  for (const r of scan.results) {
    const key = `${r.provider}:${r.model || "default"}`;
    const existing = providerStatsMap.get(key) || {
      provider: r.provider,
      model: r.model || null,
      totalChecks: 0,
      validChecks: 0,
      failedChecks: 0,
      mentionsCount: 0,
      mentionRate: 0,
    };

    existing.totalChecks += 1;
    if (r.error === null) {
      existing.validChecks += 1;
      if (r.mentioned) {
        existing.mentionsCount += 1;
      }
    } else {
      existing.failedChecks += 1;
    }

    existing.mentionRate =
      existing.validChecks > 0
        ? Math.round((existing.mentionsCount / existing.validChecks) * 100)
        : 0;

    providerStatsMap.set(key, existing);
  }

  const providerModels = Array.from(providerStatsMap.values());

  // Group by prompt
  const promptMap = new Map<
    string,
    {
      promptId: string;
      text: string;
      category: string;
      intent: string;
      promptType: string;
      demandScore: number | null;
      businessRelevance: number | null;
      checks: Array<{
        id: string;
        provider: string;
        model: string | null;
        mentioned: boolean;
        position: number | null;
        sentiment: string | null;
        reasoning: string | null;
        rawResponseSnippet: string | null;
        competitorsMentioned: unknown;
        error: string | null;
        citations: Array<{
          id: string;
          domain: string;
          url: string | null;
          title: string | null;
          citationType: string;
        }>;
      }>;
    }
  >();

  for (const r of scan.results) {
    const p = r.prompt;
    if (!promptMap.has(p.id)) {
      promptMap.set(p.id, {
        promptId: p.id,
        text: p.text,
        category: p.category,
        intent: p.intent,
        promptType: p.promptType,
        demandScore: p.demandScore,
        businessRelevance: p.businessRelevance,
        checks: [],
      });
    }

    const group = promptMap.get(p.id)!;
    group.checks.push({
      id: r.id,
      provider: r.provider,
      model: r.model || null,
      mentioned: r.mentioned,
      position: r.position,
      sentiment: r.sentiment,
      reasoning: r.reasoning,
      rawResponseSnippet: r.rawResponse ? r.rawResponse.substring(0, 500) : null,
      competitorsMentioned: r.competitorsMentioned,
      error: r.error,
      citations: r.citations,
    });
  }

  const promptGroups = Array.from(promptMap.values());

  const organicPromptsCount = promptGroups.filter(
    (p) => p.promptType === "UNBRANDED"
  ).length;
  const brandedPromptsCount = promptGroups.filter(
    (p) => p.promptType === "BRANDED"
  ).length;

  return NextResponse.json({
    data: {
      scan: {
        id: scan.id,
        status: scan.status,
        createdAt: scan.createdAt.toISOString(),
        startedAt: scan.startedAt
          ? scan.startedAt.toISOString()
          : scan.createdAt.toISOString(),
        completedAt: scan.completedAt ? scan.completedAt.toISOString() : null,
        company: scan.company,
        totalChecks,
        validChecks: validChecks.length,
        failedChecks: failedChecks.length,
        mentionsCount: mentions.length,
        mentionRate,
        coverageRate,
        promptsCount: promptGroups.length,
        organicPromptsCount,
        brandedPromptsCount,
        providerModels,
      },
      prompts: promptGroups,
      results: scan.results.map((r) => ({
        id: r.id,
        promptId: r.promptId,
        promptText: r.prompt.text,
        promptCategory: r.prompt.category,
        promptIntent: r.prompt.intent,
        promptType: r.prompt.promptType,
        provider: r.provider,
        model: r.model,
        mentioned: r.mentioned,
        position: r.position,
        sentiment: r.sentiment,
        reasoning: r.reasoning,
        rawResponseSnippet: r.rawResponse ? r.rawResponse.substring(0, 500) : null,
        competitorsMentioned: r.competitorsMentioned,
        error: r.error,
        citations: r.citations,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  });
}
