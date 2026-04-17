import type {
  BenchmarkErrorResult,
  BenchmarkSnapshotsOptions,
  BenchmarkSuccessResult,
} from "./types";

export class BenchmarkSnapshots {
  private readonly maxSnapshots: number;
  private readonly capture: "error" | "value" | "all";
  private readonly snapshots = new Map<
    string,
    (BenchmarkSuccessResult<unknown> | BenchmarkErrorResult)[]
  >();

  public constructor(options?: BenchmarkSnapshotsOptions) {
    this.maxSnapshots = options?.maxSnapshots ?? 100;
    this.capture = options?.capture ?? "error";
  }

  /**
   * Record a raw result. Called automatically by measure() when a snapshotContainer is set.
   * Respects the `capture` setting — ignores results that don't match.
   *
   * @param result - The success or error result to record.
   *
   * @example
   * snapshots.record(result);
   */
  public record(result: BenchmarkSuccessResult<unknown> | BenchmarkErrorResult): void {
    if (this.capture === "error" && result.success) return;
    if (this.capture === "value" && !result.success) return;

    let list = this.snapshots.get(result.name);

    if (!list) {
      list = [];
      this.snapshots.set(result.name, list);
    }

    if (list.length >= this.maxSnapshots && this.maxSnapshots > 0) {
      list.shift(); // Evict oldest
    }

    list.push(result);
  }

  /**
   * Get all snapshots for one operation name.
   *
   * @param name - The operation name.
   * @returns Array of snapshots for the operation.
   *
   * @example
   * snapshots.getSnapshots("db-query");
   */
  public getSnapshots(name: string): (BenchmarkSuccessResult<unknown> | BenchmarkErrorResult)[] {
    return this.snapshots.get(name) ?? [];
  }

  /**
   * Get all snapshots for all tracked operations.
   *
   * @returns A mapping of operation names to their snapshots array.
   *
   * @example
   * snapshots.allSnapshots();
   */
  public allSnapshots(): Record<
    string,
    (BenchmarkSuccessResult<unknown> | BenchmarkErrorResult)[]
  > {
    const all: Record<string, (BenchmarkSuccessResult<unknown> | BenchmarkErrorResult)[]> = {};

    for (const [name, list] of this.snapshots.entries()) {
      all[name] = [...list];
    }

    return all;
  }

  /**
   * Clear snapshots for one or all operations.
   *
   * @param name - Optional operation name. If omitted, clears all snapshots.
   *
   * @example
   * snapshots.reset("db-query");
   * snapshots.reset();
   */
  public reset(name?: string): void {
    if (name) {
      this.snapshots.delete(name);
    } else {
      this.snapshots.clear();
    }
  }
}
