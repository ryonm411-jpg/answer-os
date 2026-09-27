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

  const getTabDescription = () => {
    if (numericScore === null) {
      return "Run a scan to see how often AI recommends your brand when customers search for products or services like yours.";
    }
    if (activeTab === "branded") {
      return "How AI responds when customers explicitly ask about your brand by name.";
    }
    if (activeTab === "organic") {
      return "How often AI recommends your brand when customers search without mentioning your name.";
    }
    return "How often AI mentions your brand, where you appear, how you compare to competitors, and the quality of sources citing you.";
  };

  const tabLabel = activeTab === "branded" ? "Brand searches" : activeTab === "organic" ? "General searches" : "All searches";

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          AI Visibility Score
          <Tooltip>
            <TooltipTrigger aria-label="Score calculation info" className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              <p className="font-semibold mb-1">How is this calculated?</p>
              <p>Based on how often your brand is mentioned, where it appears, how positively AI describes it, how visible competitors are, and how authoritative the sources are.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>

        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "overall" | "branded" | "organic")}>
            <TabsList className="h-7 p-0.5 bg-muted/60">
              <TabsTrigger value="overall" className="text-xs h-6 px-2">
                All searches
              </TabsTrigger>
              <TabsTrigger value="branded" className="text-xs h-6 px-2">
                Brand searches
              </TabsTrigger>
              <TabsTrigger value="organic" className="text-xs h-6 px-2">
                General searches
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {numericScore !== null && (
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              {completedAt ? `Scanned ${new Date(completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Scale: 0–100"}
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
                {numericScore !== null ? `AI Visibility Score` : "No score yet"}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                ({tabLabel})
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getTabDescription()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
