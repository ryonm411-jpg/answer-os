import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { normalizeDomain, isValidDomain } from "@/lib/utils/domain";
import {
  ensureUser,
  getCompanyByClerkId,
  getCompanyByUserId,
  createCompany,
  updateCompanyDomain,
  deleteCompany,
} from "@/lib/db/companies";
import type { Company } from "@/generated/prisma";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

interface PrismaUniqueConstraintError {
  code: string;
  meta?: { target?: string[] };
}

/** Prisma throws P2002 when a @unique field is violated (race protection). */
function isUniqueConstraintError(error: unknown): error is PrismaUniqueConstraintError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/** Shape the company for API responses (adds the UI onboarding status). */
function companyData(company: Company) {
  return {
    id: company.id,
    name: company.name,
    domain: company.domain,
    industry: company.industry,
    onboardingStatus: "COMPLETED" as const,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

/**
 * GET /api/domain
 * Returns the authenticated user's company, or `null` when they have no
 * company yet ("no company yet" is a valid onboarding state, not a 404).
 */
export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const company = await getCompanyByClerkId(clerkId);

  return NextResponse.json({ data: company ? companyData(company) : null });
}

/**
 * POST /api/domain
 * Creates the authenticated user's company.
 * Request body: { domain: string, industry?: string }
 * `name` defaults to the normalized domain (no separate name field in MVP).
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  let body: { domain?: unknown; industry?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { domain, industry } = body ?? {};

  const normalizedDomain =
    typeof domain === "string" ? normalizeDomain(domain) : "";
  if (!normalizedDomain || !isValidDomain(normalizedDomain)) {
    return NextResponse.json(
      { error: { message: "Invalid domain format" } },
      { status: 400 }
    );
  }

  // Ensure the Clerk user is synced to the database.
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses[0]?.emailAddress ?? `${clerkId}@example.com`;
  const fullName = clerkUser
    ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
    : null;

  const dbUser = await ensureUser(clerkId, email, fullName);

  // Each user may create only one company in the MVP.
  const existingCompany = await getCompanyByUserId(dbUser.id);
  if (existingCompany) {
    return NextResponse.json(
      { error: { message: "User already has a company" } },
      { status: 409 }
    );
  }

  // Reject duplicate domains globally.
  const duplicateDomain = await prisma.company.findUnique({
    where: { domain: normalizedDomain },
  });
  if (duplicateDomain) {
    return NextResponse.json(
      { error: { message: "Domain is already registered" } },
      { status: 409 }
    );
  }

  let company: Company;
  try {
    company = await createCompany(
      dbUser.id,
      normalizedDomain,
      typeof industry === "string" ? industry.trim() || undefined : undefined
    );
  } catch (error) {
    // Two near-simultaneous POSTs can both pass the pre-checks above and then
    // trip a unique constraint on insert — surface those as clean 409s.
    if (isUniqueConstraintError(error)) {
      const target = error.meta?.target;
      return NextResponse.json(
        {
          error: {
            message: target?.includes("userId")
              ? "User already has a company"
              : "Domain is already registered",
          },
        },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ data: companyData(company) }, { status: 201 });
}

/**
 * PATCH /api/domain
 * Updates the authenticated user's tracked domain.
 * Request body: { domain: string }
 * Note: optional `name` / `industry` keys are tolerated (accepted and ignored)
 * in the MVP — the Edit Domain dialog only edits the domain.
 */
export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  let body: { domain?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { domain } = body ?? {};

  const normalizedDomain =
    typeof domain === "string" ? normalizeDomain(domain) : "";
  if (!normalizedDomain || !isValidDomain(normalizedDomain)) {
    return NextResponse.json(
      { error: { message: "Invalid domain format" } },
      { status: 400 }
    );
  }

  const company = await getCompanyByClerkId(clerkId);
  if (!company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  // Reject duplicate domains globally (unless it's the user's own domain).
  if (normalizedDomain !== company.domain) {
    const duplicateDomain = await prisma.company.findUnique({
      where: { domain: normalizedDomain },
    });
    if (duplicateDomain) {
      return NextResponse.json(
        { error: { message: "Domain is already registered" } },
        { status: 409 }
      );
    }
  }

  const updatedCompany = await updateCompanyDomain(company.id, normalizedDomain);

  await trackEvent(EVENTS.DOMAIN_UPDATED, clerkId, { company_id: company.id });

  return NextResponse.json({ data: companyData(updatedCompany) });
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

  const company = await getCompanyByClerkId(clerkId);
  if (!company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  await deleteCompany(company.id);

  await trackEvent(EVENTS.DOMAIN_REMOVED, clerkId, { company_id: company.id });

  return NextResponse.json({
    data: { message: "Company deleted successfully" },
  });
}
