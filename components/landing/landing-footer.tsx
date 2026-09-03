"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border/80 bg-card/60 py-12 text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                AnswerOS
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              The AI search &amp; visibility optimization platform for B2B SaaS. Become the answer ChatGPT, Claude, and Gemini give.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#score" className="hover:text-foreground transition-colors">
              Score
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-primary hover:underline font-semibold">
              Get Started
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40 text-[11px]">
          <p>© {new Date().getFullYear()} AnswerOS Inc. All rights reserved.</p>
          <p className="text-muted-foreground/70">
            Proprietary closed-source SaaS · Built for B2B AI Search Optimization
          </p>
        </div>
      </div>
    </footer>
  );
}
