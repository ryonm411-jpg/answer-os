import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getMultiBrandScoreHistory } from "@/lib/db/dashboard";

/**
 * GET /api/dashboard/trend
 * Returns multi-brand visibility time-series data filtered by date range (days) and AI provider.
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
  const daysParam = searchParams.get("days");
  const providerParam = searchParams.get("provider");

  const days = daysParam ? Math.max(1, parseInt(daysParam, 10) || 14) : 14;
  const provider = providerParam || "all";

  const trend = await getMultiBrandScoreHistory(company.id, {
    dateRangeDays: days,
    provider,
  });

  return NextResponse.json({
    data: {
      trend,
    },
  });
}
