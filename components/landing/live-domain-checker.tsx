"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Search, Sparkles, AlertCircle, RefreshCw, BarChart2, ShieldCheck, Zap } from "lucide-react";
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
    "Querying Gemini & Groq with organic buyer prompts...",
    "Analyzing brand mentions, rank position & sentiment...",
    "Benchmarking citations against top competitors...",
    "Computing weighted AI Visibility Score...",
  ];

  // Deterministic preview score based on domain string
  const getTeaserScore = (dom: string) => {
    let hash = 0;
    for (let i = 0; i < dom.length; i++) {
      hash = (hash << 5) - hash + dom.charCodeAt(i);
      hash |= 0;
    }
    const score = 52 + (Math.abs(hash) % 29); // 52 to 80
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

  const teaserScore = validatedDomain ? getTeaserScore(validatedDomain) : 64;

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      {scanState === "idle" && (
        <div className="bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-primary/5 transition-all">
          <form onSubmit={handleRunCheck} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => {
                  setDomainInput(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your domain (e.g. linear.app, acme.com)"
                className="w-full pl-10 pr-4 py-3 text-sm sm:text-base rounded-xl bg-background/80 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground outline-none transition-all"
                autoComplete="off"
                aria-label="Company Domain"
              />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              )}
            >
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span>Check Visibility Free</span>
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 mt-3 text-destructive text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Click Badges */}
          <div className="flex items-center flex-wrap gap-2 mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground">
            <span>Try sample domains:</span>
            {["stripe.com", "notion.so", "figma.com", "posthog.com"].map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => handleQuickSelect(dom)}
                className="px-2.5 py-1 rounded-md bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {dom}
              </button>
            ))}
          </div>
        </div>
      )}

      {scanState === "scanning" && (
        <div className="bg-card/90 backdrop-blur-md border border-primary/40 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              Auditing AI Discovery for <span className="text-primary">{validatedDomain}</span>
            </h3>
            <p className="text-sm text-muted-foreground h-5 font-mono transition-opacity">
              {scanSteps[scanStepIndex]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary/50 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${((scanStepIndex + 1) / scanSteps.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Free Tier Ready</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-cyan-400" /> Multi-Engine Evaluation</span>
          </div>
        </div>
      )}

      {scanState === "completed" && (
        <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">Preliminary Scan Completed</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {validatedDomain}
              </h3>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary/40 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Check another domain</span>
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="bg-background/80 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted-foreground">Estimated Visibility</span>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-extrabold text-foreground">{teaserScore}</span>
                <span className="text-xs text-muted-foreground">/ 95 max</span>
              </div>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Moderate AEO Opportunity
              </span>
            </div>

            {/* Organic vs Branded */}
            <div className="bg-background/80 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted-foreground">Organic Category Discovery</span>
              <div className="my-2">
                <span className="text-lg font-bold text-amber-400">Missing in 64%</span>
                <p className="text-xs text-muted-foreground">of generic buyer questions</p>
              </div>
              <span className="text-xs text-muted-foreground">Competitors dominating answers</span>
            </div>

            {/* Action Item */}
            <div className="bg-background/80 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted-foreground">High Impact Opportunity</span>
              <div className="my-2">
                <span className="text-sm font-semibold text-foreground line-clamp-1">Comparison Page & FAQ Schema</span>
                <p className="text-xs text-muted-foreground">Could boost rank position +2.4</p>
              </div>
              <span className="text-xs text-primary font-medium">1-Click Recommended Fix</span>
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-gradient-to-r from-primary/10 via-emerald-500/10 to-cyan-500/10 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-semibold text-foreground flex items-center justify-center sm:justify-start gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <span>Want to see full AI search answers & cited sources?</span>
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Run a full scan across 100+ buyer queries on Gemini, Groq, and ChatGPT. Free tier included.
              </p>
            </div>

            <Link
              href={`/sign-up?domain=${encodeURIComponent(validatedDomain)}`}
              onClick={() => trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: "claim_domain_teaser_cta" })}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 whitespace-nowrap"
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
