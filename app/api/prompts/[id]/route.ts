import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import {
  getPromptsForCompany,
  updateCompanyPrompt,
  archiveCompanyPrompt,
} from "@/lib/db/prompts";
import { isValidIntent } from "@/lib/prompts/intent";
import { prisma } from "@/lib/db/prisma";

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * PATCH /api/prompts/:id
 * Updates text, category, or intent of an owned AI-suggested or custom prompt.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Refuse mutation if scan active
  const activeScan = await prisma.scan.findFirst({
    where: {
      companyId: company.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });
  if (activeScan) {
    return NextResponse.json(
      { error: { message: "Cannot edit prompts while a scan is in progress" } },
      { status: 409 }
    );
  }

  const { id } = await params;

  const target = await prisma.prompt.findUnique({
    where: { id },
  });

  if (!target || target.archivedAt !== null) {
    return NextResponse.json(
      { error: { message: "Prompt not found" } },
      { status: 404 }
    );
  }

  // Curated prompts are immutable to company users (spec §22.3, Invariant #3)
  if (target.source === "CURATED" || target.companyId === null) {
    return NextResponse.json(
      { error: { message: "Curated prompts cannot be modified" } },
      { status: 403 }
    );
  }

  // Verify company ownership
  if (target.companyId !== company.id) {
    return NextResponse.json(
      { error: { message: "Prompt not found" } },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { text, category, intent } = body ?? {};

    const changes: { text?: string; category?: string; intent?: any } = {};

    if (text !== undefined) {
      if (typeof text !== "string") {
        return NextResponse.json(
          { error: { message: "Text must be a string" } },
          { status: 400 }
        );
      }
      const trimmed = text.trim().replace(/\s+/g, " ");
      if (trimmed.length < 3 || trimmed.length > 500) {
        return NextResponse.json(
          { error: { message: "Prompt text must be between 3 and 500 characters" } },
          { status: 400 }
        );
      }

      // Check normalized duplicate among other active prompts
      const existing = await getPromptsForCompany(company.id);
      const normalizedInput = normalizeText(trimmed);
      const isDuplicate = existing.some(
        (p) => p.id !== id && normalizeText(p.text) === normalizedInput
      );
      if (isDuplicate) {
        return NextResponse.json(
          { error: { message: "A prompt with identical text already exists" } },
          { status: 409 }
        );
      }

      changes.text = trimmed;
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return NextResponse.json(
          { error: { message: "Category cannot be empty" } },
          { status: 400 }
        );
      }
      changes.category = category.trim();
    }

    if (intent !== undefined) {
      if (!isValidIntent(intent)) {
        return NextResponse.json(
          { error: { message: "Invalid prompt intent" } },
          { status: 400 }
        );
      }
      changes.intent = intent;
    }

    const updated = await updateCompanyPrompt(id, company.id, changes);

    return NextResponse.json({
      data: {
        prompt: {
          id: updated.id,
          text: updated.text,
          category: updated.category,
          intent: updated.intent,
          source: updated.source,
          demandScore: updated.demandScore,
          businessRelevance: updated.businessRelevance,
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to update prompt" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompts/:id
 * Archives an owned prompt (spec §22.4). Soft-delete only!
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Refuse mutation if scan active
  const activeScan = await prisma.scan.findFirst({
    where: {
      companyId: company.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });
  if (activeScan) {
    return NextResponse.json(
      { error: { message: "Cannot archive prompts while a scan is in progress" } },
      { status: 409 }
    );
  }

  const { id } = await params;

  const target = await prisma.prompt.findUnique({
    where: { id },
  });

  if (!target || target.archivedAt !== null) {
    return NextResponse.json(
      { error: { message: "Prompt not found" } },
      { status: 404 }
    );
  }

  if (target.source === "CURATED" || target.companyId === null) {
    return NextResponse.json(
      { error: { message: "Curated prompts cannot be archived" } },
      { status: 403 }
    );
  }

  if (target.companyId !== company.id) {
    return NextResponse.json(
      { error: { message: "Prompt not found" } },
      { status: 404 }
    );
  }

  await archiveCompanyPrompt(id, company.id);

  return NextResponse.json({
    data: {
      id,
      archived: true,
    },
  });
}
