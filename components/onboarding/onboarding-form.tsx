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
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

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

    try {
      await createCompany(normalized);
      // No PII per spec 21: never send domain/name/email as event properties.
      posthog.capture(EVENTS.ONBOARDING_COMPLETED);
      // Kick off AI prompt generation best-effort (non-blocking)
      fetch("/api/prompts/generate", { method: "POST" }).catch(() => {});
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
          Enter the domain you want to track across AI search engines.
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

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Adding…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
