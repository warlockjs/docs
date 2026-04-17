import type { Model } from "../model/model";

/**
 * Restorer service contract for restoring deleted models from the database.
 *
 * The restorer orchestrates the complete restoration pipeline:
 * 1. Strategy detection (trash vs soft delete)
 * 2. Record retrieval from trash table or soft-deleted records
 * 3. ID conflict resolution
 * 4. Event emission (restoring, restored)
 * 5. Driver execution (insert back to original table, remove from trash/clear deletedAt)
 *
 * @example
 * ```typescript
 * const restorer = new DatabaseRestorer(User);
 * const result = await restorer.restore(123);
 *
 * console.log(result.success); // true
 * console.log(result.strategy); // "trash" | "soft"
 * console.log(result.restoredCount); // 1
 * ```
 */
export interface RestorerContract {
  /**
   * Restore a single deleted record by its ID.
   *
   * Resolves the delete strategy from options → model static → data source default.
   * Handles ID conflicts based on options.
   *
   * @param id - The primary key value of the record to restore
   * @param options - Restorer options
   * @returns Result containing success status, strategy used, and restored record
   *
   * @throws {Error} If strategy is "permanent" (cannot restore permanently deleted records)
   * @throws {Error} If record not found in trash or soft-deleted records
   * @throws {Error} If ID conflict and onIdConflict is "fail"
   *
   * @example
   * ```typescript
   * // Restore with default options (assign new ID if conflict)
   * const result = await restorer.restore(123);
   *
   * // Restore with explicit strategy
   * await restorer.restore(123, { strategy: "trash" });
   *
   * // Restore and fail if ID conflict
   * await restorer.restore(123, { onIdConflict: "fail" });
   *
   * // Silent restore (skip events)
   * await restorer.restore(123, { skipEvents: true });
   * ```
   */
  restore(
    id: string | number,
    options?: RestorerOptions,
  ): Promise<RestorerResult>;

  /**
   * Restore all deleted records for the model's table.
   *
   * Restores all records from the trash table (if using trash strategy)
   * or all soft-deleted records (if using soft strategy).
   *
   * @param options - Restorer options
   * @returns Result containing success status, strategy used, and aggregate counts
   *
   * @example
   * ```typescript
   * // Restore all with default options
   * const result = await restorer.restoreAll();
   *
   * // Restore all and fail on any ID conflict
   * await restorer.restoreAll({ onIdConflict: "fail" });
   * ```
   */
  restoreAll(options?: RestorerOptions): Promise<RestorerResult>;
}

/**
 * Options for controlling the restore operation.
 */
export type RestorerOptions = {
  /**
   * Override the delete strategy for this operation.
   * Takes precedence over model static property and data source default.
   *
   * Must be "trash" or "soft" (cannot restore permanently deleted records).
   *
   * @default undefined (uses model static or data source default)
   */
  strategy?: "trash" | "soft";

  /**
   * Behavior when the original ID already exists in the target table.
   *
   * - `"assignNew"`: Automatically assign a new ID (default)
   * - `"fail"`: Throw an error if ID conflict occurs
   *
   * @default "assignNew"
   */
  onIdConflict?: "fail" | "assignNew";

  /**
   * Skip lifecycle event emission.
   * Equivalent to "silent restore".
   *
   * @default false
   */
  skipEvents?: boolean;
};

/**
 * Result returned after a successful restore operation.
 */
export type RestorerResult = {
  /**
   * Whether the restore operation succeeded.
   */
  success: boolean;

  /**
   * Number of records restored.
   * - `1` for single restore
   * - `N` for restoreAll (number of records restored)
   */
  restoredCount: number;

  /**
   * The delete strategy that was used for restoration.
   * - `"trash"`: Record was restored from trash table
   * - `"soft"`: Record was restored by clearing deletedAt timestamp
   */
  strategy: "trash" | "soft";

  /**
   * The restored record data (for single restore only).
   * Contains the record that was restored, with potentially new ID if conflict occurred.
   */
  restoredRecord?: Model;

  /**
   * The restored records list
   */
  restoredRecords?: Model[];

  /**
   * List of ID conflicts that occurred during restoreAll.
   * Only populated if onIdConflict is "assignNew" and conflicts occurred.
   */
  conflicts?: Array<{
    /** The original ID that conflicted */
    id: string | number;
    /** Reason for the conflict */
    reason: string;
  }>;
};
