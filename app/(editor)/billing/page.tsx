import * as React from "react";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { getBillingStatusForCompany } from "@/lib/db/subscriptions";
import { BillingPage } from "@/components/billing/billing-page";

export default async function BillingRoutePage() {
  const { userId: clerkId } = await auth.protect();
  const company = clerkId ? await getCompanyByClerkId(clerkId) : null;
  const initialStatus = company
    ? await getBillingStatusForCompany(company.id)
    : {
        status: null,
        entitled: false,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };

  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 max-w-4xl mx-auto py-8">
          <div className="h-8 w-48 bg-accent/40 rounded animate-pulse" />
          <div className="h-64 max-w-2xl mx-auto bg-accent/30 rounded-lg animate-pulse" />
        </div>
      }
    >
      <BillingPage initialStatus={initialStatus} domainName={company?.domain} />
    </React.Suspense>
  );
}
