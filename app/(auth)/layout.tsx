import * as React from "react";
import { Sparkles, ShieldCheck, BarChart3, Bot } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground">
      {/* Left Information Panel (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-card border-r border-border relative overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-wider text-foreground">
            AnswerOS
          </span>
        </div>

        {/* Value Proposition */}
        <div className="space-y-8 max-w-xl relative z-10">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground xl:text-4xl 2xl:text-5xl leading-tight whitespace-nowrap">
              Become the answer <span className="text-primary">AI gives.</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitor, analyze, and optimize your brand visibility across ChatGPT, Claude, Gemini, and Perplexity.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded bg-accent text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Multi-Provider AI Scanning</h3>
                <p className="text-xs text-muted-foreground">Automated prompts scanned across 4 major AI search engines.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded bg-accent text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Weighted Visibility Score</h3>
                <p className="text-xs text-muted-foreground">Real-time benchmark scoring, rank tracking, and sentiment analysis.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded bg-accent text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Competitor Benchmarking</h3>
                <p className="text-xs text-muted-foreground">See how your SaaS compares side-by-side with top market rivals.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground relative z-10">
          © {new Date().getFullYear()} AnswerOS. All rights reserved.
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
