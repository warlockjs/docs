import type { TransactionOptions } from "mongodb";

/**
 * MongoDB pipeline stage names.
 */
export type PipelineStage =
  | "$match"
  | "$project"
  | "$sort"
  | "$group"
  | "$lookup"
  | "$limit"
  | "$skip"
  | "$unwind"
  | "$addFields"
  | "$setWindowFields"
  | "$vectorSearch";


/**
 * Represents a single operation in the query builder chain.
 */
export type Operation = {
  /** The MongoDB aggregation stage this operation belongs to */
  stage: PipelineStage;
  /** Whether this operation can be merged with other operations of the same stage */
  mergeable: boolean;
  /** The operation type (for processing logic) */
  type: string;
  /** The operation data */
  data: any;
};

/**
 * MongoDB driver-specific options.
 *
 * These are cascade-next specific configurations for the MongoDB driver,
 * not native MongoDB client options.
 */
export type MongoDriverOptions = {
  /**
   * Enable auto-generation of numeric IDs.
   * When enabled, creates a counter collection for managing sequential IDs.
   * @default false
   */
  autoGenerateId?: boolean;

  /**
   * Counter collection name for auto-generated IDs.
   * @default "counters"
   */
  counterCollection?: string;

  /**
   * Transaction options for this driver.
   * Applied to all transactions unless overridden.
   */
  transactionOptions?: TransactionOptions;
};
