import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCompanyByClerkId } from "@/lib/db/companies";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: scanId } = await params;

  // Handle "latest" scan keyword or specific scan ID
  let targetScanId = scanId;
  if (scanId === "latest") {
    const latestScan = await prisma.scan.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!latestScan) {
      return NextResponse.json({ data: { scanId: null, errors: [] } });
    }
    targetScanId = latestScan.id;
  }

  const scan = await prisma.scan.findFirst({
    where: { id: targetScanId, companyId: company.id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
    },
  });

  if (!scan) {
    return NextResponse.json(
      { error: { message: "Scan not found" } },
      { status: 404 }
    );
  }

  const failedResults = await prisma.scanResult.findMany({
    where: {
      scanId: targetScanId,
      error: { not: null },
    },
    include: {
      prompt: {
        select: {
          text: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const errors = failedResults.map((r) => ({
    id: r.id,
    provider: r.provider,
    promptText: r.prompt.text,
    promptCategory: r.prompt.category,
    error: r.error,
    rawResponseSnippet: r.rawResponse ? r.rawResponse.substring(0, 300) : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    data: {
      scanId: scan.id,
      status: scan.status,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.completedAt ? scan.completedAt.toISOString() : null,
      totalErrors: errors.length,
      errors,
    },
  });
}
