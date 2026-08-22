import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId, updateCompanyProfile } from "@/lib/db/companies";

/**
 * PATCH /api/company/profile
 * Updates the company's Business Profile (productDescription and optional industry).
 */
export async function PATCH(req: Request) {
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

  try {
    const body = await req.json();
    const { productDescription, industry } = body ?? {};

    if (typeof productDescription !== "string" || !productDescription.trim()) {
      return NextResponse.json(
        { error: { message: "productDescription is required" } },
        { status: 400 }
      );
    }

    const updated = await updateCompanyProfile(company.id, {
      productDescription,
      industry: typeof industry === "string" ? industry.trim() : null,
    });

    return NextResponse.json({
      data: {
        productDescription: updated.productDescription,
        industry: updated.industry,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to update company profile" } },
      { status: 500 }
    );
  }
}
