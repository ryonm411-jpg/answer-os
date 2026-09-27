"use client";

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FACTORS = [
  {
    name: "Mention Rate",
    weight: "30%",
    plainSummary: "How often your brand appears.",
    description: "The percentage of buyer prompt checks where your brand is actively recommended.",
    color: "bg-[#29C78F]",
  },
  {
    name: "Average Rank",
    weight: "25%",
    plainSummary: "Where your brand appears when recommended.",
    description: "Positioning of your brand in AI recommendations (#1 top pick vs #2+ alternative).",
    color: "bg-[#5B8CFF]",
  },
  {
    name: "Sentiment",
    weight: "20%",
    plainSummary: "How AI describes your brand.",
    description: "Tone, attributes, and descriptive strengths associated with your company in AI answers.",
    color: "bg-[#8B6CFF]",
  },
  {
    name: "Competitor Share",
    weight: "15%",
    plainSummary: "How often competitors are mentioned relative to you.",
    description: "Your share of AI recommendations compared against category rivals in the same prompt sets.",
    color: "bg-amber-400",
  },
  {
    name: "Source Authority",
    weight: "10%",
    plainSummary: "How authoritative the cited sources are.",
    description: "The authority and independence of websites and review publications cited by the AI.",
    color: "bg-[#5B8CFF]/80",
  },
];

export function ScoreExplainer() {
  return (
    <section id="score" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#101521]/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-[#252D3A] bg-[#141A26] text-[#5B8CFF] uppercase tracking-wider"
          >
            Measurement Methodology
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            How your AI visibility is measured
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            AnswerOS computes a weighted 0–100 visibility score based on real scan data across five core factors.
          </p>
        </div>

        {/* 5 Factor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FACTORS.map((factor) => (
            <div
              key={factor.name}
              className="rounded-2xl border border-[#252D3A] bg-[#141A26]/80 p-5 space-y-3 flex flex-col justify-between transition-all hover:border-[#5B8CFF]/40 hover:bg-[#141A26]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F5F7FA]">
                    {factor.name}
                  </span>
                  <span className="font-mono text-xs font-black text-[#5B8CFF] px-2 py-0.5 rounded bg-[#101521] border border-[#252D3A]">
                    {factor.weight}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-[#101521] rounded-full overflow-hidden border border-[#252D3A]/60">
                  <div
                    className={`h-full ${factor.color} rounded-full`}
                    style={{ width: factor.weight }}
                  />
                </div>

                <p className="text-xs font-medium text-[#F5F7FA]/90 pt-1">
                  &ldquo;{factor.plainSummary}&rdquo;
                </p>
              </div>

              <p className="text-[11px] text-[#9AA4B2] leading-relaxed border-t border-[#252D3A]/60 pt-2">
                {factor.description}
              </p>
            </div>
          ))}
        </div>

        {/* Transparent Methodology Callout */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#252D3A] bg-[#141A26]/90 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs shadow-sm">
          <div className="p-3 rounded-xl bg-[#29C78F]/10 text-[#29C78F] border border-[#29C78F]/20 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-[#F5F7FA] text-sm flex items-center gap-2">
              <span>Empirical Scoring &amp; Transparent Methodology</span>
            </h4>
            <p className="text-[#9AA4B2] leading-relaxed">
              Every score factor is calculated strictly from empirical scan data across your category buyer questions—giving you clear, actionable insights without guesswork.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
