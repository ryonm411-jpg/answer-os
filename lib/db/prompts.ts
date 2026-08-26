import { prisma } from "./prisma";
import type { PromptIntent } from "@/lib/prompts/intent";
import { INTENT_RELEVANCE_DEFAULTS } from "@/lib/prompts/intent";

export interface PromptSuggestionInput {
  text: string;
  category: string;
  intent?: PromptIntent;
  demandScore?: number | null;
  businessRelevance?: number | null;
}

/**
 * Returns the effective active prompt set for a company.
 *
 * Includes:
 *   - Global curated prompts (companyId IS NULL)
 *   - Company-owned prompts (companyId = currentCompanyId)
 *
 * Excludes archived prompts. The `archivedAt IS NULL` filter is applied
 * OUTSIDE the ownership OR so archived curated prompts are also excluded (spec §21).
 */
export async function getPromptsForCompany(companyId: string) {
  return prisma.prompt.findMany({
    where: {
      archivedAt: null,
      OR: [{ companyId }, { companyId: null }],
    },
    orderBy: [{ category: "asc" }, { text: "asc" }],
  });
}

export async function getCompanySuggestions(companyId: string) {
  return prisma.prompt.findMany({
    where: {
      companyId,
      source: "AI_SUGGESTED",
      archivedAt: null,
    },
    orderBy: [{ category: "asc" }, { text: "asc" }],
  });
}

/**
 * Adds a USER_CUSTOM prompt for a company.
 *
 * Calculates initial `businessRelevance` server-side from the intent default.
 * The caller must have already validated text length, intent, and uniqueness.
 */
export async function addUserCustomPrompt(
  companyId: string,
  input: {
    text: string;
    category: string;
    intent: PromptIntent;
  }
) {
  const businessRelevance = INTENT_RELEVANCE_DEFAULTS[input.intent];
  // Neutral demand fallback (spec §13): 50 until an AI estimate is available.
  const demandScore = 50;

  return prisma.prompt.create({
    data: {
      companyId,
      source: "USER_CUSTOM",
      intent: input.intent,
      text: input.text.trim(),
      category: input.category || "Other",
      demandScore,
      businessRelevance,
    },
  });
}

/**
 * Updates a company-owned prompt's text, category, and/or intent.
 *
 * Resets `demandScore` and `businessRelevance` when intent changes because the
 * stored estimate is no longer valid for the new intent context.
 */
export async function updateCompanyPrompt(
  promptId: string,
  companyId: string,
  changes: {
    text?: string;
    category?: string;
    intent?: PromptIntent;
  }
) {
  const data: Record<string, unknown> = {};
  if (changes.text !== undefined) data.text = changes.text.trim();
  if (changes.category !== undefined) data.category = changes.category;
  if (changes.intent !== undefined) {
    data.intent = changes.intent;
    // Recalculate relevance from the new intent default (spec §22.3).
    data.businessRelevance = INTENT_RELEVANCE_DEFAULTS[changes.intent];
    data.demandScore = 50; // reset to neutral until regenerated
  }

  return prisma.prompt.update({
    where: { id: promptId, companyId },
    data,
  });
}

/**
 * Archives a company-owned prompt (spec §21).
 *
 * Does NOT hard-delete — historical ScanResult rows remain intact.
 */
export async function archiveCompanyPrompt(promptId: string, companyId: string) {
  return prisma.prompt.update({
    where: { id: promptId, companyId },
    data: { archivedAt: new Date() },
  });
}

/**
 * Adds new AI-suggested prompts additively without replacing existing ones.
 *
 * Skips any suggestion whose normalized text already exists in the active
 * prompt set for this company (curated or company-owned).
 *
 * Replaces the old destructive `replaceCompanySuggestions` behavior (spec §8).
 */
export async function addNewAiSuggestions(
  companyId: string,
  suggestions: PromptSuggestionInput[]
) {
  // Fetch ALL prompts for this company (active and archived)
  const allCompanyPrompts = await prisma.prompt.findMany({
    where: { OR: [{ companyId }, { companyId: null }] },
  });

  const activeTexts = new Set(
    allCompanyPrompts
      .filter((p) => p.archivedAt === null)
      .map((p) => normalizeText(p.text))
  );

  const archivedMap = new Map<string, string>(); // normalizedText -> promptId
  allCompanyPrompts
    .filter((p) => p.archivedAt !== null && p.companyId === companyId)
    .forEach((p) => {
      archivedMap.set(normalizeText(p.text), p.id);
    });

  const toUnarchiveIds: string[] = [];
  const brandNewSuggestions: PromptSuggestionInput[] = [];

  for (const s of suggestions) {
    const norm = normalizeText(s.text);
    if (activeTexts.has(norm)) {
      continue; // already active in workspace
    }
    if (archivedMap.has(norm)) {
      toUnarchiveIds.push(archivedMap.get(norm)!);
    } else {
      brandNewSuggestions.push(s);
    }
  }

  if (toUnarchiveIds.length > 0) {
    await prisma.prompt.updateMany({
      where: { id: { in: toUnarchiveIds } },
      data: { archivedAt: null },
    });
  }

  if (brandNewSuggestions.length > 0) {
    await prisma.prompt.createMany({
      data: brandNewSuggestions.map((s) => ({
        companyId,
        source: "AI_SUGGESTED" as const,
        intent: (s.intent as PromptIntent) ?? "PRODUCT",
        text: s.text.trim(),
        category: s.category || "Other",
        demandScore: s.demandScore ?? 50,
        businessRelevance: s.businessRelevance ?? 70,
      })),
    });
  }

  const activePrompts = await prisma.prompt.findMany({
    where: {
      companyId,
      source: "AI_SUGGESTED",
      archivedAt: null,
      text: { in: suggestions.map((s) => s.text.trim()) },
    },
    orderBy: [{ category: "asc" }, { text: "asc" }],
  });

  const totalAddedOrRestored = toUnarchiveIds.length + brandNewSuggestions.length;
  return { count: totalAddedOrRestored, prompts: activePrompts };
}

/** Legacy export kept for backward-compatibility with onboarding route. */
export async function replaceCompanySuggestions(
  companyId: string,
  suggestions: PromptSuggestionInput[]
) {
  return addNewAiSuggestions(companyId, suggestions);
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
