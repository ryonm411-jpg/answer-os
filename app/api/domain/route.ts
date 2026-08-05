import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { normalizeDomain, isValidDomain } from "@/lib/utils/domain";

/**
 * GET /api/domain
 * Returns the authenticated user's company information and onboarding status.
 */
export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { company: true },
  });

  if (!user || !user.company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      data: {
        id: user.company.id,
        name: user.company.name,
        domain: user.company.domain,
        industry: user.company.industry,
        onboardingStatus: "COMPLETED",
        createdAt: user.company.createdAt,
        updatedAt: user.company.updatedAt,
      },
    },
    { status: 200 }
  );
}

/**
 * POST /api/domain
 * Creates the authenticated user's company.
 * Request body: { name: string, domain: string, industry?: string }
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  let body: { name?: unknown; domain?: unknown; industry?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { name, domain, industry } = body || {};

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    return NextResponse.json(
      { error: { message: "Company name is required" } },
      { status: 400 }
    );
  }

  const normalizedDomain =
    typeof domain === "string" ? normalizeDomain(domain) : "";
  if (!normalizedDomain || !isValidDomain(normalizedDomain)) {
    return NextResponse.json(
      { error: { message: "Invalid domain format" } },
      { status: 400 }
    );
  }

  // Ensure Clerk user is synced to DB
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses[0]?.emailAddress ?? `${clerkId}@example.com`;
  const fullName = clerkUser
    ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
    : null;

  const dbUser = await prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      email,
      name: fullName,
    },
    include: { company: true },
  });

  // Each user may create only one company in MVP
  if (dbUser.company) {
    return NextResponse.json(
      { error: { message: "User already has a company" } },
      { status: 409 }
    );
  }

  // Reject duplicate domains globally
  const existingDomain = await prisma.company.findUnique({
    where: { domain: normalizedDomain },
  });

  if (existingDomain) {
    return NextResponse.json(
      { error: { message: "Domain is already registered" } },
      { status: 409 }
    );
  }

  // Create company
  const company = await prisma.company.create({
    data: {
      userId: dbUser.id,
      name: trimmedName,
      domain: normalizedDomain,
      industry: typeof industry === "string" ? industry.trim() || null : null,
    },
  });

  return NextResponse.json(
    {
      data: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        onboardingStatus: "COMPLETED",
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    },
    { status: 201 }
  );
}

/**
 * PATCH /api/domain
 * Updates company information (name, domain, industry) for the authenticated user.
 */
export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  let body: { name?: unknown; domain?: unknown; industry?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { name, domain, industry } = body || {};

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { company: true },
  });

  if (!user || !user.company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  const updateData: { name?: string; domain?: string; industry?: string | null } =
    {};

  if (name !== undefined) {
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return NextResponse.json(
        { error: { message: "Company name cannot be empty" } },
        { status: 400 }
      );
    }
    updateData.name = trimmedName;
  }

  if (domain !== undefined) {
    const normalizedDomain =
      typeof domain === "string" ? normalizeDomain(domain) : "";
    if (!normalizedDomain || !isValidDomain(normalizedDomain)) {
      return NextResponse.json(
        { error: { message: "Invalid domain format" } },
        { status: 400 }
      );
    }

    if (normalizedDomain !== user.company.domain) {
      const duplicateDomain = await prisma.company.findUnique({
        where: { domain: normalizedDomain },
      });
      if (duplicateDomain) {
        return NextResponse.json(
          { error: { message: "Domain is already registered" } },
          { status: 409 }
        );
      }
      updateData.domain = normalizedDomain;
    }
  }

  if (industry !== undefined) {
    updateData.industry =
      typeof industry === "string" ? industry.trim() || null : null;
  }

  const updatedCompany = await prisma.company.update({
    where: { id: user.company.id },
    data: updateData,
  });

  return NextResponse.json(
    {
      data: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        domain: updatedCompany.domain,
        industry: updatedCompany.industry,
        onboardingStatus: "COMPLETED",
        createdAt: updatedCompany.createdAt,
        updatedAt: updatedCompany.updatedAt,
      },
    },
    { status: 200 }
  );
}

/**
 * DELETE /api/domain
 * Deletes the authenticated user's company.
 * Cascade deletes related scans, competitors, and recommendations.
 */
export async function DELETE() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { company: true },
  });

  if (!user || !user.company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  await prisma.company.delete({
    where: { id: user.company.id },
  });

  return NextResponse.json(
    {
      data: { message: "Company deleted successfully" },
    },
    { status: 200 }
  );
}
