"use client";

import * as React from "react";
import { Check, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PROVIDER_CATALOG } from "@/lib/providers/catalog";
import { PREMIUM_PROVIDERS } from "@/lib/providers/tiers";

export interface ProviderAccessListProps {
  entitled: boolean;
}

export function ProviderAccessList({ entitled }: ProviderAccessListProps) {
  const providers = PROVIDER_CATALOG.map((entry) => ({
    ...entry,
    isFreeTier: !PREMIUM_PROVIDERS.includes(entry.name),
  }));
  const freeCount = providers.filter((p) => p.isFreeTier).length;
  const totalCount = providers.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Provider Access & Tier Status
        </h3>
        <span className="text-xs text-muted-foreground">
          {entitled
            ? `${totalCount} of ${totalCount} Providers Unlocked`
            : `${freeCount} of ${totalCount} Free Providers Active`}
        </span>
      </div>

      <div className="space-y-4">
        {/* Section 1: AI Search Platforms (Canonical) */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Search Platforms (Canonical Visibility)
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {providers
              .filter((p) => ["openai", "anthropic", "gemini", "perplexity"].includes(p.name))
              .map((p) => {
                const isUnlocked = entitled || p.isFreeTier;
                return (
                  <div
                    key={p.name}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-colors ${
                      isUnlocked
                        ? "bg-card border-border/80 text-foreground"
                        : "bg-accent/20 border-border/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-md ${
                          isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isUnlocked ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tracking-tight">{p.label}</span>
                          {p.isFreeTier ? (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              Free Tier
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium bg-primary/10 text-primary border-primary/20">
                              Paid Plan
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                      </div>
                    </div>
                    <div>
                      {isUnlocked ? (
                        <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground bg-accent/30 gap-1">
                          <Lock className="h-3 w-3" />
                          <span>Unlocks with Paid Plan</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Section 2: Additional Model Coverage (Auxiliary) */}
        <div className="space-y-2 pt-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Additional Model Coverage (Auxiliary)
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {providers
              .filter((p) => ["groq", "nvidia", "openrouter"].includes(p.name))
              .map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card text-foreground transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Check className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tracking-tight">{p.label}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Free Tier
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                    Available
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
