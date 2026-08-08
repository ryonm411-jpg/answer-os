import { describe, expect, it } from "vitest";
import {
  CURATED_PROMPTS,
  isKnownCategory,
  normalizePromptText,
} from "./curated";

describe("curated prompt catalog", () => {
  it("contains at least 100 curated prompts", () => {
    expect(CURATED_PROMPTS.length).toBeGreaterThanOrEqual(100);
  });

  it("populates at least 8 categories", () => {
    const categoriesPresent = new Set(CURATED_PROMPTS.map((p) => p.category));
    expect(categoriesPresent.size).toBeGreaterThanOrEqual(8);
  });

  it("has non-empty texts and valid categories", () => {
    for (const prompt of CURATED_PROMPTS) {
      expect(prompt.text.trim().length).toBeGreaterThan(0);
      expect(isKnownCategory(prompt.category)).toBe(true);
      if (prompt.searchVolume !== undefined && prompt.searchVolume !== null) {
        expect(prompt.searchVolume).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("has unique normalized prompt texts", () => {
    const normalizedTexts = CURATED_PROMPTS.map((p) =>
      normalizePromptText(p.text)
    );
    const uniqueSet = new Set(normalizedTexts);
    expect(uniqueSet.size).toBe(normalizedTexts.length);
  });

  it("normalizes text by trimming, collapsing spaces, and lowercasing", () => {
    expect(normalizePromptText("  Compare   HubSpot   vs Salesforce  ")).toBe(
      "compare hubspot vs salesforce"
    );
  });
});
