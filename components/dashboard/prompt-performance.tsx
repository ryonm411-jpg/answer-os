"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, MessageSquare } from "lucide-react";
import type { PromptPerformanceItem } from "@/lib/db/dashboard";

interface PromptPerformanceProps {
  topPrompts: PromptPerformanceItem[];
  missingOpportunities: PromptPerformanceItem[];
}

export function PromptPerformance({ topPrompts, missingOpportunities }: PromptPerformanceProps) {
  const [activeTab, setActiveTab] = useState<"top" | "missing">("top");

  const renderPromptList = (items: PromptPerformanceItem[], isMissing: boolean) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-secondary/20 my-2">
          <MessageSquare className="h-6 w-6 text-muted-foreground/60 mb-2" />
          <p className="text-xs text-muted-foreground">
            {isMissing
              ? "No missing prompt opportunities detected. Great coverage!"
              : "No high-performing prompts recorded in the latest scan."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        {items.map((item) => {
          const mentionPercent = Math.round(item.mentionRate * 100);
          return (
            <div
              key={item.promptId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground border-border">
                    {item.category}
                  </Badge>
                  {!isMissing && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {mentionPercent}% Mentioned
                    </span>
                  )}
                  {isMissing && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Not Mentioned
                    </span>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger className="text-xs font-medium text-foreground truncate cursor-default block text-left">
                    &quot;{item.text}&quot;
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md text-xs leading-relaxed">
                    {item.text}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                {item.averageRank !== null && (
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Avg Rank</span>
                    <span className="font-semibold text-foreground">#{item.averageRank.toFixed(1)}</span>
                  </div>
                )}

                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Competitors</span>
                  <span className="font-medium text-foreground">
                    {item.competitorMentionCount} {item.competitorMentionCount === 1 ? "check" : "checks"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Prompt Performance Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "top" | "missing")}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary/50">
            <TabsTrigger value="top" className="text-xs">
              Top Prompts ({topPrompts.length})
            </TabsTrigger>
            <TabsTrigger value="missing" className="text-xs">
              Missing Opportunities ({missingOpportunities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top">
            {renderPromptList(topPrompts, false)}
          </TabsContent>

          <TabsContent value="missing">
            {renderPromptList(missingOpportunities, true)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
