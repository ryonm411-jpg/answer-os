"use client";

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FACTORS = [
  {
    name: "Mention Rate",
    weight: "30%",
    description: "Percentage of prompt checks where your brand is mentioned.",
    color: "bg-emerald-500",
  },
  {
    name: "Average Rank",
    weight: "25%",
    description: "Positioning of your brand when recommended (#1 vs #2+).",
    color: "bg-cyan-500",
  },
  {
    name: "Sentiment Tone",
    weight: "20%",
    description: "Emotional tone (Positive, Neutral, Negative) in AI answers.",
    color: "bg-blue-500",
  },
  {
    name: "Competitor Share",
    weight: "15%",
    description: "Share of mentions compared to competing industry brands.",
    color: "bg-amber-500",
  },
  {
    name: "Source Authority",
    weight: "10%",
    description: "Citation authority (Neutral MVP 50% baseline).",
    color: "bg-purple-500",
  },
];

export function ScoreExplainer() {
  return (
    <section id="score" className="py-20 border-b border-border/60 bg-secondary/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-border text-muted-foreground uppercase tracking-wider"
          >
            Algorithm &amp; Scoring
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            A visibility score that&apos;s honest and actionable
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Your score is computed server-side from real scan results — never estimated or fabricated client-side.
          </p>
        </div>

        {/* 5 Factor Cards & Weight Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {FACTORS.map((factor) => (
            <div
              key={factor.name}
              className="rounded-xl border border-border/80 bg-card/60 p-5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {factor.name}
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {factor.weight}
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${factor.color}`}
                  style={{ width: factor.weight }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {factor.description}
              </p>
            </div>
          ))}
        </div>

        {/* Server-Side Guarantee & MVP Ceiling Callout */}
        <div className="max-w-3xl mx-auto rounded-xl border border-border/80 bg-card/50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-sm">
              Server-Calculated Scoring &amp; Honest 95 MVP Ceiling
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Every score factor is computed by a pure server-side algorithm with error rows excluded. Because source authority uses a constant neutral baseline, the MVP maximum reachable score is capped at 95/100 until deeper web citation crawling is released.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
