import { describe, expect, it } from "vitest";
import {
  CURATED_PROMPTS,
  isKnownCategory,
  normalizePromptText,
} from "./curated";

describe("curated prompt catalog", () => {
  it("defaults to empty array so generic SaaS prompts do not contaminate custom business domains", () => {
    expect(CURATED_PROMPTS).toEqual([]);
  });

  it("validates known categories", () => {
    expect(isKnownCategory("CRM")).toBe(true);
    expect(isKnownCategory("Footwear")).toBe(true);
    expect(isKnownCategory("UnknownCat")).toBe(false);
  });

  it("normalizes text by trimming, collapsing spaces, and lowercasing", () => {
    expect(normalizePromptText("  Compare   HubSpot   vs Salesforce  ")).toBe(
      "compare hubspot vs salesforce"
    );
  });
});
