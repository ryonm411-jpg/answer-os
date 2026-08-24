"use client";

import * as React from "react";
import { Check, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AIProviderName } from "@/lib/providers";

export interface ProviderAccessItem {
  name: AIProviderName;
  label: string;
  description: string;
  isFreeTier: boolean;
}

const PROVIDERS_LIST: ProviderAccessItem[] = [
  {
    name: "gemini",
    label: "Google Gemini",
    description: "Gemini 2.5 / 3.5 Flash search integration (1,500 RPD free)",
    isFreeTier: true,
  },
  {
    name: "groq",
    label: "Groq LPU",
    description: "Ultra-fast LPU inference (Llama 3.3 70B & Qwen, 1,000 RPD free)",
    isFreeTier: true,
  },
  {
    name: "nvidia",
    label: "NVIDIA NIM",
    description: "Enterprise NIM catalog (10,000 RPD free)",
    isFreeTier: true,
  },
  {
    name: "openrouter",
    label: "OpenRouter Free Pool",
    description: "Open-weight free model router (15+ free models)",
    isFreeTier: true,
  },
  {
    name: "openai",
    label: "OpenAI ChatGPT",
    description: "GPT-4o general AI model scanning",
    isFreeTier: false,
  },
  {
    name: "anthropic",
    label: "Anthropic Claude",
    description: "Claude 3.5 Sonnet analysis & recommendations",
    isFreeTier: false,
  },
  {
    name: "perplexity",
    label: "Perplexity AI",
    description: "Sonar real-time answer engine search",
    isFreeTier: false,
  },
];

export interface ProviderAccessListProps {
  entitled: boolean;
}

export function ProviderAccessList({ entitled }: ProviderAccessListProps) {
  const freeCount = PROVIDERS_LIST.filter((p) => p.isFreeTier).length;
  const totalCount = PROVIDERS_LIST.length;

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

      <div className="grid grid-cols-1 gap-2.5">
        {PROVIDERS_LIST.map((p) => {
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
                    isUnlocked
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
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
                    <span className="text-sm font-semibold tracking-tight">
                      {p.label}
                    </span>
                    {p.isFreeTier && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      >
                        Free Tier
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.description}
                  </p>
                </div>
              </div>

              <div>
                {isUnlocked ? (
                  <Badge
                    variant="outline"
                    className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                  >
                    Available
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs border-border/60 text-muted-foreground bg-accent/30 gap-1"
                  >
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
  );
}
