"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { VisibilityFactors } from "@/lib/scoring/calculator";

interface ScoreFactorBreakdownProps {
  factors: VisibilityFactors | null;
}

export function ScoreFactorBreakdown({ factors }: ScoreFactorBreakdownProps) {
  const factorItems = [
    {
      name: "Mention Rate",
      weight: "30%",
      value: factors ? Math.round(factors.mentionRate * 100) : 0,
      display: factors ? `${Math.round(factors.mentionRate * 100)}%` : "N/A",
      description: "Percentage of valid AI prompt checks where your product was explicitly mentioned.",
    },
    {
      name: "Average Rank",
      weight: "25%",
      value: factors ? Math.round(factors.averageRank * 100) : 0,
      display: factors ? `${Math.round(factors.averageRank * 100)}%` : "N/A",
      description: "Visibility score derived from listing position rank. Earlier positions score higher.",
    },
    {
      name: "Sentiment Tone",
      weight: "20%",
      value: factors ? Math.round(factors.sentiment * 100) : 0,
      display: factors ? `${Math.round(factors.sentiment * 100)}%` : "N/A",
      description: "Tone score calculated from positive, neutral, and negative model recommendations.",
    },
    {
      name: "Competitor Share",
      weight: "15%",
      value: factors ? Math.round(factors.competitorShare * 100) : 0,
      display: factors ? `${Math.round(factors.competitorShare * 100)}%` : "N/A",
      description: "Your mention share relative to competitor mentions detected across valid checks.",
    },
    {
      name: "Source Authority",
      weight: "10%",
      value: factors ? Math.round(factors.sourceAuthority * 100) : 50,
      display: "Neutral (50%)",
      description: "Constant neutral 50% in MVP while citation source extraction is under development.",
    },
  ];

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
          <span>Score Factor Breakdown</span>
          <span className="text-xs font-normal text-muted-foreground">5 Normalized Factors</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pt-2">
        {factorItems.map((factor) => (
          <div key={factor.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                {factor.name}
                <span className="text-[10px] text-muted-foreground font-normal">({factor.weight})</span>
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
      </CardContent>
    </Card>
  );
}
