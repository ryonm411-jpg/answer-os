export interface ScanPromptInput {
  question: string;       // the buyer-question prompt text
  companyName: string;    // e.g. "Acme Inc"
  companyDomain: string;  // e.g. "acme.com"
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
