"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bot, ChevronRight, Info } from "lucide-react";
import type { ScoreSummary } from "@/lib/scoring/calculator";
import type { LatestScanSummary } from "@/lib/db/dashboard";
import { FailedChecksModal } from "@/components/dashboard/failed-checks-modal";
import { Button } from "@/components/ui/button";

interface MentionsOverviewProps {
  summary: ScoreSummary | null;
  latestScan: LatestScanSummary | null;
}

export function MentionsOverview({ summary, latestScan }: MentionsOverviewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const validChecks = summary?.validResults ?? latestScan?.validChecks ?? 0;
  const totalChecks = summary?.results ?? latestScan?.totalChecks ?? 0;
  const mentions = summary?.mentions ?? 0;
  const errors = summary?.errors ?? latestScan?.errorChecks ?? 0;
  const mentionRatePercent = validChecks > 0 ? Math.round((mentions / validChecks) * 100) : 0;
  const scanId = latestScan?.id ?? "latest";

  const providers =
    latestScan?.activeProviders && latestScan.activeProviders.length > 0
      ? latestScan.activeProviders
      : [
          { name: "ChatGPT", model: "OpenAI" },
          { name: "Claude", model: "Anthropic" },
          { name: "Gemini", model: "Google" },
          { name: "Perplexity", model: "Sonar" },
        ];

  const engineCount = providers.length;

  return (
    <>
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            <span>Scan Overview &amp; Provider Metrics</span>
            <span className="text-xs font-normal text-muted-foreground">
              {engineCount} Active LLM {engineCount === 1 ? "Engine" : "Engines"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Scan Coverage</span>
              <div className="text-xl font-bold text-foreground">
                {totalChecks > 0 ? `${Math.round((validChecks / totalChecks) * 100)}%` : "0%"}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">({validChecks}/{totalChecks})</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">AI Mentions</span>
              <div className="text-xl font-bold text-foreground">{mentions}</div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Mention Rate</span>
              <div className="text-xl font-bold text-emerald-500">
                {validChecks > 0 ? `${mentionRatePercent}%` : "—"}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">({mentions}/{validChecks})</span>
              </div>
            </div>

            <div
              onClick={() => errors > 0 && setModalOpen(true)}
              className={`rounded-lg border bg-secondary/30 p-3 space-y-1 transition-all ${
                errors > 0
                  ? "border-rose-500/40 hover:border-rose-500/80 hover:bg-rose-500/5 cursor-pointer group"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Failed Checks</span>
                {errors > 0 && (
                  <span className="text-[10px] font-medium text-rose-400 group-hover:underline flex items-center">
                    Inspect <ChevronRight className="h-3 w-3 ml-0.5" />
                  </span>
                )}
              </div>
              <div className={`text-xl font-bold ${errors > 0 ? "text-rose-500" : "text-foreground"}`}>
                {errors}
              </div>
            </div>
          </div>

          {/* Failed Check Warning Alert */}
          {errors > 0 && (
            <div className="flex items-start justify-between gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200" role="alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">
                    {errors} {errors === 1 ? "check" : "checks"} encountered errors
                  </span>
                  <p className="mt-0.5 text-amber-200/90 leading-normal">
                    Failed checks were excluded from denominator math and score factors rather than treated as non-mentions.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setModalOpen(true)}
                className="shrink-0 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs h-7 gap-1"
              >
                <Info className="h-3 w-3" />
                View Errors
              </Button>
            </div>
          )}

          {/* Provider List */}
          <div className="pt-1 border-t border-border/60">
            <span className="text-xs font-medium text-muted-foreground mb-2 block">Monitored Providers:</span>
            <div className="flex flex-wrap items-center gap-2">
              {providers.map((p) => (
                <div
                  key={p.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground"
                >
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  <span>{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">({p.model})</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <FailedChecksModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        scanId={scanId}
      />
    </>
  );
}
