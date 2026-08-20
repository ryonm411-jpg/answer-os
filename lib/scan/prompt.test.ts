import { describe, it, expect } from "vitest";
import { buildScanPrompt } from "./prompt";

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
