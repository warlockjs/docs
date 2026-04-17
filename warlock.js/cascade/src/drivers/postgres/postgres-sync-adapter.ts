/**
 * PostgreSQL Sync Adapter
 *
 * Implements the SyncAdapterContract for batch update operations
 * on embedded/denormalized data in PostgreSQL.
 *
 * @module cascade/drivers/postgres
 */

import type { SyncAdapterContract, SyncInstruction } from "../../contracts/sync-adapter.contract";
import type { PostgresDriver } from "./postgres-driver";

/**
 * PostgreSQL Sync Adapter.
 *
 * Handles batch updates for embedded/denormalized data stored
 * in JSONB columns. In a normalized SQL world, this is less common
 * than in MongoDB, but still useful for JSONB documents.
 *
 * @example
 * ```typescript
 * const syncAdapter = driver.syncAdapter();
 *
 * // Update embedded user data in posts
 * await syncAdapter.executeBatch([
 *   {
 *     targetTable: 'posts',
 *     filter: { 'author.id': 123 },
 *     update: { 'author.name': 'New Name' },
 *     // ... other fields
 *   }
 * ]);
 * ```
 */
export class PostgresSyncAdapter implements SyncAdapterContract {
  /**
   * Create a new sync adapter.
   *
   * @param driver - The PostgreSQL driver instance
   */
  public constructor(private readonly driver: PostgresDriver) {}

  /**
   * Execute a batch of sync instructions.
   *
   * @param instructions - Array of sync instructions
   * @returns Total number of affected rows
   */
  public async executeBatch(instructions: SyncInstruction[]): Promise<number> {
    let totalAffected = 0;

    for (const instruction of instructions) {
      if (instruction.isArrayUpdate) {
        totalAffected += await this.executeArrayUpdate(instruction);
      } else {
        totalAffected += await this.executeOne(instruction);
      }
    }

    return totalAffected;
  }

  /**
   * Execute a single sync instruction.
   *
   * @param instruction - Sync instruction
   * @returns Number of affected rows
   */
  public async executeOne(instruction: SyncInstruction): Promise<number> {
    const { targetTable, filter, update } = instruction;
    return this.executeJsonbUpdate(targetTable, filter, update);
  }

  /**
   * Execute an array update instruction with positional operators.
   *
   * @param instruction - Sync instruction with array update info
   * @returns Number of affected rows
   */
  public async executeArrayUpdate(instruction: SyncInstruction): Promise<number> {
    const { targetTable, filter, update, arrayField, identifierField, identifierValue } =
      instruction;

    if (!arrayField || !identifierField || identifierValue === undefined) {
      // Fall back to regular update if array info is missing
      return this.executeOne(instruction);
    }

    return this.executeArrayElementUpdate(
      targetTable,
      filter,
      arrayField,
      { [identifierField]: identifierValue },
      update,
    );
  }

  /**
   * Execute an update on JSONB fields.
   *
   * @param table - Table name
   * @param filter - Row filter
   * @param update - Fields to update
   * @returns Number of affected rows
   */
  private async executeJsonbUpdate(
    table: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<number> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Build SET clauses for each update field
    for (const [path, value] of Object.entries(update)) {
      if (path.includes(".")) {
        // JSONB path update: "column.nested.field" -> jsonb_set
        const [column, ...pathParts] = path.split(".");
        const quotedColumn = this.driver.dialect.quoteIdentifier(column);
        const jsonPath = `{${pathParts.join(",")}}`;
        const placeholder = this.driver.dialect.placeholder(paramIndex++);
        params.push(JSON.stringify(value));

        setClauses.push(
          `${quotedColumn} = jsonb_set(COALESCE(${quotedColumn}, '{}'::jsonb), '${jsonPath}', ${placeholder}::jsonb)`,
        );
      } else {
        // Regular column update
        const quotedColumn = this.driver.dialect.quoteIdentifier(path);
        const placeholder = this.driver.dialect.placeholder(paramIndex++);
        params.push(value);

        setClauses.push(`${quotedColumn} = ${placeholder}`);
      }
    }

    // Build WHERE clause
    const whereClauses: string[] = [];
    for (const [key, value] of Object.entries(filter)) {
      if (key.includes(".")) {
        // JSONB path filter
        const [column, ...pathParts] = key.split(".");
        const quotedColumn = this.driver.dialect.quoteIdentifier(column);
        const jsonPath = pathParts.map((p) => `'${p}'`).join("->>");
        const placeholder = this.driver.dialect.placeholder(paramIndex++);
        params.push(value);

        whereClauses.push(`${quotedColumn}->>${jsonPath} = ${placeholder}`);
      } else {
        const quotedKey = this.driver.dialect.quoteIdentifier(key);
        const placeholder = this.driver.dialect.placeholder(paramIndex++);
        params.push(value);

        whereClauses.push(`${quotedKey} = ${placeholder}`);
      }
    }

    const sql = `UPDATE ${quotedTable} SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")}`;

    const result = await this.driver.query(sql, params);
    return result.rowCount ?? 0;
  }

  /**
   * Execute an update on elements within a JSONB array.
   *
   * @param table - Table name
   * @param filter - Row filter
   * @param arrayField - JSONB array column
   * @param arrayFilter - Filter to match array elements
   * @param update - Fields to update on matched elements
   * @returns Number of affected rows
   */
  private async executeArrayElementUpdate(
    table: string,
    filter: Record<string, unknown>,
    arrayField: string,
    arrayFilter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<number> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedArrayField = this.driver.dialect.quoteIdentifier(arrayField);

    const params: unknown[] = [];
    let paramIndex = 1;

    // Build array element filter condition
    const arrayFilterCondition = Object.entries(arrayFilter)
      .map(([key, value]) => {
        params.push(value);
        return `elem->>'${key}' = ${this.driver.dialect.placeholder(paramIndex++)}`;
      })
      .join(" AND ");

    // Build update expression for matched elements
    const updateExpr = Object.entries(update)
      .map(([key, value]) => {
        params.push(JSON.stringify(value));
        return `'${key}', ${this.driver.dialect.placeholder(paramIndex++)}::jsonb`;
      })
      .join(", ");

    // Build WHERE clause for row filter
    const whereClauses = Object.entries(filter).map(([key, value]) => {
      const quotedKey = this.driver.dialect.quoteIdentifier(key);
      params.push(value);
      return `${quotedKey} = ${this.driver.dialect.placeholder(paramIndex++)}`;
    });

    // Use a CTE to update array elements
    const sql = `
      WITH updated AS (
        SELECT id, (
          SELECT jsonb_agg(
            CASE 
              WHEN ${arrayFilterCondition}
              THEN elem || jsonb_build_object(${updateExpr})
              ELSE elem
            END
          )
          FROM jsonb_array_elements(${quotedArrayField}) elem
        ) AS new_array
        FROM ${quotedTable}
        WHERE ${whereClauses.join(" AND ")}
      )
      UPDATE ${quotedTable} t
      SET ${quotedArrayField} = u.new_array
      FROM updated u
      WHERE t.id = u.id
    `;

    const result = await this.driver.query(sql, params);
    return result.rowCount ?? 0;
  }
}
