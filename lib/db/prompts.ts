import { prisma } from "./prisma";
import type { PromptType } from "@/generated/prisma";
import { classifyPromptType } from "@/lib/prompts/classify";
import type { PromptIntent } from "@/lib/prompts/intent";
import { INTENT_RELEVANCE_DEFAULTS } from "@/lib/prompts/intent";

export interface PromptSuggestionInput {
  text: string;
  category: string;
  intent?: PromptIntent;
  promptType?: PromptType;
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
 * Excludes archived prompts.
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
 * Classifies promptType (BRANDED vs UNBRANDED) automatically if not supplied.
 */
export async function addUserCustomPrompt(
  companyId: string,
  input: {
    text: string;
    category: string;
    intent: PromptIntent;
    promptType?: PromptType;
  },
  companyName?: string,
  companyDomain?: string
) {
  const businessRelevance = INTENT_RELEVANCE_DEFAULTS[input.intent];
  const demandScore = 50;
  const promptType =
    input.promptType ||
    classifyPromptType(input.text, companyName || "", companyDomain || "");

  return prisma.prompt.create({
    data: {
      companyId,
      source: "USER_CUSTOM",
      intent: input.intent,
      promptType,
      text: input.text.trim(),
      category: input.category || "Other",
      demandScore,
      businessRelevance,
    },
  });
}

/**
 * Updates a company-owned prompt's text, category, intent, and/or promptType.
 */
export async function updateCompanyPrompt(
  promptId: string,
  companyId: string,
  changes: {
    text?: string;
    category?: string;
    intent?: PromptIntent;
    promptType?: PromptType;
  },
  companyName?: string,
  companyDomain?: string
) {
  const data: Record<string, unknown> = {};
  if (changes.text !== undefined) {
    const trimmed = changes.text.trim();
    data.text = trimmed;
    if (!changes.promptType && companyName && companyDomain) {
      data.promptType = classifyPromptType(trimmed, companyName, companyDomain);
    }
  }
  if (changes.category !== undefined) data.category = changes.category;
  if (changes.promptType !== undefined) data.promptType = changes.promptType;
  if (changes.intent !== undefined) {
    data.intent = changes.intent;
    data.businessRelevance = INTENT_RELEVANCE_DEFAULTS[changes.intent];
    data.demandScore = 50;
  }

  return prisma.prompt.update({
    where: { id: promptId, companyId },
    data,
  });
}

/**
 * Archives a company-owned prompt.
 */
export async function archiveCompanyPrompt(promptId: string, companyId: string) {
  return prisma.prompt.update({
    where: { id: promptId, companyId },
    data: { archivedAt: new Date() },
  });
}

/**
 * Adds new AI-suggested prompts additively without replacing existing ones.
 */
export async function addNewAiSuggestions(
  companyId: string,
  suggestions: PromptSuggestionInput[],
  companyName?: string,
  companyDomain?: string
) {
  const allCompanyPrompts = await prisma.prompt.findMany({
    where: { OR: [{ companyId }, { companyId: null }] },
  });

  const activeTexts = new Set(
    allCompanyPrompts
      .filter((p) => p.archivedAt === null)
      .map((p) => normalizeText(p.text))
  );

  const archivedMap = new Map<string, string>();
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
      continue;
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
        promptType:
          s.promptType ??
          classifyPromptType(s.text, companyName || "", companyDomain || ""),
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

export async function replaceCompanySuggestions(
  companyId: string,
  suggestions: PromptSuggestionInput[],
  companyName?: string,
  companyDomain?: string
) {
  return addNewAiSuggestions(companyId, suggestions, companyName, companyDomain);
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
