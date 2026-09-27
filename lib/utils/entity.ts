/**
 * Utility to normalize entity / brand names from AI model outputs.
 * Fixes markdown artifacts, double-initial hallucinations (e.g. "AAMD" -> "AMD", "NNVIDIA" -> "NVIDIA"),
 * and standardizes canonical brand casings.
 */

const KNOWN_BRANDS: Record<string, string> = {
  amd: "AMD",
  nvidia: "NVIDIA",
  intel: "Intel",
  msi: "MSI",
  asus: "ASUS",
  gigabyte: "Gigabyte",
  asrock: "ASRock",
  evga: "EVGA",
  zotac: "Zotac",
  sparkle: "Sparkle",
  sapphire: "Sapphire",
  pny: "PNY",
  powercolor: "PowerColor",
  xfx: "XFX",
  gainward: "Gainward",
  palit: "Palit",
  inno3d: "Inno3D",
  galax: "GALAX",
  kfa2: "KFA2",
  amazon: "Amazon",
  apple: "Apple",
  microsoft: "Microsoft",
  google: "Google",
  jira: "Jira",
  asana: "Asana",
  linear: "Linear",
  clickup: "ClickUp",
  notion: "Notion",
  github: "GitHub",
  gitlab: "GitLab",
  basecamp: "Basecamp",
  trello: "Trello",
  wrike: "Wrike",
  monday: "Monday.com",
  "monday.com": "Monday.com",
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  zendesk: "Zendesk",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  bigcommerce: "BigCommerce",
  magento: "Magento",
  stripe: "Stripe",
  paypal: "PayPal",
  square: "Square",
  nike: "Nike",
  adidas: "Adidas",
  saucony: "Saucony",
  hoka: "Hoka",
  brooks: "Brooks",
  altra: "Altra",
  on: "On Running",
  "on running": "On Running",
  merrell: "Merrell",
  vivobarefoot: "VivoBarefoot",
  xero: "Xero Shoes",
  "xero shoes": "Xero Shoes",
};

export function normalizeEntityName(rawName: string | null | undefined): string {
  if (!rawName) return "";

  let name = rawName.trim();

  // Strip markdown formatting: **, *, `, _, [], ()
  name = name.replace(/[*`_~[\]()]/g, "");

  // Strip leading list numbers/bullets: "1. ", "A. ", "- ", "• "
  name = name.replace(/^(?:[0-9]+[.)]|[A-Za-z][.)]|[-*•])\s*/, "");

  // Strip trailing punctuation
  name = name.replace(/[:;,."']+$/, "").trim();

  if (!name) return "";

  // Check known brands first (case-insensitive)
  const lower = name.toLowerCase();
  if (KNOWN_BRANDS[lower]) {
    return KNOWN_BRANDS[lower];
  }

  // Fix repeated initial letters caused by list formatting artifacts
  // e.g. "AAMD" -> "AMD", "NNVIDIA" -> "NVIDIA", "IIntel" -> "Intel", "AAmazon" -> "Amazon", "NNvidia" -> "Nvidia"
  const doubleInitialMatch = name.match(/^([A-Za-z])\1([A-Za-z0-9\s_-]{2,})$/);
  if (doubleInitialMatch) {
    const candidate = doubleInitialMatch[1] + doubleInitialMatch[2];
    const candidateLower = candidate.toLowerCase();
    if (KNOWN_BRANDS[candidateLower]) {
      return KNOWN_BRANDS[candidateLower];
    }
    // If the remainder looks like a valid capitalized word, use single initial
    name = candidate;
  }

  // If the word starts with double uppercase followed by lowercase: e.g. "NNvidia" -> "Nvidia"
  const doubleUpperMatch = name.match(/^([A-Z])\1([a-z][a-zA-Z0-9\s_-]+)$/);
  if (doubleUpperMatch) {
    name = doubleUpperMatch[1] + doubleUpperMatch[2];
  }

  // Final check against known brands
  const finalLower = name.toLowerCase();
  if (KNOWN_BRANDS[finalLower]) {
    return KNOWN_BRANDS[finalLower];
  }

  return name;
}
