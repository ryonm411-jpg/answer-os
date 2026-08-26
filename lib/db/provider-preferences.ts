import { prisma } from "@/lib/db/prisma";
import type { AIProviderName } from "@/lib/providers/types";
import { TO_PRISMA_PROVIDER } from "@/lib/providers/types";

/**
 * Database access helpers for the company's provider preferences.
 * Owns Prisma queries; contains no rendering or entitlement decisions.
 */

type PrismaAIProvider = import("@/generated/prisma").AIProvider;

function toPrismaProviders(enabled: AIProviderName[]): PrismaAIProvider[] {
  return enabled.map(
    (name) => TO_PRISMA_PROVIDER[name] as PrismaAIProvider
  );
}

function fromPrismaProviders(enabled: PrismaAIProvider[]): AIProviderName[] {
  return enabled.map((value) => value.toLowerCase() as AIProviderName);
}

/**
 * Return the company's stored enabled provider list, or `null` when no
 * preference row exists (caller applies the plan default).
 */
export async function getEnabledProviders(
  companyId: string
): Promise<AIProviderName[] | null> {
  const preference = await prisma.providerPreference.findUnique({
    where: { companyId },
  });
  if (!preference) return null;
  return fromPrismaProviders(preference.enabledProviders);
}

/**
 * Upsert the company's validated enabled-provider selection.
 * Prisma scalar lists are written as a whole — the entire list is replaced.
 */
export async function upsertProviderPreferences(
  companyId: string,
  enabled: AIProviderName[]
): Promise<AIProviderName[]> {
  const enabledProviders = toPrismaProviders(enabled);
  await prisma.providerPreference.upsert({
    where: { companyId },
    create: { companyId, enabledProviders },
    update: { enabledProviders },
  });
  return enabled;
}

/**
 * Delete the preference row so the plan default applies again.
 * Returns the caller-provided default set (the caller computes it).
 */
export async function deleteProviderPreferences(
  companyId: string
): Promise<void> {
  await prisma.providerPreference.deleteMany({
    where: { companyId },
  });
}
