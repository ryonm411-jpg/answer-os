"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Search, ExternalLink } from "lucide-react";
import type { DomainCitationRow } from "@/lib/db/sources";
import Image from "next/image";

interface SourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: DomainCitationRow[];
}

const BADGE_STYLES: Record<string, string> = {
  you: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  competitor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  corporate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  editorial: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ugc: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  other: "bg-secondary/60 text-muted-foreground border-border",
};

export function SourcesModal({
  open,
  onOpenChange,
  domains,
}: SourcesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filteredDomains = domains.filter((d) => {
    const matchesSearch = d.domain
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());
    const matchesFilter =
      selectedFilter === "ALL" || d.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0 border-border bg-card overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-secondary/20">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary border border-primary/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                All Discovered Sources &amp; Citations
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Complete list of web domains cited by AI models across active prompts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-background/50"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={selectedFilter === "ALL" ? "default" : "outline"}
              size="xs"
              onClick={() => setSelectedFilter("ALL")}
              className="text-xs h-7"
            >
              All ({domains.length})
            </Button>
            {["YOU", "COMPETITOR", "UGC", "EDITORIAL", "CORPORATE", "OTHER"].map(
              (type) => {
                const count = domains.filter((d) => d.type === type).length;
                if (count === 0) return null;
                return (
                  <Button
                    key={type}
                    variant={selectedFilter === type ? "default" : "outline"}
                    size="xs"
                    onClick={() => setSelectedFilter(type)}
                    className="text-xs h-7"
                  >
                    {type} ({count})
                  </Button>
                );
              }
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {filteredDomains.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matching domains found.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-medium uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-12">#</th>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3 text-right">Used (%)</th>
                    <th className="py-2.5 px-3 text-right">Avg. Citations</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredDomains.map((row) => (
                    <tr
                      key={row.domain}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                        {row.rank}
                      </td>
                      <td className="py-2.5 px-3">
                        <a
                          href={`https://${row.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors group"
                        >
                          <Image
                            src={row.faviconUrl}
                            alt=""
                            width={16}
                            height={16}
                            className="rounded shrink-0"
                            unoptimized
                          />
                          <span>{row.domain}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                        {row.usedPercentage}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-foreground font-mono">
                        {row.avgCitations.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 border font-semibold ${
                            BADGE_STYLES[row.typeBadgeVariant] || BADGE_STYLES.other
                          }`}
                        >
                          {row.typeLabel}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
