export const PROMPT_CATEGORIES = [
  "CRM",
  "Email Marketing",
  "Project Management",
  "Analytics",
  "Payments",
  "Collaboration",
  "Help Desk",
  "Marketing Automation",
  "Data & BI",
  "Security",
  "HR & Recruiting",
  "Footwear",
  "E-Commerce",
  "Other",
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export interface CuratedPrompt {
  text: string;
  category: PromptCategory;
  searchVolume?: number;
}

export function isKnownCategory(category: string): category is PromptCategory {
  return (PROMPT_CATEGORIES as readonly string[]).includes(category);
}

export function normalizePromptText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Global curated prompt library (empty by default; company-specific prompts are AI generated or user custom) */
export const CURATED_PROMPTS: CuratedPrompt[] = [];
