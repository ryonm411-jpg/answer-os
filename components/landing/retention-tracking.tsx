"use client";

import { 
  TrendingUp, 
  RotateCw, 
  ArrowRight,
  LineChart,
  BellRing
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RETENTION_PILLARS = [
  {
    title: "Historical Visibility Trends",
    description: "Monitor how your brand mention rate and average rank evolve week over week across each AI model.",
    icon: LineChart,
  },
  {
    title: "Recurring & On-Demand Scans",
    description: "Re-scan automatically to catch model updates and seasonal buyer shifts before they affect your pipeline.",
    icon: RotateCw,
  },
  {
    title: "Competitor Movement Alerts",
    description: "See when competitors launch new comparison pages or gain traction on newly cited review platforms.",
    icon: BellRing,
  },
  {
    title: "Measure Real Impact",
    description: "Directly correlate the publication of new FAQs, docs, and comparison pages with measurable AI position gains.",
    icon: TrendingUp,
  },
];

const LOOP_STEPS = [
  { label: "SCAN", sub: "Audit current answers" },
  { label: "DISCOVER", sub: "Find competitor gaps" },
  { label: "FIX", sub: "Publish optimized content" },
  { label: "RE-SCAN", sub: "Benchmark new answers" },
  { label: "TRACK", sub: "Verify score growth" },
];

export function RetentionTracking() {
  return (
    <section id="tracking" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#080B12] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-[#252D3A] bg-[#141A26] text-[#5B8CFF] uppercase tracking-wider"
          >
            Ongoing Optimization
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Don&apos;t just measure your AI visibility. <br className="hidden sm:inline" />
            <span className="text-[#5B8CFF]">Track whether your changes improve it.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            AI search is dynamic. AnswerOS gives you the continuous tracking and re-scanning tools needed to turn one-time insights into compounding organic growth.
          </p>
        </div>

        {/* Visualized Continuous Optimization Loop */}
        <div className="max-w-5xl mx-auto bg-[#141A26] border border-[#252D3A] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {LOOP_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-center w-full md:w-auto">
                <div className="flex-1 md:flex-initial text-center md:text-left bg-[#101521] border border-[#252D3A] p-4 rounded-xl space-y-1 min-w-[140px]">
                  <span className="font-mono text-xs font-black text-[#5B8CFF] block">
                    {step.label}
                  </span>
                  <p className="text-[11px] text-[#9AA4B2]">{step.sub}</p>
                </div>
                {idx < LOOP_STEPS.length - 1 && (
                  <div className="hidden md:flex items-center justify-center px-2 text-[#6B778C]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Retention Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {RETENTION_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#252D3A] bg-[#141A26]/80 p-6 space-y-3 transition-all hover:border-[#5B8CFF]/40 hover:bg-[#141A26]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B8CFF]/10 text-[#5B8CFF] border border-[#5B8CFF]/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#F5F7FA]">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#9AA4B2] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
