import { type Blueprint } from "../blueprint/blueprint";

export type Migration = {
  /**
   * Migration name
   */
  name: string;
  /**
   * Migration Created at time
   */
  createdAt?: string;
  /**
   * Migration BluePrint
   */
  blueprint: Blueprint;
  /**
   * Run the migration
   */
  up: (blueprint: Blueprint) => Promise<void> | void;
  /**
   * Rollback the migration
   */
  down: (blueprint: Blueprint) => Promise<void> | void;
};

export type RegisteredMigration = Migration & {
  /**
   * Execute the up method
   */
  executeUp: () => Promise<void>;
  /**
   * Execute the down method
   */
  executeDown: () => Promise<void>;
};
