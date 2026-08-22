"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export interface PromptScoreBadgeProps {
  score: number | null;
  isEstimated?: boolean;
}

export function PromptScoreBadge({ score, isEstimated }: PromptScoreBadgeProps) {
  if (score === null || isEstimated) {
    return (
      <Badge
        variant="outline"
        className="border-muted bg-muted/20 text-muted-foreground text-xs font-normal"
      >
        Awaiting scan data
      </Badge>
    );
  }

  let colorClass = "border-amber-500/30 bg-amber-500/10 text-amber-400";
  if (score >= 70) {
    colorClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  } else if (score < 40) {
    colorClass = "border-rose-500/30 bg-rose-500/10 text-rose-400";
  }

  return (
    <Badge variant="outline" className={`font-semibold text-xs ${colorClass}`}>
      Opp: {score} / 100
    </Badge>
  );
}
