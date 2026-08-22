import type {
  AIProvider,
  AIProviderName,
  AIResponse,
  MockOverrides,
} from "./types";

export class MockProvider implements AIProvider {
  constructor(
    readonly name: AIProviderName,
    private readonly overrides?: MockOverrides
  ) {}

  async ask(prompt: string): Promise<AIResponse> {
    if (this.overrides?.error) {
      throw this.overrides.error;
    }

    const content =
      this.overrides?.content ??
      JSON.stringify({
        mentioned: true,
        position: 1,
        sentiment: "POSITIVE",
        reasoning: `Mock ${this.name} evaluation for prompt: "${prompt.slice(0, 30)}..."`,
        competitorsMentioned: [{ name: "Salesforce" }, { name: "HubSpot" }],
      });
    const model = this.overrides?.model ?? `mock-${this.name}`;
    const tokensUsed =
      this.overrides?.tokensUsed ?? Math.max(10, Math.ceil(prompt.length / 4));
    const latencyMs = this.overrides?.latencyMs ?? 50;

    return {
      content,
      model,
      tokensUsed,
      latencyMs,
    };
  }
}
