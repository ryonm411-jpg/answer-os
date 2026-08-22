"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { CompetitorMentionItem } from "@/lib/db/dashboard";

interface CompetitorMentionsProps {
  competitors: CompetitorMentionItem[];
  hasScanData: boolean;
}

export function CompetitorMentions({ competitors, hasScanData }: CompetitorMentionsProps) {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Competitor Mentions
          </span>
          {hasScanData && competitors.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {competitors.length} Detected
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        {!hasScanData ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-lg bg-secondary/20 my-2">
            <Users className="h-6 w-6 text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground">
              No scan data available yet. Run a scan to capture competitor mentions across tested prompts.
            </p>
          </div>
        ) : competitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-lg bg-secondary/20 my-2">
            <Users className="h-6 w-6 text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground">
              No competitor mentions detected in the latest scan checks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {competitors.map((comp) => {
              const sharePercent = Math.round(comp.share * 100);
              return (
                <div key={comp.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {comp.name}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {comp.mentions} {comp.mentions === 1 ? "mention" : "mentions"}{" "}
                      <span className="text-[10px] text-muted-foreground/80 font-sans">({sharePercent}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
