import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { trackEvent } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

export const metadata = {
  title: "Get Started — AnswerOS",
  description: "Enter your company domain to start tracking your AI visibility.",
};

export default async function OnboardingPage() {
  // Protect: redirect unauthenticated users to sign-in.
  const { userId: clerkId } = await auth.protect();

  // Protect: if the user already has a company, they are done onboarding.
  const company = await getCompanyByClerkId(clerkId);
  if (company) {
    redirect("/editor");
  }

  // USER_SIGNED_UP: /onboarding is the post-sign-up landing page (afterSignUpUrl
  // hook per spec 21). Newly authenticated users without a company land here.
  trackEvent(EVENTS.USER_SIGNED_UP, clerkId);

  return <OnboardingForm />;
}
