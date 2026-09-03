"use client";

import { useEffect } from "react";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";

let landingViewedFired = false;

export function LandingTracker() {
  useEffect(() => {
    if (landingViewedFired) return;
    landingViewedFired = true;
    trackClientEvent(EVENTS.LANDING_VIEWED);
  }, []);

  return null;
}
