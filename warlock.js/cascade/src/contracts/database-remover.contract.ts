import type { DeleteStrategy } from "../types";

/**
 * Remover service contract for deleting models from the database.
 *
 * The remover orchestrates the complete deletion pipeline:
 * 1. Strategy resolution (options → model static → data source default)
 * 2. Validation (check if model is new, has primary key)
 * 3. Event emission (deleting, deleted)
 * 4. Driver execution (based on strategy: trash, permanent, or soft)
 * 5. Post-deletion cleanup (mark as new, reset state)
 *
 * @example
 * ```typescript
 * const user = await User.find(1);
 * const remover = new DatabaseRemover(user);
 * const result = await remover.destroy();
 *
 * console.log(result.success); // true
 * console.log(result.strategy); // "trash" | "permanent" | "soft"
 * console.log(result.deletedCount); // 1
 * ```
 */
export interface RemoverContract {
  /**
   * Destroy (delete) the model instance from the database.
   *
   * Performs deletion based on the resolved strategy:
   * - `trash`: Moves to trash collection, then deletes
   * - `permanent`: Direct deletion
   * - `soft`: Sets deletedAt timestamp
   *
   * Automatically emits lifecycle events and handles cleanup.
   *
   * @param options - Remover options
   * @returns Result containing success status, strategy used, and metadata
   *
   * @throws {Error} If model is new (not saved) or if deletion fails
   *
   * @example
   * ```typescript
   * // Use default strategy
   * const result = await remover.destroy();
   *
   * // Override strategy
   * await remover.destroy({ strategy: "permanent" });
   *
   * // Skip events (silent delete)
   * await remover.destroy({ skipEvents: true });
   * ```
   */
  destroy(options?: RemoverOptions): Promise<RemoverResult>;
}

/**
 * Options for controlling the destroy operation.
 */
export type RemoverOptions = {
  /**
   * Override the delete strategy for this operation.
   * Takes precedence over model static property and data source default.
   *
   * @default undefined (uses model static or data source default)
   */
  strategy?: DeleteStrategy;

  /**
   * Skip lifecycle event emission.
   * Equivalent to "silent delete" in legacy Cascade.
   *
   * @default false
   */
  skipEvents?: boolean;

  /**
   * Skip sync operations after delete.
   * Useful when you want to delete without triggering sync updates.
   *
   * @default false
   */
  skipSync?: boolean;
};

/**
 * Result returned after a successful destroy operation.
 */
export type RemoverResult = {
  /**
   * Whether the destroy operation succeeded.
   */
  success: boolean;

  /**
   * Number of records deleted.
   * - `1` for permanent and trash strategies
   * - `1` for soft delete (one record updated)
   * - `0` if deletion failed
   */
  deletedCount: number;

  /**
   * The delete strategy that was used.
   */
  strategy: DeleteStrategy;

  /**
   * The trash record (if strategy was "trash").
   * Contains the original record data that was moved to trash.
   */
  trashRecord?: Record<string, unknown>;
};

