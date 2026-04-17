/**
 * PostgreSQL Migration Driver
 *
 * Implements the MigrationDriverContract for PostgreSQL DDL operations.
 * Provides methods for creating/dropping tables, columns, indexes,
 * and constraints.
 *
 * @module cascade/drivers/postgres
 */

import { databaseTransactionContext } from "../../context/database-transaction-context";
import type {
  ColumnDefinition,
  ColumnType,
  ForeignKeyDefinition,
  FullTextIndexOptions,
  GeoIndexOptions,
  IndexDefinition,
  MigrationDriverContract,
  TableIndexInformation,
  VectorIndexOptions,
} from "../../contracts/migration-driver.contract";
import type { MigrationDefaults, UuidStrategy } from "../../types";
import type { PostgresDriver } from "./postgres-driver";

/**
 * PostgreSQL Migration Driver.
 *
 * Handles database schema operations for PostgreSQL including:
 * - Table creation and deletion
 * - Column management
 * - Index creation (B-tree, GIN, GiST, etc.)
 * - Constraint management (foreign keys, unique, etc.)
 *
 * @example
 * ```typescript
 * const migrationDriver = driver.migrationDriver();
 *
 * // Create a table
 * await migrationDriver.createTable('users');
 *
 * // Add columns
 * await migrationDriver.addColumn('users', {
 *   name: 'email',
 *   type: 'string',
 *   length: 255,
 *   nullable: false
 * });
 *
 * // Create unique index
 * await migrationDriver.createUniqueIndex('users', ['email']);
 * ```
 */
export class PostgresMigrationDriver implements MigrationDriverContract {
  /**
   * Active transaction client (if any).
   */
  private get transactionClient(): unknown {
    return databaseTransactionContext.getSession();
  }

  /**
   * Create a new migration driver.
   *
   * @param driver - The PostgreSQL driver instance
   */
  public constructor(public readonly driver: PostgresDriver) {}

  // ============================================================================
  // TABLE OPERATIONS
  // ============================================================================

  /**
   * Create a new table with a default id column.
   *
   * @param table - Table name
   */
  public async createTable(table: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    // Create empty table - columns are added via addColumn operations
    await this.execute(`CREATE TABLE ${quotedTable} ()`);
  }

  /**
   * Create table if it doesn't exist.
   *
   * @param table - Table name
   */
  public async createTableIfNotExists(table: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    // Create empty table if not exists - columns are added via addColumn operations
    await this.execute(`CREATE TABLE IF NOT EXISTS ${quotedTable} ()`);
  }

  /**
   * Drop an existing table.
   *
   * @param table - Table name
   */
  public async dropTable(table: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    await this.execute(`DROP TABLE ${quotedTable} CASCADE`);
  }

  /**
   * Drop table if it exists.
   *
   * @param table - Table name
   */
  public async dropTableIfExists(table: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    await this.execute(`DROP TABLE IF EXISTS ${quotedTable} CASCADE`);
  }

  /**
   * Rename a table.
   *
   * @param from - Current table name
   * @param to - New table name
   */
  public async renameTable(from: string, to: string): Promise<void> {
    const quotedFrom = this.driver.dialect.quoteIdentifier(from);
    const quotedTo = this.driver.dialect.quoteIdentifier(to);
    await this.execute(`ALTER TABLE ${quotedFrom} RENAME TO ${quotedTo}`);
  }

  /**
   * Truncate a table — remove all rows efficiently.
   *
   * @param table - Table name
   */
  public async truncateTable(table: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    await this.execute(`TRUNCATE TABLE ${quotedTable}`);
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

  /**
   * List all columns in a table.
   *
   * @param table - Table name
   * @returns Array of column definitions
   */
  public async listColumns(table: string): Promise<ColumnDefinition[]> {
    const result = await this.driver.query<{
      column_name: string;
      data_type: string;
      character_maximum_length: number | null;
      numeric_precision: number | null;
      numeric_scale: number | null;
      is_nullable: string;
      column_default: string | null;
    }>(
      `SELECT
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position`,
      [table],
    );

    return result.rows.map((row) => ({
      name: row.column_name,
      type: this.mapPostgresTypeToColumnType(row.data_type),
      length: row.character_maximum_length ?? undefined,
      precision: row.numeric_precision ?? undefined,
      scale: row.numeric_scale ?? undefined,
      nullable: row.is_nullable === "YES",
      defaultValue: row.column_default ?? undefined,
    }));
  }

  /**
   * List all tables in the current database.
   *
   * @returns Array of table names
   */
  public async listTables(): Promise<string[]> {
    const result = await this.driver.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`,
    );

    return result.rows.map((row) => row.table_name);
  }

  /**
   * Ensure the migrations tracking table exists.
   *
   * Creates the table with proper schema if it doesn't exist.
   *
   * @param tableName - Name of the migrations table
   */
  public async ensureMigrationsTable(tableName: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(tableName);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS ${quotedTable} (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "batch" INTEGER NOT NULL,
        "executedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP WITH TIME ZONE
      )
    `);
  }

