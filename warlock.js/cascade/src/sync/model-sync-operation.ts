/**
 * Model sync operation class.
 *
 * Manages a single sync relationship between a source and target model.
 * Subscribes to source model events and triggers sync operations when
 * the source is updated or deleted.
 *
 * @module cascade-next/sync/model-sync-operation
 */

import events, { type EventSubscription } from "@mongez/events";
import type { ChildModel, Model } from "../model/model";
import { getModelDeletedEvent, getModelUpdatedEvent } from "./model-events";
import { DEFAULT_MAX_SYNC_DEPTH } from "./sync-context";
import { SyncManager } from "./sync-manager";
import type { ModelSyncConfig, ModelSyncOperationContract } from "./types";

/**
 * Manages a single model sync operation.
 *
 * Subscribes to source model events (updated, deleted) and triggers
 * sync operations to update embedded data in target models.
 *
 * @example
 * ```typescript
 * // Created via modelSync.sync() or Model.sync()
 * const operation = new ModelSyncOperation(Category, Product, "category", false);
 * operation
 *   .embed("embedMinimal")
 *   .watchFields(["name", "slug"])
 *   .unsetOnDelete();
 * ```
 */
export class ModelSyncOperation implements ModelSyncOperationContract {
  /**
   * Configuration for this sync operation.
   */
  private readonly config: ModelSyncConfig;

  /**
   * Active event subscriptions for cleanup.
   */
  private readonly subscriptions: EventSubscription[] = [];

  /**
   * Whether this operation is currently subscribed to events.
   */
  private isSubscribed = false;

  /**
   * Create a new model sync operation.
   *
   * @param sourceModel - Source model class that triggers sync
   * @param targetModel - Target model class that receives data
   * @param targetField - Field path in target model
   * @param isMany - Whether this syncs to an array field
   */
  public constructor(
    sourceModelClass: ChildModel<Model>,
    targetModelClass: ChildModel<Model>,
    targetField: string,
    isMany: boolean,
  ) {
    this.config = {
      sourceModel: sourceModelClass,
      targetModel: targetModelClass,
      targetField,
      isMany,
      embedKey: "embedData",
      identifierField: "id",
      maxSyncDepth: DEFAULT_MAX_SYNC_DEPTH,
      watchFields: [],
      unsetOnDelete: false,
      removeOnDelete: false,
    };

    this.subscribe();
  }

  // ============================================================================
  // FLUENT CONFIGURATION
  // ============================================================================

  /**
   * Set the embed method to call on source model.
   *
   * @param embed - getter property name (e.g., "embedData", "embedMinimal") Or Array of fields
   * @returns This operation for chaining
   *
   * @example
   * ```typescript
   * Category.sync(Product, "category").embed("embedMinimal");
   * ```
   */
  public embed(method: string | string[]): this {
    this.config.embedKey = method;
    return this;
  }

  /**
   * Set the identifier field for array matching.
   * Required when syncing to array fields (syncMany).
   *
   * @param field - Field name used as identifier (default: "id")
   * @returns This operation for chaining
   *
   * @example
   * ```typescript
   * Tag.syncMany(Post, "tags").identifyBy("tagId");
   * ```
   */
  public identifyBy(field: string): this {
    this.config.identifierField = field;
    return this;
  }

  /**
   * Set the maximum sync depth for chained operations.
   *
   * @param depth - Maximum depth (default: 3)
   * @returns This operation for chaining
   *
   * @example
   * ```typescript
   * Category.sync(Product, "category").maxDepth(2);
   * ```
   */
  public maxDepth(depth: number): this {
    this.config.maxSyncDepth = depth;
    return this;
  }

  /**
   * Set which fields to watch for changes.
   * Sync only triggers when these fields change.
   *
   * @param fields - Array of field names to watch (empty = all)
   * @returns This operation for chaining
   *
   * @example
   * ```typescript
   * Category.sync(Product, "category").watchFields(["name", "slug"]);
   * ```
   */
  public watchFields(fields: string[]): this {
    this.config.watchFields = fields;
    return this;
  }

  /**
   * Unset the target field when source is deleted.
   *
   * @returns This operation for chaining
   *
   * @example
   * ```typescript
   * Category.sync(Product, "category").unsetOnDelete();
   * ```
   */
  public unsetOnDelete(): this {
    this.config.unsetOnDelete = true;
    return this;
  }

