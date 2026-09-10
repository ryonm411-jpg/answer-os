"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeDomain, validateDomain } from "@/lib/utils/domain";
import { createCompany } from "@/lib/api/domain";
import posthog from "posthog-js";
import { EVENTS } from "@/lib/analytics/events"

export function OnboardingForm() {
  const router = useRouter();

  const [domain, setDomain] = React.useState("");
  const [productDescription, setProductDescription] = React.useState("");
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Guard against double-submit.
    if (isLoading) return;

    // Normalize then validate client-side using shared rules.
    const normalized = normalizeDomain(domain);
    const validationError = validateDomain(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    const desc = productDescription.trim();

    try {
      await createCompany(normalized, {
        productDescription: desc || undefined,
      });
      // No PII per spec 21: never send domain/name/email as event properties.
      posthog.capture(EVENTS.ONBOARDING_COMPLETED);

      // Kick off AI prompt generation with product description context (non-blocking)
      fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: desc || undefined,
          count: 8,
        }),
      }).catch(() => {});

      // Success — navigate to the dashboard (now renders the company state).
      router.push("/editor");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      {/* Heading */}
      <div className="mb-8 space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Set up your workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your company domain and software focus to generate tailored buyer queries.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="domain">Company domain</Label>
          <Input
            id="domain"
            type="text"
            placeholder="acme.com"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
            autoComplete="off"
            autoFocus
            aria-describedby={error ? "domain-error" : undefined}
            aria-invalid={!!error}
          />
          {error && (
            <p id="domain-error" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">What does your company do?</Label>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <Input
            id="description"
            type="text"
            placeholder="e.g. Issue tracking and project management for software engineers"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />
          <p className="text-[12px] text-muted-foreground">
            Helps AI models generate accurate organic search queries for your market.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Setting up workspace…" : "Continue to Dashboard"}
        </Button>
      </form>
    </div>
  );
}
