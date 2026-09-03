"use client";

import {
  UserPlus,
  Globe,
  ListFilter,
  Play,
  BarChart3,
  CheckSquare,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    stepNumber: "01",
    title: "Create your account",
    description:
      "Sign up with email or Google via Clerk. The free tier is ready immediately with no credit card required; upgrade anytime from billing.",
    icon: UserPlus,
  },
  {
    stepNumber: "02",
    title: "Add your company domain",
    description:
      "Tell AnswerOS which brand domain to track. Automatic normalization validates your domain at the API boundary.",
    icon: Globe,
  },
  {
    stepNumber: "03",
    title: "Review your AI prompt set",
    description:
      "AnswerOS builds a curated library plus AI-suggested buyer questions with opportunity scores. Archive what's irrelevant; keep what matters.",
    icon: ListFilter,
  },
  {
    stepNumber: "04",
    title: "Run your first scan",
    description:
      "One click queues an async background scan across your enabled AI engines (Gemini, Groq, NVIDIA, OpenRouter, OpenAI, Claude, Perplexity).",
    icon: Play,
  },
  {
    stepNumber: "05",
    title: "Read your visibility report",
    description:
      "View a weighted 0–100 visibility score (Overall, Branded, and Organic), per-factor breakdown, competitor leaderboard, and top cited sources.",
    icon: BarChart3,
  },
  {
    stepNumber: "06",
    title: "Act on recommendations and track",
    description:
      "Execute prioritized, evidence-based recommendations (comparison landing pages, FAQ schema, positioning), re-scan, and monitor trends over time.",
    icon: CheckSquare,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-border text-muted-foreground uppercase tracking-wider"
          >
            Product Walkthrough
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            How AnswerOS works — and how to use it
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            From initial setup to AI search optimization in six simple steps.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.stepNumber}
                className="group relative rounded-xl border border-border/80 bg-card/40 p-6 space-y-4 transition-all hover:border-primary/50 hover:bg-card/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-muted-foreground/60 group-hover:text-primary transition-colors">
                    STEP {step.stepNumber}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest Callout */}
        <div className="max-w-2xl mx-auto rounded-lg border border-border/80 bg-secondary/20 p-4 flex items-center gap-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>Honest product note:</strong> Background scans typically finish in minutes. The MVP score ceiling is 95 out of 100 until richer source authority data is indexed.
          </span>
        </div>
      </div>
    </section>
  );
}
