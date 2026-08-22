"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import type { DashboardRecommendationItem } from "@/lib/db/dashboard";

interface RecommendationsListProps {
  recommendations: DashboardRecommendationItem[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const getPriorityBadge = (priority: number) => {
    if (priority <= 1) {
      return (
        <Badge variant="destructive" className="text-[10px] uppercase font-semibold">
          High Priority
        </Badge>
      );
    }
    if (priority === 2) {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30 text-[10px] uppercase font-semibold">
          Medium Priority
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
        Low Priority
      </Badge>
    );
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            Actionable Recommendations
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {recommendations.length} Pending
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-secondary/20 my-2">
            <Lightbulb className="h-6 w-6 text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground">
              No recommendations queued. Complete additional scans to generate fresh optimization recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-lg border border-border bg-secondary/20 space-y-2 hover:border-border/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(item.priority)}
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground border-border">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
