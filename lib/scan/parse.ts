export type ScanSentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export interface ParsedCompetitorMention {
  name: string;
  position: number | null;
  sentiment: ScanSentiment | null;
}

export interface ParsedScanResponse {
  mentioned: boolean;
  position: number | null;
  sentiment: ScanSentiment | null;
  reasoning: string | null;
  competitors: ParsedCompetitorMention[];
}

/** ok:false means the response contained no usable metadata JSON object. */
export type ParseResult =
  | { ok: true; data: ParsedScanResponse }
  | { ok: false; error: string };

const SENTIMENT_MAP: Record<string, ScanSentiment> = {
  positive: "POSITIVE",
  neutral: "NEUTRAL",
  negative: "NEGATIVE",
};

export function parseSentiment(value: unknown): ScanSentiment | null {
  if (typeof value !== "string") return null;
  return SENTIMENT_MAP[value.trim().toLowerCase()] ?? null;
}

function parsePosition(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

/** 1. whole response is JSON; 2. markdown-fenced block; 3. first { to last }. */
function extractJsonObject(content: string): string | null {
  const trimmed = content.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return null;
}

export function parseScanResponse(content: string): ParseResult {
  const json = extractJsonObject(content);
  if (!json) return { ok: false, error: "Response contained no JSON metadata object" };

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Response JSON could not be parsed" };
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Metadata is not a JSON object" };
  }
  const obj = raw as Record<string, unknown>;

  const mentioned = obj.mentioned === true || obj.mentioned === "true";
  const sentiment = parseSentiment(obj.sentiment);
  const position = mentioned ? parsePosition(obj.position) : null;

  const competitors: ParsedCompetitorMention[] = [];
  const rawCompetitors = Array.isArray(obj.competitors)
    ? obj.competitors
    : Array.isArray(obj.competitorsMentioned)
    ? obj.competitorsMentioned
    : null;

  if (rawCompetitors) {
    for (const c of rawCompetitors) {
      if (typeof c !== "object" || c === null) continue;
      const comp = c as Record<string, unknown>;
      const name = typeof comp.name === "string" ? comp.name.trim() : "";
      if (!name) continue;

      // Filter out synthetic/placeholder competitor labels per spec rule 9
      const lowerName = name.toLowerCase();
      if (lowerName === "otherco" || lowerName === "other company" || lowerName === "unknown competitor") {
        continue;
      }

      competitors.push({
        name,
        position: parsePosition(comp.position),
        sentiment: parseSentiment(comp.sentiment),
      });
      if (competitors.length >= 10) break; // bounded
    }
  }

  const reasoning =
    typeof obj.reasoning === "string" && obj.reasoning.trim() ? obj.reasoning.trim() : null;

  return { ok: true, data: { mentioned, position, sentiment, reasoning, competitors } };
}

function normalizeDomain(d: string): string {
  return d
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function matchesTrackedCompany(
  candidate: { name: string; domain: string },
  trackedName: string,
  trackedDomain: string
): boolean {
  if (candidate.domain && trackedDomain) {
    const candNorm = normalizeDomain(candidate.domain);
    const trackNorm = normalizeDomain(trackedDomain);
    if (candNorm === trackNorm) return true;
    const bareTrack = trackNorm.split(".")[0];
    if (bareTrack && bareTrack.length >= 3 && candNorm.includes(bareTrack)) return true;
  }

  if (candidate.name && trackedName) {
    const candNameNorm = candidate.name.trim().toLowerCase();
    const trackNameNorm = trackedName.trim().toLowerCase();
    if (candNameNorm === trackNameNorm || candNameNorm.includes(trackNameNorm)) return true;
  }

  return false;
}

/**
 * Parse a non-injective scan response that lists ALL mentioned companies.
 * Then identify which (if any) matches the tracked company.
 */
export function parseUnbrandedScanResponse(
  content: string,
  trackedCompanyName: string,
  trackedCompanyDomain: string
): ParseResult {
  const json = extractJsonObject(content);
  if (!json) return { ok: false, error: "Response contained no JSON metadata object" };

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Response JSON could not be parsed" };
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Metadata is not a JSON object" };
  }
  const obj = raw as Record<string, unknown>;

  const rawList = Array.isArray(obj.mentionedCompanies)
    ? obj.mentionedCompanies
    : Array.isArray(obj.companies)
    ? obj.companies
    : [];

  const parsedCompanies: Array<{
    name: string;
    domain: string;
    position: number | null;
    sentiment: ScanSentiment | null;
    reasoning: string | null;
  }> = [];

  for (const item of rawList) {
    if (typeof item !== "object" || item === null) continue;
    const comp = item as Record<string, unknown>;
    const name = typeof comp.name === "string" ? comp.name.trim() : "";
    if (!name) continue;

    const lowerName = name.toLowerCase();
    if (lowerName === "otherco" || lowerName === "other company" || lowerName === "unknown competitor") {
      continue;
    }

    const domain = typeof comp.domain === "string" ? comp.domain.trim() : "";
    const position = parsePosition(comp.position);
    const sentiment = parseSentiment(comp.sentiment);
    const reasoning = typeof comp.reasoning === "string" && comp.reasoning.trim() ? comp.reasoning.trim() : null;

    parsedCompanies.push({ name, domain, position, sentiment, reasoning });
  }

  const matchedIndex = parsedCompanies.findIndex((c) =>
    matchesTrackedCompany(c, trackedCompanyName, trackedCompanyDomain)
  );

  if (matchedIndex !== -1) {
    const matched = parsedCompanies[matchedIndex];
    const competitors: ParsedCompetitorMention[] = parsedCompanies
      .filter((_, idx) => idx !== matchedIndex)
      .slice(0, 10)
      .map((c) => ({
        name: c.name,
        position: c.position,
        sentiment: c.sentiment,
      }));

    return {
      ok: true,
      data: {
        mentioned: true,
        position: matched.position,
        sentiment: matched.sentiment,
        reasoning: matched.reasoning,
        competitors,
      },
    };
  }

  const competitors: ParsedCompetitorMention[] = parsedCompanies.slice(0, 10).map((c) => ({
    name: c.name,
    position: c.position,
    sentiment: c.sentiment,
  }));

  return {
    ok: true,
    data: {
      mentioned: false,
      position: null,
      sentiment: null,
      reasoning: null,
      competitors,
    },
  };
}
