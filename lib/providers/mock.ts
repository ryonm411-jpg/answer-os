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
      `[Mock ${this.name}] Response for prompt: "${prompt.slice(0, 30)}..."`;
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
