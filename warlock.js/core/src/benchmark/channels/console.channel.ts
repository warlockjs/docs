import type { BenchmarkChannel, BenchmarkStats } from "../types";

export class ConsoleChannel implements BenchmarkChannel {
  /**
   * Pretty-prints a stats table per operation on onFlush().
   *
   * @param stats - Aggregated stats for all tracked operations.
   *
   * @example
   * const channel = new ConsoleChannel();
   * channel.onFlush({ "db-query": { p50: 10, count: 100, ... } });
   */
  public onFlush(stats: Record<string, BenchmarkStats>): void {
    const tableData: Record<string, any> = {};

    for (const [name, operationStats] of Object.entries(stats)) {
      tableData[name] = {
        "p50 (ms)": operationStats.p50,
        "p90 (ms)": operationStats.p90,
        "p95 (ms)": operationStats.p95,
        "p99 (ms)": operationStats.p99,
        "Avg (ms)": operationStats.avg,
        "Min (ms)": operationStats.min,
        "Max (ms)": operationStats.max,
        "Error Rate": `${(operationStats.errorRate * 100).toFixed(2)}%`,
        Errors: operationStats.errors,
        Count: operationStats.count,
      };
    }

    console.table(tableData);
  }
}
