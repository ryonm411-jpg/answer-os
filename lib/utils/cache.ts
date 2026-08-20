import { Redis } from "@upstash/redis";
import type { ParsedScanResponse } from "@/lib/scan/parse";

/** Default cache TTL (architecture.md: 24h; per-plan configurable post-MVP). */
export const SCAN_CACHE_TTL_SECONDS = 24 * 60 * 60;

/**
 * Lazy Upstash client. Null when UPSTASH_REDIS_REST_URL/TOKEN are absent —
 * every helper then degrades to a no-op (Decision #6): a scan must never
 * fail because caching is unavailable.
 */
let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (!redisInitialized) {
    redisInitialized = true;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) redis = new Redis({ url, token });
  }
  return redis;
}

/** Cache key per company + prompt + provider (Decision #7). */
export function scanResultKey(companyId: string, promptId: string, provider: string): string {
  return `scan:${companyId}:${promptId}:${provider}`;
}

export async function getCachedScanResult(key: string): Promise<ParsedScanResponse | null> {
  try {
    return (await getRedis()?.get<ParsedScanResponse>(key)) ?? null;
  } catch {
    return null; // non-fatal (Decision #6)
  }
}

export async function setCachedScanResult(key: string, result: ParsedScanResponse): Promise<void> {
  try {
    await getRedis()?.set(key, result, { ex: SCAN_CACHE_TTL_SECONDS });
  } catch {
    // non-fatal (Decision #6)
  }
}
