import { prisma } from "@/lib/db/prisma";
import {
  toBillingStatus,
  isSubscriptionEntitled,
  getConfiguredPriceId,
  type BillingStatus,
  type NormalizedSubscription,
} from "@/lib/stripe/server";

/**
 * Database access helpers for subscriptions and billing status.
 * Owns Prisma queries; contains no rendering decisions.
 */

/**
 * Return the current Subscription row for a company, or `null`.
 */
export async function getSubscriptionForCompany(companyId: string) {
  return prisma.subscription.findUnique({
    where: { companyId },
  });
}

/**
 * Map the company's stored Subscription row to the safe serializable billing view model.
 */
export async function getBillingStatusForCompany(
  companyId: string
): Promise<BillingStatus> {
  const subscription = await getSubscriptionForCompany(companyId);
  return toBillingStatus(subscription);
}

/**
 * Server-side entitlement check for resource-consuming actions.
 * Checks the stored Subscription row against `ACTIVE`/`TRIALING` and configured `STRIPE_PRICE_ID`.
 */
export async function hasActiveSubscription(
  companyId: string
): Promise<boolean> {
  const subscription = await getSubscriptionForCompany(companyId);
  if (!subscription) return false;

  let configuredPriceId = "";
  try {
    configuredPriceId = getConfiguredPriceId();
  } catch {
    return false;
  }

  return isSubscriptionEntitled({
    status: subscription.status,
    stripePriceId: subscription.stripePriceId,
    configuredPriceId,
  });
}

/**
 * Upsert a subscription from a verified Stripe webhook event.
 *
 * Runs inside an atomic database transaction alongside StripeWebhookEvent recording
 * to guarantee idempotent updates (spec §9).
 */
export async function upsertSubscriptionFromStripe(
  companyId: string,
  eventId: string,
  eventType: string,
  data: NormalizedSubscription
): Promise<{ processed: boolean; isDuplicate: boolean }> {
  return prisma.$transaction(async (tx) => {
    // 1. Check for duplicate event
    const existingEvent = await tx.stripeWebhookEvent.findUnique({
      where: { id: eventId },
    });

    if (existingEvent) {
      return { processed: true, isDuplicate: true };
    }

    // 2. Record the webhook event
    await tx.stripeWebhookEvent.create({
      data: {
        id: eventId,
        type: eventType,
      },
    });

    // 3. Upsert the subscription row
    await tx.subscription.upsert({
      where: { companyId },
      create: {
        companyId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripePriceId: data.stripePriceId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        canceledAt: data.canceledAt,
      },
      update: {
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripePriceId: data.stripePriceId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        canceledAt: data.canceledAt,
      },
    });

    return { processed: true, isDuplicate: false };
  });
}

/**
 * Record an ignored or non-subscription Stripe event for idempotency tracking.
 */
export async function recordStripeWebhookEvent(
  eventId: string,
  eventType: string
): Promise<boolean> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: { id: eventId, type: eventType },
    });
    return true; // Newly recorded
  } catch {
    return false; // Duplicate
  }
}
