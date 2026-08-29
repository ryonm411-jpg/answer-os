import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getEnabledProviders } from "@/lib/db/provider-preferences";
import { hasActiveSubscription } from "@/lib/db/subscriptions";
import {
  getAvailableProviders,
  isProviderConfigured,
  PREMIUM_PROVIDERS,
  PROVIDER_CATALOG,
  resolveAllowedProviders,
} from "@/lib/providers";
import type { AIProviderName } from "@/lib/providers";

export interface ProviderStatus {
  name: AIProviderName;
  label: string;
  description: string;
  tier: "free" | "premium";
  configured: boolean;
  enabled: boolean;
  locked: boolean;
}

/**
 * GET /api/providers
 * Returns the full provider catalog with server-computed state for the
 * All Models tab: plan entitlement, configuration status, current selection,
 * and lock state (spec 18, §9.1).
 */
export async function GET() {
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

  const entitled = await hasActiveSubscription(company.id);
  const configured = getAvailableProviders().map((p) => p.name);
  const stored = await getEnabledProviders(company.id);
  const tierAllowed = resolveAllowedProviders({ entitled, configured });

  const providers: ProviderStatus[] = PROVIDER_CATALOG.map((entry) => {
    const tier = PREMIUM_PROVIDERS.includes(entry.name) ? "premium" : "free";
    const enabled = stored === null
      ? tierAllowed.includes(entry.name)
      : stored.includes(entry.name);

    return {
      name: entry.name,
      label: entry.label,
      description: entry.description,
      tier,
      configured: isProviderConfigured(entry.name),
      enabled,
      locked: !entitled && tier === "premium",
      speedBadge: entry.speedBadge,
      promptLengthNote: entry.promptLengthNote,
      restrictionNote: entry.restrictionNote,
    };
  });

  return NextResponse.json({ data: { entitled, providers } });
}
