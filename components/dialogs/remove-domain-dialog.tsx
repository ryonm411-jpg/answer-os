"use client";

import { useRouter } from "next/navigation";
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
import { removeCompany } from "@/lib/api/domain";

export function RemoveDomainDialog() {
  const {
    activeDialog,
    dialogData,
    formState,
    isLoading,
    closeDialog,
    setFormError,
    setLoading,
  } = useDialogs();

  const router = useRouter();

  const isOpen = activeDialog === "remove-domain";
  const domainName = dialogData.domain ?? "this domain";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await removeCompany();
      router.refresh();
      closeDialog();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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

        {formState.error && (
          <p
            className="text-sm text-destructive"
            role="alert"
          >
            {formState.error}
          </p>
        )}

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
