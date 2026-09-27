"use client";

import { 
  Bot, 
  Users2, 
  Globe2, 
  Wrench, 
  Sparkles 
} from "lucide-react";

const DISCOVERY_CARDS = [
  {
    icon: Bot,
    title: "Are AI engines recommending you?",
    description: "See whether your brand appears when customers ask AI for recommendations across ChatGPT, Claude, Gemini, and beyond.",
    badge: "Mention Rate & Rank",
  },
  {
    icon: Users2,
    title: "Who gets recommended instead?",
    description: "Compare your visibility with the brands appearing alongside you and find out which competitors dominate buyer questions.",
    badge: "Competitor Share",
  },
  {
    icon: Globe2,
    title: "Why are they being mentioned?",
    description: "See the websites, publications, reviews, and other sources influencing AI answers in your category.",
    badge: "Cited Sources",
  },
  {
    icon: Wrench,
    title: "What should you fix?",
    description: "Get specific recommendations based on the gaps found in your real scan results so you know what content and schema to build next.",
    badge: "Actionable Fixes",
  },
];

export function WhatYouDiscover() {
  return (
    <section id="what-you-discover" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#080B12]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141A26] border border-[#252D3A] text-[#5B8CFF] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Search Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            What you&apos;ll discover
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            Understand exactly how AI search answers treat your brand and what drives those recommendations.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISCOVERY_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#252D3A] bg-[#141A26]/80 p-6 space-y-4 flex flex-col justify-between transition-all duration-200 hover:border-[#5B8CFF]/50 hover:bg-[#141A26] shadow-sm hover:shadow-lg hover:shadow-primary/5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5B8CFF]/10 text-[#5B8CFF] border border-[#5B8CFF]/20 group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#9AA4B2] px-2 py-0.5 rounded bg-[#101521] border border-[#252D3A]">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#F5F7FA] leading-snug group-hover:text-[#5B8CFF] transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-sm text-[#9AA4B2] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
