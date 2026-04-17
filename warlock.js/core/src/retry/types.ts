/**
 * Options for the retry() function.
 */
export type RetryOptions = {
  /**
   * How many times to retry after the first failure.
   * Total attempts = count + 1.
   *
   * @example count: 3 → up to 4 total attempts
   * @default 0
   */
  count?: number;

  /**
   * Milliseconds to wait between attempts.
   * Omit or set to 0 for no delay.
   */
  delay?: number;

  /**
   * Optional predicate — return false to abort retrying early
   * (e.g., don't retry on a 4xx validation error).
   *
   * @example
   * shouldRetry: (err) => !(err instanceof ValidationError)
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};
