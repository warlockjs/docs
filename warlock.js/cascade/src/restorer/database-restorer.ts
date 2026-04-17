import type { DriverContract, UpdateOperations } from "../contracts/database-driver.contract";
import type {
  RestorerContract,
  RestorerOptions,
  RestorerResult,
} from "../contracts/database-restorer.contract";
import type { DataSource } from "../data-source/data-source";
import type { Model } from "../model/model";
import type { DeleteStrategy } from "../types";

/**
 * Database restorer service that orchestrates model restoration.
 *
 * Handles the complete restoration pipeline:
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
 * ```
 */
export class DatabaseRestorer implements RestorerContract {
  /** Model constructor reference */
  private readonly ctor: typeof Model;

  /** Data source containing driver */
  private readonly dataSource: DataSource;

  /** Database driver for executing queries */
  private readonly driver: DriverContract;

  /** Table/collection name */
  private readonly table: string;

  /** Primary key field name */
  private readonly primaryKey: string;

  /**
   * Create a new restorer instance for a model class.
   *
   * @param modelClass - The model class (static context)
   *
   * @example
   * ```typescript
   * const restorer = new DatabaseRestorer(User);
   * await restorer.restore(123);
   * ```
   */
  public constructor(modelClass: typeof Model) {
    this.ctor = modelClass;
    this.dataSource = modelClass.getDataSource();
    this.driver = this.dataSource.driver;
    this.table = modelClass.table;
    this.primaryKey = modelClass.primaryKey;
  }

  /**
   * Restore a single deleted record by its ID.
   *
   * @param id - The primary key value of the record to restore
   * @param options - Restorer options
   * @returns Result containing success status, strategy used, and restored record
   * @throws {Error} If record not found in trash or soft-deleted records
   * @throws {Error} If ID conflict and onIdConflict is "fail"
   */
  public async restore(
    id: string | number,
    options: RestorerOptions = {},
  ): Promise<RestorerResult> {
    const onIdConflict = options.onIdConflict ?? "assignNew";
    const skipEvents = options.skipEvents ?? false;

    // 1. Resolve strategy (options → model static → data source default)
    const strategy = this.resolveStrategy(options.strategy);

    // 2. Validate strategy (cannot restore permanent deletes)
    if (strategy === "permanent") {
      throw new Error(
        `Cannot restore ${this.ctor.name} with ${this.primaryKey} ${id}: permanently deleted records cannot be restored.`,
      );
    }

    // 3. Fetch record based on strategy
    const recordData = await this.fetchRecordByStrategy(id, strategy);

    if (!recordData) {
      throw new Error(
        `Cannot restore ${this.ctor.name} with ${this.primaryKey} ${id}: record not found in ${strategy === "trash" ? "trash table" : "soft-deleted records"}.`,
      );
    }

    // 4. Prepare record data (remove metadata fields)
    const restoredData = { ...recordData };
    delete restoredData.deletedAt;
    delete restoredData.originalTable;

    // 5. Check for ID conflict and handle
    const finalData = await this.handleIdConflict(restoredData, id, onIdConflict);

    // 6. Create temporary model instance for event emission
    // Note: Model is abstract, but at runtime this.ctor is a concrete subclass
    const model = new (this.ctor as any)(finalData) as Model;

    // 7. Emit restoring event (unless skipEvents)
    if (!skipEvents) {
      await model.emitEvent("restoring");
    }

    // 8. Restore based on strategy
    if (strategy === "trash") {
      // Insert record back into original table (was moved to trash)
      await this.driver.insert(this.table, finalData);
      model.isNew = false;

      // Remove from trash table
      await this.driver.delete(this.resolveTrashTable(), {
        [this.primaryKey]: id,
      });
    } else if (strategy === "soft") {
      // Record still exists, just unset deletedAt (don't insert - would create duplicate!)
      const deletedAtColumn = this.ctor.deletedAtColumn ?? "deletedAt";
      if (deletedAtColumn) {
        const filter = { [this.primaryKey]: id };
        const updateOperations: UpdateOperations = {
          $unset: { [deletedAtColumn]: 1 },
        };

        await this.driver.update(this.table, filter, updateOperations);
        model.isNew = false;
      }
    }

    // 10. Emit restored event (unless skipEvents)
    if (!skipEvents) {
      await model.emitEvent("restored");
    }

    return {
      success: true,
      restoredCount: 1,
      strategy,
      restoredRecord: model,
    };
  }

