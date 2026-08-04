"use client";

import * as React from "react";
import { Globe } from "lucide-react";
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

export function AddDomainDialog() {
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
  const isOpen = activeDialog === "add-domain";

  // Auto-focus input when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Small delay to allow dialog animation to complete
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
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
            <Globe className="h-5 w-5 text-primary" />
            <DialogTitle>Add Domain</DialogTitle>
          </div>
          <DialogDescription>
            Enter a domain to track its visibility across AI search engines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-domain-input">Domain</Label>
            <Input
              id="add-domain-input"
              ref={inputRef}
              type="text"
              placeholder="https://company.com"
              value={formState.domain}
              onChange={(e) => setFormField("domain", e.target.value)}
              aria-invalid={!!formState.error}
              aria-describedby={
                formState.error ? "add-domain-error" : undefined
              }
            />
            {formState.error && (
              <p
                id="add-domain-error"
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
              {isLoading ? "Adding…" : "Add Domain"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
