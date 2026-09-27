"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Search, Sparkles, AlertCircle } from "lucide-react";
import { normalizeDomain, validateDomain } from "@/lib/utils/domain";
import { buttonVariants } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

export function FinalCta() {
  const router = useRouter();
  const [domainInput, setDomainInput] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeDomain(domainInput);
    const validationError = validateDomain(normalized);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    try {
      sessionStorage.setItem("prefill_domain", normalized);
    } catch {
      // Ignore storage errors in restricted contexts
    }

    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: "final_cta_scan" });
    router.push(`/sign-up?domain=${encodeURIComponent(normalized)}`);
  };

  return (
    <section className="py-20 md:py-28 border-b border-[#252D3A] bg-gradient-to-b from-[#080B12] via-[#0D121F] to-[#080B12] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#5B8CFF]/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141A26] border border-[#252D3A] text-xs font-semibold text-[#5B8CFF] uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Instant AI Audit</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
          Find out how AI currently sees your brand.
        </h2>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#9AA4B2] leading-relaxed">
          Run a free visibility scan and see where your brand appears, who gets recommended instead, and what you can improve.
        </p>

        {/* Input Form */}
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <label htmlFor="final-cta-input" className="sr-only">
                Enter your company website
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4 text-[#9AA4B2]" />
              </div>
              <input
                id="final-cta-input"
                type="text"
                value={domainInput}
                onChange={(e) => {
                  setDomainInput(e.target.value);
                  if (error) setError("");
                }}
                placeholder="yourcompany.com"
                className="w-full pl-10 pr-4 py-3.5 text-sm sm:text-base rounded-xl bg-[#141A26] border border-[#252D3A] focus:border-[#5B8CFF] focus:ring-2 focus:ring-[#5B8CFF]/25 text-[#F5F7FA] placeholder:text-[#6B778C] outline-none transition-all"
                autoComplete="off"
                aria-label="Enter your company website"
              />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-[#5B8CFF]/20 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              )}
            >
              <span>Run My Free AI Visibility Scan</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {error && (
            <div className="flex items-center justify-center gap-2 mt-3 text-destructive text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Trust Line */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-[#9AA4B2]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#29C78F]" />
            <span>No credit card required</span>
          </div>
          <span className="text-[#252D3A]">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#29C78F]" />
            <span>Free scan included</span>
          </div>
          <span className="text-[#252D3A]">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#29C78F]" />
            <span>Results in minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
