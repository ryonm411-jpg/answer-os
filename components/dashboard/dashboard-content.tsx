"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Scan, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/hooks/use-dialogs";

import { DashboardHeader } from "./dashboard-header";
import { VisibilityScoreCard } from "./visibility-score-card";
import { ScoreFactorBreakdown } from "./score-factor-breakdown";
import { MentionsOverview } from "./mentions-overview";
import { OverviewFilterBar, type OverviewFilterValues } from "./overview-filter-bar";
import { VisibilityTrendCard } from "./visibility-trend-card";
import { CompetitorLeaderboard } from "./competitor-leaderboard";
import { TopSourcesCard } from "./top-sources-card";
import { SourcesDomainTable } from "./sources-domain-table";
import { PromptPerformance } from "./prompt-performance";
import { RecommendationsList } from "./recommendations-list";
import { getDashboardTrend, getDashboardSources } from "@/lib/api/dashboard";

import type { DashboardData, MultiBrandTrendPoint } from "@/lib/db/dashboard";
import type { SourcesSummaryData } from "@/lib/db/sources";

export interface DashboardContentProps {
  company: {
    id: string;
    name: string;
    domain: string;
  } | null;
  data?: DashboardData | null;
}

export function DashboardContent({ company, data }: DashboardContentProps) {
  const router = useRouter();
  const { openDialog } = useDialogs();

  // Filter state for Overview
  const [filters, setFilters] = useState<OverviewFilterValues>({
    days: 14,
    provider: "all",
  });
  const [fetchedTrend, setFetchedTrend] = useState<MultiBrandTrendPoint[] | null>(null);
  const [sourcesData, setSourcesData] = useState<SourcesSummaryData | null>(null);

  // Refetch trend & sources when filters change
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getDashboardTrend(filters.days, filters.provider),
      getDashboardSources(filters.days, filters.provider, data?.latestCompletedScanId),
    ])
      .then(([trend, sources]) => {
        if (isMounted) {
          setFetchedTrend(trend);
          setSourcesData(sources);
        }
      })
      .catch((err) => {
        console.error("[DashboardContent] Failed to fetch trend/sources:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [filters, data?.latestCompletedScanId]);

  const activeTrend = fetchedTrend ?? data?.multiBrandTrend ?? [];

  // Combine company info from prop or data
  const currentCompany = data?.company || company;

  const latestScan = data?.latestScan || null;
  const isScanRunning = latestScan?.status === "PENDING" || latestScan?.status === "RUNNING";

  // Auto-refresh server component data every 4 seconds while a scan is running
  useEffect(() => {
    if (!isScanRunning) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 4000);

    return () => clearInterval(interval);
  }, [isScanRunning, router]);

  // --- State 1: No Company ---
  if (!currentCompany) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center min-h-[65vh] bg-card/40 backdrop-blur-sm space-y-4">
        <div className="rounded-full bg-primary/10 p-4 text-primary">
          <Layers className="h-8 w-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome to AnswerOS
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and optimize your brand visibility across ChatGPT, Claude, Gemini, and Perplexity. Enter your company domain to get started.
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={() => openDialog("add-domain")} size="lg" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Company Domain
          </Button>
        </div>
      </div>
    );
  }

  const hasCompletedScan = !!data?.latestCompletedScanId;
  const isAllErrored =
    latestScan?.status === "COMPLETED" &&
    latestScan.validChecks === 0 &&
    latestScan.totalChecks > 0;

  // Handlers for dialog actions
  const handleRunScan = () => openDialog("run-scan");
  const handleEditDomain = () => openDialog("edit-domain", { domain: currentCompany.domain });
  const handleRemoveDomain = () => openDialog("remove-domain", { domain: currentCompany.domain });

  // --- State 2: Company Exists, No Completed Scan ---
  if (!hasCompletedScan && !isScanRunning && !isAllErrored) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          company={currentCompany}
          completedAt={null}
          onRunScan={handleRunScan}
          onEditDomain={handleEditDomain}
          onRemoveDomain={handleRemoveDomain}
        />

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center min-h-[50vh] bg-card/40 space-y-4">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <Scan className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Run your first AI visibility scan
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AnswerOS will test prompts across OpenAI ChatGPT, Anthropic Claude, Google Gemini, and Perplexity to measure your visibility score and competitor presence.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleRunScan} className="gap-2 shadow-sm">
              <Scan className="h-4 w-4" />
              Run Scan Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- State 3: All Checks Errored ---
  if (isAllErrored && !hasCompletedScan) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          company={currentCompany}
          completedAt={null}
          onRunScan={handleRunScan}
          onEditDomain={handleEditDomain}
          onRemoveDomain={handleRemoveDomain}
        />

        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 p-10 text-center space-y-4">
          <div className="rounded-full bg-rose-500/20 p-4 text-rose-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-bold tracking-tight text-rose-200">
              Scan Failed to Produce Results
            </h2>
            <p className="text-xs text-rose-300/90 leading-relaxed">
              The latest scan completed but all {latestScan?.totalChecks || 0} checks encountered rate limits or provider errors. Score calculations remain unavailable.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleRunScan} variant="destructive" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Scan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- State 4 & 5: Completed Scan with usable data (plus optional running banner) ---
  return (
    <div className="space-y-6">
      <DashboardHeader
        company={currentCompany}
        completedAt={latestScan?.completedAt || null}
        onRunScan={handleRunScan}
        onEditDomain={handleEditDomain}
        onRemoveDomain={handleRemoveDomain}
      />

      {/* Filter Bar (Brand, Date Range, AI Model) */}
      <OverviewFilterBar
        companyName={currentCompany.name}
        selectedDays={filters.days}
        selectedProvider={filters.provider}
        onChange={setFilters}
      />

      {/* In-Progress Scan Banner */}
      {isScanRunning && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-xs text-primary-foreground" role="status">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="h-4 w-4 animate-spin text-primary shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Scan in progress...</span>
              <span className="text-muted-foreground ml-1">
                Testing prompts across AI providers in the background. Refresh anytime to see updated progress.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Top Grid: Score Card & Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisibilityScoreCard
          score={data?.score || null}
          completedAt={latestScan?.completedAt || null}
        />
        <ScoreFactorBreakdown factors={data?.score?.factors || null} />
      </div>

      {/* Overview Metrics Row */}
      <MentionsOverview
        summary={data?.score?.summary || null}
        latestScan={latestScan}
      />

      {/* Multi-Brand Visibility Trend & Competitor Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisibilityTrendCard
          trend={activeTrend}
          onRunScan={handleRunScan}
        />
        <CompetitorLeaderboard
          competitors={data?.competitorLeaderboard || []}
          hasScanData={hasCompletedScan}
        />
      </div>

      {/* Top Sources & Domain Citations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSourcesCard
          totalSourcesCount={sourcesData?.totalSourcesCount ?? 0}
          breakdown={sourcesData?.breakdown ?? []}
        />
        <SourcesDomainTable
          domains={sourcesData?.topDomains ?? []}
        />
      </div>

      {/* Prompts & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PromptPerformance
          topPrompts={data?.promptPerformance?.topPrompts || []}
          missingOpportunities={data?.promptPerformance?.missingOpportunities || []}
        />
        <RecommendationsList
          recommendations={data?.recommendations || []}
        />
      </div>
    </div>
  );
}
