/**
 * Sync context management and validation.
 *
 * @module cascade-next/sync/sync-context
 */

import type { SyncContext, SyncInstruction } from "./types";

/**
 * Default maximum sync depth.
 * Prevents infinite sync chains.
 */
export const DEFAULT_MAX_SYNC_DEPTH = 3;

/**
 * Manages sync context and provides validation utilities.
 */
export class SyncContextManager {
  /**
   * Creates a new sync context from a sync instruction.
   *
   * @param instruction - The sync instruction to create context from
   * @param affectedCount - Number of documents affected
   * @returns A new sync context
   */
  public static createContext(
    instruction: SyncInstruction,
    affectedCount: number,
  ): SyncContext {
    return {
      sourceModel: instruction.sourceModel,
      sourceId: instruction.sourceId,
      currentDepth: instruction.depth,
      syncChain: [...instruction.chain],
      targetModel: instruction.targetModel,
      filter: { ...instruction.filter },
      update: { ...instruction.update },
      affectedCount,
      timestamp: new Date(),
    };
  }

  /**
   * Validates if a sync operation can proceed based on depth and cycle detection.
   *
   * @param depth - Current sync depth
   * @param chain - Current sync chain
   * @param targetModel - Target model name
   * @param maxDepth - Maximum allowed depth
   * @param preventCircular - Whether to prevent circular references
   * @returns Validation result with success flag and optional error message
   */
  public static validate(
    depth: number,
    chain: string[],
    targetModel: string,
    maxDepth: number,
    preventCircular: boolean,
  ): { valid: boolean; error?: string } {
    // Check depth limit
    if (depth > maxDepth) {
      return {
        valid: false,
        error: `Sync depth limit exceeded: ${depth} > ${maxDepth}. Chain: ${chain.join(" → ")}`,
      };
    }

    // Check for circular references
    if (preventCircular && this.hasCycle(chain, targetModel)) {
      return {
        valid: false,
        error: `Circular sync detected: ${targetModel} already exists in chain [${chain.join(" → ")}]`,
      };
    }

    return { valid: true };
  }

  /**
   * Checks if adding a target model would create a cycle in the sync chain.
   *
   * @param chain - Current sync chain
   * @param targetModel - Model to be added to the chain
   * @returns True if adding the model would create a cycle
   */
  public static hasCycle(chain: string[], targetModel: string): boolean {
    return chain.includes(targetModel);
  }

  /**
   * Creates a new sync chain by appending a model name.
   *
   * @param chain - Current sync chain
   * @param modelName - Model name to append
   * @returns New sync chain array
   */
  public static extendChain(chain: string[], modelName: string): string[] {
    return [...chain, modelName];
  }

  /**
   * Formats a sync chain for display.
   *
   * @param chain - Sync chain to format
   * @returns Formatted string (e.g., "Category → Product → Module")
   */
  public static formatChain(chain: string[]): string {
    return chain.join(" → ");
  }

  /**
   * Checks if the current depth allows for further syncing.
   *
   * @param currentDepth - Current depth in the chain
   * @param maxDepth - Maximum allowed depth
   * @returns True if more syncing is allowed
   */
  public static canSyncDeeper(
    currentDepth: number,
    maxDepth: number,
  ): boolean {
    return currentDepth < maxDepth;
  }
}

