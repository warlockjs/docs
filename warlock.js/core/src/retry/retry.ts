import type { RetryOptions } from "./types";

/**
 * Executes `fn`, retrying up to `options.count` additional times on failure.
 * Total executions = 1 (initial) + count (retries).
 *
 * Throws the last error if every attempt fails.
 *
 * @example
 * // Basic retry
 * const data = await retry(() => fetchUser(id), { count: 3, delay: 200 });
 *
 * @example
 * // Don't retry on validation errors
 * const data = await retry(() => sendEmail(payload), {
 *   count: 3,
 *   delay: 500,
 *   shouldRetry: (err) => !(err instanceof ValidationError),
 * });
 */
export async function retry<T>(fn: () => T | Promise<T>, options: RetryOptions = {}): Promise<T> {
  let lastError: unknown;

  const { count = 0, delay = 0, shouldRetry } = options;

  for (let attempt = 0; attempt <= count; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Allow caller to bail out early (e.g., don't retry 4xx errors)
      if (shouldRetry && !shouldRetry(err, attempt)) {
        throw err;
      }

      // Delay before the next attempt (skip delay after the last failure)
      if (attempt < count && delay) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
