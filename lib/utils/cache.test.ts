import { describe, it, expect, beforeEach, vi } from "vitest";

describe("cache layer", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("formats scanResultKey correctly", async () => {
    const { scanResultKey } = await import("./cache");
    expect(scanResultKey("comp-1", "prompt-1", "openai")).toBe(
      "scan:comp-1:prompt-1:openai"
    );
  });

  it("exports 24h default TTL constant", async () => {
    const { SCAN_CACHE_TTL_SECONDS } = await import("./cache");
    expect(SCAN_CACHE_TTL_SECONDS).toBe(86400);
  });

  it("degrades gracefully to no-op when Upstash env vars are absent", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { getCachedScanResult, setCachedScanResult } = await import("./cache");

    const cached = await getCachedScanResult("scan:comp-1:prompt-1:openai");
    expect(cached).toBeNull();

    // setCachedScanResult should resolve without throwing
    await expect(
      setCachedScanResult("scan:comp-1:prompt-1:openai", {
        mentioned: true,
        position: 1,
        sentiment: "POSITIVE",
        reasoning: "Test",
        competitors: [],
      })
    ).resolves.toBeUndefined();
  });
});
