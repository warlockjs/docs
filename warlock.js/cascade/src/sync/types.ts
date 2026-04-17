/**
 * Core types for the sync system.
 *
 * @module cascade-next/sync/types
 */

import type { ChildModel, Model } from "../model/model";

/**
 * Context information for a sync operation.
 * Tracks the source, target, chain, and results of a sync operation.
 */
export type SyncContext = {
  /** Source model name (e.g., "Category") */
  sourceModel: string;

  /** Source model primary key value */
  sourceId: string | number;

  /** Current depth in the sync chain (1, 2, 3...) */
  currentDepth: number;

  /** Chain of model names in the sync path (e.g., ["Category", "Product"]) */
  syncChain: string[];

  /** Target model name being synced to */
  targetModel: string;

  /** Filter to identify documents to update in target */
  filter: Record<string, unknown>;

  /** Update operations to apply to matched documents */
  update: Record<string, unknown>;

  /** Number of documents affected by this sync operation */
  affectedCount: number;

  /** Timestamp when the sync operation was executed */
  timestamp: Date;
};

/**
 * Result of a sync operation.
 * Contains success status, counts, and error details.
 */
export type SyncResult = {
  /** Whether the overall sync operation succeeded */
  success: boolean;

  /** Total number of sync instructions attempted */
  attempted: number;

  /** Number of sync instructions that succeeded */
  succeeded: number;

  /** Number of sync instructions that failed */
  failed: number;

  /** Detailed error information for failed operations */
  errors: Array<{ instruction: SyncInstruction; error: Error }>;

  /** Maximum depth reached in the sync chain */
  depthReached: number;

  /** All sync contexts created during the operation */
  contexts: SyncContext[];
};

/**
 * A single sync instruction to be executed.
 * Contains all information needed to perform a sync update.
 */
export type SyncInstruction = {
  /** Target table/collection name */
  targetTable: string;

  /** Target model name */
  targetModel: string;

  /** Filter to identify documents to update */
  filter: Record<string, unknown>;

  /** Update operations to apply */
  update: Record<string, unknown>;

  /** Current depth in the sync chain */
  depth: number;

  /** Chain of model names leading to this instruction */
  chain: string[];

  /** Source model name */
  sourceModel: string;

  /** Source model ID */
  sourceId: string | number;

  /** Whether this is an array update (requires positional operator) */
  isArrayUpdate?: boolean;

  /** Array field path for positional updates */
  arrayField?: string;

  /** Identifier field for array matching */
  identifierField?: string;

  /** Identifier value for array matching */
  identifierValue?: string | number;
};

/**
 * Configuration for a single sync relationship.
 */
export type SyncConfig = {
  /** Target field path in the target model (e.g., "category" or "products") */
  targetField: string;

  /** Whether this is a many relationship (array of embedded documents) */
  isMany: boolean;

  /** Method name to call on source model to get embedded data */
  embedKey: string;

  /** Field name to use as identifier in array matching (for isMany) */
  identifierField: string;

  /** Maximum sync depth allowed from this relationship */
  maxSyncDepth: number;

  /** Whether to prevent circular sync chains */
  preventCircularSync: boolean;

  /** Fields to watch for changes (empty = all fields) */
  watchFields: string[];

  /** Whether to unset the field when source is deleted */
  unsetOnDelete: boolean;

  /** Target model class (for chaining) */
  targetModelClass: ChildModel<Model>;
};

/**
 * Options for building sync instructions.
 */
export type SyncInstructionOptions = {
  /** Current depth in the sync chain */
  currentDepth: number;

  /** Chain of model names leading to this point */
  syncChain: string[];

  /** Maximum allowed depth for this sync operation */
  maxDepth: number;

  /** Whether to prevent circular references */
  preventCircular: boolean;
};

/**
 * Payload for collecting sync instructions.
 */
export type CollectInstructionsPayload = {
  /** Source model ID */
  sourceId: string | number;

  /** Updated data to sync (can be Model instance or plain data) */
  updatedData: Record<string, unknown> | Model;

  /** Fields that changed */
  changedFields: string[];

  /** Sync configurations */
  syncConfigs: SyncConfig[];

  /** Instruction options (depth, chain, etc.) */
  options: SyncInstructionOptions;
};

/**
 * Standard embed proeprties names.
 */
export type EmbedKey = "embedData" | "embedParent" | "embedMinimal";

/**
 * Event payload for sync events.
 */
