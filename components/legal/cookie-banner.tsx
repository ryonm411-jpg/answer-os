"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePostHogConsent } from "@/lib/analytics/posthog-client";

export const COOKIE_CONSENT_KEY = "answeros_cookie_consent";

export type ConsentStatus = "accepted" | "rejected" | null;

export function CookieBanner() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Check if consent preference has already been saved
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        setIsVisible(true);
      }
    } catch {
      // Fallback for SSR/restricted environments
    }
  }, []);

  const handleConsent = (status: "accepted" | "rejected") => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, status);
    } catch {
      // Handle storage errors
    }
    updatePostHogConsent(status);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-xl border border-border/90 bg-card/95 p-4 shadow-2xl backdrop-blur-md space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 mt-0.5">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-foreground flex items-center gap-1.5">
              Cookie &amp; Privacy Preferences
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We use necessary cookies for authentication and optional cookies to understand product usage. Essential cookies remain active.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
          <Link
            href="/cookies"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Shield className="h-3 w-3" />
            Cookie Settings
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConsent("rejected")}
              className="h-7 text-xs px-2.5 font-medium border-border/80 hover:bg-accent"
            >
              <X className="h-3 w-3 mr-1" />
              Reject optional
            </Button>
            <Button
              size="sm"
              onClick={() => handleConsent("accepted")}
              className="h-7 text-xs px-3 font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
