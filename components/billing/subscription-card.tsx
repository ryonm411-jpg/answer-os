"use client";

import * as React from "react";
import { CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingStatusBadge } from "./billing-status-badge";
import { ProviderAccessList } from "./provider-access-list";
import type { BillingStatus } from "@/lib/stripe/server";

export interface SubscriptionCardProps {
  status: BillingStatus;
  onSubscribe: () => Promise<void>;
  onManagePortal: () => Promise<void>;
  onRefresh: () => void;
  isLoadingCheckout: boolean;
  isLoadingPortal: boolean;
  isRefreshing: boolean;
  checkoutQueryParam?: string | null;
}

export function SubscriptionCard({
  status,
  onSubscribe,
  onManagePortal,
  onRefresh,
  isLoadingCheckout,
  isLoadingPortal,
  isRefreshing,
  checkoutQueryParam,
}: SubscriptionCardProps) {
  const isEntitled = status.entitled;
  const hasSubscription = status.status !== null;
  const isCanceling = status.cancelAtPeriodEnd;

  const formattedPeriodEnd = status.currentPeriodEnd
    ? new Date(status.currentPeriodEnd).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Card className="border-border bg-card shadow-lg max-w-3xl w-full mx-auto">
      <CardHeader className="space-y-3 pb-6 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                AnswerOS Subscription & Entitlement
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {isEntitled
                  ? "Full AI Visibility & Multi-Provider Intelligence Access Unlocked"
                  : "Free Tier Active — Gemini, Groq, NVIDIA NIM, & OpenRouter Scans Enabled"}
              </CardDescription>
            </div>
          </div>
          <BillingStatusBadge
            status={status.status}
            cancelAtPeriodEnd={status.cancelAtPeriodEnd}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* State Banners */}
        {checkoutQueryParam === "success" && !isEntitled && (
          <div
            role="status"
            className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-blue-400" />
              <span>
                Payment received! Waiting for Stripe webhook verification...
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 text-xs border-blue-500/40 text-blue-300 hover:bg-blue-500/20"
            >
              <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              <span className="ml-1.5">Check Status</span>
            </Button>
          </div>
        )}

        {checkoutQueryParam === "cancelled" && (
          <div
            role="status"
            className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm"
          >
            Checkout was canceled. Your subscription status remains unchanged.
          </div>
        )}

        {status.status === "PAST_DUE" && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm"
          >
            Your latest payment was unsuccessful. Please update your payment method to restore full scan access.
          </div>
        )}

        {/* Provider Access List */}
        <ProviderAccessList entitled={isEntitled} />

        {/* Period Info */}
        {hasSubscription && formattedPeriodEnd && (
          <div className="rounded-lg bg-accent/40 p-4 border border-border/40 text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Current Billing Period Ends:</span>
              <span className="font-medium text-foreground">{formattedPeriodEnd}</span>
            </div>
            {isCanceling && (
              <p className="text-amber-400/90 text-[11px] pt-1">
                Your subscription will automatically end on {formattedPeriodEnd}. Features remain active until then.
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50 bg-accent/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Secure checkout hosted by Stripe</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasSubscription ? (
            <Button
              variant="default"
              onClick={onManagePortal}
              disabled={isLoadingPortal}
              className="w-full sm:w-auto gap-2"
            >
              {isLoadingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span>Manage Subscription & Billing</span>
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={onSubscribe}
              disabled={isLoadingCheckout}
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isLoadingCheckout ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              <span>Subscribe to Unlock All Providers</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