  // ============================================================================
  // COLUMN OPERATIONS
  // ============================================================================

  /**
   * Add a column to an existing table.
   *
   * @param table - Table name
   * @param column - Column definition
   */
  public async addColumn(table: string, column: ColumnDefinition): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumn = this.driver.dialect.quoteIdentifier(column.name);

    // For auto-increment integers, use SERIAL/BIGSERIAL instead of INTEGER/BIGINT
    let sqlType: string;
    if (column.autoIncrement) {
      if (column.type === "bigInteger") {
        sqlType = "BIGSERIAL";
      } else {
        sqlType = "SERIAL";
      }
    } else {
      sqlType = this.driver.dialect.getSqlType(column.type, {
        length: column.length,
        precision: column.precision,
        scale: column.scale,
        dimensions: column.dimensions,
      });
    }

    let sql = `ALTER TABLE ${quotedTable} ADD COLUMN ${quotedColumn} ${sqlType}`;

    // Handle generated columns
    if (column.generated) {
      sql += ` GENERATED ALWAYS AS (${column.generated.expression})`;
      if (column.generated.stored) {
        sql += " STORED";
      }
      // PostgreSQL only supports STORED, not VIRTUAL
      // If virtual is requested, it's simply ignored (PostgreSQL doesn't support it)
    } else {
      // SERIAL/BIGSERIAL are always NOT NULL, so skip for those
      if (!column.autoIncrement && column.nullable === false) {
        sql += " NOT NULL";
      }

      if (column.defaultValue !== undefined) {
        // Check for special CURRENT_TIMESTAMP marker
        if (
          typeof column.defaultValue === "object" &&
          column.defaultValue !== null &&
          (column.defaultValue as any).__type === "CURRENT_TIMESTAMP"
        ) {
          sql += " DEFAULT NOW()";
        } else if (column.isRawDefault === false) {
          // Explicit string literal - escape it properly
          const escaped = String(column.defaultValue).replace(/'/g, "''");
          sql += ` DEFAULT '${escaped}'`;
        } else if (typeof column.defaultValue === "boolean") {
          // Boolean values
          sql += ` DEFAULT ${column.defaultValue ? "TRUE" : "FALSE"}`;
        } else if (typeof column.defaultValue === "number") {
          // Numeric values
          sql += ` DEFAULT ${column.defaultValue}`;
        } else {
          // Raw SQL expression (default behavior when isRawDefault is true or undefined)
          sql += ` DEFAULT ${column.defaultValue}`;
        }
      }

      // Handle primary key
      if (column.primary) {
        sql += " PRIMARY KEY";
      }

      // Handle unique constraint
      if (column.unique) {
        sql += " UNIQUE";
      }
    }

    await this.execute(sql);
  }

  /**
   * Drop a column from a table.
   *
   * @param table - Table name
   * @param column - Column name
   */
  public async dropColumn(table: string, column: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumn = this.driver.dialect.quoteIdentifier(column);
    await this.execute(`ALTER TABLE ${quotedTable} DROP COLUMN ${quotedColumn}`);
  }

  /**
   * Drop multiple columns from a table.
   *
   * @param table - Table name
   * @param columns - Column names
   */
  public async dropColumns(table: string, columns: string[]): Promise<void> {
    for (const column of columns) {
      await this.dropColumn(table, column);
    }
  }

  /**
   * Rename a column.
   *
   * @param table - Table name
   * @param from - Current column name
   * @param to - New column name
   */
  public async renameColumn(table: string, from: string, to: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedFrom = this.driver.dialect.quoteIdentifier(from);
    const quotedTo = this.driver.dialect.quoteIdentifier(to);
    await this.execute(`ALTER TABLE ${quotedTable} RENAME COLUMN ${quotedFrom} TO ${quotedTo}`);
  }

