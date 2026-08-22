"use client";

import { Scan, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  company: {
    id: string;
    name: string;
    domain: string;
  };
  completedAt: string | null;
  onRunScan: () => void;
  onEditDomain: () => void;
  onRemoveDomain: () => void;
}

export function DashboardHeader({
  company,
  completedAt,
  onRunScan,
  onEditDomain,
  onRemoveDomain,
}: DashboardHeaderProps) {
  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl truncate">
            {company.name}
          </h1>
          <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground border border-border shrink-0">
            {company.domain}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {formattedDate ? (
            <>
              Last scanned on{" "}
              <time dateTime={completedAt!} className="font-medium text-foreground">
                {formattedDate}
              </time>
            </>
          ) : (
            "No completed scans yet"
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <Button onClick={onRunScan} className="gap-2 shadow-sm">
          <Scan className="h-4 w-4" />
          Run Scan
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onEditDomain}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Domain
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRemoveDomain}
          className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      </div>
    </div>
  );
}
