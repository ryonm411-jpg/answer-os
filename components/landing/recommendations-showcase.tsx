"use client";

import { 
  Sparkles, 
  Layers, 
  Globe2, 
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RECOMMENDATIONS = [
  {
    type: "Missing from comparisons",
    priority: "High Impact",
    action: "Create comparison content for the alternatives buyers frequently ask about.",
    evidence: "AI models cited 3rd-party comparison articles when buyers evaluated your alternatives, while your domain lacked a direct alternative breakdown.",
    lift: "+Rank Improvement",
    icon: Layers,
    color: "border-[#5B8CFF]/40",
  },
  {
    type: "Weak positioning",
    priority: "High Impact",
    action: "Strengthen the attributes AI models associate with your brand.",
    evidence: "AI answers frequently describe competitors with explicit use-case strengths while describing your brand in generic terms.",
    lift: "+Sentiment & Context",
    icon: Sparkles,
    color: "border-[#8B6CFF]/40",
  },
  {
    type: "Low-quality citations",
    priority: "Medium Impact",
    action: "Build content and visibility on sources frequently cited in your category.",
    evidence: "LLMs consistently cite specific industry review portals and editorial guides where your company is unlisted.",
    lift: "+Source Authority",
    icon: Globe2,
    color: "border-[#5B8CFF]/40",
  },
  {
    type: "Competitor dominance",
    priority: "Medium Impact",
    action: "Identify the buyer questions where competitors consistently appear ahead.",
    evidence: "Competitors capture rank #1 in 74% of high-intent purchase queries where your product is capable but unmentioned.",
    lift: "+Organic Discovery",
    icon: Target,
    color: "border-[#29C78F]/40",
  },
];

export function RecommendationsShowcase() {
  return (
    <section id="recommendations" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#080B12]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-[#252D3A] bg-[#141A26] text-[#5B8CFF] uppercase tracking-wider"
          >
            Actionable Recommendations
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Clear action steps, not generic advice
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            AnswerOS doesn&apos;t just point out where you rank—it pinpoints the exact structural, content, and citation gaps you can fix immediately.
          </p>
        </div>

        {/* 4 Tangible Recommendation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {RECOMMENDATIONS.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl border ${rec.color} bg-[#141A26]/80 p-6 sm:p-7 space-y-4 flex flex-col justify-between transition-all hover:bg-[#141A26] shadow-sm`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5B8CFF]/10 text-[#5B8CFF] border border-[#5B8CFF]/20">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5B8CFF]">
                        {rec.type}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#29C78F] font-semibold px-2 py-0.5 rounded bg-[#29C78F]/10 border border-[#29C78F]/20">
                      {rec.lift}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#F5F7FA] leading-snug">
                    {rec.action}
                  </h3>

                  <div className="p-3.5 rounded-xl bg-[#080B12]/80 border border-[#252D3A] text-xs text-[#9AA4B2] leading-relaxed">
                    <strong className="text-[#F5F7FA] font-medium block mb-1">Empirical Scan Evidence:</strong>
                    {rec.evidence}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
