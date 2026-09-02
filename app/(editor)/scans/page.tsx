"use client";

import * as React from "react";
import {
  History,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FailedChecksModal } from "@/components/dashboard/failed-checks-modal";

interface ScanRecord {
  id: string;
  status: "COMPLETED" | "RUNNING" | "FAILED" | "PENDING";
  createdAt: string;
  startedAt: string;
  completedAt: string | null;
  totalChecks: number;
  validChecks: number;
  failedChecks: number;
  mentionsCount: number;
  mentionRate: number;
  coverageRate: number;
  providers: string[];
}

export default function ScanHistoryPage() {
  const [scans, setScans] = React.useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTriggering, setIsTriggering] = React.useState(false);
  const [triggerError, setTriggerError] = React.useState<string | null>(null);
  const [inspectScanId, setInspectScanId] = React.useState<string | null>(null);

  const fetchScans = React.useCallback(async () => {
    try {
      const res = await fetch("/api/scans");
      if (res.ok) {
        const json = await res.json();
        setScans(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch scan history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const handleTriggerScan = async () => {
    setIsTriggering(true);
    setTriggerError(null);
    try {
      const res = await fetch("/api/scans", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setTriggerError(json.error?.message || "Failed to trigger scan");
      } else {
        await fetchScans();
      }
    } catch (err) {
      setTriggerError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsTriggering(false);
    }
  };

  const completedScans = scans.filter((s) => s.status === "COMPLETED");
  const latestScan = scans[0];
  const avgMentionRate =
    completedScans.length > 0
      ? Math.round(
          completedScans.reduce((acc, s) => acc + s.mentionRate, 0) /
            completedScans.length
        )
      : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Historical log of AI search visibility scans, prompt coverage metrics, and LLM engine health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchScans}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerScan}
            disabled={isTriggering}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <Play className={`h-4 w-4 ${isTriggering ? "animate-spin" : ""}`} />
            <span>{isTriggering ? "Triggering..." : "Run New Scan"}</span>
          </Button>
        </div>
      </div>

      {triggerError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <span>{triggerError}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setTriggerError(null)}
            className="text-destructive hover:bg-destructive/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Total Scans Run
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{scans.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {completedScans.length} completed successfully
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Avg. Mention Rate
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">
              {avgMentionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Across valid prompt checks
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Latest Scan Status
            </CardDescription>
            <div className="mt-1">
              {latestScan ? (
                <StatusBadge status={latestScan.status} />
              ) : (
                <span className="text-sm text-muted-foreground">No scans yet</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {latestScan ? new Date(latestScan.createdAt).toLocaleString() : "—"}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Monitored Engines
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>3 Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Gemini, Groq LPU, NVIDIA NIM
          </CardContent>
        </Card>
      </div>

      {/* Main Scan History Table */}
      <Card className="bg-card/50 border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Scan Execution Logs</CardTitle>
          <CardDescription className="text-xs">
            Detailed view of each visibility scan batch, completion rate, and rate-limit error telemetry.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Loading scan history...</span>
            </div>
          ) : scans.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground space-y-3">
              <History className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-foreground">No scan history recorded yet</p>
              <p className="text-xs max-w-sm mx-auto">
                Trigger your first AI visibility scan to measure brand mentions across Gemini, Groq, and NVIDIA NIM.
              </p>
              <Button size="sm" onClick={handleTriggerScan} disabled={isTriggering}>
                Run First Scan
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60 overflow-x-auto">
              <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Prompt Coverage</div>
                <div className="col-span-2">Mentions</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="grid grid-cols-12 px-6 py-4 items-center text-sm hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-3">
                    <div className="font-medium text-foreground text-xs">
                      {new Date(scan.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      ID: {scan.id.slice(0, 8)}...
                    </div>
                  </div>

                  <div className="col-span-2">
                    <StatusBadge status={scan.status} />
                  </div>

                  <div className="col-span-2 text-xs">
                    <span className="font-semibold text-foreground">
                      {scan.coverageRate}%
                    </span>
                    <span className="text-muted-foreground text-[11px] ml-1">
                      ({scan.validChecks}/{scan.totalChecks} checks)
                    </span>
                  </div>

                  <div className="col-span-2 text-xs">
                    <span className="font-semibold text-emerald-400">
                      {scan.mentionsCount} mentions
                    </span>
                    <span className="text-muted-foreground text-[11px] ml-1">
                      ({scan.mentionRate}%)
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-2">
                    {scan.failedChecks > 0 ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setInspectScanId(scan.id)}
                        className="text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Inspect ({scan.failedChecks})</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-400/80 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Clean
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Checks Inspection Dialog */}
      <FailedChecksModal
        open={Boolean(inspectScanId)}
        onOpenChange={(open) => {
          if (!open) setInspectScanId(null);
        }}
        scanId={inspectScanId}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ScanRecord["status"] }) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-medium px-2 py-0.5"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      );
    case "RUNNING":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-400 text-[11px] font-medium px-2 py-0.5 animate-pulse"
        >
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Running</span>
        </Badge>
      );
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-medium px-2 py-0.5"
        >
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </Badge>
      );
    case "FAILED":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-destructive/30 bg-destructive/10 text-destructive text-[11px] font-medium px-2 py-0.5"
        >
          <XCircle className="h-3 w-3" />
          <span>Failed</span>
        </Badge>
      );
    default:
      return null;
  }
}
