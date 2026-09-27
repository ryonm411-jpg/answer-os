"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "Free initial AI visibility scan",
  "3 Core AI Providers: Gemini, Groq, NVIDIA NIM",
  "Prompt review workspace & AI suggestions",
  "Core visibility report & 0–100 score",
  "Competitor mention insights & share of voice",
  "Actionable, evidence-based recommendations",
  "No credit card required to start",
];

const PRO_FEATURES = [
  "Everything in Free tier included",
  "3 Premium AI Providers: OpenAI, Claude, Perplexity",
  "Full 6 AI providers monitoring & scanning",
  "Historical visibility tracking & trend curves",
  "Recurring re-scans & competitor movement alerts",
  "Expanded prompt library sets",
  "Self-serve Stripe billing & cancel anytime",
];

export function PricingTeaser() {
  const handleCtaClick = (plan: string) => {
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: `pricing_${plan}` });
  };

  return (
    <section id="pricing" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#080B12]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-[#252D3A] bg-[#141A26] text-[#5B8CFF] uppercase tracking-wider"
          >
            Clear, Transparent Tiers
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Start free. Upgrade when you need more AI models.
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            Audit your brand today on our free AI providers. Unlock premium models and historical tracking with a single flat monthly subscription.
          </p>
        </div>

        {/* Free vs Pro Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* FREE TIER CARD */}
          <div className="rounded-2xl border border-[#252D3A] bg-[#141A26]/70 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#F5F7FA]">Free Tier</h3>
                  <p className="text-xs text-[#9AA4B2] mt-0.5">Explore your AI search footprint</p>
                </div>
                <Badge variant="outline" className="border-[#252D3A] bg-[#101521] text-[#9AA4B2] text-xs">
                  Free Forever
                </Badge>
              </div>

              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-4xl font-extrabold text-[#F5F7FA]">$0</span>
                <span className="text-xs text-[#9AA4B2]">/ month</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#252D3A]">
                {FREE_FEATURES.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#F5F7FA]/90">
                    <Check className="h-4 w-4 text-[#29C78F] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <a
                href="#hero-scan"
                onClick={() => handleCtaClick("free_tier")}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full h-11 text-sm font-semibold border-[#252D3A] bg-[#101521] hover:bg-[#1C2433] hover:text-white text-[#F5F7FA] gap-2 rounded-xl"
                )}
              >
                <span>Run Free Scan</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-[11px] text-center text-[#9AA4B2] mt-2.5">
                No credit card required
              </p>
            </div>
          </div>

          {/* PRO PLAN CARD (Highlighted) */}
          <div className="rounded-2xl border-2 border-[#5B8CFF] bg-gradient-to-b from-[#141A26] to-[#101521] p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3 right-6">
              <Badge className="bg-[#5B8CFF] text-white border-0 font-semibold text-xs px-3 py-1 shadow-md">
                <Sparkles className="h-3 w-3 mr-1" />
                All 6 AI Providers
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-[#F5F7FA]">AnswerOS Pro</h3>
                <p className="text-xs text-[#9AA4B2] mt-0.5">Complete AI search monitoring &amp; tracking</p>
              </div>

              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-4xl font-extrabold text-[#F5F7FA]">Pro Subscription</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#252D3A]">
                {PRO_FEATURES.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#F5F7FA]">
                    <Check className="h-4 w-4 text-[#5B8CFF] shrink-0 mt-0.5" />
                    <span className={idx === 1 ? "font-semibold text-white" : ""}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/sign-up"
                onClick={() => handleCtaClick("pro_plan")}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl shadow-lg shadow-[#5B8CFF]/25"
                )}
              >
                <span>Get Started with Pro</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-[11px] text-center text-[#9AA4B2] mt-2.5">
                Full 6-provider visibility · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
