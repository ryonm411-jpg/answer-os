import type { AIProviderName } from "./types";
import { DEFAULT_MODELS, resolveModel } from "./config";
import { FREE_PROVIDERS } from "./tiers";

export interface ProviderProfile {
  provider: AIProviderName;
  model: string;
  tier: "free" | "paid";
  role: string;
  description: string;
  strengths: string[];
  limitations: string[];
  supportsStructuredOutput: boolean;
  supportsCitations: boolean;
  canonicalForVisibilityScore: boolean;
  auxiliaryOnly: boolean;
  maxConcurrency: number;
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestTimeoutMs: number;
  maxRetries: number;
}

export const CANONICAL_PROVIDERS: AIProviderName[] = [
  "openai",
  "anthropic",
  "gemini",
  "perplexity",
];

export const AUXILIARY_PROVIDERS: AIProviderName[] = [
  "groq",
  "nvidia",
  "openrouter",
];

export const PROVIDER_PROFILES: Record<AIProviderName, ProviderProfile> = {
  gemini: {
    provider: "gemini",
    model: DEFAULT_MODELS.gemini,
    tier: "free",
    role: "Fast general-purpose scanning, free-tier preview, prompt suggestion generator",
    description: "Google Gemini Flash model for high-speed initial scanning and AI prompt generation",
    strengths: ["Fast response times", "Multimodal comprehension", "High quota volume on paid tiers"],
    limitations: ["Free tier rate limit cap at 20 RPM", "Occasional unformatted text output under rate pressure"],
    supportsStructuredOutput: true,
    supportsCitations: false,
    canonicalForVisibilityScore: true,
    auxiliaryOnly: false,
    maxConcurrency: 1,
    requestsPerMinute: 20,
    tokensPerMinute: 30000,
    requestTimeoutMs: 60_000,
    maxRetries: 3,
  },
  groq: {
    provider: "groq",
    model: DEFAULT_MODELS.groq,
    tier: "free",
    role: "Fast auxiliary model coverage for ultra-low latency inference",
    description: "Groq LPU hardware running open-weights models like Llama 3.3 70B and Qwen",
    strengths: ["Sub-second inference speed", "High token processing throughput"],
    limitations: ["Strict TPM quota limits (8,000 TPM free)", "Payload size caps (413 Payload Too Large)", "RPM limits (30 RPM)"],
    supportsStructuredOutput: true,
    supportsCitations: false,
    canonicalForVisibilityScore: false,
    auxiliaryOnly: true,
    maxConcurrency: 1,
    requestsPerMinute: 30,
    tokensPerMinute: 8000,
    requestTimeoutMs: 30_000,
    maxRetries: 3,
  },
  nvidia: {
    provider: "nvidia",
    model: DEFAULT_MODELS.nvidia,
    tier: "free",
    role: "Additional auxiliary model coverage for open DeepSeek model diversity",
    description: "NVIDIA NIM enterprise hosted microservices for open model evaluation",
    strengths: ["DeepSeek model capabilities", "Open architecture testing"],
    limitations: ["Prone to server cold-start latency and 30s+ execution timeouts"],
    supportsStructuredOutput: true,
    supportsCitations: false,
    canonicalForVisibilityScore: false,
    auxiliaryOnly: true,
    maxConcurrency: 1,
    requestsPerMinute: 30,
    tokensPerMinute: 20000,
    requestTimeoutMs: 120_000,
    maxRetries: 3,
  },
  openrouter: {
    provider: "openrouter",
    model: DEFAULT_MODELS.openrouter,
    tier: "free",
    role: "Optional auxiliary model coverage and experimental router testing",
    description: "OpenRouter auto-router directing requests to available free open-source LLMs",
    strengths: ["Broad open-source model coverage", "Dynamic routing fallback"],
    limitations: ["Dynamic router target changes between requests", "Variable JSON instruction compliance"],
    supportsStructuredOutput: false,
    supportsCitations: false,
    canonicalForVisibilityScore: false,
    auxiliaryOnly: true,
    maxConcurrency: 2,
    requestsPerMinute: 20,
    tokensPerMinute: 15000,
    requestTimeoutMs: 60_000,
    maxRetries: 2,
  },
  openai: {
    provider: "openai",
    model: DEFAULT_MODELS.openai,
    tier: "paid",
    role: "Premium canonical AI-search visibility measurement",
    description: "OpenAI GPT-4o industry benchmark reasoning engine",
    strengths: ["Native JSON mode support", "Consistent instruction adherence", "High concurrency limits"],
    limitations: ["Paid subscription required"],
    supportsStructuredOutput: true,
    supportsCitations: false,
    canonicalForVisibilityScore: true,
    auxiliaryOnly: false,
    maxConcurrency: 5,
    requestsPerMinute: 500,
    tokensPerMinute: 150000,
    requestTimeoutMs: 60_000,
    maxRetries: 3,
  },
  anthropic: {
    provider: "anthropic",
    model: DEFAULT_MODELS.anthropic,
    tier: "paid",
    role: "Premium canonical AI-search visibility measurement",
    description: "Anthropic Claude 3.5 Sonnet advanced reasoning engine",
    strengths: ["Superior long-context reasoning", "Nuanced sentiment analysis", "High prompt compliance"],
    limitations: ["Paid subscription required"],
    supportsStructuredOutput: true,
    supportsCitations: false,
    canonicalForVisibilityScore: true,
    auxiliaryOnly: false,
    maxConcurrency: 4,
    requestsPerMinute: 100,
    tokensPerMinute: 80000,
    requestTimeoutMs: 60_000,
    maxRetries: 3,
  },
  perplexity: {
    provider: "perplexity",
    model: DEFAULT_MODELS.perplexity,
    tier: "paid",
    role: "Premium canonical search-grounded citation and reference measurement",
    description: "Perplexity Sonar real-time search engine grounded LLM",
    strengths: ["Real-time web search grounding", "Native source domain citation tracking"],
    limitations: ["Paid subscription required"],
    supportsStructuredOutput: true,
    supportsCitations: true,
    canonicalForVisibilityScore: true,
    auxiliaryOnly: false,
    maxConcurrency: 4,
    requestsPerMinute: 60,
    tokensPerMinute: 50000,
    requestTimeoutMs: 45_000,
    maxRetries: 3,
  },
};

/** Get the detailed capability profile for a provider with resolved model name */
export function getProviderProfile(name: AIProviderName, overrideModel?: string): ProviderProfile {
  const base = PROVIDER_PROFILES[name];
  const activeModel = resolveModel(name, overrideModel);
  const tier = FREE_PROVIDERS.includes(name) ? "free" : "paid";

  return {
    ...base,
    model: activeModel,
    tier,
  };
}

/** Check if a provider is canonical for historical visibility score calculations */
export function isCanonicalProvider(name: AIProviderName): boolean {
  return CANONICAL_PROVIDERS.includes(name);
}

/** Check if a provider is auxiliary-only */
export function isAuxiliaryProvider(name: AIProviderName): boolean {
  return AUXILIARY_PROVIDERS.includes(name);
}
