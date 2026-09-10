"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Bot, 
  TrendingUp, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  FileText
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type ShowcaseTab = "score" | "evidence" | "competitors" | "recommendations";

export function ScanPreviewShowcase() {
  const [activeTab, setActiveTab] = React.useState<ShowcaseTab>("evidence");

  const handleTabChange = (tab: ShowcaseTab) => {
    setActiveTab(tab);
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: `showcase_tab_${tab}` });
  };

  return (
    <section id="demo" className="py-20 md:py-28 border-b border-border/60 bg-gradient-to-b from-background via-secondary/5 to-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Product Tour</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            See exactly what AnswerOS reveals.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            No vague scores or black-box guesses. Inspect real AI engine responses, exact rank positions, cited URLs, and competitive gaps.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-card/80 border border-border/80 backdrop-blur-md gap-1 shadow-md">
            <button
              onClick={() => handleTabChange("evidence")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "evidence"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              <Bot className="h-4 w-4" />
              <span>AI Answer Evidence</span>
            </button>

            <button
              onClick={() => handleTabChange("score")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "score"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Visibility Score Breakdown</span>
            </button>

            <button
              onClick={() => handleTabChange("competitors")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "competitors"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              <Layers className="h-4 w-4" />
              <span>Competitor Leaderboard</span>
            </button>

            <button
              onClick={() => handleTabChange("recommendations")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "recommendations"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              <FileText className="h-4 w-4" />
              <span>Actionable Fixes</span>
            </button>
          </div>
        </div>

        {/* Interactive Showcase Screen */}
        <div className="bg-card/90 border border-border/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm transition-all">
          {/* Top Window Bar */}
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground hidden sm:inline">
                app.getansweros.com/editor • live scan output
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified Scan
              </span>
            </div>
          </div>

          {/* TAB 1: AI EVIDENCE */}
          {activeTab === "evidence" && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="bg-background/80 border border-border/80 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-secondary text-xs font-semibold text-primary uppercase tracking-wider">
                    Buyer Prompt • Commercial Intent (80% Organic)
                  </span>
                  <span className="text-xs text-muted-foreground">Tested across 7 AI Engines</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  &ldquo;What are the best issue tracking and sprint planning tools for fast-moving engineering teams?&rdquo;
                </h3>
              </div>

              {/* Multi-Engine Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Engine 1: Groq / LLaMA */}
                <div className="bg-background/90 border border-emerald-500/30 rounded-xl p-5 space-y-3 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">Groq (Llama 3.3 70B)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold">
                        Rank #1 • Mentioned
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">1.2s response</span>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic border-l-2 border-emerald-500/50 pl-3">
                    &ldquo;For modern software teams looking for speed, keyboard-first navigation, and tight Git workflows, <strong className="text-foreground underline decoration-emerald-400">Linear</strong> is currently the top recommendation. It is built for speed compared to heavier tools like Jira.&rdquo;
                  </p>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-medium">Positive Sentiment (0.92)</span>
                    <span className="text-muted-foreground text-[11px]">Cited: linear.app, reddit.com/r/reactjs</span>
                  </div>
                </div>

                {/* Engine 2: Google Gemini */}
                <div className="bg-background/90 border border-border/80 rounded-xl p-5 space-y-3 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">Google Gemini Pro</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-primary/15 text-primary font-semibold">
                        Rank #2 • Mentioned
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">2.1s response</span>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/50 pl-3">
                    &ldquo;Leading solutions include Jira for enterprise governance, <strong className="text-foreground underline decoration-primary">Linear</strong> for streamlined issue tracking, and GitHub Projects for developer-centric workflows.&rdquo;
                  </p>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-primary font-medium">Neutral / Positive (0.78)</span>
                    <span className="text-muted-foreground text-[11px]">Cited: g2.com, producthunt.com</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCORE BREAKDOWN */}
          {activeTab === "score" && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="bg-background/90 border border-primary/30 rounded-2xl p-6 text-center space-y-3 shadow-lg">
                  <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">Overall Visibility Score</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-6xl font-black text-foreground">72</span>
                    <span className="text-lg text-muted-foreground">/ 95 max</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +8.4% this month
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
                    Calculated server-side from 300+ prompt checks
                  </p>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">5-Factor Algorithm Breakdown</h4>
                  
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Mention Rate (30% weight)</span>
                        <span className="font-semibold text-foreground">78% of answers</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: "78%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Average Position Rank (25% weight)</span>
                        <span className="font-semibold text-foreground">Rank #1.8</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: "82%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Sentiment Score (20% weight)</span>
                        <span className="font-semibold text-foreground">84 / 100</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: "84%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Competitor Presence Share (15% weight)</span>
                        <span className="font-semibold text-foreground">62% share of voice</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: "62%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPETITORS */}
          {activeTab === "competitors" && (
            <div className="p-6 sm:p-8 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-sm font-semibold text-foreground">Competitor Share of AI Recommendations</span>
                <span className="text-xs text-muted-foreground">Ranked across 100+ buyer queries</span>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Your Brand (e.g. Linear)", share: "68% AI Share", rank: "#1", mentions: "82 mentions", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
                  { name: "Jira Software", share: "54% AI Share", rank: "#2", mentions: "65 mentions", color: "text-foreground bg-secondary/40 border-border/60" },
                  { name: "Asana", share: "41% AI Share", rank: "#3", mentions: "49 mentions", color: "text-foreground bg-secondary/40 border-border/60" },
                  { name: "ClickUp", share: "33% AI Share", rank: "#4", mentions: "40 mentions", color: "text-foreground bg-secondary/40 border-border/60" },
                ].map((comp, idx) => (
                  <div key={idx} className={cn("flex items-center justify-between p-3.5 rounded-xl border", comp.color)}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{comp.rank}</span>
                      <span className="font-semibold text-sm">{comp.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">{comp.mentions}</span>
                      <span className="font-bold">{comp.share}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RECOMMENDATIONS */}
          {activeTab === "recommendations" && (
            <div className="p-6 sm:p-8 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-sm font-semibold text-foreground">Prioritized Evidence-Based Recommendations</span>
                <span className="text-xs text-muted-foreground">Auto-generated from scan gaps</span>
              </div>

              <div className="space-y-3">
                <div className="bg-background/90 border border-primary/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-semibold">
                      High Priority • Missing Comparison Page
                    </span>
                    <span className="text-xs font-mono text-emerald-400">+3.5 Rank Lift</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Create &ldquo;Your Brand vs Jira&rdquo; Comparison Landing Page</h4>
                  <p className="text-xs text-muted-foreground">
                    Evidence: AI models cited 3rd-party comparison blogs 14 times when answering comparison queries where your domain was unranked.
                  </p>
                </div>

                <div className="bg-background/90 border border-border/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-xs font-semibold">
                      Medium Priority • Structured FAQ Schema
                    </span>
                    <span className="text-xs font-mono text-cyan-400">+1.8 Rank Lift</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Add JSON-LD FAQ Schema to Product Pricing Page</h4>
                  <p className="text-xs text-muted-foreground">
                    Evidence: Perplexity and Gemini crawled pricing questions directly from competitor pricing FAQs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Bar Callout */}
          <div className="px-6 py-4 bg-secondary/30 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground text-center sm:text-left">
              Want to see this exact live report for your own company domain?
            </span>
            <Link
              href="/sign-up"
              onClick={() => trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: "showcase_bottom_cta" })}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              )}
            >
              <span>Start Free Scan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
