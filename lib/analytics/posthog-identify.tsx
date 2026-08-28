"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { EVENTS } from "@/lib/analytics/events";

const signedInFired = new Set<string>();

export function PostHogIdentify() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      if (previousUserId.current) {
        posthog.reset();
        signedInFired.delete(previousUserId.current);
        previousUserId.current = null;
      }
      return;
    }

    if (previousUserId.current === userId) return;

    if (previousUserId.current) posthog.reset();

    posthog.identify(userId, {
      ...(user?.primaryEmailAddress?.emailAddress
        ? { email: user.primaryEmailAddress.emailAddress }
        : {}),
      ...(user?.fullName ? { name: user.fullName } : {}),
    });
    previousUserId.current = userId;

    if (!signedInFired.has(userId)) {
      signedInFired.add(userId);
      posthog.capture(EVENTS.USER_SIGNED_IN);
    }
  }, [isLoaded, user?.fullName, user?.primaryEmailAddress?.emailAddress, userId]);

  return null;
}
