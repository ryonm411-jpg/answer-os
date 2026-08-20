import { SCORE_WEIGHTS } from "./weights";
import type { ScanSentiment } from "@/lib/scan/parse";

/** Prisma-free row shape — the calculator never imports lib/db (Decision #1). */
export interface ScoreResultRow {
  mentioned: boolean;
  position: number | null;        // 1-based rank of the tracked company when mentioned (12)
  sentiment: ScanSentiment | null; // toward the tracked company when mentioned
  competitorsMentioned: string[]; // names of every OTHER company mentioned (12)
  error: string | null;           // non-null ⇒ check failed; excluded everywhere (Decision #2)
}

export interface VisibilityFactors {
  mentionRate: number;     // 0–1
  averageRank: number;     // 0–1
  sentiment: number;       // 0–1
  competitorShare: number; // 0–1
  sourceAuthority: number; // 0–1 — constant neutral in MVP (Decision #6)
}

export interface ScoreSummary {
  results: number;       // all rows in the scan
  validResults: number;  // rows without an error (the scoring denominator)
  mentions: number;      // rows where mentioned === true
  errors: number;        // rows with a non-null error
}

export interface ScoredScan {
  score: number | null;          // null ⇒ nothing to score (Decision #9)
  factors: VisibilityFactors | null;
  summary: ScoreSummary;
}

const NEUTRAL = 0.5; // "no data" default for competitorShare, and sourceAuthority (Decision #6)
const RANK_DEFAULT_SCORE = 0.5; // mentioned but position unknown → mid-visibility

const SENTIMENT_SCORE: Record<ScanSentiment, number> = {
  POSITIVE: 1,
  NEUTRAL: 0.5,
  NEGATIVE: 0,
};

/** Rank decay: position 1 → 1.0, 2 → 0.5, 3 → 0.33 — earlier is better (answeros-spec). */
function rankScore(position: number | null): number {
  if (position !== null && position >= 1) return 1 / position;
  return RANK_DEFAULT_SCORE;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateVisibilityScore(rows: ScoreResultRow[]): ScoredScan {
  const summary: ScoreSummary = {
    results: rows.length,
    validResults: rows.filter((r) => !r.error).length,
    mentions: rows.filter((r) => r.mentioned).length,
    errors: rows.filter((r) => r.error !== null).length,
  };

  if (summary.validResults === 0) {
    return { score: null, factors: null, summary }; // Decision #9
  }

  const valid = rows.filter((r) => !r.error);
  const mentions = valid.filter((r) => r.mentioned);

  // Mention rate (30%): clean mentions over clean checks.
  const mentionRate = mentions.length / valid.length;

  // Average rank (25%): mean rank decay over mentions; 0 when never mentioned
  // (no rank data ≠ mid score — the company wasn't ranked at all).
  const averageRank =
    mentions.length > 0 ? mean(mentions.map((r) => rankScore(r.position))) : 0;

  // Sentiment (20%): mean over mentions that reported a sentiment; 0 when none
  // (no tone data ≠ neutral tone — there were no mentions to have tone).
  const sentiments: ScanSentiment[] = [];
  for (const r of mentions) if (r.sentiment) sentiments.push(r.sentiment);
  const sentiment = sentiments.length > 0 ? mean(sentiments.map((s) => SENTIMENT_SCORE[s])) : 0;

  // Competitor share (15%): tracked mentions vs mentions of ANY other company.
  // No data at all → neutral (neither you nor competitors were named).
  const competitorPresence = valid.filter((r) => r.competitorsMentioned.length > 0).length;
  const competitorShare =
    mentions.length + competitorPresence > 0
      ? mentions.length / (mentions.length + competitorPresence)
      : NEUTRAL;

  // Source authority (10%): constant neutral in MVP (Decision #6).
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
