"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { normalizeDomain, validateDomain } from "@/lib/utils/domain";
import { createCompany } from "@/lib/api/domain";
import posthog from "posthog-js";
import { EVENTS } from "@/lib/analytics/events";
import { ArrowRight, CheckCircle2, Globe, Sparkles, Building2, Edit3 } from "lucide-react";

interface InferredProfile {
  brandName: string;
  whatYouSell: string;
  whoItIsFor: string;
}

function inferBusinessDetails(domainStr: string): InferredProfile {
  const parts = domainStr.split(".");
  const rawName = parts[0] || "Your Brand";
  const brandName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // Common knowledge heuristics for sample domains or general intelligent fallback
  const lower = rawName.toLowerCase();
  if (lower.includes("sparkle")) {
    return {
      brandName: "Sparkle",
      whatYouSell: "Graphics cards, discrete GPUs, and PC cooling hardware.",
      whoItIsFor: "Gamers, video creators, and small-form-factor PC builders.",
    };
  }
  if (lower.includes("linear")) {
    return {
      brandName: "Linear",
      whatYouSell: "Issue tracking, project management, and product roadmaps.",
      whoItIsFor: "Engineering teams, product managers, and modern software companies.",
    };
  }
  if (lower.includes("allbirds")) {
    return {
      brandName: "Allbirds",
      whatYouSell: "Sustainable wool and tree fiber running shoes and everyday apparel.",
      whoItIsFor: "Eco-conscious runners, travelers, and comfort-focused consumers.",
    };
  }
  if (lower.includes("acme")) {
    return {
      brandName: "Acme",
      whatYouSell: "Products and services designed for modern customer needs.",
      whoItIsFor: "Businesses and consumers looking for reliable solutions.",
    };
  }

  return {
    brandName,
    whatYouSell: `Products and specialized services provided by ${brandName}.`,
    whoItIsFor: "Prospective customers and buyers searching for solutions in this space.",
  };
}

export function OnboardingForm() {
  const router = useRouter();

  // Multi-step state: 1 = Website input, 2 = Confirmation & Inferred details, 3 = Optional notes
  const [step, setStep] = React.useState<1 | 2>(1);
  const [domain, setDomain] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Profile data
  const [brandName, setBrandName] = React.useState("");
  const [whatYouSell, setWhatYouSell] = React.useState("");
  const [whoItIsFor, setWhoItIsFor] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [additionalNotes, setAdditionalNotes] = React.useState("");

  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem("prefill_domain");
      if (stored) {
        setDomain(stored);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeDomain(domain);
    const validationError = validateDomain(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsAnalyzing(true);

    // Simulate smart website inspection
    setTimeout(() => {
      const inferred = inferBusinessDetails(normalized);
      setBrandName(inferred.brandName);
      setWhatYouSell(inferred.whatYouSell);
      setWhoItIsFor(inferred.whoItIsFor);
      setIsAnalyzing(false);
      setStep(2);
    }, 600);
  };

  async function handleFinalSubmit() {
    if (isLoading) return;

    const normalized = normalizeDomain(domain);
    const validationError = validateDomain(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    // Combine what they sell, who it's for, and additional notes into the product description for the prompt generator
    const combinedDescription = [
      whatYouSell ? `What we offer: ${whatYouSell}` : "",
      whoItIsFor ? `Target audience: ${whoItIsFor}` : "",
      additionalNotes ? `Additional context: ${additionalNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await createCompany(normalized, {
        productDescription: combinedDescription || undefined,
      });

      posthog.capture(EVENTS.ONBOARDING_COMPLETED);

      // Kick off AI prompt generation with full context (non-blocking)
      fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: combinedDescription || undefined,
          count: 8,
        }),
      }).catch(() => {});

      // Success — navigate to AI searches or dashboard
      router.push("/prompts");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm max-w-xl mx-auto">
      {step === 1 ? (
        <form onSubmit={handleAnalyze} noValidate className="space-y-6">
          {/* Step 1 Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <Globe className="h-3.5 w-3.5" />
              <span>Step 1 of 2</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              What&apos;s your website?
            </h1>
            <p className="text-sm text-muted-foreground">
              AnswerOS will analyze your business to discover how AI search engines recommend your brand.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain" className="text-sm font-medium">
              Website or domain
            </Label>
            <Input
              id="domain"
              type="text"
              placeholder="yourcompany.com"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                if (error) setError("");
              }}
              disabled={isAnalyzing}
              autoComplete="off"
              autoFocus
              className="h-11 text-base bg-secondary/30"
              aria-describedby={error ? "domain-error" : undefined}
              aria-invalid={!!error}
            />
            {error && (
              <p id="domain-error" className="text-sm text-destructive font-medium">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold flex items-center justify-center gap-2"
            disabled={isAnalyzing || !domain.trim()}
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-primary-foreground" />
                <span>Analyzing your business…</span>
              </>
            ) : (
              <>
                <span>Analyze My Business</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Step 2 Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>We found your business</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Does this look right?
            </h1>
            <p className="text-sm text-muted-foreground">
              We inferred these details from <span className="font-semibold text-foreground">{normalizeDomain(domain)}</span> to generate relevant customer search questions.
            </p>
          </div>

          {/* Inferred Details Box */}
          <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-4">
            {!isEditing ? (
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block mb-0.5">
                    Brand
                  </span>
                  <p className="font-semibold text-foreground text-base">{brandName}</p>
                </div>
                <div>
                  <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block mb-0.5">
                    What you sell
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{whatYouSell}</p>
                </div>
                <div>
                  <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block mb-0.5">
                    Who it&apos;s for
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{whoItIsFor}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-brand" className="text-xs font-semibold text-muted-foreground uppercase">
                    Brand name
                  </Label>
                  <Input
                    id="edit-brand"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="mt-1 h-9 bg-card text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-what" className="text-xs font-semibold text-muted-foreground uppercase">
                    What you sell
                  </Label>
                  <Input
                    id="edit-what"
                    value={whatYouSell}
                    onChange={(e) => setWhatYouSell(e.target.value)}
                    className="mt-1 h-9 bg-card text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-who" className="text-xs font-semibold text-muted-foreground uppercase">
                    Who it&apos;s for
                  </Label>
                  <Input
                    id="edit-who"
                    value={whoItIsFor}
                    onChange={(e) => setWhoItIsFor(e.target.value)}
                    className="mt-1 h-9 bg-card text-sm"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditing ? "Done editing" : "Edit details"}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Change website
              </button>
            </div>
          </div>

          {/* Optional Step 3 Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                Anything else we should know?
              </Label>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Optional — add any specific products, key competitors, or details to help us understand your business."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="resize-none bg-secondary/30 text-sm"
            />
            <p className="text-[12px] text-muted-foreground">
              This helps AnswerOS generate more relevant AI search questions.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isLoading}
              className="w-full h-11 text-base font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-primary-foreground" />
                  <span>Setting up your searches…</span>
                </>
              ) : (
                <>
                  <span>Yes, continue →</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
