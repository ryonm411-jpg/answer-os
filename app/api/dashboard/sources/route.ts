import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getSourcesSummary } from "@/lib/db/sources";

/**
 * GET /api/dashboard/sources
 * Returns top sources breakdown (donut visualizer data) and domain citations leaderboard.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const company = await getCompanyByClerkId(userId);
  if (!company) {
    return NextResponse.json(
      { error: { message: "Company not found" } },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  const daysParam = searchParams.get("days");
  const providerParam = searchParams.get("provider");

  const days = daysParam ? Math.max(1, parseInt(daysParam, 10) || 14) : 14;
  const provider = providerParam || "all";

  try {
    const sourcesData = await getSourcesSummary(company.id, {
      scanId,
      days,
      provider,
    });

    return NextResponse.json({
      data: sourcesData,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/sources] Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to load sources data" } },
      { status: 500 }
    );
  }
}
