import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import {
  getStripeClient,
  getWebhookSecret,
  normalizeStripeSubscription,
} from "@/lib/stripe/server";
import {
  upsertSubscriptionFromStripe,
  recordStripeWebhookEvent,
} from "@/lib/db/subscriptions";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { captureApiError } from "@/lib/monitoring/sentry";

export async function POST(req: Request) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[webhooks/stripe] Failed to read request text:", err);
    return NextResponse.json(
      { error: { message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: { message: "Missing stripe-signature header" } },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhooks/stripe] Signature verification failed:", err);
    return NextResponse.json(
      { error: { message: "Invalid signature" } },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const normalized = normalizeStripeSubscription(sub);

        if (!normalized) {
          console.warn(
            `[webhooks/stripe] Unprocessable subscription data for event ${event.id}`
          );
          await recordStripeWebhookEvent(event.id, event.type);
          return NextResponse.json({ received: true });
        }

        // 1. Resolve company by subscription metadata
        let companyId: string | undefined = sub.metadata?.companyId;

        if (companyId) {
          const exists = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true },
          });
          if (!exists) companyId = undefined;
        }

        // 2. Fallback to lookup by customerId in Subscription table
        if (!companyId && normalized.stripeCustomerId) {
          const subRow = await prisma.subscription.findUnique({
            where: { stripeCustomerId: normalized.stripeCustomerId },
            select: { companyId: true },
          });
          if (subRow) companyId = subRow.companyId;
        }

        if (!companyId) {
          console.warn(
            `[webhooks/stripe] Could not resolve companyId for customer ${normalized.stripeCustomerId} on event ${event.id}`
          );
          await recordStripeWebhookEvent(event.id, event.type);
          return NextResponse.json({ received: true });
        }

        const result = await upsertSubscriptionFromStripe(
          companyId,
          event.id,
          event.type,
          normalized
        );

        if (result.isDuplicate) {
          console.log(
            `[webhooks/stripe] Duplicate event ${event.id} recognized and ignored`
          );
        }

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `[webhooks/stripe] Checkout completed for session ${session.id}, companyId: ${session.metadata?.companyId}`
        );
        await recordStripeWebhookEvent(event.id, event.type);
        if (session.metadata?.companyId) {
          const company = await prisma.company.findUnique({
            where: { id: session.metadata.companyId },
            select: { user: { select: { clerkId: true } } },
          });
          if (company) {
            await trackEvent(EVENTS.SUBSCRIPTION_ACTIVATED, company.user.clerkId, {
              company_id: session.metadata.companyId,
            });
          }
        }
        break;
      }

      default: {
        // Ignored event types
        await recordStripeWebhookEvent(event.id, event.type);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[webhooks/stripe] Processing error for event ${event.id}:`, err);
    captureApiError(err, "/api/webhooks/stripe");
    // Return 500 so Stripe will retry transient database failures
    return NextResponse.json(
      { error: { message: "Internal processing error" } },
      { status: 500 }
    );
  }
}
