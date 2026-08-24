import { getAvailableProviders } from "../providers/registry";
import type { AIProvider } from "../providers/types";
import { CURATED_PROMPTS, PROMPT_CATEGORIES, normalizePromptText } from "./curated";
import { PromptGenerationError } from "./errors";
import type { PromptIntent } from "./intent";
import { isValidIntent, PROMPT_INTENTS } from "./intent";

export interface BusinessProfile {
  productDescription: string;
  category: string;
}

export interface PromptSuggestion {
  text: string;
  category: string;
  intent: PromptIntent;
  demandScore: number;
  businessRelevance: number;
}

export interface GeneratePromptSuggestionsInput {
  companyName: string;
  domain: string;
  industry: string | null;
  businessProfile: BusinessProfile;
  competitors: { name: string; domain: string }[];
  count?: number;
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
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
  raw: Partial<PromptSuggestion>[],
  curatedTexts: Set<string>,
  max: number = 20,
  fallbackCategory?: string
): PromptSuggestion[] {
  const cap = Math.min(Math.max(1, max), 50);
  const result: PromptSuggestion[] = [];
  const seenInBatch = new Set<string>();

  for (const item of raw) {
    if (!item.text || typeof item.text !== "string") continue;
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

    // Preserve the model's suggested category if non-empty, otherwise use profile category or fallback to "Other"
    const category =
      item.category && typeof item.category === "string" && item.category.trim().length > 0
        ? item.category.trim()
        : fallbackCategory && fallbackCategory.trim().length > 0
        ? fallbackCategory.trim()
        : "Other";

    // Fallback parser behavior per spec §6: PRODUCT used only when malformed intent can be recovered
    const intent: PromptIntent = isValidIntent(item.intent) ? item.intent : "PRODUCT";

    const demandScore =
      typeof item.demandScore === "number" && !isNaN(item.demandScore)
        ? clamp(Math.round(item.demandScore), 0, 100)
        : 50;

    const businessRelevance =
      typeof item.businessRelevance === "number" && !isNaN(item.businessRelevance)
        ? clamp(Math.round(item.businessRelevance), 0, 100)
        : 70;

    result.push({
      text: rawText,
      category,
      intent,
      demandScore,
      businessRelevance,
    });

    if (result.length >= cap) {
      break;
    }
  }

  return result;
}

export async function generatePromptSuggestions(
  input: GeneratePromptSuggestionsInput,
  opts?: { provider?: AIProvider; providers?: AIProvider[] }
): Promise<PromptSuggestion[]> {
  if (
    !input.businessProfile ||
    !input.businessProfile.productDescription ||
    input.businessProfile.productDescription.trim().length === 0
  ) {
    throw new PromptGenerationError("Business Profile productDescription is required for prompt generation");
  }

  const candidateProviders: AIProvider[] = opts?.provider
    ? [opts.provider]
    : opts?.providers && opts.providers.length > 0
    ? opts.providers
    : getAvailableProviders();

  if (candidateProviders.length === 0) {
    throw new PromptGenerationError("No AI provider configured");
  }

  const competitorList =
    input.competitors.length > 0
      ? input.competitors.map((c) => `${c.name} (${c.domain})`).join(", ")
      : "None listed";

  const categoriesList = PROMPT_CATEGORIES.join(", ");
  const intentsList = PROMPT_INTENTS.join(", ");

  const prompt = `You are an AI search visibility analyst. Generate realistic, high-intent buyer questions that prospects ask AI assistants (ChatGPT, Claude, Gemini, Perplexity) when discovering or comparing solutions in this company's exact industry.

CRITICAL INSTRUCTIONS:
1. All generated questions MUST be strictly relevant to the company's Business Profile described below.
2. BALANCE BRANDED AND UNBRANDED QUERIES:
   - Provide 50% UNBRANDED category questions where the buyer is searching for solutions without mentioning the brand name (e.g., "What are the best barefoot shoes for trail running?", "Best zero-drop shoes for posture", "Top minimalist footwear for wide feet").
   - Provide 50% BRANDED and COMPARISON questions that explicitly evaluate the company or compare it to competitors (e.g., "${input.companyName} vs Vivobarefoot", "Are ${input.companyName} good for long distance?").
3. NEVER generate questions about unrelated industries (for example, if the company sells shoes, do NOT generate CRM software questions).

Company Context:
- Company Name: ${input.companyName}
- Domain: ${input.domain}
- Primary Category: ${input.businessProfile.category || input.industry || "General"}
- Product/Offering Description: ${input.businessProfile.productDescription}
- Key Competitors: ${competitorList}

Instructions:
1. Generate natural buyer questions relevant to this specific product offering across ALL applicable buyer intents.
2. Each question MUST be assigned one of these EXACT intent values: ${intentsList}.
3. Each question MUST be assigned one of these EXACT categories: ${categoriesList}.
4. Provide an estimated "demandScore" (0-100, representing how commonly buyers search/ask this type of query).
5. Provide an estimated "businessRelevance" (0-100, representing how closely this question aligns with the company's product offering).
6. Return ONLY a valid JSON array of objects with keys: "text", "category", "intent", "demandScore", "businessRelevance". No extra prose.

Example JSON output format:
[
  {
    "text": "What are the best barefoot shoes for running?",
    "category": "Footwear",
    "intent": "COMMERCIAL",
    "demandScore": 90,
    "businessRelevance": 95
  },
  {
    "text": "What are the best alternatives to ${input.companyName}?",
    "category": "Alternatives",
    "intent": "ALTERNATIVE",
    "demandScore": 85,
    "businessRelevance": 90
  },
  {
    "text": "Compare ${input.companyName} vs ${input.competitors[0]?.name || "competitor"}",
    "category": "Comparisons",
    "intent": "COMPARISON",
    "demandScore": 80,
    "businessRelevance": 85
  }
]`;

  let responseContent: string | null = null;
  const providerErrors: { name: string; message: string }[] = [];

  for (const provider of candidateProviders) {
    try {
      const response = await provider.ask(prompt, {
        maxTokens: 4096,
        temperature: 0.8,
        timeoutMs: 60_000,
      });
      responseContent = response.content;
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      providerErrors.push({ name: provider.name, message });
      console.warn(`[PromptGenerator] Provider "${provider.name}" failed, trying next provider if available:`, err);
    }
  }

  if (responseContent === null) {
    const summary = providerErrors
      .map((e) => `${e.name}: ${e.message}`)
      .join("; ");
    throw new PromptGenerationError(
      `All providers failed — ${summary}`
    );
  }

  const rawParsed = parseSuggestions(responseContent);
  const curatedSet = new Set(
    CURATED_PROMPTS.map((p) => normalizePromptText(p.text))
  );

  return filterSuggestions(rawParsed, curatedSet, input.count ?? 20, input.businessProfile.category);
}
