/**
 * PostgreSQL Driver Types
 *
 * Type definitions specific to the PostgreSQL driver implementation.
 *
 * @module cascade/drivers/postgres
 */

/**
 * PostgreSQL connection configuration options.
 */
export type PostgresConnectionConfig = {
  /** Database host (default: "localhost") */
  readonly host?: string;
  /** Database port (default: 5432) */
  readonly port?: number;
  /** Database name */
  readonly database: string;
  /** Database user */
  readonly user?: string;
  /** Database password */
  readonly password?: string;
  /** Connection string (alternative to individual options) */
  readonly connectionString?: string;
  /** SSL configuration */
  readonly ssl?:
    | boolean
    | {
        readonly rejectUnauthorized?: boolean;
        readonly ca?: string;
        readonly cert?: string;
        readonly key?: string;
      };
  /** Enable database operation logging (queries, execution time, parameters) */
  readonly logging?: boolean;
};

/**
 * PostgreSQL pool configuration options.
 */
export type PostgresPoolConfig = PostgresConnectionConfig & {
  /** Maximum number of clients in the pool (default: 10) */
  readonly max?: number;
  /** Minimum number of clients in the pool (default: 0) */
  readonly min?: number;
  /** How long a client can sit idle before being closed (ms) */
  readonly idleTimeoutMillis?: number;
  /** How long to wait for a client before timing out (ms) */
  readonly connectionTimeoutMillis?: number;
  /** Maximum times to use a connection before destroying it */
  readonly maxUses?: number;
  /** Application name for connection identification */
  readonly application_name?: string;
};

/**
 * PostgreSQL query result wrapper.
 */
export type PostgresQueryResult<T = Record<string, unknown>> = {
  /** Array of rows returned by the query */
  readonly rows: T[];
  /** Number of rows affected by INSERT/UPDATE/DELETE */
  readonly rowCount: number | null;
  /** Column definitions from the result */
  readonly fields: Array<{
    readonly name: string;
    readonly dataTypeID: number;
  }>;
  /** Command that was executed (SELECT, INSERT, etc.) */
  readonly command: string;
};

/**
 * PostgreSQL transaction isolation levels.
 */
export type PostgresIsolationLevel =
  | "read uncommitted"
  | "read committed"
  | "repeatable read"
  | "serializable";

/**
 * PostgreSQL transaction options.
 */
export type PostgresTransactionOptions = {
  /** Isolation level for the transaction */
  readonly isolationLevel?: PostgresIsolationLevel;
  /** Whether the transaction is read-only */
  readonly readOnly?: boolean;
  /** Use deferrable mode (for serializable + read-only) */
  readonly deferrable?: boolean;
};

/**
 * PostgreSQL-specific operation types used in the query builder.
 */
export type PostgresOperation = {
  /** Operation stage (select, where, join, etc.) */
  readonly stage:
    | "select"
    | "from"
    | "join"
    | "where"
    | "groupBy"
    | "having"
    | "orderBy"
    | "limit"
    | "offset";
  /** Operation type/name */
  readonly type: string;
  /** Operation payload/data */
  readonly data: Record<string, unknown>;
};

/**
 * Internal representation of a pending WHERE clause.
 */
export type PostgresWhereClause = {
  /** Boolean operator to combine with previous clause */
  readonly boolean: "and" | "or";
  /** Type of where clause */
  readonly type:
    | "basic"
    | "raw"
    | "null"
    | "notNull"
    | "in"
    | "notIn"
    | "between"
    | "notBetween"
    | "exists"
    | "notExists"
    | "nested"
    | "column";
  /** Column/field name */
  readonly column?: string;
  /** Comparison operator */
  readonly operator?: string;
  /** Value to compare */
  readonly value?: unknown;
  /** Raw SQL expression */
  readonly raw?: string;
  /** Parameter bindings */
  readonly bindings?: unknown[];
  /** Nested conditions */
  readonly nested?: PostgresWhereClause[];
};

/**
 * PostgreSQL NOTIFY payload structure.
 */
export type PostgresNotification = {
  /** Channel name */
  readonly channel: string;
  /** Notification payload */
  readonly payload?: string;
  /** Process ID of the notifying backend */
  readonly processId: number;
};

/**
 * PostgreSQL COPY options for bulk operations.
 */
export type PostgresCopyOptions = {
  /** Format (text, csv, binary) */
  readonly format?: "text" | "csv" | "binary";
  /** Field delimiter for text/csv */
  readonly delimiter?: string;
  /** Quote character for csv */
  readonly quote?: string;
  /** Escape character for csv */
  readonly escape?: string;
  /** Include header row */
  readonly header?: boolean;
  /** Null string representation */
  readonly null?: string;
  /** Column list */
  readonly columns?: string[];
};
