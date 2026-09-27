"use client";

import * as React from "react";
import { Edit2, Archive, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
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
  promptType?: "BRANDED" | "UNBRANDED";
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
  const [showDetails, setShowDetails] = React.useState(false);
  const intentLabel = INTENT_LABELS[prompt.intent] || prompt.intent;

  // Demand qualitative text
  const demandValue = prompt.demandScore ?? 50;
  const demandLabel = demandValue >= 70 ? "High" : demandValue >= 40 ? "Medium" : "Low";

  // Opportunity summary sentence
  const relevance = prompt.businessRelevance ?? 80;
  const whyMatters =
    relevance >= 80 && demandValue >= 60
      ? "High buyer relevance · Strong discovery potential"
      : relevance >= 80
      ? "Directly matches your offerings · Relevant customer question"
      : "Broad market search · Helps identify competitor positioning";

  // Category fallback - never display "Other"
  const cleanCategory =
    !prompt.category || prompt.category.toLowerCase() === "other"
      ? "General question"
      : prompt.category;

  return (
    <Card className="flex flex-col justify-between border-border bg-card hover:border-primary/40 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PromptScoreBadge
              score={prompt.opportunityScore}
              isEstimated={prompt.isEstimated}
            />
            <Badge variant={prompt.promptType === "BRANDED" ? "default" : "outline"} className="text-[11px] font-normal">
              {prompt.promptType === "BRANDED" ? "Brand search" : "General search"}
            </Badge>
            <Badge variant="secondary" className="text-[11px] font-normal">
              {intentLabel}
            </Badge>
          </div>
          <PromptSourceBadge source={prompt.source} />
        </div>

        {/* Search Question Text */}
        <p className="text-sm font-semibold text-foreground leading-relaxed">
          &ldquo;{prompt.text}&rdquo;
        </p>

        {/* Plain-English Why this search matters */}
        <div className="rounded-md bg-secondary/30 border border-border/40 p-2.5 space-y-1 text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Why this search matters
          </span>
          <p className="text-muted-foreground leading-relaxed">
            {whyMatters}
          </p>
        </div>

        {/* Basic key indicators */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-3">
            <span>
              Demand: <strong className="text-foreground">{demandLabel}</strong>
            </span>
            <span>
              Relevance: <strong className="text-foreground">{relevance}</strong>
            </span>
            {prompt.opportunityScore !== null && !prompt.isEstimated && (
              <span>
                Opportunity: <strong className="text-foreground">{prompt.opportunityScore}/100</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
          >
            <span>{showDetails ? "Hide details" : "View details"}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Collapsible Factor Breakdown */}
        {showDetails && (
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-border/50 text-muted-foreground bg-secondary/20 p-2 rounded-md">
            <div>
              <div className="flex items-center gap-1">
                <span>Estimated demand</span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Estimated demand is a relative estimate produced by the AnswerOS opportunity model (0–100). It is not a direct measure of search volume.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-semibold text-foreground">
                {demandValue} / 100 ({demandLabel})
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span>Visibility gap</span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Difference between your brand visibility and competitor visibility in this search (0–1).
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-semibold text-foreground">
                {prompt.competitiveGap !== null
                  ? prompt.competitiveGap.toFixed(2)
                  : "Awaiting scan"}
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
                    How closely this question aligns with your products and target audience (0–100).
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-semibold text-foreground">
                {relevance} / 100
              </span>
            </div>
          </div>
        )}

        {/* Footer Category & Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground">
            Topic: <strong className="text-foreground/80 font-normal">{cleanCategory}</strong>
          </span>

          {prompt.editable && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit?.(prompt)}
                disabled={isLocked}
                title={isLocked ? "Scan in progress" : "Edit question"}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onArchive?.(prompt.id)}
                disabled={isLocked}
                title={isLocked ? "Scan in progress" : "Archive question"}
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
