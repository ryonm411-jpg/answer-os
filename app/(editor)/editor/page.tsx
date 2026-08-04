"use client";

import { Plus, Pencil, Trash2, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/hooks/use-dialogs";

export default function EditorPage() {
  const { openDialog } = useDialogs();

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center min-h-[60vh] bg-card/40">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        AnswerOS Dashboard
      </h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        Track and optimize your business visibility across ChatGPT, Claude,
        Gemini, and Perplexity.
      </p>

      {/* Dialog Trigger Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => openDialog("add-domain")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Domain
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            openDialog("edit-domain", { domain: "shopify.com" })
          }
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Domain
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            openDialog("remove-domain", { domain: "shopify.com" })
          }
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Remove Domain
        </Button>

        <Button
          variant="outline"
          onClick={() => openDialog("run-scan")}
          className="gap-2"
        >
          <Scan className="h-4 w-4" />
          Run Scan
        </Button>
      </div>
    </div>
  );
}
