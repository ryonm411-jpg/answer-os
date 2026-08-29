import { describe, it, expect } from "vitest";
import { buildScanPrompt, buildUnbrandedScanPrompt } from "./prompt";

describe("buildScanPrompt", () => {
  it("interpolates question, company name, and domain into the prompt template", () => {
    const prompt = buildScanPrompt({
      question: "What is the best CRM for startups?",
      companyName: "Acme Corp",
      companyDomain: "acme.com",
    });

    expect(prompt).toContain('Question: "What is the best CRM for startups?"');
    expect(prompt).toContain('We are tracking how often "Acme Corp" (acme.com) is recommended.');
    expect(prompt).toContain('"mentioned"');
    expect(prompt).toContain('"position"');
    expect(prompt).toContain('"sentiment"');
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('"competitors"');
  });
});

describe("buildUnbrandedScanPrompt", () => {
  it("includes question text without injecting tracked company name into tracking prompt", () => {
    const prompt = buildUnbrandedScanPrompt({
      question: "What are the best laptop skin companies?",
      companyName: "Slickwraps",
      companyDomain: "slickwraps.com",
    });

    expect(prompt).toContain('Question: "What are the best laptop skin companies?"');
    expect(prompt).not.toContain('We are tracking how often "Slickwraps"');
    expect(prompt).toContain('"mentionedCompanies"');
    expect(prompt).toContain('Do not mention any specific company unless it genuinely belongs in your answer.');
  });
});
