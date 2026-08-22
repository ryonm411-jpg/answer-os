/**
 * PromptIntent taxonomy for buyer query classification.
 *
 * Intent describes what the user is trying to accomplish — it is separate from
 * the `category` field (which describes the business/topic area).
 */

export const PROMPT_INTENTS = [
  "COMMERCIAL",
  "COMPARISON",
  "PROBLEM",
  "PRODUCT",
  "BRAND",
  "ALTERNATIVE",
  "PURCHASE_INTENT",
] as const;

export type PromptIntent = (typeof PROMPT_INTENTS)[number];

/** Type guard for validating raw string values against the enum. */
export function isValidIntent(value: unknown): value is PromptIntent {
  return typeof value === "string" && (PROMPT_INTENTS as readonly string[]).includes(value);
}

/**
 * Human-readable UI labels for each intent.
 * `PURCHASE_INTENT` renders as "Purchase intent" per spec §6.
 */
export const INTENT_LABELS: Record<PromptIntent, string> = {
  COMMERCIAL: "Commercial",
  COMPARISON: "Comparison",
  PROBLEM: "Problem",
  PRODUCT: "Product",
  BRAND: "Brand",
  ALTERNATIVE: "Alternative",
  PURCHASE_INTENT: "Purchase intent",
};

/**
 * Initial businessRelevance estimates for user-created prompts (spec §15).
 * These are estimates, not measured values. The server assigns them; the browser
 * never supplies them.
 */
export const INTENT_RELEVANCE_DEFAULTS: Record<PromptIntent, number> = {
  PURCHASE_INTENT: 95,
  COMMERCIAL: 90,
  ALTERNATIVE: 90,
  COMPARISON: 85,
  BRAND: 80,
  PRODUCT: 80,
  PROBLEM: 75,
};
