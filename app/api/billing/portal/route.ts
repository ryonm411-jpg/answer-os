import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getSubscriptionForCompany } from "@/lib/db/subscriptions";
import { getStripeClient, getAppUrl } from "@/lib/stripe/server";

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
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  const subscription = await getSubscriptionForCompany(company.id);
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      {
        error: {
          message:
            "No active payment profile found for this company. Please subscribe first.",
        },
      },
      { status: 404 }
    );
  }

  try {
    const stripe = getStripeClient();
    const appUrl = getAppUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (err) {
    console.error("[billing/portal] Error creating portal session:", err);
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error
              ? err.message
              : "Failed to create billing portal session",
        },
      },
      { status: 500 }
    );
  }
}
