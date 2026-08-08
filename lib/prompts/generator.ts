import { getAvailableProviders } from "../providers/registry";
import type { AIProvider } from "../providers/types";
import { AIProviderError } from "../providers/errors";
import { CURATED_PROMPTS, PROMPT_CATEGORIES, isKnownCategory, normalizePromptText } from "./curated";
import { PromptGenerationError } from "./errors";

export interface PromptSuggestion {
  text: string;
  category: string;
}

export interface GeneratePromptSuggestionsInput {
  companyName: string;
  domain: string;
  industry: string | null;
  competitors: { name: string; domain: string }[];
  count?: number;
}

export function parseSuggestions(content: string): PromptSuggestion[] {
  if (!content || typeof content !== "string") {
    return [];
  }

  let cleaned = content.trim();

  // Strip markdown code block fences if present
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  } else {
    // If no code block, try finding raw JSON array [ ... ]
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      cleaned = arrayMatch[0].trim();
    }
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is PromptSuggestion =>
        typeof item === "object" &&
        item !== null &&
        typeof item.text === "string" &&
        item.text.trim().length > 0 &&
        typeof item.category === "string" &&
        item.category.trim().length > 0
    );
  } catch {
    return [];
  }
}

export function filterSuggestions(
  raw: PromptSuggestion[],
  curatedTexts: Set<string>,
  max: number = 20
): PromptSuggestion[] {
  const cap = Math.min(Math.max(1, max), 50);
  const result: PromptSuggestion[] = [];
  const seenInBatch = new Set<string>();

  for (const item of raw) {
    const rawText = item.text.trim();
    const normalized = normalizePromptText(rawText);

    if (normalized.length < 3) {
      continue;
    }

    if (curatedTexts.has(normalized)) {
      continue;
    }

    if (seenInBatch.has(normalized)) {
      continue;
    }

    seenInBatch.add(normalized);

    const category = isKnownCategory(item.category) ? item.category : "Other";

    result.push({
      text: rawText,
      category,
    });

    if (result.length >= cap) {
      break;
    }
  }

  return result;
}

export async function generatePromptSuggestions(
  input: GeneratePromptSuggestionsInput,
  opts?: { provider?: AIProvider }
): Promise<PromptSuggestion[]> {
  const provider = opts?.provider ?? getAvailableProviders()[0];
  if (!provider) {
    throw new PromptGenerationError("No AI provider configured");
  }

  const competitorList =
    input.competitors.length > 0
      ? input.competitors.map((c) => `${c.name} (${c.domain})`).join(", ")
      : "None listed";

  const categoriesList = PROMPT_CATEGORIES.join(", ");

  const prompt = `You are an AI visibility analyst. Generate high-intent buyer questions that real customers ask AI assistants when comparing or searching for software in this domain.

Company Context:
- Company Name: ${input.companyName}
- Domain: ${input.domain}
- Industry: ${input.industry || "B2B SaaS"}
- Key Competitors: ${competitorList}

Instructions:
1. Generate natural buyer questions relevant to this company and its industry.
2. Formulate prompts as realistic questions an end-user would type into ChatGPT, Claude, Gemini, or Perplexity.
3. Categorize each prompt into one of these EXACT categories: ${categoriesList}.
4. Return ONLY a valid JSON array of objects with keys "text" and "category". No extra prose.

Example format:
[
  { "text": "What are the best alternatives to ${input.companyName} for small teams?", "category": "${PROMPT_CATEGORIES[0]}" },
  { "text": "Compare ${input.companyName} vs ${input.competitors[0]?.name || "leading competitors"} for security features", "category": "Security" }
]`;

  let responseContent: string;
  try {
    const response = await provider.ask(prompt, {
      maxTokens: 4096,
      temperature: 0.8,
    });
    responseContent = response.content;
  } catch (err) {
    if (err instanceof AIProviderError) {
      throw err;
    }
    throw new PromptGenerationError(
      err instanceof Error ? err.message : "Failed to generate prompt suggestions"
    );
  }

  const rawParsed = parseSuggestions(responseContent);
  const curatedSet = new Set(
    CURATED_PROMPTS.map((p) => normalizePromptText(p.text))
  );

  return filterSuggestions(rawParsed, curatedSet, input.count ?? 20);
}
