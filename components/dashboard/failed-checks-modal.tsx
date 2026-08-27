"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bot, RefreshCw, Terminal, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FailedCheckItem {
  id: string;
  provider: string;
  promptText: string;
  promptCategory: string;
  error: string;
  rawResponseSnippet: string | null;
  createdAt: string;
}

interface FailedChecksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanId: string | null;
}

export function FailedChecksModal({
  open,
  onOpenChange,
  scanId,
}: FailedChecksModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FailedCheckItem[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !scanId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/scans/${scanId}/errors`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.data?.errors) {
          setErrors(json.data.errors);
        }
      })
      .catch((err) => console.error("Failed to load check errors:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, scanId]);

  const providersList = Array.from(new Set(errors.map((e) => e.provider)));

  const filteredErrors =
    selectedProvider === "ALL"
      ? errors
      : errors.filter((e) => e.provider === selectedProvider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0 border-border bg-card overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-secondary/20">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500 border border-rose-500/20">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Failed Checks Inspection Log
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Exact prompt × provider errors encountered during scan execution
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Filter Provider:
            </span>
            <Button
              variant={selectedProvider === "ALL" ? "default" : "outline"}
              size="xs"
              onClick={() => setSelectedProvider("ALL")}
              className="text-xs h-7"
            >
              All ({errors.length})
            </Button>
            {providersList.map((p) => {
              const count = errors.filter((e) => e.provider === p).length;
              return (
                <Button
                  key={p}
                  variant={selectedProvider === p ? "default" : "outline"}
                  size="xs"
                  onClick={() => setSelectedProvider(p)}
                  className="text-xs h-7 gap-1"
                >
                  <Bot className="h-3 w-3" />
                  <span>{p}</span>
                  <span className="opacity-70">({count})</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Loading scan error details...</span>
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-80" />
              <p className="font-medium text-foreground">No failed checks found for this view!</p>
              <p className="text-xs">All provider prompt checks executed cleanly without errors.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredErrors.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/80 bg-secondary/20 p-3.5 space-y-2 text-xs transition-colors hover:border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="destructive"
                          className="font-mono text-[10px] px-2 py-0.5 gap-1 bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        >
                          <Bot className="h-3 w-3" />
                          {item.provider}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground font-normal"
                        >
                          {item.promptCategory}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div>
                      <span className="font-semibold text-foreground block mb-0.5">
                        Prompt: &quot;{item.promptText}&quot;
                      </span>
                    </div>

                    <div className="rounded bg-rose-950/30 border border-rose-500/20 p-2.5 font-mono text-[11px] text-rose-300 break-words leading-relaxed">
                      <div className="font-semibold text-rose-400 mb-0.5 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Error Details:</span>
                      </div>
                      <p>{item.error}</p>
                    </div>

                    {item.rawResponseSnippet && (
                      <div className="pt-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-[11px] text-muted-foreground hover:text-foreground h-6 px-1.5 gap-1"
                        >
                          <Terminal className="h-3 w-3" />
                          {isExpanded ? "Hide Raw Response" : "View Raw Response Snippet"}
                        </Button>
                        {isExpanded && (
                          <pre className="mt-2 p-2.5 rounded bg-black/60 border border-border font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-36">
                            {item.rawResponseSnippet}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
