import { describe, it, expect, vi, beforeEach } from "vitest";

const mockWithScope = vi.fn();
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  withScope: mockWithScope,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
}));

describe("lib/monitoring/sentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithScope.mockImplementation((cb) => {
      const scope = {
        setTag: vi.fn(),
        setUser: vi.fn(),
      };
      cb(scope);
      return scope;
    });
  });

  describe("captureApiError", () => {
    it("calls Sentry.withScope with route tag and captures exception", async () => {
      const { captureApiError } = await import("./sentry");
      const error = new Error("test error");

      captureApiError(error, "/api/scans", "user-123");

      expect(mockWithScope).toHaveBeenCalledOnce();
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    it("sets user when userId is provided", async () => {
      const { captureApiError } = await import("./sentry");
      const error = new Error("test error");

      captureApiError(error, "/api/domain", "user-456");

      const scopeCb = mockWithScope.mock.calls[0][0];
      const scope = { setTag: vi.fn(), setUser: vi.fn() };
      scopeCb(scope);

      expect(scope.setTag).toHaveBeenCalledWith("route", "/api/domain");
      expect(scope.setUser).toHaveBeenCalledWith({ id: "user-456" });
    });

    it("does not set user when userId is omitted", async () => {
      const { captureApiError } = await import("./sentry");
      const error = new Error("test error");

      captureApiError(error, "/api/prompts");

      const scopeCb = mockWithScope.mock.calls[0][0];
      const scope = { setTag: vi.fn(), setUser: vi.fn() };
      scopeCb(scope);

      expect(scope.setTag).toHaveBeenCalledWith("route", "/api/prompts");
      expect(scope.setUser).not.toHaveBeenCalled();
    });
  });

  describe("captureJobError", () => {
    it("calls Sentry.withScope with job tag and captures exception", async () => {
      const { captureJobError } = await import("./sentry");
      const error = new Error("job failed");

      captureJobError(error, "scan-company", "scan-123");

      expect(mockWithScope).toHaveBeenCalledOnce();
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    it("sets scanId tag when provided", async () => {
      const { captureJobError } = await import("./sentry");
      const error = new Error("job failed");

      captureJobError(error, "scan-company", "scan-456");

      const scopeCb = mockWithScope.mock.calls[0][0];
      const scope = { setTag: vi.fn(), setUser: vi.fn() };
      scopeCb(scope);

      expect(scope.setTag).toHaveBeenCalledWith("job", "scan-company");
      expect(scope.setTag).toHaveBeenCalledWith("scanId", "scan-456");
    });

    it("does not set scanId when omitted", async () => {
      const { captureJobError } = await import("./sentry");
      const error = new Error("job failed");

      captureJobError(error, "report-weekly");

      const scopeCb = mockWithScope.mock.calls[0][0];
      const scope = { setTag: vi.fn(), setUser: vi.fn() };
      scopeCb(scope);

      expect(scope.setTag).toHaveBeenCalledWith("job", "report-weekly");
      expect(scope.setTag).not.toHaveBeenCalledWith("scanId", expect.anything());
    });
  });

  describe("captureMessage", () => {
    it("delegates to Sentry.captureMessage with default level", async () => {
      const { captureMessage } = await import("./sentry");

      captureMessage("Provider timeout");

      expect(mockCaptureMessage).toHaveBeenCalledWith("Provider timeout", "info");
    });

    it("passes custom level", async () => {
      const { captureMessage } = await import("./sentry");

      captureMessage("Rate limit hit", "warning");

      expect(mockCaptureMessage).toHaveBeenCalledWith("Rate limit hit", "warning");
    });
  });
});
