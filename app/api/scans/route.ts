import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { getCompanyByClerkId } from "@/lib/db/companies";
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

  const scan = await prisma.scan.create({
    data: {
      companyId: company.id,
      status: "PENDING",
    },
  });

  try {
    await tasks.trigger<typeof runScan>("scan-company", { scanId: scan.id });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
    return NextResponse.json(
      { error: { message: "Failed to trigger background scan job" } },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { data: { scanId: scan.id, status: "PENDING" } },
    { status: 202 }
  );
}
