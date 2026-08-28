import * as Sentry from "@sentry/nextjs";

export function captureApiError(error: unknown, route: string, userId?: string) {
  Sentry.withScope((scope) => {
    scope.setTag("route", route);
    if (userId) scope.setUser({ id: userId });
    Sentry.captureException(error);
  });
}

export function captureJobError(error: unknown, jobName: string, scanId?: string) {
  Sentry.withScope((scope) => {
    scope.setTag("job", jobName);
    if (scanId) scope.setTag("scanId", scanId);
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}
