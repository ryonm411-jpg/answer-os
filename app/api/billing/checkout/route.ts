import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import {
  getSubscriptionForCompany,
  hasActiveSubscription,
} from "@/lib/db/subscriptions";
import {
  getStripeClient,
  getConfiguredPriceId,
  getAppUrl,
} from "@/lib/stripe/server";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { captureApiError } from "@/lib/monitoring/sentry";

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const company = await getCompanyByClerkId(clerkId);
  if (!company) {
    return NextResponse.json(
      { error: { message: "Company not found. Please complete onboarding." } },
      { status: 404 }
    );
  }

  // Reject if already entitled
  const isEntitled = await hasActiveSubscription(company.id);
  if (isEntitled) {
    return NextResponse.json(
      {
        error: {
          message: "Company already has an active or entitled subscription.",
        },
      },
      { status: 409 }
    );
  }

  const existingSub = await getSubscriptionForCompany(company.id);
  const user = await currentUser();
  const primaryEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  try {
    const stripe = getStripeClient();
    const priceId = getConfiguredPriceId();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?checkout=success`,
      cancel_url: `${appUrl}/billing?checkout=cancelled`,
      client_reference_id: company.id,
      metadata: { companyId: company.id },
      subscription_data: {
        metadata: { companyId: company.id },
      },
      ...(existingSub?.stripeCustomerId
        ? { customer: existingSub.stripeCustomerId }
        : primaryEmail
          ? { customer_email: primaryEmail }
          : {}),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: { message: "Failed to generate Stripe checkout URL" } },
        { status: 500 }
      );
    }

    await trackEvent(EVENTS.CHECKOUT_INITIATED, clerkId, { company_id: company.id });

    return NextResponse.json({ data: { url: session.url } });
  } catch (err) {
    console.error("[billing/checkout] Error creating checkout session:", err);
    captureApiError(err, "/api/billing/checkout", clerkId);
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error
              ? err.message
              : "Failed to create checkout session",
        },
      },
      { status: 500 }
    );
  }
}
