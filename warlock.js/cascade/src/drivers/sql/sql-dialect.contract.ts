/**
 * SQL Dialect Contract
 *
 * Defines the interface for database-specific SQL syntax variations.
 * Each SQL database driver implements this interface to handle
 * differences in parameter placeholders, identifier quoting, and SQL syntax.
 *
 * @module cascade/drivers/sql
 */

/**
 * Contract that SQL dialects must implement to handle database-specific
 * SQL syntax variations.
 *
 * Each SQL database (PostgreSQL, MySQL, SQLite) has subtle differences
 * in how they handle parameters, identifiers, and certain SQL features.
 * This interface abstracts those differences.
 *
 * @example
 * ```typescript
 * class PostgresDialect implements SqlDialectContract {
 *   placeholder(index: number): string {
 *     return `$${index}`;  // PostgreSQL uses $1, $2, etc.
 *   }
 * }
 *
 * class MySqlDialect implements SqlDialectContract {
 *   placeholder(index: number): string {
 *     return '?';  // MySQL uses ? for all parameters
 *   }
 * }
 * ```
 */
export interface SqlDialectContract {
  /**
   * The name of the dialect for identification purposes.
   *
   * @example "postgres", "mysql", "sqlite"
   */
  readonly name: string;

  /**
   * Generate a parameter placeholder for the given index.
   *
   * Different databases use different placeholder styles:
   * - PostgreSQL: `$1`, `$2`, `$3`
   * - MySQL/SQLite: `?` (positional)
   *
   * @param index - The 1-based parameter index
   * @returns The placeholder string to use in the SQL query
   *
   * @example
   * ```typescript
   * dialect.placeholder(1); // "$1" for PostgreSQL
   * dialect.placeholder(2); // "?" for MySQL
   * ```
   */
  placeholder(index: number): string;

  /**
   * Quote an identifier (table name, column name) for safe use in SQL.
   *
   * Different databases use different quote characters:
   * - PostgreSQL: `"column_name"`
   * - MySQL: `` `column_name` ``
   *
   * This also handles escaping if the identifier contains the quote character.
   *
   * @param identifier - The identifier to quote
   * @returns The quoted identifier safe for use in SQL
   *
   * @example
   * ```typescript
   * dialect.quoteIdentifier('user'); // '"user"' for PostgreSQL
   * dialect.quoteIdentifier('order'); // '`order`' for MySQL
   * ```
   */
  quoteIdentifier(identifier: string): string;

  /**
   * Convert a boolean value to the appropriate SQL literal.
   *
   * Different databases represent booleans differently:
   * - PostgreSQL: `TRUE` / `FALSE`
   * - MySQL: `1` / `0`
   *
   * @param value - The boolean value to convert
   * @returns The SQL literal string
   *
   * @example
   * ```typescript
   * dialect.booleanLiteral(true); // "TRUE" for PostgreSQL
   * dialect.booleanLiteral(false); // "0" for MySQL
   * ```
   */
  booleanLiteral(value: boolean): string;

  /**
   * Whether the database supports the RETURNING clause for INSERT/UPDATE/DELETE.
   *
   * - PostgreSQL: `true` (supports `RETURNING *`)
   * - MySQL: `false` (must use `LAST_INSERT_ID()`)
   */
  readonly supportsReturning: boolean;

  /**
   * The keyword used for upsert (insert or update) operations.
   *
   * - PostgreSQL: `"ON CONFLICT"`
   * - MySQL: `"ON DUPLICATE KEY"`
   */
  readonly upsertKeyword: "ON CONFLICT" | "ON DUPLICATE KEY";

  /**
   * Build the LIMIT/OFFSET clause for pagination.
   *
   * Most databases use `LIMIT x OFFSET y`, but syntax may vary.
   *
   * @param limit - Maximum number of rows to return (undefined = no limit)
   * @param offset - Number of rows to skip (undefined = no offset)
   * @returns The SQL clause string (e.g., "LIMIT 10 OFFSET 20")
   *
   * @example
   * ```typescript
   * dialect.limitOffset(10, 20); // "LIMIT 10 OFFSET 20"
   * dialect.limitOffset(10);     // "LIMIT 10"
   * dialect.limitOffset(undefined, 20); // "OFFSET 20"
   * ```
   */
  limitOffset(limit?: number, offset?: number): string;

  /**
   * Build a JSON path extraction expression.
   *
   * Different databases have different JSON operators:
   * - PostgreSQL: `column->>'path'` or `column->'path'`
   * - MySQL: `JSON_EXTRACT(column, '$.path')`
   *
   * @param column - The JSON/JSONB column name
   * @param path - The path to extract (dot notation)
   * @returns The SQL expression for extracting the path
   *
   * @example
   * ```typescript
   * dialect.jsonExtract('data', 'user.name');
   * // PostgreSQL: "data"->>'user'->>'name'
   * // MySQL: JSON_EXTRACT("data", '$.user.name')
   * ```
   */
  jsonExtract(column: string, path: string): string;

  /**
   * Check if a JSON column contains a value.
   *
   * - PostgreSQL: `column @> '{"key": "value"}'::jsonb`
   * - MySQL: `JSON_CONTAINS(column, '"value"', '$.key')`
   *
   * @param column - The JSON/JSONB column name
   * @param value - The value to check for
   * @param path - Optional path within the JSON
   * @returns The SQL expression
   */
  jsonContains(column: string, value: unknown, path?: string): string;

  /**
   * Build a LIKE pattern with proper escaping.
   *
   * @param pattern - The pattern (may include % and _ wildcards)
   * @param caseInsensitive - Whether to use case-insensitive matching
   * @returns Object with the SQL operator and escaped pattern
   *
   * @example
   * ```typescript
   * dialect.likePattern('%test%', true);
   * // PostgreSQL: { operator: 'ILIKE', pattern: '%test%' }
   * // MySQL: { operator: 'LIKE', pattern: '%test%' } (case-insensitive by default)
   * ```
   */
  likePattern(pattern: string, caseInsensitive?: boolean): { operator: string; pattern: string };

  /**
   * Build an array contains expression.
   *
   * - PostgreSQL: `$1 = ANY(column)` or `column @> ARRAY[$1]`
   * - MySQL: `JSON_CONTAINS(column, ...)` for JSON arrays
   *
   * @param column - The array column name
   * @param paramIndex - The parameter index for the value
   * @returns The SQL expression
   */
  arrayContains(column: string, paramIndex: number): string;

  /**
   * Get the SQL type name for common abstract types.
   *
   * @param type - The abstract type name
   * @param options - Type-specific options (length, precision, scale)
   * @returns The database-specific SQL type
   *
   * @example
   * ```typescript
   * dialect.getSqlType('string', { length: 255 }); // "VARCHAR(255)"
   * dialect.getSqlType('json'); // "JSONB" for PostgreSQL, "JSON" for MySQL
   * ```
   */
  getSqlType(
    type: string,
    options?: { length?: number; precision?: number; scale?: number; dimensions?: number },
  ): string;
}
