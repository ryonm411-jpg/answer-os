"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Scan } from "lucide-react";
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

  const isOpen = activeDialog === "run-scan";



  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await triggerScan();
      router.refresh();
      closeDialog();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start scan"
      );
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            <DialogTitle>Run a new visibility scan?</DialogTitle>
          </div>
          <DialogDescription>
            Scanning may take several minutes. You can continue using AnswerOS
            while the scan runs in the background.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Starting…" : "Start Scan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

