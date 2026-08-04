"use client";

import { Trash2 } from "lucide-react";
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

export function RemoveDomainDialog() {
  const { activeDialog, dialogData, isLoading, closeDialog, setLoading } =
    useDialogs();

  const isOpen = activeDialog === "remove-domain";
  const domainName = dialogData.domain ?? "this domain";

  const handleConfirm = () => {
    // Mock removal — no API call
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
            <Trash2 className="h-5 w-5 text-destructive" />
            <DialogTitle>Remove domain?</DialogTitle>
          </div>
          <DialogDescription>
            This removes <strong>{domainName}</strong> from AnswerOS. Previous
            scan history will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Removing…" : "Remove Domain"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
