import { SCORE_WEIGHTS } from "./weights";
import type { ScanSentiment } from "@/lib/scan/parse";
import type { PromptType } from "@/generated/prisma";

/** Prisma-free row shape — the calculator never imports lib/db (Decision #1). */
export interface ScoreResultRow {
  mentioned: boolean;
  position: number | null;        // 1-based rank of the tracked company when mentioned
  sentiment: ScanSentiment | null; // toward the tracked company when mentioned
  competitorsMentioned: string[]; // names of every OTHER company mentioned
  error: string | null;           // non-null ⇒ check failed; excluded everywhere
  promptType?: PromptType;        // BRANDED or UNBRANDED
}

export interface ScoreCalculatorInput {
  rows: ScoreResultRow[];
  promptType?: PromptType | "ALL";
}

export interface VisibilityFactors {
  mentionRate: number;     // 0–1
  averageRank: number;     // 0–1
  sentiment: number;       // 0–1
  competitorShare: number; // 0–1
  sourceAuthority: number; // 0–1 — constant neutral in MVP
}

export interface ScoreSummary {
  results: number;       // all rows in the scan
  validResults: number;  // rows without an error (the scoring denominator)
  mentions: number;      // rows where mentioned === true
  errors: number;        // rows with a non-null error
  promptType?: PromptType | "ALL";
}

export interface ScoredScan {
  score: number | null;          // null ⇒ nothing to score
  factors: VisibilityFactors | null;
  summary: ScoreSummary;
}

const NEUTRAL = 0.5;
const RANK_DEFAULT_SCORE = 0.5;

const SENTIMENT_SCORE: Record<ScanSentiment, number> = {
  POSITIVE: 1,
  NEUTRAL: 0.5,
  NEGATIVE: 0,
};

function rankScore(position: number | null): number {
  if (position !== null && position >= 1) return 1 / position;
  return RANK_DEFAULT_SCORE;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateVisibilityScore(
  input: ScoreResultRow[] | ScoreCalculatorInput,
  filterType?: PromptType | "ALL"
): ScoredScan {
  let rows: ScoreResultRow[];
  let promptTypeFilter: PromptType | "ALL" = filterType ?? "ALL";

  if (Array.isArray(input)) {
    rows = input;
  } else {
    rows = input.rows;
    promptTypeFilter = input.promptType ?? filterType ?? "ALL";
  }

  // Filter by promptType if requested
  const targetRows =
    promptTypeFilter && promptTypeFilter !== "ALL"
      ? rows.filter((r) => r.promptType === promptTypeFilter)
      : rows;

  const summary: ScoreSummary = {
    results: targetRows.length,
    validResults: targetRows.filter((r) => !r.error).length,
    mentions: targetRows.filter((r) => r.mentioned).length,
    errors: targetRows.filter((r) => r.error !== null).length,
    promptType: promptTypeFilter,
  };

  if (summary.validResults === 0) {
    return { score: null, factors: null, summary };
  }

  const valid = targetRows.filter((r) => !r.error);
  const mentions = valid.filter((r) => r.mentioned);

  const mentionRate = mentions.length / valid.length;
  const averageRank =
    mentions.length > 0 ? mean(mentions.map((r) => rankScore(r.position))) : 0;

  const sentiments: ScanSentiment[] = [];
  for (const r of mentions) if (r.sentiment) sentiments.push(r.sentiment);
  const sentiment = sentiments.length > 0 ? mean(sentiments.map((s) => SENTIMENT_SCORE[s])) : 0;

  const competitorPresence = valid.filter((r) => r.competitorsMentioned.length > 0).length;
  const competitorShare =
    mentions.length + competitorPresence > 0
      ? mentions.length / (mentions.length + competitorPresence)
      : NEUTRAL;

  const sourceAuthority = NEUTRAL;

  const factors: VisibilityFactors = {
    mentionRate,
    averageRank,
    sentiment,
    competitorShare,
    sourceAuthority,
  };

  const weighted =
    factors.mentionRate * SCORE_WEIGHTS.mentionRate +
    factors.averageRank * SCORE_WEIGHTS.averageRank +
    factors.sentiment * SCORE_WEIGHTS.sentiment +
    factors.competitorShare * SCORE_WEIGHTS.competitorShare +
    factors.sourceAuthority * SCORE_WEIGHTS.sourceAuthority;

  const score = Math.min(100, Math.max(0, Math.round(100 * weighted)));

  return { score, factors, summary };
}