  /**
   * Restore all deleted records for the model's table.
   *
   * @param options - Restorer options
   * @returns Result containing success status, strategy used, and aggregate counts
   */
  public async restoreAll(options: RestorerOptions = {}): Promise<RestorerResult> {
    const onIdConflict = options.onIdConflict ?? "assignNew";
    const skipEvents = options.skipEvents ?? false;

    // 1. Resolve strategy (options → model static → data source default)
    const strategy = this.resolveStrategy(options.strategy);

    // 2. Validate strategy (cannot restore permanent deletes)
    if (strategy === "permanent") {
      throw new Error(
        `Cannot restore all ${this.ctor.name} records: permanently deleted records cannot be restored.`,
      );
    }

    // 3. Fetch all records based on strategy
    const recordsToRestore = await this.fetchAllRecordsByStrategy(strategy);

    if (recordsToRestore.length === 0) {
      return {
        success: true,
        restoredCount: 0,
        strategy,
      };
    }

    // 4. Restore each record
    let restoredCount = 0;
    const conflicts: Array<{ id: string | number; reason: string }> = [];

    const restoredRecords: Model[] = [];

    for (const recordData of recordsToRestore) {
      const id = recordData[this.primaryKey] as string | number;

      try {
        // Prepare record data (remove metadata fields)
        const restoredData = { ...recordData };
        delete restoredData.deletedAt;
        delete restoredData.originalTable;

        // Check for ID conflict
        const idExists = await this.checkIdExists(id);
        if (idExists) {
          if (onIdConflict === "fail") {
            throw new Error(
              `Cannot restore ${this.ctor.name} with ${this.primaryKey} ${id}: ID already exists in target table.`,
            );
          }

          // Assign new ID
          const finalData = await this.assignNewId(restoredData);
          conflicts.push({
            id,
            reason: `ID ${id} already exists, assigned new ID ${finalData[this.primaryKey]}`,
          });

          // Create temporary model for events
          const model = new (this.ctor as any)(finalData) as Model;

          // Emit restoring event
          if (!skipEvents) {
            await model.emitEvent("restoring");
          }

          // Restore based on strategy
          if (strategy === "trash") {
            // Insert with new ID (was moved to trash)
            await this.driver.insert(this.table, finalData);
            model.isNew = false;
          } else if (strategy === "soft") {
            // Record still exists, just unset deletedAt
            const deletedAtColumn = this.ctor.deletedAtColumn ?? "deletedAt";
            if (deletedAtColumn) {
              const filter = { [this.primaryKey]: id };
              const updateOperations: UpdateOperations = {
                $unset: { [deletedAtColumn]: 1 },
              };
              await this.driver.update(this.table, filter, updateOperations);
              model.isNew = false;
            }
          }

          restoredRecords.push(model);

          // Emit restored event
          if (!skipEvents) {
            await model.emitEvent("restored");
          }
        } else {
          // No conflict, restore with original ID
          const model = new (this.ctor as any)(restoredData) as Model;

          // Emit restoring event
          if (!skipEvents) {
            await model.emitEvent("restoring");
          }

          // Restore based on strategy
          if (strategy === "trash") {
            // Insert with original ID (was moved to trash)
            await this.driver.insert(this.table, restoredData);
            model.isNew = false;
          } else if (strategy === "soft") {
            // Record still exists, just unset deletedAt
            const deletedAtColumn = this.ctor.deletedAtColumn ?? "deletedAt";
            if (deletedAtColumn) {
              const filter = { [this.primaryKey]: id };
              const updateOperations: UpdateOperations = {
                $unset: { [deletedAtColumn]: 1 },
              };
              await this.driver.update(this.table, filter, updateOperations);
              model.isNew = false;
            }
          }

          restoredRecords.push(model);

          // Emit restored event
          if (!skipEvents) {
            await model.emitEvent("restored");
          }
        }

        // Remove from trash (only for trash strategy)
        if (strategy === "trash") {
          const trashTable = this.resolveTrashTable();
          const trashFilter = { [this.primaryKey]: id };
          await this.driver.delete(trashTable, trashFilter);
        }

        restoredCount++;
      } catch (error) {
        if (onIdConflict === "fail") {
          throw error;
        }
        // Continue with next record if assignNew mode
        conflicts.push({
          id,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: true,
      restoredCount,
      restoredRecords,
      strategy,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  /**
   * Resolve the delete strategy.
   *
   * Priority: options → model static → data source default → "permanent"
   *
   * @param strategyOption - Optional strategy override from options
   * @returns The resolved delete strategy
   * @private
   */
  private resolveStrategy(strategyOption?: "trash" | "soft"): DeleteStrategy {
    return (
      strategyOption ??
      this.ctor.deleteStrategy ??
      this.dataSource.defaultDeleteStrategy ??
      "permanent"
    );
  }

  /**
   * Fetch a record by ID based on the delete strategy.
   *
   * @param id - The primary key value
   * @param strategy - The delete strategy to use
   * @returns The record data, or null if not found
   * @private
   */
  private async fetchRecordByStrategy(id: string | number, strategy: "trash" | "soft") {
    if (strategy === "trash") {
      const trashTable = this.resolveTrashTable();
      try {
        const trashQuery = await this.driver
          .queryBuilder(trashTable)
          .where(this.primaryKey, id)
          .first<Record<string, unknown>>();

        return trashQuery;
      } catch {
        return null;
      }
    } else if (strategy === "soft") {
      const deletedAtColumn = this.ctor.deletedAtColumn ?? "deletedAt";
      if (!deletedAtColumn) {
        return null;
      }

      try {
        const softDeletedQuery = await this.driver
          .queryBuilder(this.table)
          .where(this.primaryKey, id)
          .whereNotNull(deletedAtColumn)
          .first<Record<string, unknown>>();

        return softDeletedQuery;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Fetch all records based on the delete strategy.
   *
   * @param strategy - The delete strategy to use
   * @returns Array of record data
   * @private
   */
  private async fetchAllRecordsByStrategy(
    strategy: "trash" | "soft",
  ): Promise<Record<string, unknown>[]> {
    if (strategy === "trash") {
      const trashTable = this.resolveTrashTable();
      try {
        const trashQuery = this.driver
          .queryBuilder(trashTable)
          .where("originalTable", this.table)
          .get();

        return (await trashQuery) as Record<string, unknown>[];
      } catch {
        return [];
      }
    } else if (strategy === "soft") {
      const deletedAtColumn = this.ctor.deletedAtColumn ?? "deletedAt";
      if (!deletedAtColumn) {
        return [];
      }

      try {
        const softDeletedQuery = this.driver
          .queryBuilder(this.table)
          .whereNotNull(deletedAtColumn)
          .get();

        return (await softDeletedQuery) as Record<string, unknown>[];
      } catch {
        return [];
      }
    }

    return [];
  }

  /**
   * Handle ID conflict by checking if ID exists and assigning new one if needed.
   *
   * @param recordData - The record data to restore
   * @param originalId - The original ID value
   * @param onIdConflict - Conflict resolution strategy
   * @returns Record data with potentially new ID
   * @private
   */
  private async handleIdConflict(
    recordData: Record<string, unknown>,
    originalId: string | number,
    onIdConflict: "fail" | "assignNew",
  ): Promise<Record<string, unknown>> {
    const idExists = await this.checkIdExists(originalId);

    if (idExists) {
      if (onIdConflict === "fail") {
        throw new Error(
          `Cannot restore ${this.ctor.name} with ${this.primaryKey} ${originalId}: ID already exists in target table.`,
        );
      }

      // Assign new ID
      return await this.assignNewId(recordData);
    }

    return recordData;
  }

  /**
   * Check if an ID already exists in the target table.
   *
   * @param id - The ID to check
   * @returns True if ID exists, false otherwise
   * @private
   */
  private async checkIdExists(id: string | number): Promise<boolean> {
    try {
      const query = this.driver.queryBuilder(this.table).where(this.primaryKey, id).exists();

      return await query;
    } catch {
      return false;
    }
  }

  /**
   * Assign a new ID to the record data.
   *
   * For MongoDB: Generates new ObjectId for `_id`, keeps `id` if it exists
   * For SQL: Removes `id` to let database auto-increment
   *
   * @param recordData - The record data
   * @returns Record data with new ID assigned
   * @private
   */
  private async assignNewId(recordData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const isMongoDb = this.driver.name === "mongodb";
    const newData = { ...recordData };

    if (isMongoDb) {
      // MongoDB: Generate new ObjectId for _id
      if (this.primaryKey === "_id") {
        // Remove _id to let MongoDB generate new one
        delete newData._id;
      } else if (this.primaryKey === "id") {
        // Remove id to let ID generator create new one
        delete newData.id;
      }
    } else {
      // SQL: Remove primary key to let database auto-increment
      delete newData[this.primaryKey];
    }

    return newData;
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
}
