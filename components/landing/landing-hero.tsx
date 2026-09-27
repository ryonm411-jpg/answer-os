"use client";

import { CheckCircle2, ChevronDown, Sparkles, Compass } from "lucide-react";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { LiveDomainChecker } from "@/components/landing/live-domain-checker";

export function LandingHero() {
  const handleCtaClick = (ctaName: string) => {
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: ctaName });
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/60 bg-gradient-to-b from-[#080B12] via-[#0D121F] to-[#080B12]">
      {/* Subtle Background Glows (Blue -> Violet) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-[#5B8CFF]/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#8B6CFF]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141A26] border border-[#252D3A] text-xs font-semibold tracking-wider uppercase text-[#9AA4B2] shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#5B8CFF]" />
          <span>AI Search Visibility</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F5F7FA] leading-[1.12]">
          See how AI search engines <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#5B8CFF] to-[#8B6CFF] bg-clip-text text-transparent">
            recommend your brand.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl text-[#9AA4B2] leading-relaxed">
          AnswerOS shows where your brand appears in ChatGPT, Claude, Gemini, and other AI search experiences—including your ranking, competitors, cited sources, and what to improve.
        </p>

        {/* Plain-English Definition Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#101521]/90 border border-[#252D3A] text-xs sm:text-sm text-[#F5F7FA]/90">
          <Compass className="h-4 w-4 text-[#5B8CFF] shrink-0" />
          <span>
            <strong className="text-white font-semibold">AI visibility</strong> = how often your brand appears when potential customers ask AI for recommendations.
          </span>
        </div>

        {/* Interactive Live Domain Checker Form */}
        <LiveDomainChecker />

        {/* Trust Badges & Secondary CTA */}
        <div className="flex flex-col items-center justify-center gap-4 pt-3">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#9AA4B2]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#29C78F]" />
              <span>No credit card</span>
            </div>
            <span className="text-[#252D3A]">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#29C78F]" />
              <span>Free scan</span>
            </div>
            <span className="text-[#252D3A]">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#29C78F]" />
              <span>Results in minutes</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="#sample-report"
              onClick={() => handleCtaClick("hero_see_sample_report")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#9AA4B2] hover:text-[#5B8CFF] transition-colors py-1 px-3 rounded-md hover:bg-[#101521]"
            >
              <span>See a Sample Report</span>
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
