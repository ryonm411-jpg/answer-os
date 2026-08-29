import { describe, it, expect } from "vitest";
import { classifyPromptType } from "./classify";

describe("classifyPromptType", () => {
  const companyName = "Slickwraps";
  const companyDomain = "https://www.slickwraps.com/";

  it("classifies prompts mentioning company name as BRANDED", () => {
    expect(classifyPromptType("Is Slickwraps good?", companyName, companyDomain)).toBe("BRANDED");
    expect(
      classifyPromptType("Where to buy slickwraps laptop skins?", companyName, companyDomain)
    ).toBe("BRANDED");
    expect(classifyPromptType("SLICKWRAPS vs dbrand", companyName, companyDomain)).toBe("BRANDED");
  });

  it("classifies prompts mentioning domain as BRANDED", () => {
    expect(classifyPromptType("Check out slickwraps.com for skins", companyName, companyDomain)).toBe(
      "BRANDED"
    );
  });

  it("classifies buyer questions without company name or domain as UNBRANDED", () => {
    expect(classifyPromptType("What are the best laptop skin companies?", companyName, companyDomain)).toBe(
      "UNBRANDED"
    );
    expect(classifyPromptType("Best laptop skins for MacBook Pro", companyName, companyDomain)).toBe(
      "UNBRANDED"
    );
  });

  it("avoids substring false positives using word boundaries", () => {
    // "CRM Corp" should not match "What is the best crm for startups?" if we check "CRM Corp"
    expect(
      classifyPromptType("What is the best crm for startups?", "CRM Corp", "crmcorp.com")
    ).toBe("UNBRANDED");
  });

  it("handles prompts with competitor names as UNBRANDED if company name is not present", () => {
    expect(classifyPromptType("Is dbrand better than Skinit?", companyName, companyDomain)).toBe(
      "UNBRANDED"
    );
  });

  it("handles empty or edge case inputs gracefully", () => {
    expect(classifyPromptType("", companyName, companyDomain)).toBe("UNBRANDED");
    expect(classifyPromptType("Best products", "", "")).toBe("UNBRANDED");
  });
});
