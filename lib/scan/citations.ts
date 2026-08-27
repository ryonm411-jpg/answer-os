import type { CitationType as PrismaCitationType } from "@/generated/prisma";

export type CitationType = "YOU" | "COMPETITOR" | "CORPORATE" | "EDITORIAL" | "UGC" | "OTHER";

export interface ExtractedCitation {
  domain: string;
  url: string | null;
  title: string | null;
  citationType: CitationType;
}

const UGC_DOMAINS = new Set([
  "reddit.com",
  "youtube.com",
  "youtu.be",
  "quora.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "medium.com",
  "discord.com",
  "discord.gg",
  "stackexchange.com",
  "stackoverflow.com",
  "discourse.org",
  "vimeo.com",
  "facebook.com",
  "instagram.com",
  "threads.net",
  "lemon8-app.com",
  "pinterest.com",
]);

const EDITORIAL_DOMAINS = new Set([
  "techcrunch.com",
  "theverge.com",
  "tomsguide.com",
  "wirecutter.com",
  "rtings.com",
  "cnet.com",
  "pcmag.com",
  "forbes.com",
  "engadget.com",
  "digitaltrends.com",
  "macrumors.com",
  "9to5mac.com",
  "androidcentral.com",
  "ign.com",
  "gamespot.com",
  "anandtech.com",
  "businessinsider.com",
  "nytimes.com",
  "wsj.com",
  "bloomberg.com",
  "theguardian.com",
  "wired.com",
  "slashdot.org",
  "ars-technica.com",
  "arstechnica.com",
  "mashable.com",
  "tomshardware.com",
]);

const OTHER_DOMAINS = new Set([
  "amazon.com",
  "amazon.co.uk",
  "amazon.de",
  "amazon.ca",
  "ebay.com",
  "walmart.com",
  "etsy.com",
  "target.com",
  "bestbuy.com",
  "wikipedia.org",
  "wikimedia.org",
  "google.com",
  "bing.com",
  "duckduckgo.com",
  "yahoo.com",
]);

/** Normalize raw domain/URL string to clean root domain (e.g. "https://www.reddit.com/r/..." -> "reddit.com") */
export function normalizeDomain(input: string): string {
  if (!input) return "";
  let clean = input.trim().toLowerCase();

  // Strip protocol
  clean = clean.replace(/^https?:\/\//i, "");

  // Strip path & query parameters
  clean = clean.split("/")[0].split("?")[0].split("#")[0].split(":")[0];

  // Strip leading "www."
  if (clean.startsWith("www.")) {
    clean = clean.slice(4);
  }

  return clean;
}

/** Classify a domain into canonical CitationType taxonomy */
export function classifyDomain(
  domainInput: string,
  companyDomain?: string | null,
  competitorDomains?: string[]
): CitationType {
  const domain = normalizeDomain(domainInput);
  if (!domain) return "OTHER";

  // 1. Primary brand check ("YOU")
  if (companyDomain) {
    const cleanCompany = normalizeDomain(companyDomain);
    if (cleanCompany && (domain === cleanCompany || domain.endsWith("." + cleanCompany))) {
      return "YOU";
    }
  }

  // 2. Competitor check ("COMPETITOR")
  if (competitorDomains && competitorDomains.length > 0) {
    for (const comp of competitorDomains) {
      const cleanComp = normalizeDomain(comp);
      if (cleanComp && (domain === cleanComp || domain.endsWith("." + cleanComp))) {
        return "COMPETITOR";
      }
    }
  }

  // 3. UGC Check
  if (
    UGC_DOMAINS.has(domain) ||
    Array.from(UGC_DOMAINS).some((u) => domain.endsWith("." + u)) ||
    domain.startsWith("forum.") ||
    domain.includes(".forum.")
  ) {
    return "UGC";
  }

  // 4. Editorial Check
  if (
    EDITORIAL_DOMAINS.has(domain) ||
    Array.from(EDITORIAL_DOMAINS).some((ed) => domain.endsWith("." + ed))
  ) {
    return "EDITORIAL";
  }

  // 5. Marketplaces & General Encyclopedias Check ("OTHER")
  if (
    OTHER_DOMAINS.has(domain) ||
    Array.from(OTHER_DOMAINS).some((o) => domain.endsWith("." + o))
  ) {
    return "OTHER";
  }

  // 6. Default external corporate/brand site check
  return "CORPORATE";
}

/** Extract explicit URL citations and referenced web domains from raw AI text outputs */
export function extractCitations(
  rawText: string | null | undefined,
  companyDomain?: string | null,
  competitorDomains?: string[]
): ExtractedCitation[] {
  if (!rawText || !rawText.trim()) return [];

  const citationMap = new Map<string, ExtractedCitation>();

  // 1. Extract markdown links: [Title/Text](https://domain.com/path)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/gi;
  let mdMatch: RegExpExecArray | null;
  while ((mdMatch = markdownLinkRegex.exec(rawText)) !== null) {
    const title = mdMatch[1].trim();
    const url = mdMatch[2].trim();
    try {
      const parsedUrl = new URL(url);
      const domain = normalizeDomain(parsedUrl.hostname);
      if (domain && !citationMap.has(domain)) {
        citationMap.set(domain, {
          domain,
          url,
          title: title || null,
          citationType: classifyDomain(domain, companyDomain, competitorDomains),
        });
      }
    } catch {
      // ignore invalid URLs
    }
  }

  // 2. Extract plain URLs: https://domain.com/path
  const plainUrlRegex = /(https?:\/\/[^\s\)\>\]"']+)/gi;
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = plainUrlRegex.exec(rawText)) !== null) {
    const url = urlMatch[1].trim();
    try {
      const parsedUrl = new URL(url);
      const domain = normalizeDomain(parsedUrl.hostname);
      if (domain && !citationMap.has(domain)) {
        citationMap.set(domain, {
          domain,
          url,
          title: null,
          citationType: classifyDomain(domain, companyDomain, competitorDomains),
        });
      }
    } catch {
      // ignore invalid URLs
    }
  }

  // 3. Fallback: Extract explicit standalone brand domain mentions (e.g. "skinit.com", "mightyskins.com", "reddit.com")
  const domainMentionRegex = /\b([a-zA-Z0-9-]+\.(?:com|org|net|co|io|uk|ca|de|app|store|shop|me|tech|dev))\b/gi;
  let domainMatch: RegExpExecArray | null;
  while ((domainMatch = domainMentionRegex.exec(rawText)) !== null) {
    const domainStr = domainMatch[1].trim();
    const domain = normalizeDomain(domainStr);
    if (domain && !citationMap.has(domain)) {
      citationMap.set(domain, {
        domain,
        url: `https://${domain}`,
        title: null,
        citationType: classifyDomain(domain, companyDomain, competitorDomains),
      });
    }
  }

  return Array.from(citationMap.values());
}
