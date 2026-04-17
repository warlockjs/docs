import events from "@mongez/events";
import { getSealConfig, v, type ObjectValidator } from "@warlock.js/seal";
import type {
  DriverContract,
  InsertResult,
  UpdateOperations,
  UpdateResult,
} from "../contracts/database-driver.contract";
import type {
  WriterContract,
  WriterOptions,
  WriterResult,
} from "../contracts/database-writer.contract";
import type { ChildModel, Model } from "../model/model";
import { getModelUpdatedEvent } from "../sync/model-events";
import type { StrictMode } from "../types";
import { DatabaseWriterValidationError } from "../validation";
import type { DataSource } from "./../data-source/data-source";

/**
 * Database writer service that orchestrates model persistence.
 *
 * Handles the complete save pipeline:
 * 1. Check for changes (skip if no changes and not new)
 * 2. Emit `saving` event (for data enrichment)
 * 3. Emit `validating` event
 * 4. Validate and cast data via @warlock.js/seal schema
 * 5. Emit `validated` event
 * 6. Generate ID (for new NoSQL records)
 * 7. Emit `creating`/`updating` events
 * 8. Execute insert or update via driver
 * 9. Merge returned data into model
 * 10. Reset dirty tracker and update `isNew` flag
 * 11. Emit `saved` and `created`/`updated` events
 *
 * @example
 * ```typescript
 * const user = new User({ name: "Alice", email: "alice@example.com" });
 * const writer = new DatabaseWriter(user);
 * await writer.save();
 *
 * console.log(user.get("id")); // 1 (auto-generated)
 * console.log(user.get("_id")); // ObjectId("...")
 *
 * // Update existing record
 * user.set("name", "Alice Smith");
 * await writer.save();
 * // Only updates the "name" field (partial update)
 *
 * // Silent save (no events)
 * await writer.save({ skipEvents: true });
 * ```
 */
export class DatabaseWriter implements WriterContract {
  /** The model instance being persisted */
  private readonly model: Model;

  /** Model constructor reference */
  private readonly ctor: ChildModel<Model>;

  /** Data source containing driver and ID generator */
  private readonly dataSource: DataSource;

  /** Database driver for executing queries */
  private readonly driver: DriverContract;

  /** Table/collection name */
  private readonly table: string;

  /** Primary key field name */
  private readonly primaryKey: string;

  /** Validation schema (if defined) */
  private readonly schema?: ObjectValidator;

  /** Strict mode configuration */
  private readonly strictMode: StrictMode;

  /**
   * Create a new writer instance for a model.
   *
   * @param model - The model instance to persist
   *
   * @example
   * ```typescript
   * const user = new User({ name: "Alice" });
   * const writer = new DatabaseWriter(user);
   * await writer.save();
   * ```
   */
  public constructor(model: Model) {
    this.model = model;
    this.ctor = model.constructor as ChildModel<Model>;
    this.dataSource = this.ctor.getDataSource();
    this.driver = this.dataSource.driver;
    this.table = this.ctor.table;
    this.primaryKey = this.ctor.primaryKey;
    this.schema = this.ctor.schema;
    this.strictMode = this.ctor.strictMode;
  }

  /**
   * Save the model instance to the database.
   *
   * @param options - Save options
   * @returns Result with success status, document, and metadata
   * @throws {ValidationError} If validation fails
   */
  public async save(options: WriterOptions = {}): Promise<WriterResult> {
    const isInsert = this.model.isNew;

    // 1. Check if model has changes (skip if no changes and not new)
    if (!isInsert && !this.model.hasChanges()) {
      return {
        success: true,
        document: this.model.data,
        isNew: false,
        modifiedCount: 0,
      };
    }

    // 2. Emit saving event (before validation for data enrichment)
    if (!options.skipEvents) {
      await this.model.emitEvent("saving", {
        isInsert,
        options,
        mode: isInsert ? "insert" : "update",
      });
    }

    // 3. Validate and cast data
    await this.validateAndCast(isInsert, options);

    // 4. Execute insert or update
    let result: InsertResult | UpdateResult;

    if (isInsert) {
      result = await this.performInsert(options);
    } else {
      result = await this.performUpdate(options);
    }

    // 5. Reset dirty tracker and update isNew flag
    const changedFields = isInsert ? [] : this.model.getDirtyColumns();
    this.model.dirtyTracker.reset();
    this.model.isNew = false;

    // 6. Emit post-save events
    if (!options.skipEvents) {
      await this.model.emitEvent("saved");
      await this.model.emitEvent(isInsert ? "created" : "updated");
    }

    // 7. Trigger sync operations (fire-and-forget, non-blocking)
    if (!options.skipSync && !isInsert) {
      void this.triggerSync(changedFields);
    }

    return {
      success: true,
      document: this.model.data,
      isNew: isInsert,
      modifiedCount: isInsert ? undefined : (result as UpdateResult).modifiedCount,
    };
  }

