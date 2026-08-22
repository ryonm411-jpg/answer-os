"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Scan, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/hooks/use-dialogs";
import { triggerScan } from "@/lib/api/scans";

export function RunScanDialog() {
  const { activeDialog, isLoading, closeDialog, setLoading } = useDialogs();
  const router = useRouter();
  const [error, setError] = React.useState("");
  const [promptCount, setPromptCount] = React.useState<number | null>(null);
  const [isFetchingCount, setIsFetchingCount] = React.useState(false);

  const isOpen = activeDialog === "run-scan";
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setError("");
      setIsFetchingCount(true);
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      fetch("/api/prompts")
        .then((res) => res.json())
        .then((json) => {
          if (isMounted && json.data?.prompts) {
            setPromptCount(json.data.prompts.length);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsFetchingCount(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await triggerScan();
      router.refresh();
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scan");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError("");
      closeDialog();
    }
  };

  const isBlocked = promptCount === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            <DialogTitle>Run a new visibility scan?</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            Scanning queries AI models (ChatGPT, Claude, Gemini, Perplexity)
            across your active prompt set.
          </DialogDescription>

          <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-md border border-border mt-3">
            <span className="text-foreground font-medium">
              {isFetchingCount
                ? "Loading active prompts..."
                : promptCount !== null
                ? `${promptCount} active prompts will be tested`
                : "Active prompt count ready"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-primary hover:underline p-0 gap-1"
              onClick={() => {
                closeDialog();
                router.push("/prompts");
              }}
            >
              Review Prompts <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </DialogHeader>

        {isBlocked && (
          <p className="text-xs text-destructive font-medium" role="alert">
            Run Scan disabled — please add or activate at least one prompt before scanning.
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || isFetchingCount || isBlocked}
          >
            {isLoading
              ? "Starting…"
              : promptCount !== null
              ? `Run Scan — ${promptCount} Prompts`
              : "Start Scan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
