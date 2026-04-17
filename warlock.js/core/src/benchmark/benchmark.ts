import { config } from "../config";
import type {
  BenchmarkConfigurations,
  BenchmarkErrorResult,
  BenchmarkOptions,
  BenchmarkSuccessResult,
} from "./types";

/**
 * Classifies latency into "excellent", "good", or "poor" based on thresholds.
 *
 * @example
 * latencyState(80, { excellent: 100, poor: 500 })  // "excellent"
 * latencyState(300, { excellent: 100, poor: 500 }) // "good"
 * latencyState(600, { excellent: 100, poor: 500 }) // "poor"
 */
function latencyState(
  latency: number,
  range: { excellent: number; poor: number },
): "excellent" | "good" | "poor" {
  if (latency <= range.excellent) return "excellent";
  if (latency >= range.poor) return "poor";
  return "good";
}

/**
 * Measure the execution time of a function and classify its performance.
 *
 * When `enabled` is false, fn() is still called but no timing runs and no hooks fire.
 * A zeroed SuccessResult is returned to keep the return type stable for all callers.
 *
 * @example
 * ```ts
 * const result = await measure("db-query", () => db.query("SELECT 1"), {
 *   latencyRange: { excellent: 100, poor: 500 },
 *   onComplete: (r) => metrics.record(r.latency),
 *   onError:    (r) => logger.error("query failed", r.error),
 *   onFinish:   (r) => logger.info(`${r.name} took ${r.latency}ms`),
 * });
 *
 * if (isSuccessResult(result)) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function measure<T>(
  name: string,
  fn: () => T | Promise<T>,
  options?: BenchmarkOptions<T>,
): Promise<BenchmarkSuccessResult<T> | BenchmarkErrorResult> {
  // Fast path: disabled — call fn() and return a zeroed success wrapper.
  // No timing, no hooks. Re-throws if fn() throws.
  if (options?.enabled === false) {
    const value = await fn();
    return {
      name,
      success: true,
      value,
      latency: 0,
      state: "excellent",
      tags: options.tags,
      startedAt: new Date(),
      endedAt: new Date(),
    };
  }

  // Resolve latency range from inline options or global config
  const benchmarkConfig = config.get<BenchmarkConfigurations>("benchmark");
  const latencyRange = options?.latencyRange ?? benchmarkConfig?.latencyRange;

  const startedAt = new Date();
  const startTime = performance.now();
  const profiler = options?.profiler ?? benchmarkConfig?.profiler;
  const snapshotContainer = options?.snapshotContainer ?? benchmarkConfig?.snapshotContainer;

  try {
    const value = await fn();

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    const state = latencyRange ? latencyState(latency, latencyRange) : "good";

    const result: BenchmarkSuccessResult<T> = {
      name,
      success: true,
      value,
      latency,
      state,
      tags: options?.tags,
      startedAt,
      endedAt: new Date(),
    };

    if (profiler) {
      profiler.record(result);
    }

    if (snapshotContainer) {
      snapshotContainer.record(result);
    }

    options?.onComplete?.(result);
    options?.onFinish?.(result);

    return result;
  } catch (thrown) {
    // Decide whether to benchmark this error or just re-throw immediately
    const shouldBenchmark = options?.shouldBenchmarkError
      ? options.shouldBenchmarkError(thrown)
      : true;

    if (!shouldBenchmark) {
      throw thrown;
    }

    // Capture timing even on failure — a 30s timeout is very different from a 2ms crash
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    const state = latencyRange ? latencyState(latency, latencyRange) : "poor";

    // Normalize thrown value to something consistent
    const error = thrown instanceof Error ? thrown : new Error(String(thrown));

    const result: BenchmarkErrorResult = {
      name,
      success: false,
      error,
      latency,
      state,
      tags: options?.tags,
      startedAt,
      endedAt: new Date(),
    };

    if (profiler) {
      profiler.record(result);
    }

    if (snapshotContainer) {
      snapshotContainer.record(result);
    }

    options?.onError?.(result);
    options?.onFinish?.(result);

    return result;
  }
}
