"use client";

import { CheckCircle2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PAINS_SOLVED = [
  "Stop missing out when prospective buyers ask AI chatbots for software recommendations",
  "Discover where key competitors are being cited ahead of your brand",
  "Eliminate guessing with server-calculated, multi-factor visibility metrics",
  "Get clear, evidence-based action steps to improve your AI search indexing",
];

export function WhoItsFor() {
  return (
    <section className="py-20 border-b border-border/60 bg-secondary/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/80 bg-card/60 p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs font-medium border-primary/30 bg-primary/10 text-primary gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Target Positioning</span>
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Designed specifically for B2B SaaS teams
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              For B2B SaaS teams whose buyers ask AI for recommendations — &ldquo;best email marketing software&rdquo;, &ldquo;top CRM for startups&rdquo;, &ldquo;best barefoot shoes for trail running&rdquo; — and want to become the answer.
            </p>
          </div>

          {/* Pain points checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {PAINS_SOLVED.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-foreground/90 font-medium leading-normal">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
