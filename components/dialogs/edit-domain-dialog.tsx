"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDialogs,
  normalizeDomain,
  validateDomain,
} from "@/hooks/use-dialogs";

export function EditDomainDialog() {
  const {
    activeDialog,
    formState,
    isLoading,
    closeDialog,
    setFormField,
    setFormError,
    setLoading,
  } = useDialogs();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const isOpen = activeDialog === "edit-domain";

  // Auto-focus input when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = normalizeDomain(formState.domain);
    const error = validateDomain(normalized);

    if (error) {
      setFormError(error);
      return;
    }

    // Mock submission — no API call
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
            <Pencil className="h-5 w-5 text-primary" />
            <DialogTitle>Edit Domain</DialogTitle>
          </div>
          <DialogDescription>
            Update the domain you are tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-domain-input">Domain</Label>
            <Input
              id="edit-domain-input"
              ref={inputRef}
              type="text"
              placeholder="https://company.com"
              value={formState.domain}
              onChange={(e) => setFormField("domain", e.target.value)}
              aria-invalid={!!formState.error}
              aria-describedby={
                formState.error ? "edit-domain-error" : undefined
              }
            />
            {formState.error && (
              <p
                id="edit-domain-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {formState.error}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
