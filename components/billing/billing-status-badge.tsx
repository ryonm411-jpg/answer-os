import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

export interface BillingStatusBadgeProps {
  status: SubscriptionStatus | null;
  cancelAtPeriodEnd?: boolean;
  className?: string;
}

export function BillingStatusBadge({
  status,
  cancelAtPeriodEnd,
  className,
}: BillingStatusBadgeProps) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-zinc-700 bg-zinc-800/60 text-zinc-400 text-xs font-medium py-0.5 px-2.5",
          className
        )}
      >
        No Subscription
      </Badge>
    );
  }

  if (cancelAtPeriodEnd && (status === "ACTIVE" || status === "TRIALING")) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium py-0.5 px-2.5",
          className
        )}
      >
        Canceling at Period End
      </Badge>
    );
  }

  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium py-0.5 px-2.5",
            className
          )}
        >
          Active
        </Badge>
      );

    case "TRIALING":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium py-0.5 px-2.5",
            className
          )}
        >
          Trialing
        </Badge>
      );

    case "PAST_DUE":
    case "UNPAID":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-medium py-0.5 px-2.5",
            className
          )}
        >
          Past Due
        </Badge>
      );

    case "CANCELED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-zinc-700 bg-zinc-800/60 text-zinc-400 text-xs font-medium py-0.5 px-2.5",
            className
          )}
        >
          Canceled
        </Badge>
      );

    case "PAUSED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-medium py-0.5 px-2.5",
            className
          )}
        >
          Paused
        </Badge>
      );

    case "INCOMPLETE":
    case "INCOMPLETE_EXPIRED":
    default:
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-zinc-700 bg-zinc-800/60 text-zinc-400 text-xs font-medium py-0.5 px-2.5",
            className
          )}
        >
          Incomplete
        </Badge>
      );
  }
}
