import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getDashboardData } from "@/lib/db/dashboard";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

export default async function EditorPage() {
  const { userId: clerkId } = await auth();
  const company = clerkId ? await getCompanyByClerkId(clerkId) : null;
  const dashboardData = company ? await getDashboardData(company.id) : null;

  // DASHBOARD_VIEWED: once per dashboard page load (spec 21 events table).
  if (clerkId) {
    trackEvent(EVENTS.DASHBOARD_VIEWED, clerkId);
  }

  return <DashboardContent company={company} data={dashboardData} />;
}
