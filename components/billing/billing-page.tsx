"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { PlanCards } from "./plan-card";
import { SubscriptionCard } from "./subscription-card";
import { startCheckout, openPortal, getBillingStatus } from "@/lib/api/billing";
import type { BillingStatus } from "@/lib/stripe/server";

export interface BillingPageProps {
  initialStatus: BillingStatus;
  domainName?: string;
}

export function BillingPage({ initialStatus, domainName }: BillingPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutParam = searchParams.get("checkout");

  const [status, setStatus] = React.useState<BillingStatus>(initialStatus);
  const [isLoadingCheckout, setIsLoadingCheckout] = React.useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubscribe = React.useCallback(async () => {
    setIsLoadingCheckout(true);
    setError(null);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate Stripe Checkout"
      );
      setIsLoadingCheckout(false);
    }
  }, []);

  const handleManagePortal = React.useCallback(async () => {
    setIsLoadingPortal(true);
    setError(null);
    try {
      const { url } = await openPortal();
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to open Stripe Customer Portal"
      );
      setIsLoadingPortal(false);
    }
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const freshStatus = await getBillingStatus();
      setStatus(freshStatus);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh billing status"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Plans & Billing
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage plans, payment options, and AI provider access for{" "}
          <span className="font-semibold text-foreground">
            {domainName ?? "your company"}
          </span>
          .
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-semibold text-xs uppercase tracking-wider">
              Billing Error
            </h2>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Plan Comparison Cards */}
      <PlanCards
        entitled={status.entitled}
        onSubscribe={handleSubscribe}
        onManagePortal={handleManagePortal}
        isLoadingCheckout={isLoadingCheckout}
        isLoadingPortal={isLoadingPortal}
      />

      {/* Detailed Subscription & Provider Access Card */}
      <SubscriptionCard
        status={status}
        onSubscribe={handleSubscribe}
        onManagePortal={handleManagePortal}
        onRefresh={handleRefresh}
        isLoadingCheckout={isLoadingCheckout}
        isLoadingPortal={isLoadingPortal}
        isRefreshing={isRefreshing}
        checkoutQueryParam={checkoutParam}
      />
    </div>
  );
}
