import { AnthropicProvider, isConfigured as isAnthropicConfigured } from "./anthropic";
import { AIProviderError } from "./errors";
import { GeminiProvider, isConfigured as isGeminiConfigured } from "./gemini";
import { MockProvider } from "./mock";
import { OpenAIProvider, isConfigured as isOpenAIConfigured } from "./openai";
import { PerplexityProvider, isConfigured as isPerplexityConfigured } from "./perplexity";
import type { AIProvider, AIProviderName, MockOverrides } from "./types";

const providerInstances: Partial<Record<AIProviderName, AIProvider>> = {};

const envKeyNames: Record<AIProviderName, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
};

export function isProviderConfigured(name: AIProviderName): boolean {
  if (process.env.USE_MOCK_PROVIDERS === "true") {
    return true;
  }
  switch (name) {
    case "openai":
      return isOpenAIConfigured();
    case "anthropic":
      return isAnthropicConfigured();
    case "gemini":
      return isGeminiConfigured();
    case "perplexity":
      return isPerplexityConfigured();
    default:
      return false;
  }
}

export function getProvider(name: AIProviderName): AIProvider {
  if (process.env.USE_MOCK_PROVIDERS === "true") {
    if (!providerInstances[name]) {
      providerInstances[name] = new MockProvider(name);
    }
    return providerInstances[name]!;
  }

  if (!isProviderConfigured(name)) {
    const envVar = envKeyNames[name];
    throw new AIProviderError(
      `Missing environment variable ${envVar} for provider "${name}".`,
      {
        provider: name,
        retryable: false,
      }
    );
  }

  if (!providerInstances[name]) {
    switch (name) {
      case "openai":
        providerInstances[name] = new OpenAIProvider();
        break;
      case "anthropic":
        providerInstances[name] = new AnthropicProvider();
        break;
      case "gemini":
        providerInstances[name] = new GeminiProvider();
        break;
      case "perplexity":
        providerInstances[name] = new PerplexityProvider();
        break;
    }
  }

  return providerInstances[name]!;
}

export function getAvailableProviders(): AIProvider[] {
  const names: AIProviderName[] = ["openai", "anthropic", "gemini", "perplexity"];
  return names
    .filter((name) => isProviderConfigured(name))
    .map((name) => getProvider(name));
}

export function createMockProvider(
  name: AIProviderName,
  overrides?: MockOverrides
): AIProvider {
  return new MockProvider(name, overrides);
}
