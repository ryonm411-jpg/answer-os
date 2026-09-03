"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

export function LandingHero() {
  const handleCtaClick = (ctaName: string) => {
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: ctaName });
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-32 border-b border-border/60 bg-gradient-to-b from-background via-background/95 to-secondary/10">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-medium border-primary/30 bg-primary/10 text-primary rounded-full gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Search Visibility for B2B SaaS</span>
          </Badge>
        </div>

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
          Gemini, and Perplexity to show whether your brand is mentioned, at what
          position, and with what sentiment — then tells you exactly what to fix.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/sign-up"
            onClick={() => handleCtaClick("get_started")}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full sm:w-auto h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2"
            )}
          >
            <span>Get Started — it&apos;s free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#how-it-works"
            onClick={() => handleCtaClick("how_it_works")}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto h-12 px-8 text-base font-medium border-border/80 hover:bg-secondary/40"
            )}
          >
            See how it works
          </a>
        </div>

        {/* Trust Badge Line */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs sm:text-sm text-muted-foreground">
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
