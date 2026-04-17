import { SeedResult } from "./types";

export type Seeder = {
  /**
   * Seed name
   */
  name: string;
  /**
   * Whether to enable it
   */
  enabled?: boolean;
  /**
   * Seed description
   */
  description?: string;
  /**
   * List of dependent seeds to run first
   */
  dependsOn?: string[];
  /**
   * Whether to run it once
   */
  once?: boolean;
  /**
   * Seed execution order
   */
  order?: number;
  /**
   * Batch size
   */
  batchSize?: number;
  /**
   * Run seed
   */
  run(): Promise<SeedResult | void>;
};

/**
 * Create a new seeder
 */
export function seeder(seeder: Seeder) {
  return seeder;
}
