/**
 * SQL Types and Definitions
 *
 * Shared type definitions used across SQL database drivers (PostgreSQL, MySQL, SQLite).
 * These types represent common SQL operations and their parameters.
 *
 * @module cascade/drivers/sql
 */

/**
 * Result of building a SQL query with parameterized values.
 *
 * Contains the SQL string with placeholders and the corresponding parameter values.
 * This separation prevents SQL injection by ensuring values are properly escaped.
 */
export type SqlQueryResult = {
  /** The SQL query string with parameter placeholders ($1, $2, etc. or ?) */
  readonly sql: string;
  /** The parameter values in order matching the placeholders */
  readonly params: unknown[];
};

/**
 * Supported SQL JOIN types.
 */
export type SqlJoinType = "inner" | "left" | "right" | "full" | "cross";

/**
 * SQL JOIN clause definition.
 *
 * Represents a JOIN between two tables with its condition.
 */
export type SqlJoinClause = {
  /** Type of JOIN operation */
  readonly type: SqlJoinType;
  /** Target table to join */
  readonly table: string;
  /** Optional alias for the joined table */
  readonly alias?: string;
  /** JOIN condition */
  readonly on: {
    /** Field from the left (current) table */
    readonly left: string;
    /** Comparison operator (usually "=") */
    readonly operator: string;
    /** Field from the right (joined) table */
    readonly right: string;
  };
  /** Additional ON conditions (for complex joins) */
  readonly additionalConditions?: Array<{
    readonly left: string;
    readonly operator: string;
    readonly right: string;
  }>;
};

/**
 * SQL ORDER BY clause definition.
 */
export type SqlOrderClause = {
  /** Column to order by */
  readonly column: string;
  /** Sort direction */
  readonly direction: "asc" | "desc";
  /** Nulls position (PostgreSQL-specific) */
  readonly nulls?: "first" | "last";
};

/**
 * SQL GROUP BY clause definition.
 */
export type SqlGroupClause = {
  /** Columns to group by */
  readonly columns: string[];
};

/**
 * SQL HAVING clause condition.
 */
export type SqlHavingClause = {
  /** Aggregate function (count, sum, avg, etc.) */
  readonly aggregate: string;
  /** Column the aggregate operates on */
  readonly column: string;
  /** Comparison operator */
  readonly operator: string;
  /** Value to compare against */
  readonly value: unknown;
};

/**
 * SQL WHERE clause operation types.
 */
export type SqlWhereType =
  | "where"
  | "orWhere"
  | "whereRaw"
  | "orWhereRaw"
  | "whereNot"
  | "orWhereNot"
  | "whereExists"
  | "whereNotExists";

/**
 * SQL WHERE clause operation.
 *
 * Represents a single WHERE condition with its type, field, operator, and value.
 */
export type SqlWhereOperation = {
  /** Type of WHERE clause (where, orWhere, whereRaw, etc.) */
  readonly type: SqlWhereType;
  /** Field name (for standard where clauses) */
  readonly field?: string;
  /** Comparison operator */
  readonly operator?: string;
  /** Value to compare against */
  readonly value?: unknown;
  /** Raw SQL expression (for whereRaw clauses) */
  readonly raw?: string;
  /** Parameter bindings for raw expressions */
  readonly bindings?: unknown[];
  /** Nested conditions (for grouped where clauses) */
  readonly nested?: SqlWhereOperation[];
};

/**
 * SQL SELECT clause definition.
 */
export type SqlSelectClause = {
  /** Column name or expression */
  readonly expression: string;
  /** Optional alias for the column */
  readonly alias?: string;
  /** Whether this is a raw expression */
  readonly isRaw?: boolean;
};

/**
 * Configuration for building SQL queries.
 */
export type SqlQueryConfig = {
  /** Target table name */
  readonly table: string;
  /** Table alias (optional) */
  readonly alias?: string;
  /** SELECT columns (empty = SELECT *) */
  readonly select: SqlSelectClause[];
  /** JOIN clauses */
  readonly joins: SqlJoinClause[];
  /** WHERE conditions */
  readonly where: SqlWhereOperation[];
  /** GROUP BY columns */
  readonly groupBy: string[];
  /** HAVING conditions */
  readonly having: SqlHavingClause[];
  /** ORDER BY clauses */
  readonly orderBy: SqlOrderClause[];
  /** LIMIT value */
  readonly limit?: number;
  /** OFFSET value */
  readonly offset?: number;
  /** DISTINCT flag */
  readonly distinct?: boolean;
};

/**
 * SQL INSERT operation definition.
 */
export type SqlInsertOperation = {
  /** Target table */
  readonly table: string;
  /** Column names */
  readonly columns: string[];
  /** Values to insert (array of arrays for multi-row insert) */
  readonly values: unknown[][];
  /** Whether to return the inserted rows */
  readonly returning?: string[] | boolean;
  /** Conflict resolution (upsert) */
  readonly onConflict?: {
    readonly columns: string[];
    readonly action: "update" | "nothing";
    readonly updateColumns?: string[];
  };
};

/**
 * SQL UPDATE operation definition.
 */
export type SqlUpdateOperation = {
  /** Target table */
  readonly table: string;
  /** Columns to set with their values */
  readonly set: Record<string, unknown>;
  /** Columns to increment */
  readonly increment?: Record<string, number>;
  /** Columns to set to NULL */
  readonly unset?: string[];
  /** WHERE conditions */
  readonly where: SqlWhereOperation[];
  /** Whether to return updated rows */
  readonly returning?: string[] | boolean;
  /** Maximum rows to update (some databases support LIMIT in UPDATE) */
  readonly limit?: number;
};

/**
 * SQL DELETE operation definition.
 */
export type SqlDeleteOperation = {
  /** Target table */
  readonly table: string;
  /** WHERE conditions */
  readonly where: SqlWhereOperation[];
  /** Whether to return deleted rows */
  readonly returning?: string[] | boolean;
  /** Maximum rows to delete */
  readonly limit?: number;
};

/**
 * Aggregate function types supported in SQL.
 */
export type SqlAggregateFunction =
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "array_agg"
  | "string_agg"
  | "jsonb_agg";
