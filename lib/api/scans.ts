/**
 * Thin client-side fetch helpers for the scans API.
 *
 * All helpers throw an `Error` with the server's `error.message` on failure,
 * so dialogs can display the message inline.
 */

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

/** Start a visibility scan. → POST /api/scans. Throws the server's error.message on failure. */
export function triggerScan() {
  return request<{ scanId: string; status: string }>("/api/scans", {
    method: "POST",
  });
}
