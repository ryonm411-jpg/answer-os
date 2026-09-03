"use client";

import { CheckCircle2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const VALUE_POINTS = [
  "Stop missing out when prospective buyers ask AI chatbots for product or service recommendations",
  "Discover where key competitors are being cited ahead of your brand across every major AI engine",
  "Eliminate guessing with server-calculated, multi-factor visibility metrics updated on every scan",
  "Get clear, evidence-based action steps to improve how AI search engines index your brand",
  "Access full scan reports with per-model breakdowns, sentiment scores, and citation sources",
  "Track your visibility score over time and measure the real impact of your content and positioning changes",
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
              <Globe className="h-3.5 w-3.5" />
              <span>Built for Every Brand</span>
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Any brand whose buyers search AI for answers
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Whether you sell software, services, or physical products — if your customers ask AI
              &ldquo;what&rsquo;s the best&hellip;&rdquo; you need to be the answer. AnswerOS gives you full
              visibility into how every major AI engine recommends your brand, tracks your progress
              over time, and tells you exactly what to do next.
            </p>
          </div>

          {/* Value points checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {VALUE_POINTS.map((item, idx) => (
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
