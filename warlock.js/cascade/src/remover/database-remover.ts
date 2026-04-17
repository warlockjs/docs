import events from "@mongez/events";
import type { DriverContract, UpdateOperations } from "../contracts/database-driver.contract";
import type {
  RemoverContract,
  RemoverOptions,
  RemoverResult,
} from "../contracts/database-remover.contract";
import type { OnDeletedEventContext } from "../events/model-events";
import type { ChildModel, Model } from "../model/model";
import { getModelDeletedEvent } from "../sync/model-events";
import type { DataSource } from "./../data-source/data-source";

/**
 * Database remover service that orchestrates model deletion.
 *
 * Handles the complete deletion pipeline:
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
 * ```
 */
export class DatabaseRemover implements RemoverContract {
  /** The model instance being deleted */
  private readonly model: Model;

  /** Model constructor reference */
  private readonly ctor: ChildModel<Model>;

  /** Data source containing driver */
  private readonly dataSource: DataSource;

  /** Database driver for executing queries */
  private readonly driver: DriverContract;

  /** Table/collection name */
  private readonly table: string;

  /** Primary key field name */
  private readonly primaryKey: string;

  /**
   * Create a new remover instance for a model.
   *
   * @param model - The model instance to delete
   *
   * @example
   * ```typescript
   * const user = await User.find(1);
   * const remover = new DatabaseRemover(user);
   * await remover.destroy();
   * ```
   */
  public constructor(model: Model) {
    this.model = model;
    this.ctor = model.constructor as ChildModel<Model>;
    this.dataSource = this.ctor.getDataSource();
    this.driver = this.dataSource.driver;
    this.table = this.ctor.table;
    this.primaryKey = this.ctor.primaryKey;
  }

  /**
   * Destroy (delete) the model instance from the database.
   *
   * @param options - Remover options
   * @returns Result containing success status, strategy used, and metadata
   * @throws {Error} If model is new (not saved) or if deletion fails
   */
  public async destroy(options: RemoverOptions = {}): Promise<RemoverResult> {
    // 1. Resolve strategy (options → model static → data source default → permanent)
    const strategy =
      options.strategy ??
      this.ctor.deleteStrategy ??
      this.dataSource.defaultDeleteStrategy ??
      "permanent";

    // 2. Validate model is not new and has primary key
    if (this.model.isNew) {
      throw new Error(
        `Cannot destroy ${this.ctor.name} instance that hasn't been saved to the database.`,
      );
    }

    const primaryKeyValue = this.model.get(this.primaryKey);
    if (!primaryKeyValue) {
      throw new Error(
        `Cannot destroy ${this.ctor.name} instance: primary key (${this.primaryKey}) is missing.`,
      );
    }

    // 3. Emit deleting event (unless skipEvents)
    if (!options.skipEvents) {
      await this.model.emitEvent("deleting", {
        strategy,
        primaryKeyValue,
        primaryKey: this.primaryKey,
      });
    }

    // 4. Execute deletion based on strategy
    let deletedCount = 0;
    let trashRecord: Record<string, unknown> | undefined;

    const filter = { [this.primaryKey]: primaryKeyValue };

    const context: Partial<OnDeletedEventContext> = {
      strategy,
      primaryKeyValue,
      primaryKey: this.primaryKey,
    };

    switch (strategy) {
      case "trash": {
        // Move to trash table, then delete
        const trashTable = this.resolveTrashTable();
        const documentData = { ...this.model.data };

        // Prepare trash record with metadata and handle ID conflicts
        const trashData = this.prepareTrashRecord(documentData);

        // Insert into trash table
        const insertResult = await this.driver.insert(trashTable, trashData);
        trashRecord = insertResult.document as Record<string, unknown>;

        context.trashRecord = trashRecord;

        // Delete original
        const result = await this.driver.delete(this.table, filter);
        deletedCount = result > 0 ? 1 : 0;
        break;
      }

      case "permanent": {
        // Direct deletion
        const result = await this.driver.delete(this.table, filter);
        deletedCount = result > 0 ? 1 : 0;
        break;
      }

      case "soft": {
        // Set deletedAt timestamp (using resolved column name)
        const deletedAtColumn = this.ctor.deletedAtColumn;
        
        // Only proceed if deletedAtColumn is configured (not false or undefined)
        if (deletedAtColumn === false || deletedAtColumn === undefined) {
          throw new Error(
            `Cannot perform soft delete on ${this.ctor.name}: deletedAtColumn is not configured. ` +
            `Set a column name or use a different delete strategy.`,
          );
        }
        
        const updateOperations: UpdateOperations = {
          $set: { [deletedAtColumn]: new Date() },
        };
        const updateResult = await this.driver.update(this.table, filter, updateOperations);
        deletedCount = updateResult.modifiedCount > 0 ? 1 : 0;
        break;
      }
    }

    if (deletedCount === 0) {
      throw new Error(`Failed to destroy ${this.ctor.name} instance: record not found.`);
    }

    context.deletedCount = deletedCount;

    // 5. Post-deletion cleanup
    // Only mark as new for permanent and trash (soft delete keeps the record)
    if (strategy !== "soft") {
      this.model.isNew = true;
    }

    // 6. Emit deleted event (unless skipEvents)
    if (!options.skipEvents) {
      await this.model.emitEvent("deleted", context);
    }

    // 7. Trigger sync operations (fire-and-forget, non-blocking)
    if (!options.skipSync) {
      void this.triggerSync();
    }

    return {
      success: true,
      deletedCount,
      strategy,
      trashRecord,
    };
  }

