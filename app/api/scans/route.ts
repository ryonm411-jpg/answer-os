import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getEnabledProviders } from "@/lib/db/provider-preferences";
import { hasActiveSubscription } from "@/lib/db/subscriptions";
import {
  getAvailableProviders,
  resolveEffectiveProviders,
} from "@/lib/providers";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { captureApiError } from "@/lib/monitoring/sentry";
import type { runScan } from "@/lib/jobs/scan";

/**
 * POST /api/scans
 * Triggers a new background scan job for the authenticated user's company.
 */
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

  // Server-side entitlement + user preference: effective provider set (spec 18, §10.1)
  const isEntitled = await hasActiveSubscription(company.id);
  const configured = getAvailableProviders().map((p) => p.name);
  const enabled = await getEnabledProviders(company.id);
  const providers = resolveEffectiveProviders({ entitled: isEntitled, configured, enabled });

  // User-caused empty set (preference row disables everything) is recoverable via the All Models tab
  if (providers.length === 0 && enabled !== null) {
    return NextResponse.json(
      {
        error: {
          message:
            "Enable at least one AI model in the All Models tab to run a scan.",
        },
      },
      { status: 422 }
    );
  }

  // Stale-PENDING recovery (12, Decision #11): a trigger that was accepted but
  // never dequeued must not block future scans forever.
  const STALE_PENDING_MS = 10 * 60 * 1000;
  await prisma.scan.updateMany({
    where: {
      companyId: company.id,
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - STALE_PENDING_MS) },
    },
    data: { status: "FAILED", completedAt: new Date() },
  });

  // Reject a second scan while one is already PENDING or RUNNING (Decision #7)
  const activeScan = await prisma.scan.findFirst({
    where: {
      companyId: company.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });
  if (activeScan) {
    return NextResponse.json(
      { error: { message: "A scan is already in progress for this company" } },
      { status: 409 }
    );
  }

  // Load effective prompt set and reject if 0 prompts exist (spec §22.6, Invariant #13)
  const effectivePrompts = await prisma.prompt.findMany({
    where: {
      archivedAt: null,
      OR: [{ companyId: null }, { companyId: company.id }],
    },
    select: { id: true },
  });

  if (effectivePrompts.length === 0) {
    return NextResponse.json(
      { error: { message: "Cannot start a scan with 0 active prompts. Please add or activate at least one prompt." } },
      { status: 422 }
    );
  }

  const scan = await prisma.scan.create({
    data: {
      companyId: company.id,
      status: "PENDING",
    },
  });

  try {
    await tasks.trigger<typeof runScan>("scan-company", {
      scanId: scan.id,
      providers,
    });
  } catch (error) {
    captureApiError(error, "/api/scans", clerkId);
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
    return NextResponse.json(
      { error: { message: "Failed to trigger background scan job" } },
      { status: 502 }
    );
  }

  await trackEvent(EVENTS.SCAN_INITIATED, clerkId, {
    scan_id: scan.id,
    provider_count: providers.length,
  });

  return NextResponse.json(
    { data: { scanId: scan.id, status: "PENDING", providers } },
    { status: 202 }
  );
}
