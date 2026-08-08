import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { replaceCompanySuggestions } from "@/lib/db/prompts";
import { prisma } from "@/lib/db/prisma";

import { generatePromptSuggestions } from "@/lib/prompts/generator";
import { PromptGenerationError } from "@/lib/prompts/errors";
import { AIProviderError } from "@/lib/providers/errors";

export async function POST() {
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

  const competitors = await prisma.competitor.findMany({
    where: { companyId: company.id },
    select: { name: true, domain: true },
  });

  try {
    const suggestions = await generatePromptSuggestions({
      companyName: company.name,
      domain: company.domain,
      industry: company.industry,
      competitors,
    });

    const result = await replaceCompanySuggestions(company.id, suggestions);

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
