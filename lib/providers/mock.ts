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

    let content = this.overrides?.content;
    if (!content) {
      if (
        prompt.includes("buyer questions") ||
        prompt.includes("JSON array") ||
        prompt.includes("Generate realistic")
      ) {
        const companyMatch = prompt.match(/Company Name:\s*([^\n]+)/);
        const companyName = companyMatch ? companyMatch[1].trim() : "this company";

        const categoryMatch = prompt.match(/Primary Category:\s*([^\n]+)/);
        const category = categoryMatch ? categoryMatch[1].trim() : "Products";

        content = JSON.stringify([
          {
            text: `What are the best ${category.length > 35 ? "custom device protection" : category.toLowerCase()} options for daily use?`,
            category: "Device Protection",
            intent: "COMMERCIAL",
            demandScore: 94,
            businessRelevance: 96,
          },
          {
            text: `Are ${companyName} phone cases and decal skins easy to apply without air bubbles?`,
            category: "Product Features",
            intent: "PRODUCT",
            demandScore: 89,
            businessRelevance: 92,
          },
          {
            text: `What are the top alternatives to ${companyName} for custom vinyl skins?`,
            category: "Alternatives",
            intent: "ALTERNATIVE",
            demandScore: 86,
            businessRelevance: 88,
          },
          {
            text: `How does ${companyName} compare to leading competitors like Casetify and dbrand?`,
            category: "Comparisons",
            intent: "COMPARISON",
            demandScore: 84,
            businessRelevance: 90,
          },
          {
            text: `How to prevent custom phone case discoloration and decal skin peeling?`,
            category: "Maintenance",
            intent: "PROBLEM",
            demandScore: 78,
            businessRelevance: 82,
          },
          {
            text: `Where to buy officially licensed NFL and Marvel custom phone cases online?`,
            category: "Licensing",
            intent: "PURCHASE_INTENT",
            demandScore: 91,
            businessRelevance: 94,
          },
          {
            text: `Is ${companyName} Customizer tool easy to upload custom photos for laptop skins?`,
            category: "Customizer",
            intent: "BRAND",
            demandScore: 87,
            businessRelevance: 93,
          },
        ]);
      } else {
        const lowerPrompt = prompt.toLowerCase();
        let compList = [
          { name: "dbrand", position: 2, sentiment: "neutral" },
          { name: "Casetify", position: 3, sentiment: "positive" },
        ];

        if (
          lowerPrompt.includes("skin") ||
          lowerPrompt.includes("decal") ||
          lowerPrompt.includes("phone case") ||
          lowerPrompt.includes("macbook") ||
          lowerPrompt.includes("casetify") ||
          lowerPrompt.includes("dbrand") ||
          lowerPrompt.includes("skinit")
        ) {
          compList = [
            { name: "dbrand", position: 2, sentiment: "neutral" },
            { name: "Casetify", position: 3, sentiment: "positive" },
          ];
        } else if (
          lowerPrompt.includes("shoe") ||
          lowerPrompt.includes("footwear") ||
          lowerPrompt.includes("running") ||
          lowerPrompt.includes("zero-drop") ||
          lowerPrompt.includes("vivobarefoot") ||
          lowerPrompt.includes("xeroshoes")
        ) {
          compList = [
            { name: "Vivobarefoot", position: 2, sentiment: "neutral" },
            { name: "Altra", position: 3, sentiment: "positive" },
          ];
        }

        content = JSON.stringify({
          mentioned: true,
          position: 1,
          sentiment: "POSITIVE",
          reasoning: `Mock ${this.name} evaluation for prompt: "${prompt.slice(0, 30)}..."`,
          competitors: compList,
          competitorsMentioned: compList,
        });
      }
    }
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