  /**
   * Modify an existing column.
   *
   * @param table - Table name
   * @param column - New column definition
   */
  public async modifyColumn(table: string, column: ColumnDefinition): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumn = this.driver.dialect.quoteIdentifier(column.name);
    const sqlType = this.driver.dialect.getSqlType(column.type, {
      length: column.length,
      precision: column.precision,
      scale: column.scale,
      dimensions: column.dimensions,
    });

    // PostgreSQL requires separate ALTER statements for type and nullability
    await this.execute(`ALTER TABLE ${quotedTable} ALTER COLUMN ${quotedColumn} TYPE ${sqlType}`);

    if (column.nullable === false) {
      await this.execute(`ALTER TABLE ${quotedTable} ALTER COLUMN ${quotedColumn} SET NOT NULL`);
    } else if (column.nullable === true) {
      await this.execute(`ALTER TABLE ${quotedTable} ALTER COLUMN ${quotedColumn} DROP NOT NULL`);
    }

    if (column.defaultValue !== undefined) {
      let defaultVal: string;

      // Check for special CURRENT_TIMESTAMP marker
      if (
        typeof column.defaultValue === "object" &&
        column.defaultValue !== null &&
        (column.defaultValue as any).__type === "CURRENT_TIMESTAMP"
      ) {
        defaultVal = "NOW()";
      } else if (typeof column.defaultValue === "string") {
        defaultVal = `'${column.defaultValue}'`;
      } else {
        defaultVal = String(column.defaultValue);
      }

      await this.execute(
        `ALTER TABLE ${quotedTable} ALTER COLUMN ${quotedColumn} SET DEFAULT ${defaultVal}`,
      );
    }
  }

  /**
   * Create standard timestamp columns (created_at, updated_at).
   *
   * PostgreSQL implementation creates TIMESTAMPTZ columns with NOW() defaults.
   *
   * @param table - Table name
   */
  public async createTimestampColumns(table: string): Promise<void> {
    await this.addColumn(table, {
      name: "created_at",
      type: "timestamp",
      nullable: false,
      defaultValue: "NOW()",
      isRawDefault: true,
    });

    await this.addColumn(table, {
      name: "updated_at",
      type: "timestamp",
      nullable: false,
      defaultValue: "NOW()",
      isRawDefault: true,
    });
  }

  // ============================================================================
  // INDEX OPERATIONS
  // ============================================================================

  /**
   * Create an index on one or more columns.
   *
   * Supports:
   * - Regular column indexes
   * - Expression-based indexes (e.g., `lower(email)`)
   * - Covering indexes (INCLUDE clause)
   * - Concurrent index creation (CONCURRENTLY keyword)
   *
   * @param table - Table name
   * @param index - Index definition
   */
  public async createIndex(table: string, index: IndexDefinition): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const indexName = index.name ?? `idx_${table}_${index.columns.join("_")}`;
    const quotedIndexName = this.driver.dialect.quoteIdentifier(indexName);
    const uniqueKeyword = index.unique ? "UNIQUE " : "";
    const concurrentlyKeyword = index.concurrently ? "CONCURRENTLY " : "";

    let columnsPart: string;

    // Handle expression-based indexes
    if (index.expressions && index.expressions.length > 0) {
      // Wrap each expression in parentheses
      columnsPart = index.expressions.map((expr) => `(${expr})`).join(", ");
    } else {
      // Regular column indexes
      const columns = index.columns.map((col, i) => {
        const quotedCol = this.driver.dialect.quoteIdentifier(col);
        const direction = index.directions?.[i]?.toUpperCase() ?? "";
        return direction ? `${quotedCol} ${direction}` : quotedCol;
      });
      columnsPart = columns.join(", ");
    }

    let sql = `CREATE ${uniqueKeyword}INDEX ${concurrentlyKeyword}${quotedIndexName} ON ${quotedTable} (${columnsPart})`;

    // Add INCLUDE clause for covering indexes
    if (index.include && index.include.length > 0) {
      const includeCols = index.include
        .map((col) => this.driver.dialect.quoteIdentifier(col))
        .join(", ");
      sql += ` INCLUDE (${includeCols})`;
    }

    // Add partial index condition
    if (index.where && Object.keys(index.where).length > 0) {
      const conditions = Object.entries(index.where)
        .map(([key, value]) => {
          const quotedKey = this.driver.dialect.quoteIdentifier(key);
          return typeof value === "string"
            ? `${quotedKey} = '${value}'`
            : `${quotedKey} = ${value}`;
        })
        .join(" AND ");
      sql += ` WHERE ${conditions}`;
    }

    await this.execute(sql);
  }

  /**
   * Drop an index.
   *
   * @param table - Table name
   * @param indexNameOrColumns - Index name or columns
   */
  public async dropIndex(table: string, indexNameOrColumns: string | string[]): Promise<void> {
    let indexName: string;

    if (typeof indexNameOrColumns === "string") {
      indexName = indexNameOrColumns;
    } else {
      indexName = `idx_${table}_${indexNameOrColumns.join("_")}`;
    }

    const quotedIndexName = this.driver.dialect.quoteIdentifier(indexName);
    await this.execute(`DROP INDEX IF EXISTS ${quotedIndexName}`);
  }

  /**
   * Create a unique index.
   *
   * @param table - Table name
   * @param columns - Columns to include
   * @param name - Optional index name
   */
  public async createUniqueIndex(table: string, columns: string[], name?: string): Promise<void> {
    await this.createIndex(table, { columns, unique: true, name });
  }

  /**
   * Drop a unique index.
   *
   * @param table - Table name
   * @param columns - Columns in the index
   */
  public async dropUniqueIndex(table: string, columns: string[]): Promise<void> {
    await this.dropIndex(table, columns);
  }

  // ============================================================================
  // SPECIALIZED INDEXES
  // ============================================================================

  /**
   * Create a full-text search index using GIN.
   *
   * @param table - Table name
   * @param columns - Columns to index
   * @param options - Full-text options
   */
  public async createFullTextIndex(
    table: string,
    columns: string[],
    options?: FullTextIndexOptions,
  ): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const indexName = options?.name ?? `idx_${table}_fulltext_${columns.join("_")}`;
    const quotedIndexName = this.driver.dialect.quoteIdentifier(indexName);
    const language = options?.language ?? "english";

    const tsvectors = columns.map((col) => {
      const weight = options?.weights?.[col] ?? "A";
      return `setweight(to_tsvector('${language}', COALESCE(${this.driver.dialect.quoteIdentifier(col)}, '')), '${weight}')`;
    });

    await this.execute(
      `CREATE INDEX ${quotedIndexName} ON ${quotedTable} USING GIN ((${tsvectors.join(" || ")}))`,
    );
  }

  /**
   * Drop a full-text search index.
   *
   * @param table - Table name
   * @param name - Index name
   */
  public async dropFullTextIndex(table: string, name: string): Promise<void> {
    await this.dropIndex(table, name);
  }

  /**
   * Create a geo-spatial index using GiST.
   *
   * @param table - Table name
   * @param column - Geo column
   * @param options - Geo index options
   */
  public async createGeoIndex(
    table: string,
    column: string,
    options?: GeoIndexOptions,
  ): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumn = this.driver.dialect.quoteIdentifier(column);
    const indexName = options?.name ?? `idx_${table}_geo_${column}`;
    const quotedIndexName = this.driver.dialect.quoteIdentifier(indexName);

    await this.execute(
      `CREATE INDEX ${quotedIndexName} ON ${quotedTable} USING GIST (${quotedColumn})`,
    );
  }

  /**
   * Drop a geo-spatial index.
   *
   * @param table - Table name
   * @param column - Geo column
   */
  public async dropGeoIndex(table: string, column: string): Promise<void> {
    await this.dropIndex(table, `idx_${table}_geo_${column}`);
  }

  /**
   * Create a vector search index (requires pgvector extension).
   *
   * @param table - Table name
   * @param column - Vector column
   * @param options - Vector index options
   */
  public async createVectorIndex(
    table: string,
    column: string,
    options: VectorIndexOptions,
  ): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumn = this.driver.dialect.quoteIdentifier(column);
    const indexName = options.name ?? `idx_${table}_vector_${column}`;
    const quotedIndexName = this.driver.dialect.quoteIdentifier(indexName);

    // Map similarity to pgvector operator class
    const opClass =
      options.similarity === "euclidean"
        ? "vector_l2_ops"
        : options.similarity === "dotProduct"
          ? "vector_ip_ops"
          : "vector_cosine_ops";

    const lists = options.lists ?? 100;

    await this.execute(
      `CREATE INDEX ${quotedIndexName} ON ${quotedTable} USING ivfflat (${quotedColumn} ${opClass}) WITH (lists = ${lists})`,
    );
  }

  /**
   * Drop a vector search index.
   *
   * @param table - Table name
   * @param column - Vector column
   */
  public async dropVectorIndex(table: string, column: string): Promise<void> {
    await this.dropIndex(table, `idx_${table}_vector_${column}`);
  }

  /**
   * Create a TTL index (not natively supported in PostgreSQL).
   *
   * Note: PostgreSQL doesn't have native TTL indexes like MongoDB.
   * This creates a partial index and requires a scheduled job for cleanup.
   *
   * @param table - Table name
   * @param column - Date column
   * @param expireAfterSeconds - Expiration time in seconds
   */
  public async createTTLIndex(
    table: string,
    column: string,
    expireAfterSeconds: number,
  ): Promise<void> {
    // Create a partial index for expired rows (for efficient cleanup queries)
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumn = this.driver.dialect.quoteIdentifier(column);
    const indexName = `idx_${table}_ttl_${column}`;
    const quotedIndexName = this.driver.dialect.quoteIdentifier(indexName);

    await this.execute(
      `CREATE INDEX ${quotedIndexName} ON ${quotedTable} (${quotedColumn}) WHERE ${quotedColumn} < NOW() - INTERVAL '${expireAfterSeconds} seconds'`,
    );

    // Note: User must set up a scheduled job (pg_cron, etc.) to:
    // DELETE FROM table WHERE column < NOW() - INTERVAL 'X seconds'
  }

  /**
   * Drop a TTL index.
   *
   * @param table - Table name
   * @param column - Column with TTL index
   */
  public async dropTTLIndex(table: string, column: string): Promise<void> {
    await this.dropIndex(table, `idx_${table}_ttl_${column}`);
  }

  /**
   * List all indexes on a table.
   *
   * @param table - Table name
   * @returns Array of index metadata
   */
  public async listIndexes(table: string): Promise<TableIndexInformation[]> {
    const result = await this.driver.query<{ indexname: string; indexdef: string }>(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1`,
      [table],
    );

    return result.rows.map((row) => {
      const isUnique = row.indexdef.includes("UNIQUE");
      const isPrimary = row.indexname.endsWith("_pkey");
      const columnsMatch = row.indexdef.match(/\(([^)]+)\)/);
      const columns = columnsMatch
        ? columnsMatch[1].split(",").map((c) => c.trim().replace(/"/g, ""))
        : [];

      let type = "btree";
      if (row.indexdef.includes("USING GIN")) type = "gin";
      else if (row.indexdef.includes("USING GIST")) type = "gist";
      else if (row.indexdef.includes("USING HASH")) type = "hash";
      else if (row.indexdef.includes("USING ivfflat")) type = "ivfflat";

      return {
        name: row.indexname,
        columns,
        type,
        unique: isUnique || isPrimary,
        partial: row.indexdef.includes("WHERE"),
        options: { primary: isPrimary, definition: row.indexdef },
      };
    });
  }

  // ============================================================================
  // EXTENSIONS
  // ============================================================================

  /**
   * Check if a PostgreSQL extension is available on the database server.
   *
   * @param extension - Extension name (e.g., "vector")
   */
  public async isExtensionAvailable(extension: string): Promise<boolean> {
    try {
      const result = await this.driver.query<{ name: string }>(
        `SELECT name FROM pg_available_extensions WHERE name = $1`,
        [extension],
      );

      return result?.rows?.length > 0;
    } catch {
      // If we can't check (e.g., permissions issue or pg_available_extensions not accessible),
      // we return true to avoid false positives. Execution will just proceed and fail naturally if it's missing.
      return true;
    }
  }

  /**
   * Get the official documentation or installation URL for a PostgreSQL extension.
   *
   * @param extension - Extension name
   */
  public getExtensionDocsUrl(extension: string): string | undefined {
    const guideUrls: Record<string, string> = {
      vector: "https://github.com/pgvector/pgvector#installation",
      postgis: "https://postgis.net/documentation/getting_started/",
      pg_trgm: "https://www.postgresql.org/docs/current/pgtrgm.html",
      uuid_ossp: "https://www.postgresql.org/docs/current/uuid-ossp.html",
    };

    return guideUrls[extension] ?? `https://www.postgresql.org/docs/current/${extension}.html`;
  }

  // ============================================================================
  // CONSTRAINTS
  // ============================================================================

  /**
   * Add a foreign key constraint.
   *
   * @param table - Table name
   * @param foreignKey - Foreign key definition
   */
  public async addForeignKey(table: string, foreignKey: ForeignKeyDefinition): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumn = this.driver.dialect.quoteIdentifier(foreignKey.column);
    const quotedRefTable = this.driver.dialect.quoteIdentifier(foreignKey.referencesTable);
    const quotedRefColumn = this.driver.dialect.quoteIdentifier(foreignKey.referencesColumn);

    const constraintName =
      foreignKey.name ?? `fk_${table}_${foreignKey.column}_${foreignKey.referencesTable}`;
    const quotedConstraint = this.driver.dialect.quoteIdentifier(constraintName);

    let sql = `ALTER TABLE ${quotedTable} ADD CONSTRAINT ${quotedConstraint} FOREIGN KEY (${quotedColumn}) REFERENCES ${quotedRefTable} (${quotedRefColumn})`;

    if (foreignKey.onDelete) {
      sql += ` ON DELETE ${this.mapForeignKeyAction(foreignKey.onDelete)}`;
    }

    if (foreignKey.onUpdate) {
      sql += ` ON UPDATE ${this.mapForeignKeyAction(foreignKey.onUpdate)}`;
    }

    await this.execute(sql);
  }

  /**
   * Drop a foreign key constraint.
   *
   * @param table - Table name
   * @param name - Constraint name
   */
  public async dropForeignKey(table: string, name: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedConstraint = this.driver.dialect.quoteIdentifier(name);
    await this.execute(`ALTER TABLE ${quotedTable} DROP CONSTRAINT ${quotedConstraint}`);
  }

  /**
   * Add a primary key constraint.
   *
   * @param table - Table name
   * @param columns - Primary key columns
   */
  public async addPrimaryKey(table: string, columns: string[]): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedColumns = columns.map((c) => this.driver.dialect.quoteIdentifier(c)).join(", ");
    const constraintName = `pk_${table}`;
    const quotedConstraint = this.driver.dialect.quoteIdentifier(constraintName);

    await this.execute(
      `ALTER TABLE ${quotedTable} ADD CONSTRAINT ${quotedConstraint} PRIMARY KEY (${quotedColumns})`,
    );
  }

  /**
   * Drop the primary key constraint.
   *
   * @param table - Table name
   */
  public async dropPrimaryKey(table: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const constraintName = `pk_${table}`;
    const quotedConstraint = this.driver.dialect.quoteIdentifier(constraintName);

    await this.execute(`ALTER TABLE ${quotedTable} DROP CONSTRAINT ${quotedConstraint}`);
  }

  /**
   * Add a CHECK constraint.
   *
   * @param table - Table name
   * @param name - Constraint name
   * @param expression - SQL CHECK expression
   */
  public async addCheck(table: string, name: string, expression: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedName = this.driver.dialect.quoteIdentifier(name);
    const sql = `ALTER TABLE ${quotedTable} ADD CONSTRAINT ${quotedName} CHECK (${expression})`;
    await this.execute(sql);
  }

  /**
   * Drop a CHECK constraint.
   *
   * @param table - Table name
   * @param name - Constraint name
   */
  public async dropCheck(table: string, name: string): Promise<void> {
    const quotedTable = this.driver.dialect.quoteIdentifier(table);
    const quotedName = this.driver.dialect.quoteIdentifier(name);
    await this.execute(`ALTER TABLE ${quotedTable} DROP CONSTRAINT ${quotedName}`);
  }

  // ============================================================================
  // SCHEMA VALIDATION (NOT APPLICABLE FOR PostgreSQL)
  // ============================================================================

  /**
   * Set schema validation (no-op for PostgreSQL).
   *
   * PostgreSQL uses column constraints instead.
   */
  public async setSchemaValidation(_table: string, _schema: object): Promise<void> {
    // No-op: PostgreSQL doesn't have MongoDB-style schema validation
    // Use CHECK constraints instead
  }

  /**
   * Remove schema validation (no-op for PostgreSQL).
   */
  public async removeSchemaValidation(_table: string): Promise<void> {
    // No-op
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * Begin a transaction.
   */
  public async beginTransaction(): Promise<void> {
    await this.execute("BEGIN");
  }

  /**
   * Commit the current transaction.
   */
  public async commit(): Promise<void> {
    await this.execute("COMMIT");
  }

  /**
   * Rollback the current transaction.
   */
  public async rollback(): Promise<void> {
    await this.execute("ROLLBACK");
  }

  /**
   * Whether transactions are supported.
   */
  public supportsTransactions(): boolean {
    return true;
  }

  /**
   * Get the default transactional behavior for PostgreSQL.
   *
   * PostgreSQL supports transactional DDL operations, so migrations
   * are wrapped in transactions by default for atomicity and safety.
   *
   * @returns true (PostgreSQL DDL is transactional)
   */
  public getDefaultTransactional(): boolean {
    return true;
  }

  // ============================================================================
  // DEFAULTS
  // ============================================================================

  /**
   * Get the default UUID generation expression for PostgreSQL.
   *
   * Resolution order:
   * 1. `migrationDefaults.uuidExpression` → raw expression (escape hatch)
   * 2. `migrationDefaults.uuidStrategy` → mapped to PG function
   * 3. Fallback → `gen_random_uuid()` (v4, PG 13+)
   *
   * @param migrationDefaults - Optional overrides from DataSource config
   * @returns PostgreSQL SQL expression for UUID generation
   *
   * @example
   * ```typescript
   * driver.getUuidDefault(); // "gen_random_uuid()"
   * driver.getUuidDefault({ uuidStrategy: "v7" }); // "uuidv7()"
   * driver.getUuidDefault({ uuidExpression: "uuid_generate_v1mc()" }); // "uuid_generate_v1mc()"
   * ```
   */
  public getUuidDefault(migrationDefaults?: MigrationDefaults): string {
    // Escape hatch: raw expression takes highest precedence
    if (migrationDefaults?.uuidExpression) {
      return migrationDefaults.uuidExpression;
    }

    const strategy = migrationDefaults?.uuidStrategy ?? "v4";

    const strategyMap: Record<UuidStrategy, string> = {
      v4: "gen_random_uuid()",
      v7: "uuidv7()",
    };

    return strategyMap[strategy];
  }

  // ============================================================================
  // RAW ACCESS
  // ============================================================================

  /**
   * Execute raw operations with direct driver access.
   *
   * @param callback - Callback receiving the driver
   */
  public async raw<T>(callback: (connection: unknown) => Promise<T>): Promise<T> {
    return callback(this.driver);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Execute a SQL statement.
   *
   * @param sql - SQL to execute
   * @param params - Query parameters
   */
  private async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.driver.query(sql, params);
  }

  /**
   * Map foreign key action to PostgreSQL syntax.
   */
  private mapForeignKeyAction(action: "cascade" | "restrict" | "setNull" | "noAction"): string {
    const mapping: Record<string, string> = {
      cascade: "CASCADE",
      restrict: "RESTRICT",
      setNull: "SET NULL",
      noAction: "NO ACTION",
    };
    return mapping[action] ?? "NO ACTION";
  }

  /**
   * Map PostgreSQL data type to ColumnType.
   */
  private mapPostgresTypeToColumnType(pgType: string): ColumnType {
    const typeMap: Record<string, ColumnType> = {
      "character varying": "string",
      varchar: "string",
      character: "char",
      char: "char",
      text: "text",
      integer: "integer",
      int: "integer",
      smallint: "smallInteger",
      bigint: "bigInteger",
      real: "float",
      "double precision": "double",
      numeric: "decimal",
      decimal: "decimal",
      boolean: "boolean",
      date: "date",
      timestamp: "dateTime",
      "timestamp without time zone": "dateTime",
      "timestamp with time zone": "timestamp",
      time: "time",
      "time without time zone": "time",
      json: "json",
      jsonb: "json",
      bytea: "binary",
      uuid: "uuid",
      inet: "ipAddress",
      macaddr: "macAddress",
      point: "point",
      polygon: "polygon",
      line: "lineString",
      geometry: "geometry",
      // PostgreSQL array types
      "integer[]": "arrayInt",
      "int[]": "arrayInt",
      "bigint[]": "arrayBigInt",
      "real[]": "arrayFloat",
      "decimal[]": "arrayDecimal",
      "numeric[]": "arrayDecimal",
      "boolean[]": "arrayBoolean",
      "text[]": "arrayText",
      "date[]": "arrayDate",
      "timestamp with time zone[]": "arrayTimestamp",
      "timestamptz[]": "arrayTimestamp",
      "uuid[]": "arrayUuid",
    };

    return typeMap[pgType.toLowerCase()] ?? "string";
  }
}
