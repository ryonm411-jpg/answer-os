"use client";

import { HelpCircle, Calendar, Cpu, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROVIDER_CATALOG } from "@/lib/providers/catalog";

export interface OverviewFilterValues {
  days: number;
  provider: string;
}

interface OverviewFilterBarProps {
  companyName: string;
  selectedDays: number;
  selectedProvider: string;
  onChange: (filters: OverviewFilterValues) => void;
}

const DATE_RANGE_OPTIONS = [
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

export function OverviewFilterBar({
  companyName,
  selectedDays,
  selectedProvider,
  onChange,
}: OverviewFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-3 backdrop-blur-sm">
      {/* Left: Brand Pill & Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Brand Pill */}
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-secondary/80 border border-border text-foreground"
        >
          <Tag className="h-3.5 w-3.5 text-primary" />
          <span>{companyName}</span>
        </Badge>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1 text-xs text-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={selectedDays}
            onChange={(e) =>
              onChange({
                days: parseInt(e.target.value, 10),
                provider: selectedProvider,
              })
            }
            className="bg-transparent border-none text-xs font-medium text-foreground focus:outline-none cursor-pointer pr-1"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Model Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1 text-xs text-foreground">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={selectedProvider}
            onChange={(e) =>
              onChange({
                days: selectedDays,
                provider: e.target.value,
              })
            }
            className="bg-transparent border-none text-xs font-medium text-foreground focus:outline-none cursor-pointer pr-1"
          >
            <option value="all" className="bg-card text-foreground">
              All Models
            </option>
            {PROVIDER_CATALOG.map((p) => (
              <option key={p.name} value={p.name} className="bg-card text-foreground">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Help Icon Tooltip */}
      <Tooltip>
        <TooltipTrigger
          aria-label="Visibility metric information"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <HelpCircle className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs text-xs space-y-1">
          <p className="font-semibold text-foreground">Overview Filters & Visibility</p>
          <p className="text-muted-foreground leading-normal">
            Visibility represents the percentage of valid AI responses mentioning your brand vs competitors across historical scans within the selected date range and model set.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
