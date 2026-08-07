import type { AIProviderName } from "./types";

export class AIProviderError extends Error {
  readonly provider: AIProviderName;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(
    message: string,
    options: {
      provider: AIProviderName;
      retryable: boolean;
      statusCode?: number;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = "AIProviderError";
    this.provider = options.provider;
    this.retryable = options.retryable;
    this.statusCode = options.statusCode;
  }
}

export function toProviderError(
  provider: AIProviderName,
  err: unknown
): AIProviderError {
  if (err instanceof AIProviderError) {
    return err;
  }

  if (err instanceof Error) {
    const message = err.message || "Unknown AI provider error";
    const name = err.name || "";

    const statusCode =
      "statusCode" in err && typeof (err as { statusCode: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : "status" in err && typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : undefined;

    if (
      name === "AbortError" ||
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("aborted")
    ) {
      return new AIProviderError(`Provider ${provider} request timed out: ${message}`, {
        provider,
        retryable: true,
        statusCode,
        cause: err,
      });
    }

    if (
      statusCode === 429 ||
      message.includes("429") ||
      message.toLowerCase().includes("rate limit")
    ) {
      return new AIProviderError(`Provider ${provider} rate limit exceeded: ${message}`, {
        provider,
        retryable: true,
        statusCode: 429,
        cause: err,
      });
    }

    if (statusCode && statusCode >= 500 && statusCode < 600) {
      return new AIProviderError(`Provider ${provider} server error (${statusCode}): ${message}`, {
        provider,
        retryable: true,
        statusCode,
        cause: err,
      });
    }

    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return new AIProviderError(`Provider ${provider} client error (${statusCode}): ${message}`, {
        provider,
        retryable: false,
        statusCode,
        cause: err,
      });
    }

    const isNetworkError =
      message.toLowerCase().includes("fetch failed") ||
      message.toLowerCase().includes("econnreset") ||
      message.toLowerCase().includes("etimedout") ||
      message.toLowerCase().includes("network");

    return new AIProviderError(`Provider ${provider} error: ${message}`, {
      provider,
      retryable: isNetworkError,
      statusCode,
      cause: err,
    });
  }

  return new AIProviderError(`Provider ${provider} error: ${String(err)}`, {
    provider,
    retryable: false,
    cause: err,
  });
}
