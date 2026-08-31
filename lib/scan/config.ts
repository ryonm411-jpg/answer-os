/** Token budget for scan calls: the completion must have enough room for
 *  the full prose answer AND the JSON metadata block appended at the end.
 *  1024 was too small — complex prompts (e.g. hardware comparisons) would
 *  exhaust the budget on prose before the model could emit the JSON. */
export const SCAN_MAX_TOKENS = 4096;
/** Keep the provider default (0.2): deterministic, factual answers for scanning. */
export const SCAN_TEMPERATURE = 0.2;
/** 1 initial call + 2 retries, for retryable AIProviderError only (Decision #3). */
export const SCAN_PROVIDER_MAX_ATTEMPTS = 3;
export const SCAN_RETRY_BASE_MS = 1000;
export const SCAN_RETRY_MAX_MS = 10_000;
