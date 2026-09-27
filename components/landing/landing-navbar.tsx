"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const handleCtaClick = (ctaName: string) => {
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: ctaName });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Mark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/25 text-primary transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-[#5B8CFF]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground">
              AnswerOS
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-secondary/60 border border-border/50 hidden sm:inline-block">
              AI Visibility
            </span>
          </div>
        </Link>

        {/* Desktop Anchor Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          <a
            href="#sample-report"
            className="transition-colors hover:text-foreground hover:text-primary"
          >
            Example Report
          </a>
          <a
            href="#what-you-discover"
            className="transition-colors hover:text-foreground hover:text-primary"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-foreground hover:text-primary"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="transition-colors hover:text-foreground hover:text-primary"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="transition-colors hover:text-foreground hover:text-primary"
          >
            FAQ
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            onClick={() => handleCtaClick("sign_in")}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            onClick={() => handleCtaClick("nav_sign_up")}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 rounded-lg shadow-sm shadow-primary/20 flex items-center gap-1.5"
            )}
          >
            <span>Sign up</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
