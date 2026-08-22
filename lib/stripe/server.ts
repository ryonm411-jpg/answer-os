import Stripe from "stripe";
import type { SubscriptionStatus } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Stripe client — lazy singleton, validated on first access
// ---------------------------------------------------------------------------

let _stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripeClient) return _stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to .env.local."
    );
  }

  _stripeClient = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
  return _stripeClient;
}

// ---------------------------------------------------------------------------
// Validated environment helpers
// ---------------------------------------------------------------------------

export function getConfiguredPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error(
      "STRIPE_PRICE_ID is not configured. Add it to .env.local."
    );
  }
  return priceId;
}

export function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) {
    throw new Error("APP_URL is not configured. Add it to .env.local.");
  }
  return url;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured. Add it to .env.local."
    );
  }
  return secret;
}

// ---------------------------------------------------------------------------
// Status mapping — Stripe string → Prisma enum
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
  paused: "PAUSED",
};

/**
 * Map a Stripe subscription status string to our Prisma enum.
 * Unknown future statuses fall back to INCOMPLETE (non-entitled) with a warning.
 */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const mapped = STATUS_MAP[stripeStatus];
  if (mapped) return mapped;

  console.warn(
    `[stripe] Unknown subscription status "${stripeStatus}" — mapping to INCOMPLETE`
  );
  return "INCOMPLETE";
}

// ---------------------------------------------------------------------------
// Subscription normalization — Stripe object → Prisma-safe shape
// ---------------------------------------------------------------------------

export interface NormalizedSubscription {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
}

/**
 * Normalize a raw Stripe subscription into a database-safe update shape.
 * Returns `null` if critical fields are missing.
 */
export function normalizeStripeSubscription(
  sub: Stripe.Subscription
): NormalizedSubscription | null {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId || !sub.id) return null;

  // Extract first subscription item price
  const firstItem = sub.items?.data?.[0];
  const priceId = firstItem?.price?.id;
  if (!priceId) return null;

  const rawSub = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
    cancel_at_period_end?: boolean;
    canceled_at?: number | null;
  };

  return {
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    status: mapStripeStatus(sub.status),
    currentPeriodStart: rawSub.current_period_start
      ? new Date(rawSub.current_period_start * 1000)
      : null,
    currentPeriodEnd: rawSub.current_period_end
      ? new Date(rawSub.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: rawSub.cancel_at_period_end ?? false,
    canceledAt: rawSub.canceled_at ? new Date(rawSub.canceled_at * 1000) : null,
  };
}

// ---------------------------------------------------------------------------
// Entitlement — pure, deterministic, unit-testable
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the subscription is entitled to AnswerOS features.
 *
 * Rules:
 * - Status must be ACTIVE or TRIALING
 * - Price must match the configured STRIPE_PRICE_ID
 * - cancelAtPeriodEnd does NOT revoke access before period ends
 */
export function isSubscriptionEntitled(input: {
  status: SubscriptionStatus;
  stripePriceId: string;
  configuredPriceId: string;
}): boolean {
  const entitledStatuses: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];
  if (!entitledStatuses.includes(input.status)) return false;
  if (input.stripePriceId !== input.configuredPriceId) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Safe billing view model — never contains secrets or raw Stripe objects
// ---------------------------------------------------------------------------

export interface BillingStatus {
  status: SubscriptionStatus | null;
  entitled: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Map a stored Subscription row (or null) to a safe client-facing billing view.
 */
export function toBillingStatus(
  subscription: {
    status: SubscriptionStatus;
    stripePriceId: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null
): BillingStatus {
  if (!subscription) {
    return {
      status: null,
      entitled: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  return {
    status: subscription.status,
    entitled: isSubscriptionEntitled({
      status: subscription.status,
      stripePriceId: subscription.stripePriceId,
      configuredPriceId: getConfiguredPriceId(),
    }),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}
