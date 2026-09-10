"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Scan, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Bot, 
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StarterPromptItem } from "@/lib/db/dashboard";

interface PreScanLaunchpadProps {
  company: {
    id: string;
    name: string;
    domain: string;
  };
  starterPrompts: StarterPromptItem[];
  onRunScan: () => void;
}

export function PreScanLaunchpad({
  company,
  starterPrompts,
  onRunScan,
}: PreScanLaunchpadProps) {
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [promptsList, setPromptsList] = React.useState<StarterPromptItem[]>(starterPrompts);
  const [regenSuccess, setRegenSuccess] = React.useState(false);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setRegenSuccess(false);

    try {
      const res = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 6 }),
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data?.prompts) && json.data.prompts.length > 0) {
          setPromptsList(
            json.data.prompts.slice(0, 6).map((p: any) => ({
              id: p.id,
              text: p.text,
              category: p.category,
              intent: p.intent || "COMMERCIAL",
              promptType: p.promptType || "UNBRANDED",
            }))
          );
          setRegenSuccess(true);
          setTimeout(() => setRegenSuccess(false), 3000);
        }
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-card via-card/95 to-primary/5 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Workspace Setup Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Ready to scan <span className="text-primary">{company.domain}</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AnswerOS has mapped your initial buyer query set. Review the questions AI engines will be tested against below, then launch your first visibility scan.
            </p>
          </div>

          <Button
            size="lg"
            onClick={onRunScan}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 shrink-0"
          >
            <Scan className="h-4 w-4" />
            <span>Run Visibility Scan</span>
          </Button>
        </div>
      </div>

      {/* 2-Step Launchpad Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* STEP 1: Prompt Review Card (2 Cols) */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </span>
                <h2 className="text-base font-bold text-foreground">
                  AI Buyer Query Set ({promptsList.length} Prompts)
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Questions prospective customers ask AI when looking for solutions like yours.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
                <span>{isRegenerating ? "Generating…" : regenSuccess ? "Updated!" : "Regenerate with AI"}</span>
              </Button>

              <Link
                href="/prompts"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>View All</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Prompts List */}
          <div className="space-y-2.5">
            {promptsList.length > 0 ? (
              promptsList.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-background/80 hover:bg-background border border-border/60 rounded-xl p-3.5 space-y-1.5 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded font-semibold",
                        prompt.promptType === "BRANDED"
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      )}
                    >
                      {prompt.promptType === "BRANDED" ? "Branded (20%)" : "Organic (80%)"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                      {prompt.intent.toLowerCase()}
                    </span>
                    <span className="text-muted-foreground">• {prompt.category}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">
                    &ldquo;{prompt.text}&rdquo;
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground space-y-2">
                <HelpCircle className="h-6 w-6 mx-auto text-muted-foreground/60" />
                <p>Generating prompts tailored for your domain...</p>
                <Button size="sm" variant="outline" onClick={handleRegenerate}>
                  Generate Starter Prompts
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Launch Card (1 Col) */}
        <div className="bg-card border border-primary/30 rounded-2xl p-6 shadow-sm space-y-5 bg-gradient-to-b from-card to-primary/5">
          <div className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <h2 className="text-base font-bold text-foreground">
                Launch Visibility Scan
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tests all prompts across enabled AI models asynchronously.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
              What the scan analyzes:
            </span>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Brand Mention Rate</strong> — percentage of answers naming your product</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Rank Position</strong> — #1 vs #3 vs unranked recommendations</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Competitor Share</strong> — which rivals are cited instead of you</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Action Plan</strong> — prioritized fixes to rank higher</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-3">
            <Button
              onClick={onRunScan}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 gap-2"
            >
              <Scan className="h-4 w-4" />
              <span>Run First Scan Now</span>
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              ⚡ Free tier included • Background execution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
