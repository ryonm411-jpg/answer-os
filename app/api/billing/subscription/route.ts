import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getBillingStatusForCompany } from "@/lib/db/subscriptions";

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
    return NextResponse.json({
      data: {
        status: null,
        entitled: false,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    });
  }

  const status = await getBillingStatusForCompany(company.id);

  return NextResponse.json({ data: status });
}
