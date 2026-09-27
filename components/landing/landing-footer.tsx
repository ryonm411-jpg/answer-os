"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-[#252D3A] bg-[#080B12] py-12 text-xs text-[#9AA4B2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="h-4 w-4 text-[#5B8CFF]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#F5F7FA]">
                AnswerOS
              </span>
            </Link>
            <p className="text-xs text-[#9AA4B2] max-w-md leading-relaxed">
              The AI search visibility platform for modern brands. Understand how AI search engines recommend your brand, compare against competitors, and optimize citations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 font-medium text-xs">
            <a href="#sample-report" className="hover:text-[#F5F7FA] transition-colors">
              Example Report
            </a>
            <a href="#what-you-discover" className="hover:text-[#F5F7FA] transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-[#F5F7FA] transition-colors">
              How It Works
            </a>
            <a href="#tracking" className="hover:text-[#F5F7FA] transition-colors">
              Tracking
            </a>
            <a href="#pricing" className="hover:text-[#F5F7FA] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#F5F7FA] transition-colors">
              FAQ
            </a>
            <Link href="/sign-in" className="hover:text-[#F5F7FA] transition-colors">
              Sign in
            </Link>
            <a href="#hero-scan" className="text-[#5B8CFF] hover:underline font-semibold">
              Run Free Scan
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#252D3A]/60 text-[11px] text-[#6B778C]">
          <p>© {new Date().getFullYear()} AnswerOS Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-[#9AA4B2] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#9AA4B2] transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-[#9AA4B2] transition-colors">
              Cookie Policy
            </Link>
            <Link href="/subprocessors" className="hover:text-[#9AA4B2] transition-colors">
              Subprocessors
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
