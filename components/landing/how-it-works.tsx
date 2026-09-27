"use client";

import {
  HelpCircle,
  Search,
  BarChart3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const WORKFLOW_STEPS = [
  {
    stepNumber: "01",
    phase: "Ask",
    title: "Choose buyer questions",
    description:
      "Select the high-intent buyer questions and product prompts that matter to your business and category.",
    icon: HelpCircle,
  },
  {
    stepNumber: "02",
    phase: "Scan",
    title: "Scan AI models",
    description:
      "AnswerOS automatically evaluates how major AI providers respond across your selected prompts.",
    icon: Search,
  },
  {
    stepNumber: "03",
    phase: "Analyze",
    title: "Inspect your report",
    description:
      "See where your brand appears, your position rank, sentiment tone, competitor mentions, and cited sources.",
    icon: BarChart3,
  },
  {
    stepNumber: "04",
    phase: "Improve",
    title: "Take action",
    description:
      "Get clear, evidence-based recommendations on missing comparison pages, citations, and structured FAQ content.",
    icon: Sparkles,
  },
  {
    stepNumber: "05",
    phase: "Track",
    title: "Measure changes over time",
    description:
      "Re-scan periodically to measure progress, monitor competitor movement, and verify the impact of your updates.",
    icon: TrendingUp,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#101521]/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-[#252D3A] bg-[#141A26] text-[#5B8CFF] uppercase tracking-wider"
          >
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Ask → Scan → Analyze → Improve → Track
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            A continuous, five-step workflow designed to build and sustain your brand&apos;s visibility in AI search.
          </p>
        </div>

        {/* 5 Step Cards Visual Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.stepNumber}
                className="group relative rounded-2xl border border-[#252D3A] bg-[#141A26]/80 p-5 space-y-4 flex flex-col justify-between transition-all hover:border-[#5B8CFF]/50 hover:bg-[#141A26]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B8CFF]/10 text-[#5B8CFF] border border-[#5B8CFF]/20 group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#6B778C] group-hover:text-[#5B8CFF] transition-colors">
                      STEP {step.stepNumber}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B8CFF]">
                      {step.phase}
                    </div>
                    <h3 className="text-base font-bold text-[#F5F7FA] group-hover:text-[#5B8CFF] transition-colors">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#9AA4B2] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reassurance Callout */}
        <div className="max-w-2xl mx-auto rounded-xl border border-[#252D3A] bg-[#141A26]/50 p-4 text-center text-xs text-[#9AA4B2]">
          <span>
            Initial scans complete in just minutes. Use your free scan anytime without entering a credit card.
          </span>
        </div>
      </div>
    </section>
  );
}
