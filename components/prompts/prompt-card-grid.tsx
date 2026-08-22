"use client";

import * as React from "react";
import { PromptCard, type PromptCardData } from "./prompt-card";

export interface PromptCardGridProps {
  prompts: PromptCardData[];
  onEdit?: (prompt: PromptCardData) => void;
  onArchive?: (promptId: string) => void;
  isLocked?: boolean;
}

export function PromptCardGrid({
  prompts,
  onEdit,
  onArchive,
  isLocked = false,
}: PromptCardGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-card/50">
        <p className="text-sm text-muted-foreground font-medium">
          No prompts found matching your criteria.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try clearing filters or click &ldquo;Generate Suggestions&rdquo; to discover prompts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onEdit={onEdit}
          onArchive={onArchive}
          isLocked={isLocked}
        />
      ))}
    </div>
  );
}
