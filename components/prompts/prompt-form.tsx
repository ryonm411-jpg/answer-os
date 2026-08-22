"use client";

import * as React from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PromptIntent } from "@/lib/prompts/intent";
import { PROMPT_INTENTS, INTENT_LABELS } from "@/lib/prompts/intent";
import type { PromptCardData } from "./prompt-card";

export interface PromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { text: string; category: string; intent: PromptIntent }) => Promise<void>;
  editingPrompt?: PromptCardData | null;
}

export function PromptForm({
  isOpen,
  onClose,
  onSave,
  editingPrompt,
}: PromptFormProps) {
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState("Other");
  const [intent, setIntent] = React.useState<PromptIntent>("PRODUCT");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [prevPrompt, setPrevPrompt] = React.useState(editingPrompt);
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen);

  if (editingPrompt !== prevPrompt || isOpen !== prevIsOpen) {
    setPrevPrompt(editingPrompt);
    setPrevIsOpen(isOpen);
    if (editingPrompt) {
      setText(editingPrompt.text);
      setCategory(editingPrompt.category);
      setIntent(editingPrompt.intent);
    } else {
      setText("");
      setCategory("Other");
      setIntent("PRODUCT");
    }
    setError("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = text.trim();
    if (trimmed.length < 3 || trimmed.length > 500) {
      setError("Prompt text must be between 3 and 500 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        text: trimmed,
        category: category.trim() || "Other",
        intent,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingPrompt ? "Edit Custom Prompt" : "Add Custom Prompt"}
          </DialogTitle>
          <DialogDescription>
            {editingPrompt
              ? "Update the text, category, or buyer intent for this prompt."
              : "Create a new buyer question to include in future AI scans."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-destructive font-medium" role="alert">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="prompt-text">Prompt Text *</Label>
            <Input
              id="prompt-text"
              placeholder="e.g. What are the best zero-drop running shoes?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prompt-intent">Buyer Intent *</Label>
              <Select
                value={intent}
                onValueChange={(val) => setIntent(val as PromptIntent)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="prompt-intent">
                  <SelectValue placeholder="Select intent" />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_INTENTS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {INTENT_LABELS[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt-category">Category</Label>
              <Input
                id="prompt-category"
                placeholder="e.g. Footwear"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingPrompt
                ? "Update Prompt"
                : "Add Prompt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
