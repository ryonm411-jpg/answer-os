"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bot, ChevronRight, Info, RefreshCw } from "lucide-react";
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
            <span>Scan Coverage</span>
            <span className="text-xs font-normal text-muted-foreground">
              {engineCount} AI {engineCount === 1 ? "provider" : "providers"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Plain-English Summary */}
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3.5 text-sm">
            {totalChecks > 0 ? (
              <p className="text-foreground leading-relaxed">
                AI mentioned <strong className="text-primary">{mentions} time{mentions !== 1 ? "s" : ""}</strong> across{" "}
                <strong>{validChecks} of {totalChecks}</strong> completed search checks.
                {mentionRatePercent > 0 && (
                  <span className="text-muted-foreground">
                    {" "}That&apos;s a <strong className="text-foreground">{mentionRatePercent}%</strong> mention rate.
                  </span>
                )}
                {errors > 0 && (
                  <span className="text-muted-foreground">
                    {" "}{errors} check{errors !== 1 ? "s" : ""} encountered errors and were excluded.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Run a scan to see how often AI recommends your brand across customer searches.
              </p>
            )}
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Searches completed</span>
              <div className="text-xl font-bold text-foreground">
                {validChecks}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">of {totalChecks}</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Times mentioned</span>
              <div className="text-xl font-bold text-foreground">{mentions}</div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Mention rate</span>
              <div className="text-xl font-bold text-emerald-500">
                {validChecks > 0 ? `${mentionRatePercent}%` : "—"}
              </div>
            </div>

            <div
              onClick={() => errors > 0 && setModalOpen(true)}
              className={`rounded-lg border bg-secondary/30 p-3 space-y-1 transition-all ${
                errors > 0
                  ? "border-border hover:border-border/80 hover:bg-secondary/50 cursor-pointer group"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Errors</span>
                {errors > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground group-hover:underline flex items-center">
                    View <ChevronRight className="h-3 w-3 ml-0.5" />
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-foreground">
                {errors}
              </div>
            </div>
          </div>

          {/* Health alert with retry */}
          {errors > 0 && (
            <div className="flex items-start justify-between gap-2.5 rounded-lg border border-border/80 bg-secondary/20 p-3 text-xs text-muted-foreground" role="alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-muted-foreground/80 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground/90">
                    {validChecks} of {totalChecks} checks completed successfully — {errors} encountered errors
                  </span>
                  <p className="mt-0.5 text-muted-foreground/80 leading-normal">
                    Errors are excluded from your visibility score. You can retry failed checks or review what caused them.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setModalOpen(true)}
                  className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs h-7 gap-1"
                >
                  <Info className="h-3 w-3" />
                  View errors
                </Button>
              </div>
            </div>
          )}

          {/* AI Provider List */}
          <div className="pt-1 border-t border-border/60">
            <span className="text-xs font-medium text-muted-foreground mb-2 block">AI providers monitored:</span>
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
