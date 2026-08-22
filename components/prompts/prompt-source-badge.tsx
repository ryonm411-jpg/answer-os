"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, User, ShieldCheck } from "lucide-react";

export interface PromptSourceBadgeProps {
  source: "CURATED" | "AI_SUGGESTED" | "USER_CUSTOM";
}

export function PromptSourceBadge({ source }: PromptSourceBadgeProps) {
  if (source === "CURATED") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-normal"
      >
        <ShieldCheck className="h-3 w-3" />
        Curated
      </Badge>
    );
  }

  if (source === "AI_SUGGESTED") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-normal"
      >
        <Sparkles className="h-3 w-3" />
        AI Suggested
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-normal"
    >
      <User className="h-3 w-3" />
      Custom
    </Badge>
  );
}
