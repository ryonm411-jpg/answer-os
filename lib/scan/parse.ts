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
  if (Array.isArray(obj.competitors)) {
    for (const c of obj.competitors) {
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
