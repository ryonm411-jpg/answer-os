"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Globe,
  Layers,
  RefreshCw,
  Search,
  Terminal,
  XCircle,
  Zap,
} from "lucide-react";

export interface ScanDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanId: string | null;
}

interface ScanMeta {
  id: string;
  status: "COMPLETED" | "RUNNING" | "FAILED" | "PENDING";
  createdAt: string;
  startedAt: string;
  completedAt: string | null;
  company: {
    id: string;
    name: string;
    domain: string;
  };
  totalChecks: number;
  validChecks: number;
  failedChecks: number;
  mentionsCount: number;
  mentionRate: number;
  coverageRate: number;
  promptsCount: number;
  organicPromptsCount: number;
  brandedPromptsCount: number;
  providerModels: Array<{
    provider: string;
    model: string | null;
    totalChecks: number;
    validChecks: number;
    failedChecks: number;
    mentionsCount: number;
    mentionRate: number;
  }>;
}

interface CheckDetail {
  id: string;
  provider: string;
  model: string | null;
  mentioned: boolean;
  position: number | null;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  reasoning: string | null;
  rawResponseSnippet: string | null;
  competitorsMentioned: unknown;
  error: string | null;
  citations: Array<{
    id: string;
    domain: string;
    url: string | null;
    title: string | null;
    citationType: string;
  }>;
}

interface PromptGroup {
  promptId: string;
  text: string;
  category: string;
  intent: string;
  promptType: "UNBRANDED" | "BRANDED";
  demandScore: number | null;
  businessRelevance: number | null;
  checks: CheckDetail[];
}

