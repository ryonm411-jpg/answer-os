import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { ScanPreviewShowcase } from "@/components/landing/scan-preview-showcase";
import { WhatYouDiscover } from "@/components/landing/what-you-discover";
import { HowItWorks } from "@/components/landing/how-it-works";
import { RetentionTracking } from "@/components/landing/retention-tracking";
import { UseCases } from "@/components/landing/use-cases";
import { RecommendationsShowcase } from "@/components/landing/recommendations-showcase";
import { ScoreExplainer } from "@/components/landing/score-explainer";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { LandingFaq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingTracker } from "@/components/landing/landing-tracker";

export const metadata: Metadata = {
  title: "AnswerOS — See how AI search engines recommend your brand",
  description:
    "AnswerOS shows where your brand appears in ChatGPT, Claude, Gemini, and other AI search experiences—including your ranking, competitors, cited sources, and what to improve.",
  keywords: [
    "AI search visibility",
    "AEO",
    "GEO",
    "AI brand monitoring",
    "ChatGPT recommendations",
    "Claude visibility",
    "Gemini search",
    "AI visibility score",
    "Generative engine optimization",
  ],
  openGraph: {
    title: "AnswerOS — See how AI search engines recommend your brand",
    description:
      "Scan buyer queries across 6 AI providers, measure brand mentions, sentiment, and competitor presence, and get prioritized recommendations to improve your AI visibility.",
    type: "website",
  },
};

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/editor");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <LandingTracker />
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <ScanPreviewShowcase />
        <WhatYouDiscover />
        <HowItWorks />
        <RetentionTracking />
        <UseCases />
        <RecommendationsShowcase />
        <ScoreExplainer />
        <PricingTeaser />
        <LandingFaq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
