import { DatabaseDirtyTracker } from "./database-dirty-tracker";

/**
 * A dirty tracker designed for SQL databases where nested objects shouldn't be flattened.
 * Since SQL drivers (like Postgres) replace the entire JSON column when updated,
 * we keep the object intact instead of using dot-notation keys.
 */
export class SqlDatabaseDirtyTracker extends DatabaseDirtyTracker {
  /**
   * Overrides the default flattening behavior to keep the raw data structure.
   */
  protected override flattenData(data: Record<string, unknown>): Record<string, unknown> {
    // Return a shallow copy of the data without flattening nested objects
    return { ...data };
  }
}
