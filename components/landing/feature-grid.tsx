"use client";

import {
  Zap,
  Target,
  Trophy,
  Globe,
  Lightbulb,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Zap,
    title: "7 Active AI Providers",
    description:
      "Gemini, Groq, NVIDIA NIM, and OpenRouter on the free tier; OpenAI, Claude, and Perplexity unlock when subscribed. Enable models on demand in the All Models tab.",
  },
  {
    icon: Target,
    title: "Branded vs Organic Visibility",
    description:
      "Separate score tracking for when buyers search for your brand explicitly vs when they search generically for solutions. Discover where competitors win.",
  },
  {
    icon: Trophy,
    title: "Competitor Leaderboard",
    description:
      "Rank, visibility percentage, sentiment tone, and average position for every competing brand mentioned across AI answers.",
  },
  {
    icon: Globe,
    title: "Top Cited Sources & Domains",
    description:
      "Inspect the exact web domains cited by LLMs (corporate, editorial, UGC). Find out which publications and sites drive AI recommendations.",
  },
  {
    icon: Lightbulb,
    title: "Evidence-Based Recommendations",
    description:
      "Prioritized fixes (missing comparison landing pages, FAQ schema, positioning gaps) backed by empirical scan evidence, not vague advice.",
  },
  {
    icon: Layers,
    title: "Prompt Review Workspace",
    description:
      "Review curated buyer questions and AI-generated prompt suggestions with opportunity scores before scanning. Archive what's off-target.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-border text-muted-foreground uppercase tracking-wider"
          >
            Core Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Built for modern AI search engines
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Everything you need to analyze, monitor, and optimize your brand across AI providers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-border/80 bg-card/40 p-6 space-y-3 transition-all hover:border-primary/40 hover:bg-card/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
