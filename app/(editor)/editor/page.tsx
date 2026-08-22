import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getDashboardData } from "@/lib/db/dashboard";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function EditorPage() {
  const { userId: clerkId } = await auth();
  const company = clerkId ? await getCompanyByClerkId(clerkId) : null;
  const dashboardData = company ? await getDashboardData(company.id) : null;

  return <DashboardContent company={company} data={dashboardData} />;
}
