"use client";

import * as React from "react";
import { Edit2, Archive, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PromptSourceBadge } from "./prompt-source-badge";
import { PromptScoreBadge } from "./prompt-score-badge";
import type { PromptIntent } from "@/lib/prompts/intent";
import { INTENT_LABELS } from "@/lib/prompts/intent";

export interface PromptCardData {
  id: string;
  text: string;
  category: string;
  intent: PromptIntent;
  source: "CURATED" | "AI_SUGGESTED" | "USER_CUSTOM";
  demandScore: number | null;
  businessRelevance: number | null;
  competitiveGap: number | null;
  opportunityScore: number | null;
  isEstimated: boolean;
  editable: boolean;
}

export interface PromptCardProps {
  prompt: PromptCardData;
  onEdit?: (prompt: PromptCardData) => void;
  onArchive?: (promptId: string) => void;
  isLocked?: boolean;
}

export function PromptCard({
  prompt,
  onEdit,
  onArchive,
  isLocked = false,
}: PromptCardProps) {
  const intentLabel = INTENT_LABELS[prompt.intent] || prompt.intent;

  return (
    <Card className="flex flex-col justify-between border-border bg-card hover:border-primary/40 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <PromptSourceBadge source={prompt.source} />
            <Badge variant="secondary" className="text-xs font-normal">
              {intentLabel}
            </Badge>
          </div>
          <PromptScoreBadge
            score={prompt.opportunityScore}
            isEstimated={prompt.isEstimated}
          />
        </div>

        {/* Prompt Text (Untruncated) */}
        <p className="text-sm font-medium text-foreground leading-relaxed">
          &ldquo;{prompt.text}&rdquo;
        </p>

        {/* Factor Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-border/50 text-muted-foreground">
          <div>
            <div className="flex items-center gap-1">
              <span>Demand est.</span>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Estimated search/AI question frequency (0–100).
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="font-semibold text-foreground">
              {prompt.demandScore ?? 50}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <span>Gap</span>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Competitive gap from latest completed scan (0–1). Higher means competitors appear while you do not.
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="font-semibold text-foreground">
              {prompt.competitiveGap !== null
                ? prompt.competitiveGap.toFixed(2)
                : "Awaiting"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <span>Relevance</span>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Alignment with your Business Profile & offering (0–100).
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="font-semibold text-foreground">
              {prompt.businessRelevance ?? 80}
            </span>
          </div>
        </div>

        {/* Footer Category & Actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            Category: <strong className="text-foreground/80 font-normal">{prompt.category}</strong>
          </span>

          {prompt.editable && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit?.(prompt)}
                disabled={isLocked}
                title={isLocked ? "Scan in progress" : "Edit prompt"}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onArchive?.(prompt.id)}
                disabled={isLocked}
                title={isLocked ? "Scan in progress" : "Archive prompt"}
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