export function ScanDetailsModal({
  open,
  onOpenChange,
  scanId,
}: ScanDetailsModalProps) {
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [scan, setScan] = React.useState<ScanMeta | null>(null);
  const [prompts, setPrompts] = React.useState<PromptGroup[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState<string>("ALL");
  const [selectedPromptType, setSelectedPromptType] =
    React.useState<string>("ALL");
  const [selectedOutcome, setSelectedOutcome] = React.useState<string>("ALL");
  const [expandedPromptId, setExpandedPromptId] = React.useState<string | null>(
    null
  );
  const [expandedCheckId, setExpandedCheckId] = React.useState<string | null>(
    null
  );
  const [copiedId, setCopiedId] = React.useState(false);

  React.useEffect(() => {
    if (!open || !scanId) return;

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setErrorMsg(null);
      }
    });

    fetch(`/api/scans/${scanId}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error?.message || "Failed to load scan details");
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.data) {
          setScan(json.data.scan);
          setPrompts(json.data.prompts || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : "Error loading scan");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, scanId]);

  const handleCopyId = () => {
    if (!scan?.id) return;
    navigator.clipboard.writeText(scan.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const providersList = React.useMemo(() => {
    if (!scan) return [];
    return Array.from(new Set(scan.providerModels.map((p) => p.provider)));
  }, [scan]);

  // Filter prompts based on search and selected filters
  const filteredPrompts = React.useMemo(() => {
    return prompts.filter((p) => {
      // 1. Text Search
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        p.text.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.checks.some((c) => {
          if (Array.isArray(c.competitorsMentioned)) {
            return c.competitorsMentioned.some((comp) =>
              String(comp).toLowerCase().includes(search)
            );
          }
          return false;
        });

      if (!matchesSearch) return false;

      // 2. Prompt Type Filter
      if (selectedPromptType !== "ALL" && p.promptType !== selectedPromptType) {
        return false;
      }

      // 3. Provider Filter
      if (
        selectedProvider !== "ALL" &&
        !p.checks.some((c) => c.provider === selectedProvider)
      ) {
        return false;
      }

      // 4. Outcome Filter
      if (selectedOutcome === "MENTIONS") {
        return p.checks.some((c) => c.mentioned);
      }
      if (selectedOutcome === "NOT_MENTIONED") {
        return p.checks.some((c) => !c.mentioned && !c.error);
      }
      if (selectedOutcome === "ERRORS") {
        return p.checks.some((c) => c.error !== null);
      }

      return true;
    });
  }, [prompts, searchQuery, selectedPromptType, selectedProvider, selectedOutcome]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 border-border bg-card overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-secondary/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary border border-primary/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Scan Execution Inspection
                  </DialogTitle>
                  {scan && <ScanStatusBadge status={scan.status} />}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>
                    Company:{" "}
                    <strong className="text-foreground">
                      {scan?.company?.domain || "—"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Started:{" "}
                    {scan
                      ? new Date(scan.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {scan && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border font-mono text-[11px] text-muted-foreground">
                  <span>ID: {scan.id.slice(0, 10)}...</span>
                  <button
                    onClick={handleCopyId}
                    className="hover:text-foreground p-0.5 rounded transition-colors"
                    title="Copy full Scan ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                {copiedId && (
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Copied!
                  </span>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-24 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Loading full scan telemetry &amp; prompts...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-sm text-destructive space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto" />
            <p className="font-semibold">{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : !scan ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No scan data found.
          </div>
        ) : (
          <>
            {/* Top Telemetry Summary Cards */}
            <div className="p-5 border-b border-border/60 bg-muted/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-card/60 border border-border/80">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Prompt Coverage
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {scan.coverageRate}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {scan.validChecks} of {scan.totalChecks} checks valid
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card/60 border border-border/80">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  AI Mentions
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {scan.mentionsCount}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({scan.mentionRate}%)
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Across all active checks
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card/60 border border-border/80">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Prompts Tested
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {scan.promptsCount}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span className="text-cyan-400 font-medium">
                    {scan.organicPromptsCount} Organic (80%)
                  </span>
                  <span>•</span>
                  <span className="text-indigo-400 font-medium">
                    {scan.brandedPromptsCount} Branded (20%)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card/60 border border-border/80">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Engine Telemetry
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5 flex items-center gap-1">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>{scan.providerModels.length} Models</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {scan.providerModels.map((p) => p.provider).join(", ")}
                </div>
              </div>
            </div>

            {/* Model Breakdown Pills */}
            <div className="px-5 py-2.5 border-b border-border/60 bg-muted/20 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-muted-foreground font-medium shrink-0">
                Models Run:
              </span>
              {scan.providerModels.map((pm) => (
                <div
                  key={`${pm.provider}-${pm.model}`}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/40 border border-border shrink-0 font-mono text-[11px]"
                >
                  <Bot className="h-3 w-3 text-primary" />
                  <span className="font-medium text-foreground">
                    {pm.provider}
                  </span>
                  {pm.model && (
                    <span className="text-[10px] text-muted-foreground opacity-80">
                      ({pm.model})
                    </span>
                  )}
                  <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-0.5">
                    {pm.mentionsCount} mentions ({pm.mentionRate}%)
                  </span>
                  {pm.failedChecks > 0 && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {pm.failedChecks} err
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Filters & Search Toolbar */}
            <div className="p-4 border-b border-border/60 bg-muted/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search prompts, categories, competitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background/80"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Prompt Type Filter */}
                <select
                  value={selectedPromptType}
                  onChange={(e) => setSelectedPromptType(e.target.value)}
                  className="h-8 text-xs bg-background border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Types</option>
                  <option value="UNBRANDED">Organic (Unbranded)</option>
                  <option value="BRANDED">Branded &amp; Comparison</option>
                </select>

                {/* Provider Filter */}
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="h-8 text-xs bg-background border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Engines</option>
                  {providersList.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {/* Outcome Filter */}
                <select
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  className="h-8 text-xs bg-background border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="MENTIONS">Mentions Only</option>
                  <option value="NOT_MENTIONED">Not Mentioned</option>
                  <option value="ERRORS">Errors Only</option>
                </select>
              </div>
            </div>

            {/* Prompts and Checks Detail List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {filteredPrompts.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
                  <Search className="h-8 w-8 mx-auto opacity-50" />
                  <p className="font-medium text-foreground">
                    No matching prompt checks found
                  </p>
                  <p className="text-xs">
                    Try adjusting your search terms or filter selections.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPrompts.map((promptGroup) => {
                    const isExpanded = expandedPromptId === promptGroup.promptId;

                    return (
                      <div
                        key={promptGroup.promptId}
                        className="rounded-lg border border-border/80 bg-secondary/15 overflow-hidden transition-all hover:border-border"
                      >
                        {/* Prompt Header Card */}
                        <div
                          onClick={() =>
                            setExpandedPromptId(
                              isExpanded ? null : promptGroup.promptId
                            )
                          }
                          className="p-3.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Organic vs Branded Badge */}
                              {promptGroup.promptType === "UNBRANDED" ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30 px-2 py-0.5"
                                >
                                  Organic
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/30 px-2 py-0.5"
                                >
                                  Branded
                                </Badge>
                              )}

                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                              >
                                {promptGroup.category}
                              </Badge>

                              {promptGroup.intent && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-normal"
                                >
                                  {promptGroup.intent}
                                </Badge>
                              )}
                            </div>

                            <p className="font-semibold text-foreground text-sm tracking-tight">
                              &ldquo;{promptGroup.text}&rdquo;
                            </p>
                          </div>

                          {/* Engine Checks Summary Badges */}
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {promptGroup.checks.map((check) => (
                              <div
                                key={check.id}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border ${
                                  check.error
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                    : check.mentioned
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                                    : "bg-muted/40 text-muted-foreground border-border"
                                }`}
                              >
                                <Bot className="h-3 w-3" />
                                <span>{check.provider}</span>
                                {check.error ? (
                                  <span className="text-[10px] opacity-90">
                                    (Err)
                                  </span>
                                ) : check.mentioned ? (
                                  <span className="font-semibold text-emerald-300">
                                    #{check.position || 1}
                                  </span>
                                ) : (
                                  <span className="text-[10px] opacity-70">
                                    (No)
                                  </span>
                                )}
                              </div>
                            ))}

                            <div className="p-1 text-muted-foreground ml-1">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Model Details Accordion */}
                        {isExpanded && (
                          <div className="border-t border-border/60 bg-background/50 p-4 space-y-3 text-xs">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Per-Engine AI Answers &amp; Evidence:
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {promptGroup.checks.map((check) => {
                                const isCheckRawExpanded =
                                  expandedCheckId === check.id;

                                return (
                                  <div
                                    key={check.id}
                                    className={`rounded-lg border p-3 space-y-2 text-xs ${
                                      check.error
                                        ? "border-rose-500/30 bg-rose-950/10"
                                        : check.mentioned
                                        ? "border-emerald-500/30 bg-emerald-950/10"
                                        : "border-border bg-card/40"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <Bot className="h-3.5 w-3.5 text-primary" />
                                        <span className="font-bold text-foreground">
                                          {check.provider}
                                        </span>
                                        {check.model && (
                                          <span className="text-[10px] text-muted-foreground font-mono">
                                            ({check.model})
                                          </span>
                                        )}
                                      </div>

                                      {check.error ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          Failed Check
                                        </Badge>
                                      ) : check.mentioned ? (
                                        <Badge
                                          variant="outline"
                                          className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] px-1.5 py-0 font-semibold"
                                        >
                                          Rank #{check.position || 1} •{" "}
                                          {check.sentiment || "POSITIVE"}
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-muted-foreground text-[10px] px-1.5 py-0"
                                        >
                                          Not Mentioned
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Error Display */}
                                    {check.error ? (
                                      <div className="p-2 rounded bg-rose-950/40 border border-rose-500/20 font-mono text-[11px] text-rose-300 leading-relaxed break-words">
                                        <strong>Error:</strong> {check.error}
                                      </div>
                                    ) : (
                                      <>
                                        {/* AI Reasoning / Verdict */}
                                        {check.reasoning && (
                                          <div className="text-muted-foreground text-[11px] leading-relaxed">
                                            <strong className="text-foreground">
                                              Analysis:
                                            </strong>{" "}
                                            {check.reasoning}
                                          </div>
                                        )}

                                        {/* Competitors Discovered */}
                                        {Array.isArray(check.competitorsMentioned) &&
                                          check.competitorsMentioned.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                                              <span className="text-muted-foreground">
                                                Competitors:
                                              </span>
                                              {check.competitorsMentioned.map(
                                                (comp, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] text-foreground font-medium"
                                                  >
                                                    {String(comp)}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          )}

                                        {/* Citations Discovered */}
                                        {check.citations &&
                                          check.citations.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                                              <span className="text-muted-foreground flex items-center gap-1">
                                                <Globe className="h-3 w-3" />
                                                Citations:
                                              </span>
                                              {check.citations.map((cit) => (
                                                <span
                                                  key={cit.id}
                                                  className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono"
                                                >
                                                  {cit.domain}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                      </>
                                    )}

                                    {/* Raw AI Response Snippet Toggle */}
                                    {check.rawResponseSnippet && (
                                      <div className="pt-1">
                                        <button
                                          onClick={() =>
                                            setExpandedCheckId(
                                              isCheckRawExpanded ? null : check.id
                                            )
                                          }
                                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                        >
                                          <Terminal className="h-3 w-3" />
                                          <span>
                                            {isCheckRawExpanded
                                              ? "Hide Response Snippet"
                                              : "View Response Snippet"}
                                          </span>
                                        </button>
                                        {isCheckRawExpanded && (
                                          <pre className="mt-1.5 p-2 rounded bg-black/60 border border-border font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-32">
                                            {check.rawResponseSnippet}
                                          </pre>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScanStatusBadge({ status }: { status: ScanMeta["status"] }) {
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
