import { prisma } from "./prisma";

export interface PromptSuggestionInput {
  text: string;
  category: string;
}

export async function getPromptsForCompany(companyId: string) {
  return prisma.prompt.findMany({
    where: {
      OR: [{ companyId: null }, { companyId }],
    },
    orderBy: [{ category: "asc" }, { text: "asc" }],
  });
}

export async function getCompanySuggestions(companyId: string) {
  return prisma.prompt.findMany({
    where: {
      companyId,
      source: "AI_SUGGESTED",
    },
    orderBy: [{ category: "asc" }, { text: "asc" }],
  });
}

export async function replaceCompanySuggestions(
  companyId: string,
  suggestions: PromptSuggestionInput[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.prompt.deleteMany({
      where: {
        companyId,
        source: "AI_SUGGESTED",
      },
    });

    if (suggestions.length === 0) {
      return { count: 0, prompts: [] };
    }

    const data = suggestions.map((s) => ({
      companyId,
      source: "AI_SUGGESTED" as const,
      text: s.text,
      category: s.category,
      searchVolume: null,
    }));

    await tx.prompt.createMany({ data });

    const created = await tx.prompt.findMany({
      where: {
        companyId,
        source: "AI_SUGGESTED",
      },
      orderBy: [{ category: "asc" }, { text: "asc" }],
    });

    return { count: created.length, prompts: created };
  });
}
