import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { hasActiveSubscription } from "@/lib/db/subscriptions";
import { addNewAiSuggestions } from "@/lib/db/prompts";
import { prisma } from "@/lib/db/prisma";

import { generatePromptSuggestions } from "@/lib/prompts/generator";
import { PromptGenerationError } from "@/lib/prompts/errors";
import { AIProviderError } from "@/lib/providers/errors";

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

  // Server-side entitlement check (spec §12, Decision #9)
  const isEntitled = await hasActiveSubscription(company.id);
  if (!isEntitled) {
    return NextResponse.json(
      {
        error: {
          message:
            "An active AnswerOS subscription is required for this action. Open Billing to subscribe or manage your plan.",
        },
      },
      { status: 402 }
    );
  }

  // Refuse generation while scan is active
  const activeScan = await prisma.scan.findFirst({
    where: {
      companyId: company.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });
  if (activeScan) {
    return NextResponse.json(
      { error: { message: "Cannot generate prompts while a scan is in progress" } },
      { status: 409 }
    );
  }

  // Parse optional body for temporary profile override or fallback to stored profile
  let bodyProductDescription: string | undefined;
  let bodyCategory: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.productDescription === "string") {
      bodyProductDescription = body.productDescription;
    }
    if (typeof body?.category === "string") {
      bodyCategory = body.category;
    }
  } catch {
    // Body is optional if stored profile exists
  }

  const productDescription =
    bodyProductDescription?.trim() || company.productDescription?.trim();
  const category = bodyCategory?.trim() || company.industry?.trim() || "General";

  // Grounding requirement: productDescription is MANDATORY (spec §7, §22.5, Invariant #14)
  if (!productDescription) {
    return NextResponse.json(
      {
        error: {
          message:
            "Business Profile productDescription is required before generating prompts. Please provide a brief description of what your company sells.",
        },
      },
      { status: 422 }
    );
  }

  const competitors = await prisma.competitor.findMany({
    where: { companyId: company.id },
    select: { name: true, domain: true },
  });

  try {
    const suggestions = await generatePromptSuggestions({
      companyName: company.name,
      domain: company.domain,
      industry: company.industry,
      businessProfile: {
        productDescription,
        category,
      },
      competitors,
    });

    // Additive generation per spec §8 & §22.5: skips duplicates, preserves user edits
    const result = await addNewAiSuggestions(company.id, suggestions);

    return NextResponse.json({
      data: {
        prompts: result.prompts,
        count: result.count,
      },
    });
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json(
        { error: { message: err.message } },
        { status: 502 }
      );
    }
    if (err instanceof PromptGenerationError) {
      return NextResponse.json(
        { error: { message: err.message } },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
