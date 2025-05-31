import type { MongoClientOptions } from "mongodb";
import type { CascadeOnDelete } from "./model/types";

export type DatabaseConfigurations = {
  /**
   * Database host
   */
  host?: string;
  /**
   * Database port
   */
  port?: number;
  /**
   * Database username
   */
  username?: string;
  /**
   * Database password
   */
  password?: string;
  /**
   * Database name
   */
  database?: string;
  /**
   * Database authentication
   */
  dbAuth?: string;
  /**
   * Database URL string
   */
  url?: string;
  /**
   * Debug level
   * Could be one of the following values: `error`, `warn`, `info`
   * @default `warn`
   */
  debugLevel?: "error" | "warn" | "info";
  /**
   * Model configurations
   */
  model?: {
    /**
     * Randomly increment the id
     * If initial id is defined, this option will be ignored
     *
     * @default false
     */
    randomIncrement?: boolean | (() => number);
    /**
     * Randomly generate first id
     * if initial id is defined, this option will be ignored
     * @default false
     */
    randomInitialId?: boolean | (() => number);
    /**
     * Define the initial value of the id
     *
     * @default 1
     */
    initialId?: number;
    /**
     * Define the amount to be incremented by for the next generated id
     *
     * @default 1
     */
    autoIncrementBy?: number;
    /**
     * What to do when a model is deleted for the related model
     * This will be called when calling `Model.sync` or `Model.syncMany``
     * @default "unset"
     */
    cascadeOnDelete?: CascadeOnDelete;
  };
} & Partial<MongoClientOptions>;
