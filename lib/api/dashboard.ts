import type { MultiBrandTrendPoint } from "@/lib/db/dashboard";

export interface GetTrendResponse {
  data?: {
    trend: MultiBrandTrendPoint[];
  };
  error?: {
    message: string;
  };
}

/** Fetch filtered multi-brand trend data from the server */
export async function getDashboardTrend(
  days = 14,
  provider = "all"
): Promise<MultiBrandTrendPoint[]> {
  const params = new URLSearchParams({
    days: days.toString(),
    provider,
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
