import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCompanyByClerkId } from "@/lib/db/companies";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

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

  return <OnboardingForm />;
}
