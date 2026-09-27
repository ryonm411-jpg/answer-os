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
        Awaiting scan
      </Badge>
    );
  }

  let label = "Medium Opportunity";
  let colorClass = "border-amber-500/30 bg-amber-500/10 text-amber-400";
  if (score >= 70) {
    label = "High Opportunity";
    colorClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  } else if (score < 40) {
    label = "Low Opportunity";
    colorClass = "border-muted/50 bg-secondary/50 text-muted-foreground";
  }

  return (
    <Badge variant="outline" className={`font-semibold text-[11px] uppercase tracking-wider ${colorClass}`}>
      {label}
    </Badge>
  );
}