  /**
   * Validate and cast model data using the schema.
   *
   * Updates the model's data in-place with validated/casted values.
   *
   * @param isInsert - Whether this is an insert operation
   * @param options - Save options
   * @throws {ValidationError} If validation fails
   * @private
   */
  private async validateAndCast(isInsert: boolean, options: WriterOptions): Promise<void> {
    // Emit validating event
    if (!options.skipEvents) {
      await this.model.emitEvent("validating", {
        isInsert,
        options,
        mode: isInsert ? "insert" : "update",
      });
    }

    // Skip validation if requested or no schema defined
    if (options.skipValidation || !this.schema) {
      return;
    }

    // Clone schema for partial data (updates only)
    const validationSchema = isInsert
      ? this.schema.clone()
      : this.schema.clone(Object.keys(this.model.data)).extend({
          id: v.scalar().optional(),
          _id: v.any().optional(),
          [this.ctor.createdAtColumn as string]: v.date().optional(),
          [this.ctor.updatedAtColumn as string]: v.date().optional(),
        });

    // Apply strict mode
    if (this.strictMode === "strip") {
      validationSchema.stripUnknown();
    } else if (this.strictMode === "fail") {
      validationSchema.allowUnknown(false);
    } else if (this.strictMode === "allow") {
      validationSchema.allowUnknown(true);
    }

    // Run validation
    const result = await v.validate(validationSchema, this.model.data, {
      context: {
        model: this.model,
      },
      ...getSealConfig(),
    });

    if (!result.isValid) {
      console.trace(result.errors);

      const error = new DatabaseWriterValidationError(
        `[${this.model.constructor.name} Model] ${isInsert ? "Insert" : "Update"} Validation failed`,
        result.errors,
      );
      if (!options.skipEvents) {
        await this.model.emitEvent("validated", { result, error });
      }
      throw error;
    }

    // Update model data with validated/casted data
    this.model.replaceData(result.data);

    // Emit validated event
    if (!options.skipEvents) {
      await this.model.emitEvent("validated", { result });
    }
  }

  /**
   * Perform an insert operation.
   *
   * @param options - Save options
   * @returns Insert result
   * @private
   */
  private async performInsert(options: WriterOptions): Promise<InsertResult> {
    // Generate ID if needed (NoSQL only)
    await this.generateNextId();

    // Get data to insert (already validated and casted)
    const dataToInsert = this.model.data;

    // Add createdAt and updatedAt to the data (using resolved column names)
    // The column names are already resolved through the hierarchy:
    // Model static property > Database config > Driver defaults > undefined
    const createdAtColumn = this.ctor.createdAtColumn;

    if (createdAtColumn) {
      dataToInsert[createdAtColumn] = new Date();
    }

    const updatedAtColumn = this.ctor.updatedAtColumn;
    if (updatedAtColumn) {
      dataToInsert[updatedAtColumn] = new Date();
    }

    // Emit creating event
    if (!options.skipEvents) {
      await this.model.emitEvent("creating");
    }

    // INSERT: use full validated data
    const result = await this.driver.insert(this.table, dataToInsert);

    // Merge returned data (e.g., generated _id, timestamps)
    // Note: We use merge here because the result might not include all fields
    // (e.g., our generated 'id' field), and we don't want to lose them
    this.model.merge(result.document as Record<string, unknown>);

    // Reset dirty tracker immediately after merge to prevent
    // database-generated fields (like _id) from being marked as dirty
    this.model.dirtyTracker.reset();

    return result;
  }

