import type { PendingOperation } from "./migration";

/**
 * Converts PendingOperation objects to SQL strings for a specific dialect.
 */
export abstract class SQLSerializer {
  /**
   * Serialize a single pending operation into one or more SQL strings.
   *
   * Return `string` for single-statement operations, `string[]` for
   * multi-statement ones (e.g. `createTimestamps` emits two ALTER TABLE
   * statements), and `null` for no-ops.
   */
  abstract serialize(operation: PendingOperation, table: string): string | string[] | null;

  /**
   * Serialize an array of operations to a flat list of SQL strings.
   *
   * Array results from serialize() are automatically flattened, and nulls
   * (no-ops) are filtered out.
   */
  serializeAll(operations: PendingOperation[], table: string): string[] {
    const result: string[] = [];

    for (const op of operations) {
      const sql = this.serialize(op, table);
      if (sql === null) continue;
      if (Array.isArray(sql)) {
        result.push(...sql);
      } else {
        result.push(sql);
      }
    }

    return result;
  }
}
