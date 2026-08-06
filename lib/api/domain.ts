/**
 * Thin client-side fetch helpers for the domain API.
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

/** Create the user's company. → POST /api/domain */
export function createCompany(domain: string) {
  return request<void>("/api/domain", {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
}

/** Update the user's tracked domain. → PATCH /api/domain */
export function updateCompanyDomain(domain: string) {
  return request<void>("/api/domain", {
    method: "PATCH",
    body: JSON.stringify({ domain }),
  });
}

/** Delete the user's company. → DELETE /api/domain */
export function removeCompany() {
  return request<void>("/api/domain", {
    method: "DELETE",
  });
}
