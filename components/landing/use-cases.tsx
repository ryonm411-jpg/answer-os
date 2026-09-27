"use client";

import { 
  Megaphone, 
  SearchCode, 
  TrendingUp, 
  Briefcase, 
  CheckCircle2,
  Layers,
  ShoppingBag,
  Building2,
  Plane,
  GraduationCap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const USE_CASES = [
  {
    role: "Marketing",
    icon: Megaphone,
    headline: "Understand how AI surfaces your brand",
    description:
      "See whether your brand is being recommended in the high-intent buying questions that drive pipeline.",
    deliverables: ["Brand mention share", "Sentiment analysis", "Category keyword reach"],
  },
  {
    role: "SEO & Content",
    icon: SearchCode,
    headline: "Discover the sources influencing AI answers",
    description:
      "Find out which websites, comparison portals, and reviews AI models quote when answering buyer questions.",
    deliverables: ["Cited domain leaderboard", "Comparison page gaps", "Structured schema audits"],
  },
  {
    role: "Growth",
    icon: TrendingUp,
    headline: "Find competitor gaps you can act on",
    description:
      "Identify the exact prompts where competitors appear ahead of you and benchmark your progress over time.",
    deliverables: ["Competitor position tracking", "Organic query discovery", "Actionable rank lifts"],
  },
  {
    role: "Founders & Owners",
    icon: Briefcase,
    headline: "See what customers learn when asking AI what to buy",
    description:
      "Get a clear, executive-level view of your AI brand presence across every major AI provider without technical complexity.",
    deliverables: ["0–100 AI Visibility Score", "Weekly progress scans", "Multi-model consensus"],
  },
];

const CATEGORIES = [
  { name: "Software & SaaS", icon: Layers },
  { name: "Ecommerce & D2C", icon: ShoppingBag },
  { name: "Professional Services", icon: Building2 },
  { name: "Travel & Hospitality", icon: Plane },
  { name: "Education & Coaching", icon: GraduationCap },
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#101521]/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-[#252D3A] bg-[#141A26] text-[#5B8CFF] uppercase tracking-wider"
          >
            Target Audience
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Built for teams that care about <br className="hidden sm:inline" />
            <span className="text-[#5B8CFF]">how AI recommends them</span>
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            The AI search visibility platform for modern brands across software, ecommerce, services, travel, and beyond.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto text-xs text-[#9AA4B2]">
          <span className="text-[#F5F7FA] font-semibold mr-1">Category Agnostic:</span>
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A26] border border-[#252D3A] text-[#F5F7FA]"
              >
                <Icon className="h-3.5 w-3.5 text-[#5B8CFF]" />
                <span>{cat.name}</span>
              </div>
            );
          })}
        </div>

        {/* 4 Role Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {USE_CASES.map((uc, idx) => {
            const Icon = uc.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#252D3A] bg-[#141A26]/90 p-6 space-y-4 flex flex-col justify-between transition-all hover:border-[#5B8CFF]/40 hover:bg-[#141A26]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B8CFF]/10 text-[#5B8CFF] border border-[#5B8CFF]/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA4B2] px-2 py-0.5 rounded bg-[#101521] border border-[#252D3A]">
                      {uc.role}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#F5F7FA] leading-snug">
                    {uc.headline}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#9AA4B2] leading-relaxed">
                    {uc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#252D3A] space-y-1.5">
                  {uc.deliverables.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#F5F7FA]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#29C78F] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
