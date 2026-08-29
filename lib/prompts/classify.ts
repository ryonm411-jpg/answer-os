import type { PromptType } from "@/generated/prisma";

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/**
 * Classify a prompt as BRANDED or UNBRANDED based on whether the company
 * name or domain appears in the prompt text.
 *
 * Rules:
 * - Case-insensitive match against companyName and companyDomain
 * - Domain match strips protocol, "www.", and trailing slashes
 * - Uses word boundary matching (\b) to avoid substring false positives (e.g., "CRM" matching "best crm")
 * - Returns BRANDED if either matches; UNBRANDED otherwise
 */
export function classifyPromptType(
  text: string,
  companyName: string,
  companyDomain: string
): PromptType {
  if (!text || typeof text !== "string") return "UNBRANDED";

  const trimmedText = text.trim();
  if (!trimmedText) return "UNBRANDED";

  // Check company name
  if (companyName && typeof companyName === "string") {
    const normName = companyName.trim();
    if (normName.length > 0) {
      const pattern = new RegExp(`\\b${escapeRegExp(normName)}\\b`, "i");
      if (pattern.test(trimmedText)) {
        return "BRANDED";
      }
    }
  }

  // Check company domain
  if (companyDomain && typeof companyDomain === "string") {
    const normDomain = normalizeDomain(companyDomain);
    if (normDomain.length > 0) {
      // Full domain match (e.g. "acme.com")
      const fullDomainPattern = new RegExp(`\\b${escapeRegExp(normDomain)}\\b`, "i");
      if (fullDomainPattern.test(trimmedText)) {
        return "BRANDED";
      }

      // Bare domain match (e.g. "acme" from "acme.com"), if bare domain is >= 3 chars
      const bareDomain = normDomain.split(".")[0];
      if (bareDomain && bareDomain.length >= 3) {
        const bareDomainPattern = new RegExp(`\\b${escapeRegExp(bareDomain)}\\b`, "i");
        if (bareDomainPattern.test(trimmedText)) {
          return "BRANDED";
        }
      }
    }
  }

  return "UNBRANDED";
}
