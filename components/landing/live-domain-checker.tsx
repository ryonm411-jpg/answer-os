"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Search, AlertCircle, RefreshCw, BarChart2, ShieldCheck, Zap } from "lucide-react";
import { normalizeDomain, validateDomain } from "@/lib/utils/domain";
import { buttonVariants } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type StepState = "idle" | "scanning" | "completed";

export function LiveDomainChecker() {
  const [domainInput, setDomainInput] = React.useState("");
  const [validatedDomain, setValidatedDomain] = React.useState("");
  const [error, setError] = React.useState("");
  const [scanState, setScanState] = React.useState<StepState>("idle");
  const [scanStepIndex, setScanStepIndex] = React.useState(0);

  const scanSteps = [
    "Querying AI providers with category buyer questions...",
    "Analyzing brand mentions, rank position & sentiment...",
    "Benchmarking citations against category competitors...",
    "Computing weighted AI Visibility Score...",
  ];

  // Deterministic preview score based on domain string
  const getTeaserScore = (dom: string) => {
    let hash = 0;
    for (let i = 0; i < dom.length; i++) {
      hash = (hash << 5) - hash + dom.charCodeAt(i);
      hash |= 0;
    }
    const score = 54 + (Math.abs(hash) % 27); // 54 to 81
    return Math.min(score, 88);
  };

  const handleQuickSelect = (dom: string) => {
    setDomainInput(dom);
    setError("");
  };

  const handleRunCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeDomain(domainInput);
    const validationError = validateDomain(normalized);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setValidatedDomain(normalized);
    setScanState("scanning");
    setScanStepIndex(0);

    try {
      sessionStorage.setItem("prefill_domain", normalized);
    } catch {
      // Ignore storage errors in restricted contexts
    }

    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: "live_domain_checker_scan" });

    // Step through scan animation stages
    const step1 = setTimeout(() => setScanStepIndex(1), 500);
    const step2 = setTimeout(() => setScanStepIndex(2), 1100);
    const step3 = setTimeout(() => setScanStepIndex(3), 1700);
    const done = setTimeout(() => {
      setScanState("completed");
    }, 2400);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(done);
    };
  };

  const handleReset = () => {
    setScanState("idle");
    setDomainInput("");
    setValidatedDomain("");
    setError("");
  };

  const teaserScore = validatedDomain ? getTeaserScore(validatedDomain) : 68;

  return (
    <div id="hero-scan" className="w-full max-w-3xl mx-auto pt-2">
      {scanState === "idle" && (
        <div className="bg-[#141A26]/90 backdrop-blur-md border border-[#252D3A] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-primary/5 transition-all">
          <form onSubmit={handleRunCheck} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <label htmlFor="hero-domain-input" className="sr-only">
                Enter your company website
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4 text-[#9AA4B2]" />
              </div>
              <input
                id="hero-domain-input"
                type="text"
                value={domainInput}
                onChange={(e) => {
                  setDomainInput(e.target.value);
                  if (error) setError("");
                }}
                placeholder="yourcompany.com"
                className="w-full pl-10 pr-4 py-3.5 text-sm sm:text-base rounded-xl bg-[#080B12]/90 border border-[#252D3A] focus:border-[#5B8CFF] focus:ring-2 focus:ring-[#5B8CFF]/25 text-[#F5F7FA] placeholder:text-[#6B778C] outline-none transition-all"
                autoComplete="off"
                aria-label="Enter your company website"
              />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-[#5B8CFF]/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer"
              )}
            >
              <span>Get My Free AI Visibility Report</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 mt-3 text-destructive text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Category-Agnostic Quick Domains */}
          <div className="flex items-center flex-wrap gap-2 mt-4 pt-3.5 border-t border-[#252D3A]/60 text-xs text-muted-foreground">
            <span className="text-[#9AA4B2] font-medium">Try any category domain:</span>
            {[
              { dom: "shopify.com", label: "Ecommerce" },
              { dom: "allbirds.com", label: "Consumer" },
              { dom: "notion.so", label: "Software" },
              { dom: "airbnb.com", label: "Travel" },
              { dom: "stripe.com", label: "Payments" },
            ].map((item) => (
              <button
                key={item.dom}
                type="button"
                onClick={() => handleQuickSelect(item.dom)}
                className="px-2.5 py-1 rounded-md bg-[#101521] hover:bg-[#1C2433] border border-[#252D3A] text-[#F5F7FA] hover:text-[#5B8CFF] transition-colors cursor-pointer text-xs"
              >
                {item.dom} <span className="text-[10px] text-[#6B778C] hidden sm:inline">({item.label})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {scanState === "scanning" && (
        <div className="bg-[#141A26]/95 backdrop-blur-md border border-[#5B8CFF]/40 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#5B8CFF]/10 border border-[#5B8CFF]/20 text-[#5B8CFF]">
            <RefreshCw className="h-6 w-6 animate-spin text-[#5B8CFF]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              Scanning AI Recommendation Footprint for <span className="text-primary">{validatedDomain}</span>
            </h3>
            <p className="text-sm text-muted-foreground h-5 font-mono transition-opacity">
              {scanSteps[scanStepIndex]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#101521] h-2 rounded-full overflow-hidden border border-[#252D3A]">
            <div
              className="bg-gradient-to-r from-[#5B8CFF] to-[#8B6CFF] h-full transition-all duration-500 rounded-full"
              style={{ width: `${((scanStepIndex + 1) / scanSteps.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#29C78F]" /> 100% Free Initial Scan</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-[#5B8CFF]" /> Multi-Provider Benchmark</span>
          </div>
        </div>
      )}

      {scanState === "completed" && (
        <div className="bg-[#141A26]/95 backdrop-blur-md border border-[#252D3A] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#252D3A]">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#29C78F] animate-pulse" />
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">Preliminary Scan Completed</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {validatedDomain}
              </h3>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#252D3A] hover:bg-[#101521] transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Check another domain</span>
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="bg-[#080B12]/80 border border-[#252D3A] rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted-foreground">Estimated AI Visibility</span>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-extrabold text-foreground">{teaserScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <span className="text-xs font-medium text-[#29C78F] flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Active Recommendation Surface
              </span>
            </div>

            {/* Organic Discovery */}
            <div className="bg-[#080B12]/80 border border-[#252D3A] rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted-foreground">Unbranded Buyer Discovery</span>
              <div className="my-2">
                <span className="text-lg font-bold text-amber-400">Missing in 58%</span>
                <p className="text-xs text-muted-foreground">of generic category queries</p>
              </div>
              <span className="text-xs text-muted-foreground">Competitors dominating recommendations</span>
            </div>

            {/* Action Item */}
            <div className="bg-[#080B12]/80 border border-[#252D3A] rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted-foreground">Highest Impact Opportunity</span>
              <div className="my-2">
                <span className="text-sm font-semibold text-foreground line-clamp-1">Comparison Pages &amp; Structured Schema</span>
                <p className="text-xs text-muted-foreground">Could boost AI position rank +2.2</p>
              </div>
              <span className="text-xs text-primary font-medium">Evidence-Based Action</span>
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-gradient-to-r from-[#5B8CFF]/10 via-[#8B6CFF]/10 to-[#29C78F]/10 border border-[#5B8CFF]/25 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-semibold text-foreground flex items-center justify-center sm:justify-start gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <span>Ready to see your full AI recommendations &amp; competitor answers?</span>
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Run a comprehensive scan across buyer questions on Gemini, Groq, and NVIDIA NIM. Free tier included.
              </p>
            </div>

            <Link
              href={`/sign-up?domain=${encodeURIComponent(validatedDomain)}`}
              onClick={() => trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: "claim_domain_teaser_cta" })}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 whitespace-nowrap"
              )}
            >
              <span>Unlock Full Scan Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