  /**
   * Delete target documents when source is deleted.
   *
   * @returns This operation for chaining
   *
   * @example
   * ```typescript
   * User.sync(Profile, "user").removeOnDelete();
   * ```
   */
  public removeOnDelete(): this {
    this.config.removeOnDelete = true;
    return this;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Subscribe to source model events.
   * Called automatically in constructor.
   */
  private subscribe(): void {
    if (this.isSubscribed) {
      return;
    }

    const sourceModel = this.config.sourceModel;

    // Subscribe to model.updated event
    this.subscriptions.push(
      events.subscribe(getModelUpdatedEvent(sourceModel), this.handleModelUpdated),
    );

    // Subscribe to model.deleted event
    this.subscriptions.push(
      events.subscribe(getModelDeletedEvent(sourceModel), this.handleModelDeleted),
    );

    this.isSubscribed = true;
  }

  /**
   * Unsubscribe from all events and cleanup.
   * Called automatically when using modelSync.register().
   */
  public unsubscribe(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe?.();
    }

    this.subscriptions.length = 0;
    this.isSubscribed = false;
  }

  /**
   * Cleanup the sync operations
   */
  public $cleanup() {
    return this.unsubscribe();
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle model updated event.
   * Triggers sync to update embedded data in target models.
   */
  private handleModelUpdated = async (model: Model, changedFields: string[]): Promise<void> => {
    // Check if we should sync based on watched fields
    if (!this.shouldSync(changedFields)) {
      return;
    }

    try {
      const primaryKey = (this.config.sourceModel as any).primaryKey || "id";
      const sourceId = model.get(primaryKey) as string | number;

      if (!sourceId) {
        return;
      }

      // Get the driver from the source model's data source
      const dataSource = this.config.sourceModel.getDataSource();
      const driver = dataSource.driver;

      // Create sync manager and execute
      const syncManager = new SyncManager(this.config.sourceModel, driver);
      await syncManager.syncUpdateWithConfig(
        sourceId,
        model,
        changedFields,
        this.buildSyncConfig(),
      );
    } catch (error) {
      console.error(
        `[ModelSync] Failed to sync ${this.config.sourceModel.name} -> ${this.config.targetModel.name}:`,
        error,
      );
    }
  };

  /**
   * Handle model deleted event.
   * Triggers unset or remove based on configuration.
   */
  private handleModelDeleted = async (model: Model): Promise<void> => {
    if (!this.config.unsetOnDelete && !this.config.removeOnDelete) {
      return;
    }

    try {
      const primaryKey = (this.config.sourceModel as any).primaryKey || "id";
      const sourceId = model.get(primaryKey) as string | number;

      if (!sourceId) {
        return;
      }

      const dataSource = this.config.sourceModel.getDataSource();
      const driver = dataSource.driver;

      if (this.config.removeOnDelete) {
        // Delete all target documents that reference this source
        await this.removeTargetDocuments(sourceId, driver);
      } else if (this.config.unsetOnDelete) {
        // Unset the field in target documents
        const syncManager = new SyncManager(this.config.sourceModel, driver);
        await syncManager.syncDeleteWithConfig(sourceId, this.buildSyncConfig());
      }
    } catch (error) {
      console.error(
        `[ModelSync] Failed to handle delete for ${this.config.sourceModel.name}:`,
        error,
      );
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Check if sync should proceed based on watched fields.
   */
  private shouldSync(changedFields: string[]): boolean {
    if (this.config.watchFields.length === 0) {
      return true; // Watch all fields
    }

    return this.config.watchFields.some((field) => changedFields.includes(field));
  }

  /**
   * Build sync config compatible with SyncManager.
   */
  private buildSyncConfig(): any {
    return {
      targetField: this.config.targetField,
      isMany: this.config.isMany,
      embedKey: this.config.embedKey,
      identifierField: this.config.identifierField,
      maxSyncDepth: this.config.maxSyncDepth,
      preventCircularSync: true,
      watchFields: this.config.watchFields,
      unsetOnDelete: this.config.unsetOnDelete,
      targetModelClass: this.config.targetModel,
    };
  }

  /**
   * Remove target documents that reference the deleted source.
   */
  private async removeTargetDocuments(sourceId: string | number, driver: any): Promise<void> {
    const filter = this.config.isMany
      ? { [`${this.config.targetField}.${this.config.identifierField}`]: sourceId }
      : { [`${this.config.targetField}.${this.config.identifierField}`]: sourceId };

    await driver.deleteMany(this.config.targetModel.table, filter);
  }

  /**
   * Get the current configuration (for debugging/testing).
   */
  public getConfig(): Readonly<ModelSyncConfig> {
    return { ...this.config };
  }
}
