/**
 * PostgreSQL Blueprint
 *
 * Implements the DriverBlueprintContract for querying PostgreSQL
 * information schema metadata.
 *
 * @module cascade/drivers/postgres
 */

import type {
  DriverBlueprintContract,
  TableIndexInformation,
} from "../../contracts/driver-blueprint.contract";
import type { PostgresDriver } from "./postgres-driver";

/**
 * PostgreSQL Blueprint.
 *
 * Provides methods for introspecting the database schema
 * via PostgreSQL's information_schema and pg_catalog.
 *
 * @example
 * ```typescript
 * const blueprint = driver.blueprint;
 *
 * // Get all tables
 * const tables = await blueprint.listTables();
 *
 * // Get columns for a table
 * const columns = await blueprint.listColumns('users');
 * ```
 */
export class PostgresBlueprint implements DriverBlueprintContract {
  /**
   * Create a new blueprint.
   *
   * @param driver - The PostgreSQL driver instance
   */
  public constructor(private readonly driver: PostgresDriver) {}

  /**
   * Get all table names in the database.
   *
   * @returns Array of table names
   */
  public async listTables(): Promise<string[]> {
    const result = await this.driver.query<{ table_name: string }>(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    );

    return result.rows.map((row) => row.table_name);
  }

  /**
   * Get all indexes for a table.
   *
   * @param table - Table name
   * @returns Array of index information
   */
  public async listIndexes(table: string): Promise<TableIndexInformation[]> {
    const result = await this.driver.query<{
      indexname: string;
      indexdef: string;
    }>(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = 'public'
       AND tablename = $1`,
      [table],
    );

    return result.rows.map((row) => {
      const isUnique = row.indexdef.includes("UNIQUE");
      const isPrimary = row.indexname.endsWith("_pkey");

      // Extract columns from indexdef
      const columnsMatch = row.indexdef.match(/\(([^)]+)\)/);
      const columns = columnsMatch
        ? columnsMatch[1].split(",").map((c) => c.trim().replace(/"/g, ""))
        : [];

      // Determine index type
      let type = "btree"; // default
      if (row.indexdef.includes("USING GIN")) type = "gin";
      else if (row.indexdef.includes("USING GIST")) type = "gist";
      else if (row.indexdef.includes("USING HASH")) type = "hash";
      else if (row.indexdef.includes("USING ivfflat")) type = "ivfflat";

      // Check for partial index
      const isPartial = row.indexdef.includes("WHERE");

      return {
        name: row.indexname,
        columns,
        type,
        unique: isUnique || isPrimary,
        partial: isPartial,
        options: {
          primary: isPrimary,
          definition: row.indexdef,
        },
      };
    });
  }

  /**
   * Get all column names for a table.
   *
   * @param table - Table name
   * @returns Array of column names
   */
  public async listColumns(table: string): Promise<string[]> {
    const result = await this.driver.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
       AND table_name = $1
       ORDER BY ordinal_position`,
      [table],
    );

    return result.rows.map((row) => row.column_name);
  }

  /**
   * Check if a table exists.
   *
   * @param table - Table name
   * @returns Whether the table exists
   */
  public async tableExists(table: string): Promise<boolean> {
    const result = await this.driver.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [table],
    );

    return result.rows[0]?.exists ?? false;
  }
}
