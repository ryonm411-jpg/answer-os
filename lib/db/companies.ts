import { prisma } from "@/lib/db/prisma";
import { normalizeDomain } from "@/lib/utils/domain";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Database helpers for company (domain) management.
 *
 * Keep the helpers thin — no scan/competitor includes (those arrive in
 * their own feature specs).
 */

/**
 * Resolve the user's company by Clerk id, or `null`.
 * Used by the dashboard layout and page.
 *
 * If user is not found by clerkId, attempts fallback lookup by email (via currentUser)
 * to handle sign-in method changes or Clerk ID updates for existing accounts.
 */
export async function getCompanyByClerkId(clerkId: string) {
  // 1. Direct lookup by clerkId
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { company: true },
  });

  if (user?.company) {
    return user.company;
  }

  // 2. Fallback lookup by email if user/company not found by clerkId
  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const emails = (clerkUser.emailAddresses ?? [])
        .map((e) => e.emailAddress)
        .filter(Boolean);

      if (emails.length > 0) {
        const userByEmail = await prisma.user.findFirst({
          where: { email: { in: emails } },
          include: { company: true },
        });

        if (userByEmail) {
          user = await prisma.user.update({
            where: { id: userByEmail.id },
            data: { clerkId },
            include: { company: true },
          });
          return user.company;
        }
      }
    }
  } catch {
    // Ignore error if currentUser() context is unavailable
  }

  return user?.company ?? null;
}

/**
 * Sync / upsert the Clerk user row into the database.
 * Checks by clerkId first, then by email to handle auth updates seamlessly.
 */
export async function ensureUser(
  clerkId: string,
  email: string,
  name?: string | null
) {
  // 1. Check by clerkId
  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (existingByClerkId) {
    return prisma.user.update({
      where: { id: existingByClerkId.id },
      data: {
        email,
        name: name !== undefined ? name : existingByClerkId.name,
      },
    });
  }

  // 2. Check by email
  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkId,
        name: name !== undefined ? name : existingByEmail.name,
      },
    });
  }

  // 3. Create new user if neither exists
  return prisma.user.create({
    data: { clerkId, email, name: name ?? null },
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
 * `name` defaults to the normalized domain; `industry` and `productDescription` are optional.
 */
export async function createCompany(
  userId: string,
  domain: string,
  industry?: string,
  productDescription?: string
) {
  const normalized = normalizeDomain(domain);
  return prisma.company.create({
    data: {
      userId,
      name: normalized,
      domain: normalized,
      industry: industry ?? null,
      productDescription: productDescription ? productDescription.trim() : null,
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

/**
 * Update the Business Profile fields used by prompt generation (spec §7).
 *
 * `productDescription` is required for prompt generation to proceed.
 * `industry` is optional context used alongside productDescription.
 */
export async function updateCompanyProfile(
  companyId: string,
  profile: {
    productDescription: string;
    industry?: string | null;
  }
) {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      productDescription: profile.productDescription.trim(),
      industry: profile.industry !== undefined ? profile.industry : undefined,
    },
  });
}
