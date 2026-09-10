"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { LiveDomainChecker } from "@/components/landing/live-domain-checker";

export function LandingHero() {
  const handleCtaClick = (ctaName: string) => {
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: ctaName });
  };

  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-b border-border/60 bg-gradient-to-b from-background via-background/95 to-secondary/10">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
          Become the answer <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            AI search engines give.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
          AnswerOS scans hundreds of buyer prompts across ChatGPT, Claude,
          Gemini, and Groq to show whether your brand is mentioned, at what
          position, and with what sentiment — then tells you exactly what to fix.
        </p>

        {/* Interactive Live Domain Checker */}
        <LiveDomainChecker />

        {/* Trust Badge Line */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Free tier included</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Set up in minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