  /**
   * Prepare the trash record by preserving all original fields and adding deletion metadata.
   *
   * Keeps all original fields intact for easy restoration and adds:
   * - `deletedAt`: Timestamp when the record was deleted
   * - `originalTable`: The table/collection the record came from (for filtering in restoreAll)
   *
   * **ID Handling:**
   * - MongoDB with `_id`: Keeps `_id` as-is (unique across database)
   * - MongoDB with auto-increment `id`: Keeps `id` as a regular field (not primary key)
   * - SQL: Keeps original `id` as a regular field (trash table uses its own auto-increment primary key)
   *
   * The trash table should use its own primary key structure:
   * - MongoDB: Uses `_id` (ObjectId) as primary key, original `id` is just a field
   * - SQL: Uses auto-increment `trashId` as primary key, original `id` is just a field
   *
   * @param documentData - The original document data
   * @returns Prepared trash record data with all original fields + deletedAt + originalTable
   * @private
   */
  private prepareTrashRecord(documentData: Record<string, unknown>): Record<string, unknown> {
    // Preserve all original fields and add deletion metadata
    return {
      ...documentData,
      deletedAt: new Date(),
      originalTable: this.table,
    };
  }

  /**
   * Resolve the trash table/collection name.
   *
   * Priority:
   * 1. Model.trashTable (if set)
   * 2. Data source defaultTrashTable (e.g., "RecycleBin" for MongoDB)
   * 3. Default pattern: `{table}Trash`
   *
   * @returns The trash table/collection name
   * @private
   */
  private resolveTrashTable(): string {
    if (this.ctor.trashTable) {
      return this.ctor.trashTable;
    }

    if (this.dataSource.defaultTrashTable) {
      return this.dataSource.defaultTrashTable;
    }

    return `${this.table}Trash`;
  }

  /**
   * Trigger sync operations after successful deletion.
   *
   * Emits a model.deleted event that ModelSyncOperation listens to.
   * The sync is handled by registered sync operations, not directly here.
   *
   * @private
   */
  private async triggerSync(): Promise<void> {
    // Emit model.deleted event - ModelSyncOperation listens to these
    await events.triggerAll(getModelDeletedEvent(this.ctor), this.model);
  }
}
