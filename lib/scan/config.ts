/** Token budget for scan calls: the completion plus the metadata block needs
 *  more room than the provider layer's 2048 default. */
export const SCAN_MAX_TOKENS = 4096;
/** Keep the provider default (0.2): deterministic, factual answers for scanning. */
export const SCAN_TEMPERATURE = 0.2;
/** 1 initial call + 2 retries, for retryable AIProviderError only (Decision #3). */
export const SCAN_PROVIDER_MAX_ATTEMPTS = 3;
export const SCAN_RETRY_BASE_MS = 1000;
export const SCAN_RETRY_MAX_MS = 10_000;
