"use client";

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

export function RunScanDialog() {
  const { activeDialog, isLoading, closeDialog, setLoading } = useDialogs();

  const isOpen = activeDialog === "run-scan";

  const handleConfirm = () => {
    // Mock scan start — no background job implementation
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      closeDialog();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
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
