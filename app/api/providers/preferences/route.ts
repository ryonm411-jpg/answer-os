import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import {
  deleteProviderPreferences,
  upsertProviderPreferences,
} from "@/lib/db/provider-preferences";
import { hasActiveSubscription } from "@/lib/db/subscriptions";
import {
  ALL_PROVIDERS,
  getAvailableProviders,
  resolveAllowedProviders,
} from "@/lib/providers";
import type { AIProviderName } from "@/lib/providers";

const EMPTY_MESSAGE = "At least one AI model must remain enabled";

/**
 * PUT /api/providers/preferences
 * Upserts the company's enabled-provider selection (spec 18, §9.2).
 */
export async function PUT(req: Request) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const rawEnabled = (body as { enabled?: unknown } | null)?.enabled;
  if (!Array.isArray(rawEnabled)) {
    return NextResponse.json(
      { error: { message: "Request body must include an \"enabled\" array of AI provider names." } },
      { status: 422 }
    );
  }

  const invalid = rawEnabled.filter(
    (name): name is string =>
      typeof name !== "string" ||
      !ALL_PROVIDERS.includes(name as AIProviderName)
  );
  if (invalid.length > 0) {
    return NextResponse.json(
      {
        error: {
          message: `Unknown AI provider(s): ${invalid.join(", ")}. Valid providers are: ${ALL_PROVIDERS.join(", ")}.`,
        },
      },
      { status: 422 }
    );
  }

  const enabled = [...new Set(rawEnabled as AIProviderName[])];
  if (enabled.length === 0) {
    return NextResponse.json(
      { error: { message: EMPTY_MESSAGE } },
      { status: 422 }
    );
  }

  const stored = await upsertProviderPreferences(company.id, enabled);
  return NextResponse.json({ data: { enabled: stored } });
}

/**
 * DELETE /api/providers/preferences
 * Deletes the preference row so the plan default applies again (spec 18, §11.1).
 * Returns the effective default set so the UI can refresh without a second call.
 */
export async function DELETE() {
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

  await deleteProviderPreferences(company.id);

  const entitled = await hasActiveSubscription(company.id);
  const configured = getAvailableProviders().map((p) => p.name);
  const defaults = resolveAllowedProviders({ entitled, configured });

  return NextResponse.json({ data: { enabled: defaults } });
}
