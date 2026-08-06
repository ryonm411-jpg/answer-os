import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { DashboardContent } from "@/components/editor/dashboard-content";

export default async function EditorPage() {
  const { userId: clerkId } = await auth();
  const company = clerkId ? await getCompanyByClerkId(clerkId) : null;

  return <DashboardContent company={company} />;
}
