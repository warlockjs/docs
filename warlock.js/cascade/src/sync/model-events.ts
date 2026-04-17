/**
 * Model sync event name helpers.
 *
 * Provides type-safe event names for model sync operations.
 * Avoids hardcoded string literals throughout the codebase.
 *
 * @module cascade-next/sync/model-events
 */

import type { ChildModel, Model } from "../model/model";

/**
 * Event name prefix for all model sync events.
 */
export const MODEL_EVENT_PREFIX = "model";

/**
 * Model sync event types.
 */
export const ModelSyncEventType = {
  UPDATED: "updated",
  DELETED: "deleted",
} as const;

export type ModelSyncEventTypeName = (typeof ModelSyncEventType)[keyof typeof ModelSyncEventType];

/**
 * Get the event name for a model update.
 *
 * @param modelClass - The model class
 * @returns Event name string (e.g., "model.Category.updated")
 *
 * @example
 * ```typescript
 * const eventName = getModelUpdatedEvent(Category);
 * // Returns: "model.Category.updated"
 * ```
 */
export function getModelUpdatedEvent(modelClass: ChildModel<Model>): string {
  return `${MODEL_EVENT_PREFIX}.${modelClass.name}.${ModelSyncEventType.UPDATED}`;
}

/**
 * Get the event name for a model deletion.
 *
 * @param modelClass - The model class
 * @returns Event name string (e.g., "model.Category.deleted")
 *
 * @example
 * ```typescript
 * const eventName = getModelDeletedEvent(Category);
 * // Returns: "model.Category.deleted"
 * ```
 */
export function getModelDeletedEvent(modelClass: ChildModel<Model>): string {
  return `${MODEL_EVENT_PREFIX}.${modelClass.name}.${ModelSyncEventType.DELETED}`;
}

/**
 * Get the event name for a model by name string.
 *
 * @param modelName - The model class name
 * @param eventType - The event type
 * @returns Event name string
 *
 * @example
 * ```typescript
 * const eventName = getModelEvent("Category", "updated");
 * // Returns: "model.Category.updated"
 * ```
 */
export function getModelEvent(modelName: string, eventType: ModelSyncEventTypeName): string {
  return `${MODEL_EVENT_PREFIX}.${modelName}.${eventType}`;
}
