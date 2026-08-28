import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getPromptsForCompany, addUserCustomPrompt } from "@/lib/db/prompts";
import { getPromptCompetitiveGap } from "@/lib/db/competitive-gap";
import { calculateOpportunityScore } from "@/lib/scoring/opportunity";
import { getLatestCompletedScan } from "@/lib/db/scoring";
import { isValidIntent } from "@/lib/prompts/intent";
import { prisma } from "@/lib/db/prisma";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { captureApiError } from "@/lib/monitoring/sentry";

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * GET /api/prompts
 * Returns the active effective prompt set for the company, enriched with
 * Opportunity Score, competitive gap, demand estimates, and editability flags.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const company = await getCompanyByClerkId(userId);
  if (!company) {
    return NextResponse.json({ data: { prompts: [] } });
  }

  const rawPrompts = await getPromptsForCompany(company.id);
  const latestScan = await getLatestCompletedScan(company.id);

  const enrichedPrompts = await Promise.all(
    rawPrompts.map(async (prompt) => {
      let gap: number | null = null;
      if (latestScan) {
        const gapResult = await getPromptCompetitiveGap(prompt.id, latestScan.id);
        gap = gapResult.competitiveGap;
      }

      // Read-time demand fallback: 50 for legacy/curated prompts with null demandScore
      const demandScore = prompt.demandScore ?? 50;
      // Read-time businessRelevance fallback: 80
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
        isEstimated: oppResult.isEstimated,
        editable: prompt.source !== "CURATED" && prompt.companyId === company.id,
        createdAt: prompt.createdAt.toISOString(),
        updatedAt: prompt.updatedAt.toISOString(),
      };
    })
  );

  return NextResponse.json({ data: { prompts: enrichedPrompts } });
}

/**
 * POST /api/prompts
 * Creates a USER_CUSTOM prompt for the company.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const company = await getCompanyByClerkId(userId);
  if (!company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  // Refuse prompt mutation if a scan is active (spec §22.6, Invariant #12)
  const activeScan = await prisma.scan.findFirst({
    where: {
      companyId: company.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });
  if (activeScan) {
    return NextResponse.json(
      { error: { message: "Cannot add prompts while a scan is in progress" } },
      { status: 409 }
    );
  }

  try {
    const body = await req.json();
    const { text, category, intent } = body ?? {};

    if (typeof text !== "string") {
      return NextResponse.json(
        { error: { message: "Prompt text is required" } },
        { status: 400 }
      );
    }

    const trimmedText = text.trim().replace(/\s+/g, " ");
    if (trimmedText.length < 3 || trimmedText.length > 500) {
      return NextResponse.json(
        { error: { message: "Prompt text must be between 3 and 500 characters" } },
        { status: 400 }
      );
    }

    if (!isValidIntent(intent)) {
      return NextResponse.json(
        { error: { message: "Invalid or missing prompt intent" } },
        { status: 400 }
      );
    }

    const effectivePrompts = await getPromptsForCompany(company.id);
    const normalizedInput = normalizeText(trimmedText);
    const isDuplicate = effectivePrompts.some(
      (p) => normalizeText(p.text) === normalizedInput
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: { message: "A prompt with identical text already exists" } },
        { status: 409 }
      );
    }

    const created = await addUserCustomPrompt(company.id, {
      text: trimmedText,
      category: typeof category === "string" && category.trim() ? category.trim() : "Other",
      intent,
    });

    await trackEvent(EVENTS.PROMPT_ADDED, userId, { prompt_id: created.id });

    return NextResponse.json(
      {
        data: {
          prompt: {
            id: created.id,
            text: created.text,
            category: created.category,
            intent: created.intent,
            source: created.source,
            demandScore: created.demandScore,
            businessRelevance: created.businessRelevance,
            editable: true,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    captureApiError(err, "/api/prompts");
    return NextResponse.json(
      { error: { message: "Failed to create custom prompt" } },
      { status: 500 }
    );
  }
}
