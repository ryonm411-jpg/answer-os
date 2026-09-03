"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const INCLUDED_FEATURES = [
  "Free tier included (Gemini, Groq, NVIDIA NIM)",
  "Full prompt review & AI suggestion generator workspace",
  "Async scanning across 6 AI search engines",
  "Branded vs Organic Visibility Score calculations",
  "Competitor leaderboard & top cited source analytics",
  "Prioritized evidence-based recommendation engine",
  "Stripe Billing Portal self-serve management",
];

export function PricingTeaser() {
  const handleCtaClick = () => {
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: "pricing" });
  };

  return (
    <section id="pricing" className="py-20 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-border text-muted-foreground uppercase tracking-wider"
          >
            Simple Subscription
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            One plan. Everything included.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            A single flat monthly subscription after your free tier — no per-scan pricing, no usage anxiety. Manage or cancel from the billing portal anytime.
          </p>
        </div>

        {/* Pricing Card Teaser */}
        <div className="max-w-xl mx-auto rounded-2xl border border-primary/30 bg-gradient-to-b from-card/80 to-card/40 p-8 space-y-8 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                AnswerOS Pro Subscription
              </h3>
              <p className="text-xs text-muted-foreground">
                Everything you need to master AI search visibility
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30 font-medium text-xs gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              All-In-One
            </Badge>
          </div>

          <div className="space-y-3 pt-2">
            {INCLUDED_FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="rounded-full bg-emerald-500/10 p-1 text-emerald-400 shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-foreground/90 font-medium">{feat}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/80">
            <Link
              href="/sign-up"
              onClick={handleCtaClick}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              )}
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-[11px] text-center text-muted-foreground mt-3">
              Free tier ready immediately · Upgrade anytime from billing
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
