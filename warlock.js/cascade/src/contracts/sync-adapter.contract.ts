/**
 * Instruction for a sync operation.
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
 * Contract for database-specific sync adapters.
 * Handles the execution of sync operations at the driver level.
 */
export interface SyncAdapterContract {
  /**
   * Executes a batch of sync instructions.
   *
   * @param instructions - Array of sync instructions to execute
   * @returns Number of documents affected
   */
  executeBatch(instructions: SyncInstruction[]): Promise<number>;

  /**
   * Executes a single sync instruction.
   *
   * @param instruction - The sync instruction to execute
   * @returns Number of documents affected
   */
  executeOne(instruction: SyncInstruction): Promise<number>;

  /**
   * Executes an array update instruction with positional operators.
   *
   * @param instruction - The sync instruction with array update info
   * @returns Number of documents affected
   */
  executeArrayUpdate(instruction: SyncInstruction): Promise<number>;
}
