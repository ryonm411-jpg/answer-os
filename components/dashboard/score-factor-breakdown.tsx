"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import type { VisibilityFactors } from "@/lib/scoring/calculator";

interface ScoreFactorBreakdownProps {
  factors: VisibilityFactors | null;
}

export function ScoreFactorBreakdown({ factors }: ScoreFactorBreakdownProps) {
  const [showCalculation, setShowCalculation] = useState(false);

  const factorItems = [
    {
      name: "Mention rate",
      weight: "30%",
      value: factors ? Math.round(factors.mentionRate * 100) : 0,
      display: factors ? `${Math.round(factors.mentionRate * 100)}%` : "N/A",
      description: "How often AI mentions your brand across the searches we tested.",
    },
    {
      name: "Average position",
      weight: "25%",
      value: factors ? Math.round(factors.averageRank * 100) : 0,
      display: factors ? `${Math.round(factors.averageRank * 100)}%` : "N/A",
      description: "Where your brand appears when it is recommended. Earlier positions score higher.",
    },
    {
      name: "Sentiment",
      weight: "20%",
      value: factors ? Math.round(factors.sentiment * 100) : 0,
      display: factors ? `${Math.round(factors.sentiment * 100)}%` : "N/A",
      description: "How positively or negatively AI describes your brand in its answers.",
    },
    {
      name: "Competitive visibility",
      weight: "15%",
      value: factors ? Math.round(factors.competitorShare * 100) : 0,
      display: factors ? `${Math.round(factors.competitorShare * 100)}%` : "N/A",
      description: "How often competing brands appear in the same searches as your brand.",
    },
    {
      name: "Source quality",
      weight: "10%",
      value: factors ? Math.round(factors.sourceAuthority * 100) : 50,
      display: factors ? `${Math.round(factors.sourceAuthority * 100)}%` : "N/A",
      description: "How authoritative the sources cited by AI are when recommending your brand.",
    },
  ];

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          How your visibility is measured
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pt-2">
        {factorItems.map((factor) => (
          <div key={factor.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                {factor.name}
                <Tooltip>
                  <TooltipTrigger aria-label={`${factor.name} info`} className="text-muted-foreground hover:text-foreground">
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {factor.description}
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-semibold text-foreground">{factors ? factor.display : "—"}</span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${factors ? factor.value : 0}%` }}
              />
            </div>
          </div>
        ))}

        {/* How scoring works — expandable */}
        <div className="pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => setShowCalculation(!showCalculation)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <span>How is this calculated?</span>
            {showCalculation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showCalculation && (
            <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed space-y-1 bg-secondary/30 rounded-md p-2.5">
              <p>Each factor is weighted: mention rate (30%), average position (25%), sentiment (20%), competitive visibility (15%), and source quality (10%).</p>
              <p className="mt-1">Source quality is currently measured using a neutral baseline in this version of AnswerOS. It will be replaced with actual citation authority data in a future update.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
