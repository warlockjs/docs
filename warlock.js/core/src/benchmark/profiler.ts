import { NoopChannel } from "./channels/noop.channel";
import type {
  BenchmarkChannel,
  BenchmarkErrorResult,
  BenchmarkProfilerOptions,
  BenchmarkStats,
  BenchmarkSuccessResult,
} from "./types";

type BenchmarkEntry = {
  latencies: number[];
  sum: number;
  total: number;
  errors: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export class BenchmarkProfiler {
  private readonly maxSamples: number;
  private readonly channels: BenchmarkChannel[];
  private readonly entries = new Map<string, BenchmarkEntry>();
  private interval?: ReturnType<typeof setInterval>;

  public constructor(options?: BenchmarkProfilerOptions) {
    this.maxSamples = options?.maxSamples ?? 1000;
    this.channels = options?.channels ?? [new NoopChannel()];

    if (options?.flushEvery) {
      this.interval = setInterval(() => {
        // We use void to explicitly ignore the promise, as this is a background interval
        void this.flush();
      }, options.flushEvery);
    }
  }

  /**
   * Record one measurement result. Called automatically by measure() when a profiler is set.
   *
   * @param result - The success or error result from measure()
   *
   * @example
   * profiler.record(result);
   */
  public record(result: BenchmarkSuccessResult<unknown> | BenchmarkErrorResult): void {
    let entry = this.entries.get(result.name);

    if (!entry) {
      entry = {
        latencies: [],
        sum: 0,
        total: 0,
        errors: 0,
        firstSeenAt: result.startedAt,
        lastSeenAt: result.endedAt,
      };

      this.entries.set(result.name, entry);
    }

    entry.latencies.push(result.latency);
    entry.sum += result.latency;

    if (entry.latencies.length > this.maxSamples) {
      const removed = entry.latencies.shift();
      if (removed !== undefined) {
        entry.sum -= removed;
      }
    }

    entry.total += 1;

    if (!result.success) {
      entry.errors += 1;
    }

    entry.lastSeenAt = result.endedAt;
  }

  /**
   * Get aggregated stats for one operation name.
   * Computes p50/p95/p99 by sorting the ring buffer on demand.
   *
   * @param name - The operation name to get stats for.
   * @returns Stats object or undefined if no data yet.
   *
   * @example
   * const stats = profiler.stats("db-query");
   */
  public stats(name: string): BenchmarkStats | undefined {
    const entry = this.entries.get(name);
    if (!entry || entry.latencies.length === 0) return undefined;

    const latencies = [...entry.latencies].sort((a, b) => a - b);
    const count = latencies.length;

    const getP = (percentile: number) => {
      const index = Math.min(count - 1, Math.floor(count * percentile));
      return latencies[index];
    };

    return {
      p50: getP(0.5),
      p90: getP(0.9),
      p95: getP(0.95),
      p99: getP(0.99),
      avg: Math.round((entry.sum / count) * 100) / 100,
      min: latencies[0],
      max: latencies[count - 1],
      count: entry.total,
      errors: entry.errors,
      errorRate: Math.round((entry.errors / entry.total) * 100) / 100,
      firstSeenAt: entry.firstSeenAt,
      lastSeenAt: entry.lastSeenAt,
    };
  }

  /**
   * Get stats for all tracked operations.
   *
   * @returns A record mapping operation names to their stats.
   *
   * @example
   * const all = profiler.allStats();
   */
  public allStats(): Record<string, BenchmarkStats> {
    const all: Record<string, BenchmarkStats> = {};
    for (const name of this.entries.keys()) {
      const operationStats = this.stats(name);
      if (operationStats) {
        all[name] = operationStats;
      }
    }
    return all;
  }

  /**
   * Send allStats() to all registered channels.
   *
   * @example
   * await profiler.flush();
   */
  public async flush(): Promise<void> {
    const stats = this.allStats();
    if (Object.keys(stats).length === 0) return;

    for (const channel of this.channels) {
      await channel.onFlush(stats);
    }
  }

  /**
   * Clear ring buffer for one or all operations.
   * Does NOT reset unbounded total/error counters.
   *
   * @param name - Optional operation name. If omitted, clears all ring buffers.
   *
   * @example
   * profiler.reset("db-query");
   * profiler.reset();
   */
  public reset(name?: string): void {
    if (name) {
      const entry = this.entries.get(name);
      if (entry) {
        entry.latencies = [];
        entry.sum = 0;
      }
    } else {
      for (const entry of this.entries.values()) {
        entry.latencies = [];
        entry.sum = 0;
      }
    }
  }

  /**
   * Dispose the profiler, clearing its auto-flush interval.
   *
   * @example
   * profiler.dispose();
   */
  public dispose(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
