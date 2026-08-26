import type { AIProviderName } from "./types";

export interface ProviderCatalogEntry {
  name: AIProviderName;
  label: string;
  description: string;
}

/** Display metadata for every registered provider (mirrors billing provider-access-list). */
export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    name: "gemini",
    label: "Google Gemini",
    description: "Gemini 2.5 / 3.5 Flash search integration (1,500 RPD free)",
  },
  {
    name: "groq",
    label: "Groq LPU",
    description: "Ultra-fast LPU inference (Llama 3.3 70B & Qwen, 1,000 RPD free)",
  },
  {
    name: "nvidia",
    label: "NVIDIA NIM",
    description: "Enterprise NIM catalog (10,000 RPD free)",
  },
  {
    name: "openrouter",
    label: "OpenRouter Free Pool",
    description: "Open-weight free model router (15+ free models)",
  },
  {
    name: "openai",
    label: "OpenAI ChatGPT",
    description: "GPT-4o general AI model scanning",
  },
  {
    name: "anthropic",
    label: "Anthropic Claude",
    description: "Claude 3.5 Sonnet analysis & recommendations",
  },
  {
    name: "perplexity",
    label: "Perplexity AI",
    description: "Sonar real-time answer engine search",
  },
];
