/**
 * ModelSync facade for registering sync operations.
 *
 * Provides a clean API for defining sync relationships between models
 * with automatic cleanup support for HMR (Hot Module Replacement).
 *
 * @module cascade-next/sync/model-sync
 */

import type { ChildModel, Model } from "../model/model";
import { ModelSyncOperation } from "./model-sync-operation";
import type { ModelSyncContract, ModelSyncOperationContract } from "./types";

/**
 * ModelSync facade implementation.
 *
 * Manages sync operation registration with scoped cleanup support.
 * Uses a registration stack to track operations created during
 * a `register()` callback for proper HMR cleanup.
 *
 * @example
 * ```typescript
 * // In events file
 * export const cleanup = modelSync.register(() => {
 *   Category.sync(Product, "category");
 *   Tag.syncMany(Post, "tags").identifyBy("id");
 * });
 * ```
 */
class ModelSyncFacade implements ModelSyncContract {
  /**
   * All active sync operations.
   */
  private readonly operations: ModelSyncOperation[] = [];

  /**
   * Stack for tracking operations during register() callbacks.
   * Each element is an array of operations created in that scope.
   */
  private readonly registrationStack: ModelSyncOperation[][] = [];

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Create a sync operation for a single embedded document.
   *
   * When the source model is updated, the target model's field
   * will be updated with the embedded data.
   *
   * @param source - Source model class that triggers sync
   * @param target - Target model class that receives data
   * @param field - Field path in target model
   * @returns Sync operation for chaining configuration
   *
   * @example
   * ```typescript
   * // When Category updates, update Product.category
   * modelSync.sync(Category, Product, "category");
   *
   * // With configuration
   * modelSync.sync(Category, Product, "category")
   *   .embed("embedMinimal")
   *   .watchFields(["name", "slug"]);
   * ```
   */
  public sync(
    source: ChildModel<Model>,
    target: ChildModel<Model>,
    field: string,
  ): ModelSyncOperationContract {
    const operation = new ModelSyncOperation(source, target, field, false);
    this.trackOperation(operation);
    return operation;
  }

  /**
   * Create a sync operation for an array of embedded documents.
   *
   * When the source model is updated, the corresponding element
   * in the target model's array field will be updated.
   *
   * @param source - Source model class that triggers sync
   * @param target - Target model class that receives data
   * @param field - Array field path in target model
   * @returns Sync operation for chaining configuration
   *
   * @example
   * ```typescript
   * // When Tag updates, update Post.tags[i] where tags[i].id matches
   * modelSync.syncMany(Tag, Post, "tags").identifyBy("id");
   * ```
   */
  public syncMany(
    source: ChildModel<Model>,
    target: ChildModel<Model>,
    field: string,
  ): ModelSyncOperationContract {
    const operation = new ModelSyncOperation(source, target, field, true);
    this.trackOperation(operation);
    return operation;
  }

  /**
   * Register sync operations with automatic cleanup.
   *
   * Executes the callback function which should contain sync registrations.
   * Returns a cleanup function that unsubscribes all operations created
   * during the callback - perfect for HMR module cleanup.
   *
   * @param callback - Function that registers sync operations
   * @returns Cleanup function that unsubscribes all registered operations
   *
   * @example
   * ```typescript
   * // In src/app/blog/events/sync.ts
   * export const cleanup = modelSync.register(() => {
   *   Category.sync(Product, "category");
   *   Tag.syncMany(Post, "tags").identifyBy("id");
   *   Author.sync(Article, "author").unsetOnDelete();
   * });
   * ```
   */
  public register(callback: () => void): () => void {
    // Create a new scope for tracking operations
    const scopedOperations: ModelSyncOperation[] = [];
    this.registrationStack.push(scopedOperations);

    try {
      // Execute callback - operations are tracked via trackOperation()
      callback();
    } finally {
      // Remove the scope from stack
      this.registrationStack.pop();
    }

    // Return cleanup function for just these scoped operations
    return () => {
      for (const operation of scopedOperations) {
        operation.unsubscribe();

        // Remove from global operations array
        const index = this.operations.indexOf(operation);
        if (index !== -1) {
          this.operations.splice(index, 1);
        }
      }
    };
  }

  /**
   * Clear all registered sync operations.
   * Useful for testing or complete reset.
   */
  public clear(): void {
    for (const operation of this.operations) {
      operation.unsubscribe();
    }
    this.operations.length = 0;
  }

  /**
   * Get count of active sync operations.
   * Useful for debugging and testing.
   */
  public get count(): number {
    return this.operations.length;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Track a new operation in global list and current registration scope.
   */
  private trackOperation(operation: ModelSyncOperation): void {
    // Always add to global operations
    this.operations.push(operation);

    // If inside a register() callback, also track in the current scope
    const currentScope = this.registrationStack[this.registrationStack.length - 1];
    if (currentScope) {
      currentScope.push(operation);
    }
  }
}

/**
 * Global modelSync facade instance.
 *
 * Use this to register sync operations between models.
 *
 * @example
 * ```typescript
 * import { modelSync } from "@warlock.js/cascade";
 *
 * export const cleanup = modelSync.register(() => {
 *   Category.sync(Product, "category");
 * });
 * ```
 */
export const modelSync = new ModelSyncFacade();
