import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockIdentify = vi.fn();
const mockCapture = vi.fn();
const mockShutdown = vi.fn();

class MockPostHog {
  identify = mockIdentify;
  capture = mockCapture;
  shutdown = mockShutdown;
  flush = vi.fn().mockResolvedValue(undefined);
}

vi.mock("posthog-node", () => ({
  PostHog: MockPostHog,
}));

describe("lib/analytics/posthog", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("when env vars are missing", () => {
    it("trackEvent is a no-op", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

      const { trackEvent } = await import("./posthog");
      trackEvent("test_event", "user-123");

      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("identifyUser is a no-op", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

      const { identifyUser } = await import("./posthog");
      identifyUser("user-123");

      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it("shutdownPosthog is a no-op", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

      const { shutdownPosthog } = await import("./posthog");
      shutdownPosthog();

      expect(mockShutdown).not.toHaveBeenCalled();
    });
  });

  describe("when env vars are present", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phk_test-key");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("trackEvent calls posthogClient.capture with correct args", async () => {
      const { trackEvent } = await import("./posthog");
      trackEvent("scan_completed", "user-123", { scanId: "scan-1" });

      expect(mockCapture).toHaveBeenCalledWith({
        event: "scan_completed",
        distinctId: "user-123",
        properties: { scanId: "scan-1" },
      });
    });

    it("trackEvent works without properties", async () => {
      const { trackEvent } = await import("./posthog");
      trackEvent("dashboard_visited", "user-456");

      expect(mockCapture).toHaveBeenCalledWith({
        event: "dashboard_visited",
        distinctId: "user-456",
        properties: undefined,
      });
    });

    it("identifyUser calls posthogClient.identify with correct args", async () => {
      const { identifyUser } = await import("./posthog");
      identifyUser("user-789", { plan: "pro" });

      expect(mockIdentify).toHaveBeenCalledWith({
        distinctId: "user-789",
        properties: { plan: "pro" },
      });
    });

    it("shutdownPosthog calls posthogClient.shutdown", async () => {
      const { shutdownPosthog } = await import("./posthog");
      await shutdownPosthog();

      expect(mockShutdown).toHaveBeenCalledOnce();
    });
  });
});
