import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getPromptsForCompany } from "@/lib/db/prompts";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const company = await getCompanyByClerkId(userId);
  if (!company) {
    return NextResponse.json({ data: { prompts: [] } });
  }

  const prompts = await getPromptsForCompany(company.id);

  return NextResponse.json({ data: { prompts } });
}
