/**
 * Thin client-side fetch helpers for the providers API.
 *
 * All helpers throw an `Error` with the server's `error.message` on failure,
 * so the All Models tab can display the message inline.
 */

import type { AIProviderName } from "@/lib/providers";

export interface ProviderStatus {
  name: AIProviderName;
  label: string;
  description: string;
  tier: "free" | "premium";
  configured: boolean;
  enabled: boolean;
  locked: boolean;
  speedBadge?: string;
  promptLengthNote?: string;
  restrictionNote?: string;
}

export interface ProviderCatalogView {
  entitled: boolean;
  providers: ProviderStatus[];
}

type ApiEnvelope<T> = { data?: T; error?: { message?: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new Error(
      body?.error?.message ?? "Something went wrong. Please try again."
    );
  }

  return body?.data as T;
}

/** Fetch the catalog + plan + config + selection view. → GET /api/providers. */
export function getProviderCatalog() {
  return request<ProviderCatalogView>("/api/providers", { method: "GET" });
}

/** Upsert the company's enabled-provider selection. → PUT /api/providers/preferences. */
export function updateProviderPreferences(enabled: AIProviderName[]) {
  return request<{ enabled: AIProviderName[] }>("/api/providers/preferences", {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

/** Delete the preference row so plan defaults re-apply. → DELETE /api/providers/preferences. */
export function resetProviderPreferences() {
  return request<{ enabled: AIProviderName[] }>("/api/providers/preferences", {
    method: "DELETE",
  });
}
