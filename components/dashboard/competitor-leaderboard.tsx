"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Info, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CompetitorLeaderboardRow } from "@/lib/db/dashboard";

interface CompetitorLeaderboardProps {
  competitors: CompetitorLeaderboardRow[];
  hasScanData: boolean;
}

export function CompetitorLeaderboard({
  competitors,
  hasScanData,
}: CompetitorLeaderboardProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedCompetitors = showAll ? competitors : competitors.slice(0, 7);

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Competitors
            </span>
            <p className="text-xs font-normal text-muted-foreground">
              Brands with highest visibility
            </p>
          </div>

          {hasScanData && competitors.length > 7 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>{showAll ? "Show Top 7" : "Show All"}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        {!hasScanData ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-lg bg-secondary/20 my-2">
            <Users className="h-6 w-6 text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground">
              No scan data available yet. Run a scan to measure competitor visibility and rankings.
            </p>
          </div>
        ) : competitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-lg bg-secondary/20 my-2">
            <Users className="h-6 w-6 text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground">
              No competitor mentions detected in the latest scan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground font-medium text-[11px]">
                  <th scope="col" className="py-2 px-2 w-8">
                    #
                  </th>
                  <th scope="col" className="py-2 px-2">
                    Brand
                  </th>
                  <th scope="col" className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Visibility</span>
                      <Tooltip>
                        <TooltipTrigger className="inline-flex items-center text-muted-foreground hover:text-foreground">
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-xs">
                          Percentage of valid scan responses mentioning this brand.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                  <th scope="col" className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Sentiment</span>
                      <Tooltip>
                        <TooltipTrigger className="inline-flex items-center text-muted-foreground hover:text-foreground">
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-xs">
                          Average tone/sentiment score (0–100 scale) of brand mentions across AI models.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                  <th scope="col" className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Position</span>
                      <Tooltip>
                        <TooltipTrigger className="inline-flex items-center text-muted-foreground hover:text-foreground">
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-xs">
                          Average list rank position when mentioned in AI search answers (lower is better).
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayedCompetitors.map((row) => (
                  <tr
                    key={row.name}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-2 font-mono text-muted-foreground">
                      {row.rank}
                    </td>

                    {/* Brand Logo / Name */}
                    <td className="py-2.5 px-2 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {/* Placeholder logo icon / favicon */}
                        <div className="h-5 w-5 rounded bg-secondary/80 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-border/60">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[140px]">
                          {row.name}
                        </span>
                      </div>
                    </td>

                    {/* Visibility Percentage */}
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-foreground">
                      {row.visibilityPercent}%
                    </td>

                    {/* Sentiment Score Badge */}
                    <td className="py-2.5 px-2 text-right font-mono">
                      <span
                        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          row.sentimentScore >= 75
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : row.sentimentScore >= 50
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {row.sentimentScore}
                      </span>
                    </td>

                    {/* Position */}
                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                      {row.averagePosition.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
