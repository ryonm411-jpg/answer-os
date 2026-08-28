import { PostHog } from "posthog-node";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

const posthogClient =
  projectToken && host
    ? new PostHog(projectToken, {
        host,
        flushAt: 1,
        flushInterval: 0,
        enableExceptionAutocapture: true,
      })
    : null;

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthogClient?.identify({ distinctId: userId, properties });
}

export async function trackEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>
) {
  if (!posthogClient) return;

  posthogClient.capture({ event, distinctId, properties });
  await posthogClient.flush();
}

export function shutdownPosthog() {
  return posthogClient?.shutdown();
}
