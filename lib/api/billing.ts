import type { BillingStatus } from "@/lib/stripe/server";

type ApiEnvelope<T> = { data?: T; error?: { message?: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new Error(
      body?.error?.message ?? "Something went wrong. Please try again."
    );
  }

  return body?.data as T;
}

/**
 * Start a Stripe Checkout session for the single flat monthly subscription.
 * Returns `{ url }` to redirect the browser to hosted Stripe Checkout.
 */
export function startCheckout() {
  return request<{ url: string }>("/api/billing/checkout", {
    method: "POST",
  });
}

/**
 * Create a Stripe Customer Portal session for managing payments and subscriptions.
 * Returns `{ url }` to redirect the browser to hosted Stripe Portal.
 */
export function openPortal() {
  return request<{ url: string }>("/api/billing/portal", {
    method: "POST",
  });
}

/**
 * Fetch the current company's server-side billing status.
 */
export function getBillingStatus() {
  return request<BillingStatus>("/api/billing/subscription", {
    method: "GET",
  });
}
