/**
 * PostgreSQL Dialect Implementation
 *
 * Implements the SqlDialectContract for PostgreSQL-specific SQL syntax.
 * Handles parameter placeholders ($1, $2), identifier quoting, and
 * PostgreSQL-specific features like JSONB operators.
 *
 * @module cascade/drivers/postgres
 */

import type { SqlDialectContract } from "../sql/sql-dialect.contract";

/**
 * PostgreSQL-specific SQL dialect implementation.
 *
 * Provides PostgreSQL syntax for:
 * - Parameter placeholders ($1, $2, $3...)
 * - Identifier quoting with double quotes
 * - JSONB operators (->, ->>, @>)
 * - ILIKE for case-insensitive matching
 * - RETURNING clause support
 *
 * @example
 * ```typescript
 * const dialect = new PostgresDialect();
 *
 * dialect.placeholder(1); // "$1"
 * dialect.quoteIdentifier('user'); // '"user"'
 * dialect.jsonExtract('data', 'name'); // "data"->>'name'
 * ```
 */
export class PostgresDialect implements SqlDialectContract {
  /**
   * Dialect name identifier.
   */
  public readonly name = "postgres" as const;

  /**
   * PostgreSQL supports the RETURNING clause for INSERT/UPDATE/DELETE.
   */
  public readonly supportsReturning = true;

  /**
   * PostgreSQL uses ON CONFLICT for upsert operations.
   */
  public readonly upsertKeyword = "ON CONFLICT" as const;

  /**
   * Generate a PostgreSQL parameter placeholder.
   *
   * PostgreSQL uses numbered placeholders: $1, $2, $3, etc.
   *
   * @param index - The 1-based parameter index
   * @returns The placeholder string (e.g., "$1")
   */
  public placeholder(index: number): string {
    return `$${index}`;
  }

  /**
   * Quote an identifier using PostgreSQL's double-quote syntax.
   *
   * Handles escaping of embedded double quotes by doubling them.
   * This is necessary for reserved words and special characters.
   *
   * @param identifier - The identifier (table/column name) to quote
   * @returns The quoted identifier (e.g., '"user"')
   */
  public quoteIdentifier(identifier: string): string {
    // Split on dots for qualified names (schema.table.column)
    const parts = identifier.split(".");
    return parts.map((part) => `"${part.replace(/"/g, '""')}"`).join(".");
  }

  /**
   * Convert a boolean to PostgreSQL literal.
   *
   * @param value - The boolean value
   * @returns "TRUE" or "FALSE"
   */
  public booleanLiteral(value: boolean): string {
    return value ? "TRUE" : "FALSE";
  }

  /**
   * Build LIMIT/OFFSET clause for PostgreSQL.
   *
   * @param limit - Maximum rows to return
   * @param offset - Rows to skip
   * @returns The SQL clause (e.g., "LIMIT 10 OFFSET 20")
   */
  public limitOffset(limit?: number, offset?: number): string {
    const parts: string[] = [];

    if (limit !== undefined) {
      parts.push(`LIMIT ${limit}`);
    }

    if (offset !== undefined) {
      parts.push(`OFFSET ${offset}`);
    }

    return parts.join(" ");
  }

  /**
   * Build a JSON path extraction expression for PostgreSQL.
   *
   * Uses the ->> operator for text extraction from JSONB columns.
   * Supports nested paths using chained operators.
   *
   * @param column - The JSONB column name
   * @param path - The path to extract (dot notation: "user.name")
   * @returns The SQL expression (e.g., "data"->>'user'->>'name')
   */
  public jsonExtract(column: string, path: string): string {
    const quotedColumn = this.quoteIdentifier(column);
    const pathParts = path.split(".");

    if (pathParts.length === 1) {
      return `${quotedColumn}->>'${pathParts[0]}'`;
    }

    // For nested paths: data->'user'->>'name' (last one gets text extraction)
    const jsonPath = pathParts
      .slice(0, -1)
      .map((p) => `'${p}'`)
      .join("->");
    const lastKey = pathParts[pathParts.length - 1];

    return `${quotedColumn}->${jsonPath}->>'${lastKey}'`;
  }

  /**
   * Build a JSON contains expression for PostgreSQL.
   *
   * Uses the @> containment operator for JSONB columns.
   *
   * @param column - The JSONB column name
   * @param value - The value to check for
   * @param path - Optional path within the JSON
   * @returns The SQL expression
   */
  public jsonContains(column: string, value: unknown, path?: string): string {
    const quotedColumn = this.quoteIdentifier(column);

    if (path) {
      // Check if a specific path contains the value
      const jsonValue = JSON.stringify({ [path]: value });
      return `${quotedColumn} @> '${jsonValue}'::jsonb`;
    }

    // Check if the column contains the value (for arrays or objects)
    const jsonValue = JSON.stringify(value);
    return `${quotedColumn} @> '${jsonValue}'::jsonb`;
  }

