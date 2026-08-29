import type { MultiBrandTrendPoint } from "@/lib/db/dashboard";
import type { SourcesSummaryData } from "@/lib/db/sources";

export interface GetTrendResponse {
  data?: {
    trend: MultiBrandTrendPoint[];
  };
  error?: {
    message: string;
  };
}

export interface GetSourcesResponse {
  data?: SourcesSummaryData;
  error?: {
    message: string;
  };
}

/** Fetch filtered multi-brand trend data from the server */
export async function getDashboardTrend(
  days = 14,
  provider = "all",
  promptType = "all"
): Promise<MultiBrandTrendPoint[]> {
  const params = new URLSearchParams({
    days: days.toString(),
    provider,
    promptType,
  });

  const res = await fetch(`/api/dashboard/trend?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body: GetTrendResponse = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || "Failed to fetch trend data");
  }

  const body: GetTrendResponse = await res.json();
  return body.data?.trend || [];
}

/** Fetch filtered top sources and domain citations summary from the server */
export async function getDashboardSources(
  days = 14,
  provider = "all",
  scanId?: string | null,
  promptType = "all"
): Promise<SourcesSummaryData> {
  const params = new URLSearchParams({
    days: days.toString(),
    provider,
    promptType,
  });
  if (scanId) {
    params.set("scanId", scanId);
  }

  const res = await fetch(`/api/dashboard/sources?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body: GetSourcesResponse = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || "Failed to fetch sources data");
  }

  const body: GetSourcesResponse = await res.json();
  return (
    body.data || {
      totalSourcesCount: 0,
      breakdown: [],
      topDomains: [],
    }
  );
}
