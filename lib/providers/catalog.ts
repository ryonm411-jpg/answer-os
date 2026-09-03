import type { AIProviderName } from "./types";

export interface ProviderCatalogEntry {
  name: AIProviderName;
  label: string;
  description: string;
  speedBadge?: string;
  promptLengthNote?: string;
  restrictionNote?: string;
}

/** Display metadata for every registered provider (mirrors billing provider-access-list). */
export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    name: "gemini",
    label: "Google Gemini",
    description: "Fast free scanning & prompt generation. Best for quick initial visibility checks.",
    speedBadge: "Fast",
    promptLengthNote: "Standard Prompts",
    restrictionNote: "Rate throttled (20 RPM free limit)",
  },
  {
    name: "groq",
    label: "Groq LPU",
    description: "Ultra-fast inference (Llama 3.3 70B). Best for instant preview scans.",
    speedBadge: "Ultra Fast",
    promptLengthNote: "Requires Short Prompts",
    restrictionNote: "Capped at 1,000 chars per prompt (shared API key & 8k TPM cap)",
  },
  {
    name: "nvidia",
    label: "NVIDIA NIM",
    description: "Enterprise open-weight models (DeepSeek). Best for testing open AI model diversity.",
    speedBadge: "Takes Longer",
    promptLengthNote: "Cold-Start Latency (30–45s)",
    restrictionNote: "Max 2 concurrent checks & strict 45s execution limit",
  },
  {
    name: "openai",
    label: "OpenAI ChatGPT",
    description: "GPT-4o benchmark model. Essential for measuring visibility on ChatGPT.",
    speedBadge: "Fast & Benchmark",
    promptLengthNote: "Accepts Long Prompts",
    restrictionNote: "Unlocks on Paid Subscription",
  },
  {
    name: "anthropic",
    label: "Anthropic Claude",
    description: "Claude 3.5 Sonnet. Best for deep reasoning, nuanced sentiment, and recommendations.",
    speedBadge: "High Precision",
    promptLengthNote: "Accepts Long Prompts",
    restrictionNote: "Unlocks on Paid Subscription",
  },
  {
    name: "perplexity",
    label: "Perplexity AI",
    description: "Sonar real-time answer engine. Essential for tracking live web citations & sources.",
    speedBadge: "Real-time Search",
    promptLengthNote: "Standard Prompts",
    restrictionNote: "Unlocks on Paid Subscription",
  },
];
