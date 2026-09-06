"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function updatePostHogConsent(status: "accepted" | "rejected") {
  if (typeof window === "undefined") return;
  if (status === "accepted") {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token =
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
      process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!token) return;

    // Check saved consent status
    const consent = localStorage.getItem("answeros_cookie_consent");

    posthog.init(token, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: consent === "accepted",
      autocapture: false,
    });

    if (consent === "rejected") {
      posthog.opt_out_capturing();
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function trackClientEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== "undefined") {
    const consent = localStorage.getItem("answeros_cookie_consent");
    if (consent === "accepted") {
      posthog.capture(event, properties);
    }
  }
}
