import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ScoreExplainer } from "@/components/landing/score-explainer";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { WhoItsFor } from "@/components/landing/who-its-for";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { LandingFaq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingTracker } from "@/components/landing/landing-tracker";

export const metadata: Metadata = {
  title: "AnswerOS — Become the answer AI search engines give",
  description:
    "AnswerOS helps B2B SaaS companies track and optimize how often ChatGPT, Claude, Gemini, and Perplexity recommend their software to prospective buyers.",
  keywords: [
    "AI search optimization",
    "AEO",
    "GEO",
    "ChatGPT SEO",
    "Claude visibility",
    "B2B SaaS marketing",
    "AI visibility score",
  ],
  openGraph: {
    title: "AnswerOS — Become the answer AI search engines give",
    description:
      "Scan buyer prompts across 7 AI engines, measure brand mentions & sentiment, and get prioritized recommendations to win AI search recommendations.",
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
        <HowItWorks />
        <ScoreExplainer />
        <FeatureGrid />
        <WhoItsFor />
        <PricingTeaser />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
