"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScoredScan } from "@/lib/scoring/calculator";

interface VisibilityScoreCardProps {
  score: ScoredScan | null;
  brandedScore?: ScoredScan | null;
  unbrandedScore?: ScoredScan | null;
  completedAt: string | null;
  activeTab?: "overall" | "branded" | "organic";
  onTabChange?: (tab: "overall" | "branded" | "organic") => void;
}

export function VisibilityScoreCard({
  score,
  brandedScore,
  unbrandedScore,
  completedAt,
  activeTab: controlledTab,
  onTabChange,
}: VisibilityScoreCardProps) {
  const [localTab, setLocalTab] = useState<"overall" | "branded" | "organic">("overall");
  const activeTab = controlledTab ?? localTab;
  const handleTabChange = (val: "overall" | "branded" | "organic") => {
    if (onTabChange) {
      onTabChange(val);
    } else {
      setLocalTab(val);
    }
  };

  const currentScoreObj =
    activeTab === "branded"
      ? brandedScore ?? null
      : activeTab === "organic"
      ? unbrandedScore ?? null
      : score ?? null;

  const numericScore = currentScoreObj?.score ?? null;

  // Determine score color badge/ring status
  const getScoreColorClass = (val: number | null) => {
    if (val === null) return "text-muted-foreground border-border";
    if (val >= 70) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (val >= 40) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-rose-500 border-rose-500/30 bg-rose-500/10";
  };

  const getScoreLabel = (val: number | null) => {
    if (val === null) return "Score Unavailable";
    if (val >= 80) return "High AI Visibility";
    if (val >= 60) return "Moderate AI Visibility";
    if (val >= 40) return "Fair AI Visibility";
    return "Low AI Visibility";
  };

  const getTabDescription = () => {
    if (numericScore === null) {
      return "Run a scan across tested AI providers to calculate your business visibility score.";
    }
    if (activeTab === "branded") {
      return "Measures how favorably AI engines respond when buyers explicitly ask about your brand name in their question.";
    }
    if (activeTab === "organic") {
      return "Measures how often AI models organically recommend your brand when buyers search for solutions without mentioning your name.";
    }
    return "Combines mention rate, position rank, sentiment tone, competitor share, and source authority across all tested prompts.";
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          Visibility Score
          <Tooltip>
            <TooltipTrigger aria-label="Score calculation info" className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Weighted algorithm evaluating mention rate (30%), average rank position (25%), sentiment tone (20%), competitor share (15%), and source authority (10%).
            </TooltipContent>
          </Tooltip>
        </CardTitle>

        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "overall" | "branded" | "organic")}>
            <TabsList className="h-7 p-0.5 bg-muted/60">
              <TabsTrigger value="overall" className="text-xs h-6 px-2">
                Overall
              </TabsTrigger>
              <TabsTrigger value="branded" className="text-xs h-6 px-2">
                Branded
              </TabsTrigger>
              <TabsTrigger value="organic" className="text-xs h-6 px-2">
                Organic
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {numericScore !== null && (
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              {completedAt ? `Scanned ${new Date(completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Scale: 0–100"} (MVP Ceiling: 95)
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="flex items-center gap-6">
          {/* Big Score Display */}
          <div
            className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 font-bold transition-colors ${getScoreColorClass(
              numericScore
            )}`}
          >
            {numericScore !== null ? (
              <>
                <span className="text-3xl tracking-tight">{numericScore}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-medium">/ 100</span>
              </>
            ) : (
              <span className="text-xs text-center px-1 font-medium text-muted-foreground">No Score</span>
            )}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-foreground">
                {getScoreLabel(numericScore)}
              </div>
              <span className="text-xs font-medium text-muted-foreground capitalize">
                ({activeTab})
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getTabDescription()}
            </p>

            {numericScore !== null && numericScore >= 90 && (
              <p className="text-[11px] text-muted-foreground/80 italic">
                Note: 95 is the maximum reach in MVP while citation analysis is in active development.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
