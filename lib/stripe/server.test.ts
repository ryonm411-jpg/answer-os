import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mapStripeStatus,
  normalizeStripeSubscription,
  isSubscriptionEntitled,
  toBillingStatus,
} from "./server";
import type Stripe from "stripe";

describe("lib/stripe/server", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("mapStripeStatus", () => {
    it("maps standard Stripe statuses to Prisma enum values", () => {
      expect(mapStripeStatus("active")).toBe("ACTIVE");
      expect(mapStripeStatus("trialing")).toBe("TRIALING");
      expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
      expect(mapStripeStatus("canceled")).toBe("CANCELED");
      expect(mapStripeStatus("unpaid")).toBe("UNPAID");
      expect(mapStripeStatus("incomplete")).toBe("INCOMPLETE");
      expect(mapStripeStatus("incomplete_expired")).toBe("INCOMPLETE_EXPIRED");
      expect(mapStripeStatus("paused")).toBe("PAUSED");
    });

    it("falls back to INCOMPLETE for unknown statuses", () => {
      expect(mapStripeStatus("unknown_status_xyz")).toBe("INCOMPLETE");
    });
  });

  describe("isSubscriptionEntitled", () => {
    const priceId = "price_12345";

    it("returns true for ACTIVE status with matching price", () => {
      expect(
        isSubscriptionEntitled({
          status: "ACTIVE",
          stripePriceId: priceId,
          configuredPriceId: priceId,
        })
      ).toBe(true);
    });

    it("returns true for TRIALING status with matching price", () => {
      expect(
        isSubscriptionEntitled({
          status: "TRIALING",
          stripePriceId: priceId,
          configuredPriceId: priceId,
        })
      ).toBe(true);
    });

    it("returns false for non-entitled statuses", () => {
      const nonEntitled = [
        "PAST_DUE",
        "CANCELED",
        "UNPAID",
        "INCOMPLETE",
        "INCOMPLETE_EXPIRED",
        "PAUSED",
      ] as const;

      for (const status of nonEntitled) {
        expect(
          isSubscriptionEntitled({
            status,
            stripePriceId: priceId,
            configuredPriceId: priceId,
          })
        ).toBe(false);
      }
    });

    it("returns false if price ID does not match configured price", () => {
      expect(
        isSubscriptionEntitled({
          status: "ACTIVE",
          stripePriceId: "price_other",
          configuredPriceId: priceId,
        })
      ).toBe(false);
    });
  });

  describe("normalizeStripeSubscription", () => {
    it("normalizes a valid Stripe subscription object", () => {
      const rawSub = {
        id: "sub_123",
        customer: "cus_456",
        status: "active",
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        cancel_at_period_end: false,
        canceled_at: null,
        items: {
          data: [
            {
              price: { id: "price_12345" },
            },
          ],
        },
      } as unknown as Stripe.Subscription;

      const normalized = normalizeStripeSubscription(rawSub);
      expect(normalized).toEqual({
        stripeCustomerId: "cus_456",
        stripeSubscriptionId: "sub_123",
        stripePriceId: "price_12345",
        status: "ACTIVE",
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702592000 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
    });

    it("returns null when items or customer are missing", () => {
      const rawSub = {
        id: "sub_123",
        customer: null,
        status: "active",
      } as unknown as Stripe.Subscription;

      expect(normalizeStripeSubscription(rawSub)).toBeNull();
    });
  });

  describe("toBillingStatus", () => {
    it("returns empty non-entitled state when subscription is null", () => {
      expect(toBillingStatus(null)).toEqual({
        status: null,
        entitled: false,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    });

    it("serializes valid subscription date and entitlement", () => {
      process.env.STRIPE_PRICE_ID = "price_12345";
      const now = new Date("2026-09-01T00:00:00.000Z");

      const res = toBillingStatus({
        status: "ACTIVE",
        stripePriceId: "price_12345",
        currentPeriodEnd: now,
        cancelAtPeriodEnd: true,
      });

      expect(res).toEqual({
        status: "ACTIVE",
        entitled: true,
        currentPeriodEnd: "2026-09-01T00:00:00.000Z",
        cancelAtPeriodEnd: true,
      });
    });
  });
});