export type SyncEventPayload = {
  /** Source model name */
  sourceModel: string;

  /** Source model ID */
  sourceId: string | number;

  /** Target model name */
  targetModel: string;

  /** Filter used to identify target documents */
  filter: Record<string, unknown>;

  /** Update operations applied */
  update: Record<string, unknown>;

  /** Number of documents affected */
  affectedCount: number;

  /** Current depth in sync chain */
  depth: number;

  /** Sync chain path */
  chain: string[];
};

// ============================================================================
// ModelSync API Types
// ============================================================================

/**
 * Configuration for a model sync operation.
 *
 * Holds all settings for how a source model syncs to a target model.
 */
export type ModelSyncConfig = {
  /** Source model class that triggers sync on changes */
  readonly sourceModel: ChildModel<Model>;

  /** Target model class that receives synced data */
  readonly targetModel: ChildModel<Model>;

  /** Field path in target model where data is embedded */
  readonly targetField: string;

  /** Whether this syncs to an array field (true) or single field (false) */
  readonly isMany: boolean;

  /** Method name on source model to get embedded data */
  embedKey: string | string[];

  /** Field name used as identifier when syncing to arrays */
  identifierField: string;

  /** Maximum depth for chained sync operations */
  maxSyncDepth: number;

  /** Fields to watch - sync only triggers when these change (empty = all) */
  watchFields: string[];

  /** Whether to unset the target field when source is deleted */
  unsetOnDelete: boolean;

  /** Whether to delete target documents when source is deleted */
  removeOnDelete: boolean;
};

/**
 * Contract for a model sync operation instance.
 *
 * Provides fluent configuration methods and lifecycle management.
 *
 * @example
 * ```typescript
 * Category.sync(Product, "category")
 *   .embed("embedMinimal")
 *   .watchFields(["name", "slug"])
 *   .unsetOnDelete();
 * ```
 */
export interface ModelSyncOperationContract {
  /**
   * Set the embed method to call on source model.
   *
   * @param method - Method name (e.g., "embedData", "embedMinimal") or an array of strings
   * @returns This operation for chaining
   */
  embed(method: string | string[]): this;

  /**
   * Set the identifier field for array matching.
   * Required when syncing to array fields (syncMany).
   *
   * @param field - Field name used as identifier (default: "id")
   * @returns This operation for chaining
   */
  identifyBy(field: string): this;

  /**
   * Set the maximum sync depth for chained operations.
   *
   * @param depth - Maximum depth (default: 3)
   * @returns This operation for chaining
   */
  maxDepth(depth: number): this;

  /**
   * Set which fields to watch for changes.
   * Sync only triggers when these fields change.
   *
   * @param fields - Array of field names to watch (empty = all)
   * @returns This operation for chaining
   */
  watchFields(fields: string[]): this;

  /**
   * Unset the target field when source is deleted.
   *
   * @returns This operation for chaining
   */
  unsetOnDelete(): this;

  /**
   * Delete target documents when source is deleted.
   *
   * @returns This operation for chaining
   */
  removeOnDelete(): this;

  /**
   * Unsubscribe from all events and cleanup.
   * Called automatically when using modelSync.register().
   */
  unsubscribe(): void;
}

/**
 * Contract for the modelSync facade.
 *
 * Provides methods to create and manage sync operations.
 *
 * @example
 * ```typescript
 * export const cleanup = modelSync.register(() => {
 *   Category.sync(Product, "category");
 *   Tag.syncMany(Post, "tags").identifyBy("id");
 * });
 * ```
 */
export interface ModelSyncContract {
  /**
   * Create a sync operation for a single embedded document.
   *
   * @param source - Source model class that triggers sync
   * @param target - Target model class that receives data
   * @param field - Field path in target model
   * @returns Sync operation for chaining configuration
   */
  sync(
    source: ChildModel<Model>,
    target: ChildModel<Model>,
    field: string,
  ): ModelSyncOperationContract;

  /**
   * Create a sync operation for an array of embedded documents.
   *
   * @param source - Source model class that triggers sync
   * @param target - Target model class that receives data
   * @param field - Array field path in target model
   * @returns Sync operation for chaining configuration
   */
  syncMany(
    source: ChildModel<Model>,
    target: ChildModel<Model>,
    field: string,
  ): ModelSyncOperationContract;

  /**
   * Register sync operations with automatic cleanup.
   *
   * @param callback - Function that registers sync operations
   * @returns Cleanup function that unsubscribes all registered operations
   */
  register(callback: () => void): () => void;
}
