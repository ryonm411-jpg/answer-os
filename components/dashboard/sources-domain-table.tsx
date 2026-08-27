"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe } from "lucide-react";
import type { DomainCitationRow } from "@/lib/db/sources";
import { SourcesModal } from "@/components/dashboard/sources-modal";
import Image from "next/image";

interface SourcesDomainTableProps {
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

export function SourcesDomainTable({ domains }: SourcesDomainTableProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const visibleDomains = domains.slice(0, 6);

  return (
    <>
      <Card className="border-border bg-card/60 backdrop-blur-sm flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Discovered Sources</span>
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setModalOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7 px-2"
            >
              <span>Show All</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-2 pb-4 space-y-3 flex-1 flex flex-col justify-between">
          {domains.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No citation sources recorded yet. Run a scan to discover AI search web sources.
            </div>
          ) : (
            <div className="border border-border/80 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/30 border-b border-border/80 text-muted-foreground font-medium uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3 text-right">Used</th>
                    <th className="py-2.5 px-3 text-right">Avg. Citations</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {visibleDomains.map((row) => (
                    <tr
                      key={row.domain}
                      className="hover:bg-secondary/20 transition-colors"
                    >
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
                          <span className="truncate max-w-[140px] sm:max-w-[180px]">
                            {row.domain}
                          </span>
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
        </CardContent>
      </Card>

      <SourcesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        domains={domains}
      />
    </>
  );
}
