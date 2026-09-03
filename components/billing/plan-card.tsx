"use client";

import * as React from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export interface PlanCardsProps {
  entitled: boolean;
  onSubscribe: () => Promise<void>;
  onManagePortal: () => Promise<void>;
  isLoadingCheckout: boolean;
  isLoadingPortal: boolean;
}

export function PlanCards({
  entitled,
  onSubscribe,
  onManagePortal,
  isLoadingCheckout,
  isLoadingPortal,
}: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Free Plan Card */}
      <Card
        className={`border relative transition-all ${
          !entitled
            ? "border-emerald-500/50 bg-card shadow-md"
            : "border-border/60 bg-card/60"
        }`}
      >
        {!entitled && (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
          >
            Current Plan
          </Badge>
        )}
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-muted text-muted-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg font-bold">Free Tier</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Free forever version using Google Gemini, Groq & NVIDIA NIM
          </CardDescription>
          <div className="pt-2">
            <span className="text-2xl font-bold text-foreground">$0</span>
            <span className="text-xs text-muted-foreground ml-1">/ month</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Google Gemini (GEMINI_API_KEY)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Groq LPU Inference (GROQ_API_KEY)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>NVIDIA NIM Catalog (NVIDIA_NIM_API_KEY)</span>
            </li>

          </ul>
        </CardContent>
        <CardFooter className="pt-4 border-t border-border/40">
          <Button
            variant="outline"
            disabled
            className="w-full text-xs cursor-default"
          >
            {!entitled ? "Active Free Version" : "Included in Free Tier"}
          </Button>
        </CardFooter>
      </Card>

      {/* Paid Plan Card */}
      <Card
        className={`border relative transition-all ${
          entitled
            ? "border-emerald-500/50 bg-card shadow-md"
            : "border-primary/40 bg-card"
        }`}
      >
        {entitled ? (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
          >
            Active Paid Subscription
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 text-[11px] bg-primary/10 text-primary border-primary/30 font-semibold"
          >
            Recommended
          </Badge>
        )}
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg font-bold">Paid Premium Plan</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Unlocks OpenAI, Anthropic Claude, and Perplexity AI
          </CardDescription>
          <div className="pt-2">
            <span className="text-2xl font-bold text-foreground">Pro Access</span>
            <span className="text-xs text-muted-foreground ml-1">/ single monthly plan</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-foreground font-medium">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Unlock OpenAI ChatGPT (GPT-4o)</span>
            </li>
            <li className="flex items-center gap-2 text-foreground font-medium">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Unlock Anthropic Claude 3.5 Sonnet</span>
            </li>
            <li className="flex items-center gap-2 text-foreground font-medium">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Unlock Perplexity AI Sonar</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>All 4 Free Tier Providers Included</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Full Actionable Recommendations & Competitor Analysis</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4 border-t border-border/40">
          {entitled ? (
            <Button
              variant="outline"
              onClick={onManagePortal}
              disabled={isLoadingPortal}
              className="w-full text-xs"
            >
              Manage Subscription
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={onSubscribe}
              disabled={isLoadingCheckout}
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              Upgrade to Unlock All Providers
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
