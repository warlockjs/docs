import type { BenchmarkSnapshots } from "./benchmark-snapshots";
import type { BenchmarkProfiler } from "./profiler";

/**
 * Global benchmark configuration (set via config.get("benchmark"))
 */
export type BenchmarkConfigurations = {
  enabled?: boolean;
  latencyRange?: { excellent: number; poor: number };
  profiler?: BenchmarkProfiler;
  snapshotContainer?: BenchmarkSnapshots;
};

export type BenchmarkOptions<T = unknown> = {
  /**
   * Quick enable/disable without removing the call.
   * When false, fn() is still called but no timing occurs and no hooks fire.
   */
  enabled?: boolean;
  /**
   * Latency thresholds (in ms) for performance classification.
   * - latency <= excellent → "excellent"
   * - latency >= poor      → "poor"
   * - between              → "good"
   *
   * @example
   * { excellent: 100, poor: 500 } // ≤100ms excellent, ≥500ms poor
   */
  latencyRange?: {
    /**
     * Upper bound (ms) for "excellent" classification
     */
    excellent: number;
    /**
     * Lower bound (ms) for "poor" classification
     */
    poor: number;
  };
  /**
   * Hook called after a successful measurement
   */
  onComplete?: (result: BenchmarkSuccessResult<T>) => void;
  /**
   * Hook called after a benchmarked error
   */
  onError?: (result: BenchmarkErrorResult) => void;
  /**
   * Hook called after every measurement, success or error.
   * Fires after onComplete / onError.
   */
  onFinish?: (result: BenchmarkSuccessResult<T> | BenchmarkErrorResult) => void;
  /**
   * Metadata tags for grouping/filtering benchmarks
   *
   * @example { service: "auth", endpoint: "/login" }
   */
  tags?: Record<string, string>;
  /**
   * Control whether a thrown error should be benchmarked.
   * Return false for business logic errors (400, 404, validation) — they are re-thrown immediately.
   * Return true for technical errors (timeouts, DB crashes) — they are captured and benchmarked.
   *
   * Default: benchmark all errors
   */
  shouldBenchmarkError?: (error: unknown) => boolean;
  /**
   * Profiler to record this measurement into.
   * - BenchmarkProfiler instance → use it
   * - false                      → skip profiling for this call
   * - undefined (default)        → fall back to config.get("benchmark").profiler
   */
  profiler?: BenchmarkProfiler | false;
  /**
   * Snapshot container to record this result into.
   * - BenchmarkSnapshots instance → use it
   * - false                       → skip snapshot for this call
   * - undefined (default)         → fall back to config.get("benchmark").snapshotContainer
   */
  snapshotContainer?: BenchmarkSnapshots | false;
};

export type BenchmarkResult = {
  /**
   * Name of the benchmark
   */
  name: string;
  /**
   * Latency in milliseconds
   */
  latency: number;
  /**
   * Performance classification based on latency thresholds
   */
  state: "excellent" | "good" | "poor";
  /**
   * Optional metadata tags
   */
  tags?: Record<string, string>;
  /**
   * Start time of the measurement
   */
  startedAt: Date;
  /**
   * End time of the measurement
   */
  endedAt: Date;
};

/**
 * Result of a successful benchmark measurement.
 */
export type BenchmarkSuccessResult<T> = BenchmarkResult & {
  success: true;
  value: T;
};

/**
 * Result of a benchmarked error.
 */
export type BenchmarkErrorResult = BenchmarkResult & {
  success: false;
  error: unknown;
};

export interface BenchmarkChannel {
  /**
   * Called on profiler.flush() with aggregated stats for all tracked operations.
   */
  onFlush(stats: Record<string, BenchmarkStats>): void | Promise<void>;
}

export type BenchmarkStats = {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  /** Total call count — unbounded, not capped by ring buffer */
  count: number;
  /** Total error count — unbounded */
  errors: number;
  /** 0.0–1.0 — based on unbounded total/error counters */
  errorRate: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export type BenchmarkProfilerOptions = {
  /** Max latency samples to keep per operation name. Default: 1000 */
  maxSamples?: number;
  /** Channels to broadcast stats to on flush(). Default: [new NoopChannel()] */
  channels?: BenchmarkChannel[];
  /** Auto-flush interval in ms. If not set, flush() must be called manually. */
  flushEvery?: number;
};

export type BenchmarkSnapshotsOptions = {
  /** Max snapshots to keep per operation name. Default: 100 */
  maxSnapshots?: number;
  /**
   * What to capture:
   * - "error" → only BenchmarkErrorResult (default, memory safe)
   * - "value" → only BenchmarkSuccessResult<T> with value
   * - "all"   → both
   *
   * WARNING: "value" and "all" store the full T value in memory.
   * Do not use in production without understanding the memory implications.
   */
  capture?: "error" | "value" | "all";
};
