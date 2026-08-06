import { prisma } from "@/lib/db/prisma";
import { normalizeDomain } from "@/lib/utils/domain";

/**
 * Database helpers for company (domain) management.
 *
 * Keep the helpers thin — no scan/competitor includes (those arrive in
 * their own feature specs).
 */

/**
 * Resolve the user's company by Clerk id, or `null`.
 * Used by the dashboard layout and page. Does not create the user row.
 */
export async function getCompanyByClerkId(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { company: true },
  });
  return user?.company ?? null;
}

/**
 * Upsert the Clerk user row into the database.
 */
export async function ensureUser(
  clerkId: string,
  email: string,
  name?: string | null
) {
  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId, email, name: name ?? null },
  });
}

/**
 * Return the user's company, or `null`.
 */
export async function getCompanyByUserId(userId: string) {
  return prisma.company.findUnique({ where: { userId } });
}

/**
 * Create a company for a user.
 * `name` defaults to the normalized domain; `industry` is optional.
 */
export async function createCompany(
  userId: string,
  domain: string,
  industry?: string
) {
  const normalized = normalizeDomain(domain);
  return prisma.company.create({
    data: {
      userId,
      name: normalized,
      domain: normalized,
      industry: industry ?? null,
    },
  });
}

/**
 * Update the tracked domain for a company.
 */
export async function updateCompanyDomain(companyId: string, domain: string) {
  const normalized = normalizeDomain(domain);
  return prisma.company.update({
    where: { id: companyId },
    data: { domain: normalized },
  });
}

/**
 * Delete the company (cascades to scans, competitors, recommendations).
 */
export async function deleteCompany(companyId: string) {
  return prisma.company.delete({ where: { id: companyId } });
}