  /**
   * Perform an update operation.
   *
   * @param options - Save options
   * @returns Update result
   * @private
   */
  private async performUpdate(options: WriterOptions): Promise<UpdateResult> {
    // Emit updating event
    if (!options.skipEvents) {
      await this.model.emitEvent("updating");
    }

    // Update the updatedAt timestamp (using resolved column name)
    const updatedAtColumn = this.ctor.updatedAtColumn;
    if (updatedAtColumn) {
      this.model.set(updatedAtColumn, new Date());
    }

    if (options.replace) {
      const document = await this.driver.replace(
        this.table,
        {
          [this.primaryKey]: this.model.get(this.primaryKey),
        },
        this.model.data,
      );

      if (document) {
        this.model.replaceData(document as Record<string, unknown>);
      }

      return { modifiedCount: document ? 1 : 0 };
    }

    // Build operations from dirty tracker
    const operations = this.buildUpdateOperations();

    // Build filter using primary key
    const filter = { [this.primaryKey]: this.model.get(this.primaryKey) };

    // Execute update with operations
    return await this.driver.update(this.table, filter, operations);
  }

  /**
   * Generate ID for the model if auto-generation is enabled.
   *
   * @private
   */
  public async generateNextId(): Promise<void> {
    if (!this.ctor.autoGenerateId || this.model.get("id")) {
      return;
    }

    const idGenerator = this.dataSource.idGenerator;
    if (!idGenerator) {
      return;
    }

    // Resolve ID generation options from model configuration
    const initialId = this.resolveInitialId();

    const incrementIdBy = this.resolveIncrementBy();

    const id = await idGenerator.generateNextId({
      table: this.table,
      initialId,
      incrementIdBy,
    });

    this.model.set("id", id);
  }

  /**
   * Build update operations from the model's dirty tracker.
   *
   * Handles both modified fields ($set) and removed fields ($unset).
   *
   * @returns Update operations for the driver
   * @private
   *
   * @example
   * ```typescript
   * // Model with changes
   * user.set("name", "Alice");
   * user.unset("tempField");
   *
   * const operations = this.buildUpdateOperations();
   * // {
   * //   $set: { name: "Alice" },
   * //   $unset: { tempField: 1 }
   * // }
   * ```
   */
  private buildUpdateOperations(): UpdateOperations {
    const operations: UpdateOperations = {};

    // Get dirty columns (modified fields)
    const dirtyColumns = this.model.getDirtyColumns();

    if (dirtyColumns.length > 0) {
      operations.$set = {};
      for (const column of dirtyColumns) {
        const value = this.model.get(column);
        if (value === undefined) continue;

        operations.$set[column] = this.model.get(column);
      }
    }

    // Get removed columns
    const removedColumns = this.model.getRemovedColumns();
    if (removedColumns.length > 0) {
      operations.$unset = {};
      for (const column of removedColumns) {
        operations.$unset[column] = 1;
      }
    }

    return operations;
  }

  /**
   * Resolve the initial ID from model configuration.
   *
   * Priority:
   * 1. Model.initialId (explicit value)
   * 2. Model.randomInitialId (random or function)
   * 3. Default: 1
   *
   * @returns The initial ID value
   * @private
   */
  private resolveInitialId(): number {
    if (this.ctor.initialId) {
      return this.ctor.initialId;
    }

    if (this.ctor.randomInitialId) {
      return typeof this.ctor.randomInitialId === "function"
        ? this.ctor.randomInitialId()
        : this.randomInt(10000, 499999);
    }

    return 1; // Default initial ID
  }

  /**
   * Resolve the increment value from model configuration.
   *
   * Priority:
   * 1. Model.incrementIdBy (explicit value)
   * 2. Model.randomIncrement (random or function)
   * 3. Default: 1
   *
   * @returns The increment value
   * @private
   */
  private resolveIncrementBy(): number {
    if (this.ctor.incrementIdBy) {
      return this.ctor.incrementIdBy;
    }

    if (this.ctor.randomIncrement) {
      return typeof this.ctor.randomIncrement === "function"
        ? this.ctor.randomIncrement()
        : this.randomInt(1, 10);
    }

    return 1; // Default increment
  }

  /**
   * Generate a random integer between min and max (inclusive).
   *
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer
   * @private
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Trigger sync operations after successful save.
   *
   * Emits a model.updated event that ModelSyncOperation listens to.
   * The sync is handled by registered sync operations, not directly here.
   *
   * @param changedFields - Fields that were changed (for filtering)
   * @private
   */
  private async triggerSync(changedFields: string[]): Promise<void> {
    // Emit model.updated event - ModelSyncOperation listens to these
    await events.triggerAll(getModelUpdatedEvent(this.ctor), this.model, changedFields);
  }
}
