export interface ScanPromptInput {
  question: string;       // the buyer-question prompt text
  companyName: string;    // e.g. "Acme Inc"
  companyDomain: string;  // e.g. "acme.com"
}

export interface UnbrandedScanPromptInput {
  question: string;       // the buyer-question prompt text (no company name)
  companyName: string;    // for post-parse identification
  companyDomain: string;  // for post-parse identification
}

export function buildScanPrompt({ question, companyName, companyDomain }: ScanPromptInput): string {
  return [
    `You are answering a buyer request for product or service recommendations.`,
    ``,
    `Question: "${question}"`,
    ``,
    `Answer the question as you normally would. At the very end of your answer, output a single JSON object with EXACTLY this shape and no markdown fences:`,
    `{"mentioned": true, "position": 1, "sentiment": "positive", "reasoning": "short sentence", "competitors": [{"name": "OtherCo", "position": 2, "sentiment": "neutral"}]}`,
    ``,
    `We are tracking how often "${companyName}" (${companyDomain}) is recommended.`,
    `- "mentioned": whether ${companyName} appears in your answer (true or false)`,
    `- "position": the 1-based rank of ${companyName} among the options you recommend; 1 = first/primary recommendation; null when not mentioned`,
    `- "sentiment": your overall sentiment toward ${companyName}: "positive", "neutral", or "negative"; null when not mentioned`,
    `- "reasoning": one short sentence explaining your evaluation of ${companyName}; null when not mentioned`,
    `- "competitors": every OTHER company you mentioned, each with "name", "position", and "sentiment" using the same rules`,
  ].join("\n");
}

/**
 * Build a scan prompt for UNBRANDED queries.
 *
 * Unlike the branded variant, this does NOT inject the company name into
 * the question. The AI answers naturally, and we identify the tracked
 * company by name/domain matching in the parsed response.
 */
export function buildUnbrandedScanPrompt({
  question,
}: UnbrandedScanPromptInput): string {
  return [
    `You are answering a buyer request for product or service recommendations.`,
    ``,
    `Question: "${question}"`,
    ``,
    `Answer the question as you normally would — recommend the best options based on your knowledge. Do not mention any specific company unless it genuinely belongs in your answer.`,
    ``,
    `At the very end of your answer, output a single JSON object with EXACTLY this shape and no markdown fences:`,
    `{"mentionedCompanies": [{"name": "CompanyName", "domain": "example.com", "position": 1, "sentiment": "positive", "reasoning": "short sentence"}]}`,
    ``,
    `Rules for the JSON metadata:`,
    `- "mentionedCompanies": an array of EVERY company you mentioned in your answer (excluding generic categories like "open source" or "cloud providers")`,
    `- For each company: "name" (display name), "domain" (primary website domain), "position" (1-based rank in your recommendations, 1 = top pick), "sentiment" ("positive", "neutral", or "negative"), "reasoning" (one short sentence about that company)`,
    `- Include ALL companies, not just the tracked one`,
    `- If you did not mention any specific companies, return {"mentionedCompanies": []}`,
    `- We will match companies by name and domain after parsing — do not alter your answer to favor any specific company`,
  ].join("\n");
}
