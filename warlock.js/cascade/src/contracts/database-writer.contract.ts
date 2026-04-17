import type { UpdateOperations } from "./database-driver.contract";

/**
 * Writer service contract for persisting models to the database.
 *
 * The writer orchestrates the complete save pipeline:
 * 1. Validation (via @warlock.js/seal)
 * 2. ID generation (for new records in NoSQL)
 * 3. Event emission (validating, saving, created/updated, saved)
 * 4. Driver execution (insert or update)
 * 5. Post-save cleanup (reset dirty tracker, update isNew flag)
 *
 * @example
 * ```typescript
 * const user = new User({ name: "Alice" });
 * const writer = new DatabaseWriter(user);
 * const result = await writer.save();
 *
 * console.log(result.success); // true
 * console.log(result.isNew); // true (was an insert)
 * console.log(result.document); // { _id: ..., id: 1, name: "Alice" }
 * ```
 */
export interface WriterContract {
  /**
   * Save the model instance to the database.
   *
   * Performs insert if `model.isNew === true`, otherwise performs update.
   * Automatically validates, casts, generates IDs, and emits lifecycle events.
   *
   * @param options - Save options
   * @returns Result containing success status, document, and metadata
   *
   * @throws {ValidationError} If validation fails
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * // Insert
   * const user = new User({ name: "Alice" });
   * const writer = new DatabaseWriter(user);
   * await writer.save();
   *
   * // Update
   * user.set("name", "Bob");
   * await writer.save();
   *
   * // Skip validation
   * await writer.save({ skipValidation: true });
   *
   * // Skip events (silent save)
   * await writer.save({ skipEvents: true });
   * ```
   */
  save(options?: WriterOptions): Promise<WriterResult>;
}

/**
 * Options for controlling the save operation.
 */
export type WriterOptions = {
  /**
   * Skip validation and casting.
   * Useful when data is already validated or for performance-critical operations.
   *
   * @default false
   */
  skipValidation?: boolean;

  /**
   * Skip lifecycle event emission.
   * Equivalent to "silent save" in legacy Cascade.
   *
   * @default false
   */
  skipEvents?: boolean;

  /**
   * Skip sync operations after save.
   * Useful when you want to save without triggering sync updates.
   *
   * @default false
   */
  skipSync?: boolean;

  /**
   * Replace entire document with the new data.
   * By default, Model will only update or unset the dirty changes.
   * @default false
   */
  replace?: boolean;
};

/**
 * Result returned after a successful save operation.
 */
export type WriterResult = {
  /**
   * Whether the save operation succeeded.
   */
  success: boolean;

  /**
   * The saved document with all database-generated fields.
   * Includes _id, id, timestamps, etc.
   */
  document: Record<string, unknown>;

  /**
   * Whether this was an insert operation.
   * - `true`: New record was created
   * - `false`: Existing record was updated
   */
  isNew: boolean;

  /**
   * Number of records modified (for updates only).
   * Undefined for insert operations.
   */
  modifiedCount?: number;
};

/**
 * Internal type for building update operations from dirty tracker.
 *
 * @internal
 */
export type BuildUpdateOperationsResult = UpdateOperations;