  /**
   * Build a LIKE pattern expression for PostgreSQL.
   *
   * Uses ILIKE for case-insensitive matching, LIKE for case-sensitive.
   *
   * @param pattern - The pattern to match
   * @param caseInsensitive - Whether to use case-insensitive matching
   * @returns Object with operator and pattern
   */
  public likePattern(
    pattern: string,
    caseInsensitive = true,
  ): { operator: string; pattern: string } {
    // Escape special characters in the pattern (%, _, \)
    const escapedPattern = pattern.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");

    return {
      operator: caseInsensitive ? "ILIKE" : "LIKE",
      pattern: escapedPattern,
    };
  }

  /**
   * Build an array contains expression for PostgreSQL.
   *
   * Uses ANY() for checking if a value is in an array column.
   *
   * @param column - The array column name
   * @param paramIndex - The parameter index
   * @returns The SQL expression
   */
  public arrayContains(column: string, paramIndex: number): string {
    return `${this.placeholder(paramIndex)} = ANY(${this.quoteIdentifier(column)})`;
  }

  /**
   * Get the PostgreSQL SQL type for an abstract type.
   *
   * @param type - The abstract type name
   * @param options - Type-specific options
   * @returns The PostgreSQL type string
   */
  public getSqlType(
    type: string,
    options?: { length?: number; precision?: number; scale?: number; dimensions?: number },
  ): string {
    switch (type) {
      case "string":
        return options?.length ? `VARCHAR(${options.length})` : "TEXT";
      case "char":
        return `CHAR(${options?.length ?? 1})`;
      case "text":
        return "TEXT";
      case "mediumText":
      case "longText":
        return "TEXT"; // PostgreSQL doesn't distinguish text sizes
      case "integer":
        return "INTEGER";
      case "smallInteger":
        return "SMALLINT";
      case "tinyInteger":
        return "SMALLINT"; // PostgreSQL doesn't have TINYINT
      case "bigInteger":
        return "BIGINT";
      case "float":
        return "REAL";
      case "double":
        return "DOUBLE PRECISION";
      case "decimal":
        if (options?.precision !== undefined) {
          const scale = options.scale ?? 0;
          return `DECIMAL(${options.precision}, ${scale})`;
        }
        return "DECIMAL";
      case "boolean":
        return "BOOLEAN";
      case "date":
        return "DATE";
      case "dateTime":
        return "TIMESTAMP";
      case "timestamp":
        return "TIMESTAMPTZ"; // With timezone
      case "time":
        return "TIME";
      case "year":
        return "SMALLINT"; // PostgreSQL doesn't have YEAR type
      case "json":
        return "JSONB"; // Prefer JSONB for indexing and operators
      case "binary":
        return "BYTEA";
      case "uuid":
        return "UUID";
      case "ulid":
        return "CHAR(26)"; // ULIDs are 26 characters
      case "ipAddress":
        return "INET";
      case "macAddress":
        return "MACADDR";
      case "point":
        return "POINT";
      case "polygon":
        return "POLYGON";
      case "lineString":
        return "PATH";
      case "geometry":
        return "GEOMETRY"; // Requires PostGIS
      case "vector":
        return options?.dimensions ? `VECTOR(${options.dimensions})` : "VECTOR"; // Requires pgvector
      case "enum":
        return "TEXT"; // PostgreSQL enums need CREATE TYPE first
      case "set":
        return "TEXT[]"; // Use array for set-like behavior
      // PostgreSQL native array types
      case "arrayInt":
        return "INTEGER[]";
      case "arrayBigInt":
        return "BIGINT[]";
      case "arrayFloat":
        return "REAL[]";
      case "arrayDecimal":
        if (options?.precision !== undefined) {
          const scale = options.scale ?? 0;
          return `DECIMAL(${options.precision}, ${scale})[]`;
        }
        return "DECIMAL[]";
      case "arrayBoolean":
        return "BOOLEAN[]";
      case "arrayText":
        return "TEXT[]";
      case "arrayDate":
        return "DATE[]";
      case "arrayTimestamp":
        return "TIMESTAMPTZ[]";
      case "arrayUuid":
        return "UUID[]";
      default:
        return type.toUpperCase();
    }
  }
}
