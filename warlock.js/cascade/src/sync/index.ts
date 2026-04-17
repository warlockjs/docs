/**
 * Sync system exports.
 *
 * @module cascade-next/sync
 */

// Main API
export { modelSync } from "./model-sync";
export { ModelSyncOperation } from "./model-sync-operation";

// Event helpers
export {
  MODEL_EVENT_PREFIX,
  ModelSyncEventType,
  getModelDeletedEvent,
  getModelEvent,
  getModelUpdatedEvent,
} from "./model-events";

// Internal (for advanced use)
export { DEFAULT_MAX_SYNC_DEPTH, SyncContextManager } from "./sync-context";
export { SyncManager } from "./sync-manager";

// Types
export type {
  EmbedKey,
  ModelSyncConfig,
  ModelSyncContract,
  ModelSyncOperationContract,
  SyncConfig,
  SyncContext,
  SyncEventPayload,
  SyncInstruction,
  SyncInstructionOptions,
  SyncResult,
} from "./types";
