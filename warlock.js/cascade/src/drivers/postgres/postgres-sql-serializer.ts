import type { SqlDialectContract } from "../sql/sql-dialect.contract";
import type { PendingOperation } from "../../migration/migration";
import { SQLSerializer } from "../../migration/sql-serializer";
import type {
  ColumnDefinition,
  ForeignKeyDefinition,
  FullTextIndexOptions,
  GeoIndexOptions,
  IndexDefinition,
  VectorIndexOptions,
} from "../../contracts/migration-driver.contract";

/**
 * PostgreSQL-specific SQL serializer.
 *
 * Converts pending migration operations into valid PostgreSQL DDL statements.
 */
export class PostgresSQLSerializer extends SQLSerializer {
  public constructor(private readonly dialect: SqlDialectContract) {
    super();
  }

  public serialize(operation: PendingOperation, table: string): string | string[] | null {
    switch (operation.type) {
      case "createTable":
        return this.createTable(table);
      case "createTableIfNotExists":
        return this.createTableIfNotExists(table);
      case "dropTable":
        return this.dropTable(table);
      case "dropTableIfExists":
        return this.dropTableIfExists(table);
      case "renameTable":
        return this.renameTable(table, operation.payload as string);
      case "truncateTable":
        return this.truncateTable(table);
      case "addColumn":
        return this.addColumn(table, operation.payload as ColumnDefinition);
      case "dropColumn":
        return this.dropColumn(table, operation.payload as string);
      case "dropColumns":
        // This is handled via map in serializeAll or loop, but Postgres supports multiple DROP COLUMN
        // For simplicity, we can serialize multiple statements if we want, or handle it here
        // Actually, dropColumns payload is string[]. We can join them.
        return this.dropColumns(table, operation.payload as string[]);
      case "renameColumn": {
        const payload = operation.payload as { from: string; to: string };
        return this.renameColumn(table, payload.from, payload.to);
      }
      case "modifyColumn":
        // Modify column might require multiple statements in Postgres (type, nullability, default).
        // SQLSerializer's serialize return is just a string, so we'll separate them by semicolon
        // Or wait, Postgres allows multiple ALTER COLUMN in one ALTER TABLE statement.
        return this.modifyColumn(table, operation.payload as ColumnDefinition);
      case "createIndex":
        return this.createIndex(table, operation.payload as IndexDefinition);
      case "dropIndex":
        return this.dropIndex(table, operation.payload as string | string[]);
      case "createUniqueIndex": {
        const payload = operation.payload as { columns: string[]; name?: string };
        return this.createIndex(table, { columns: payload.columns, name: payload.name, unique: true });
      }
      case "dropUniqueIndex":
        return this.dropIndex(table, operation.payload as string[]);
      case "createFullTextIndex": {
        const payload = operation.payload as { columns: string[]; options?: FullTextIndexOptions };
        return this.createFullTextIndex(table, payload.columns, payload.options);
      }
      case "dropFullTextIndex":
        return this.dropIndex(table, operation.payload as string);
      case "createGeoIndex": {
        const payload = operation.payload as { column: string; options?: GeoIndexOptions };
        return this.createGeoIndex(table, payload.column, payload.options);
      }
      case "dropGeoIndex":
        return this.dropIndex(table, `idx_${table}_geo_${operation.payload}`);
      case "createVectorIndex": {
        const payload = operation.payload as { column: string; options: VectorIndexOptions };
        return this.createVectorIndex(table, payload.column, payload.options);
      }
      case "dropVectorIndex":
        return this.dropIndex(table, `idx_${table}_vector_${operation.payload}`);
      case "createTTLIndex": {
        const payload = operation.payload as { column: string; expireAfterSeconds: number };
        return this.createTTLIndex(table, payload.column, payload.expireAfterSeconds);
      }
      case "dropTTLIndex":
        return this.dropIndex(table, `idx_${table}_ttl_${operation.payload}`);
      case "addForeignKey":
        return this.addForeignKey(table, operation.payload as ForeignKeyDefinition);
      case "dropForeignKey":
        return this.dropForeignKey(table, operation.payload as string);
      case "addPrimaryKey":
        return this.addPrimaryKey(table, operation.payload as string[]);
      case "dropPrimaryKey":
        return this.dropPrimaryKey(table);
      case "addCheck":
        // addCheck is not natively implemented in MigrationDriverContract but exists in OperationType
        return null;
      case "dropCheck":
        return null;
      case "createTimestamps":
        // createTimestamps needs to inject two columns. We return two statements.
        return this.createTimestamps(table);
      case "rawStatement": {
        const payload = operation.payload as string;
        // ensure string doesn't end with a semicolon if it's already one statement
        return payload;
      }
      case "setSchemaValidation":
      case "removeSchemaValidation":
        // Not implemented in PostgreSQL
        return null;
      default:
        return null;
    }
  }

  // ============================================================================
  // TABLE OPERATIONS
  // ============================================================================

  private createTable(table: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    return `CREATE TABLE ${quotedTable} ()`;
  }

  private createTableIfNotExists(table: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    return `CREATE TABLE IF NOT EXISTS ${quotedTable} ()`;
  }

  private dropTable(table: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    return `DROP TABLE ${quotedTable} CASCADE`;
  }

  private dropTableIfExists(table: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    return `DROP TABLE IF EXISTS ${quotedTable} CASCADE`;
  }

  private renameTable(from: string, to: string): string {
    const quotedFrom = this.dialect.quoteIdentifier(from);
    const quotedTo = this.dialect.quoteIdentifier(to);
    return `ALTER TABLE ${quotedFrom} RENAME TO ${quotedTo}`;
  }

  private truncateTable(table: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    return `TRUNCATE TABLE ${quotedTable}`;
  }

  // ============================================================================
  // COLUMN OPERATIONS
  // ============================================================================

  private addColumn(table: string, column: ColumnDefinition): string | string[] {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(column.name);

    let sqlType: string;
    if (column.autoIncrement) {
      if (column.type === "bigInteger") {
        sqlType = "BIGSERIAL";
      } else {
        sqlType = "SERIAL";
      }
    } else {
      sqlType = this.dialect.getSqlType(column.type, {
        length: column.length,
        precision: column.precision,
        scale: column.scale,
        dimensions: column.dimensions,
      });
    }

    let sql = `ALTER TABLE ${quotedTable} ADD COLUMN ${quotedColumn} ${sqlType}`;

    if (column.generated) {
      sql += ` GENERATED ALWAYS AS (${column.generated.expression})`;
      if (column.generated.stored) {
        sql += " STORED";
      }
    } else {
      if (!column.autoIncrement && column.nullable === false) {
        sql += " NOT NULL";
      }

      if (column.defaultValue !== undefined) {
        if (
          typeof column.defaultValue === "object" &&
          column.defaultValue !== null &&
          (column.defaultValue as any).__type === "CURRENT_TIMESTAMP"
        ) {
          sql += " DEFAULT NOW()";
        } else if (column.isRawDefault === false) {
          const escaped = String(column.defaultValue).replace(/'/g, "''");
          sql += ` DEFAULT '${escaped}'`;
        } else if (typeof column.defaultValue === "boolean") {
          sql += ` DEFAULT ${column.defaultValue ? "TRUE" : "FALSE"}`;
        } else if (typeof column.defaultValue === "number") {
          sql += ` DEFAULT ${column.defaultValue}`;
        } else {
          sql += ` DEFAULT ${column.defaultValue}`; // raw default
        }
      }

      if (column.primary) {
        sql += " PRIMARY KEY";
      }

      if (column.unique) {
        sql += " UNIQUE";
      }
    }

    // pgvector: ensure the extension is active before the vector column is created.
    // SQLGrammar classifies CREATE EXTENSION as Phase 1, so this will always
    // run before any CREATE TABLE / ADD COLUMN statement regardless of batch order.
    if (column.type === "vector") {
      return ["CREATE EXTENSION IF NOT EXISTS vector", sql];
    }

    return sql;
  }

  private dropColumn(table: string, column: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(column);
    return `ALTER TABLE ${quotedTable} DROP COLUMN ${quotedColumn}`;
  }

  private dropColumns(table: string, columns: string[]): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const drops = columns.map((col) => `DROP COLUMN ${this.dialect.quoteIdentifier(col)}`).join(", ");
    return `ALTER TABLE ${quotedTable} ${drops}`;
  }

  private renameColumn(table: string, from: string, to: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedFrom = this.dialect.quoteIdentifier(from);
    const quotedTo = this.dialect.quoteIdentifier(to);
    return `ALTER TABLE ${quotedTable} RENAME COLUMN ${quotedFrom} TO ${quotedTo}`;
  }

  private modifyColumn(table: string, column: ColumnDefinition): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(column.name);
    const sqlType = this.dialect.getSqlType(column.type, {
      length: column.length,
      precision: column.precision,
      scale: column.scale,
      dimensions: column.dimensions,
    });

    const alters: string[] = [];
    alters.push(`ALTER COLUMN ${quotedColumn} TYPE ${sqlType}`);

    if (column.nullable === false) {
      alters.push(`ALTER COLUMN ${quotedColumn} SET NOT NULL`);
    } else if (column.nullable === true) {
      alters.push(`ALTER COLUMN ${quotedColumn} DROP NOT NULL`);
    }

    if (column.defaultValue !== undefined) {
      let defaultVal: string;
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
      alters.push(`ALTER COLUMN ${quotedColumn} SET DEFAULT ${defaultVal}`);
    }

    return `ALTER TABLE ${quotedTable} ${alters.join(", ")}`;
  }

  private createTimestamps(table: string): string[] {
    const quotedTable = this.dialect.quoteIdentifier(table);
    return [
      `ALTER TABLE ${quotedTable} ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
      `ALTER TABLE ${quotedTable} ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    ];
  }

  // ============================================================================
  // INDEX OPERATIONS
  // ============================================================================

  private createIndex(table: string, index: IndexDefinition): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    let indexName: string;
    if (index.name) {
      indexName = index.name;
    } else {
      const colStr = Array.isArray(index.columns) ? index.columns.join("_") : index.columns;
      indexName = `idx_${table}_${colStr}`;
    }
    const quotedIndexName = this.dialect.quoteIdentifier(indexName);
    const uniqueKeyword = index.unique ? "UNIQUE " : "";
    const concurrentlyKeyword = index.concurrently ? "CONCURRENTLY " : "";

    let columnsPart: string;

    if (index.expressions && index.expressions.length > 0) {
      columnsPart = index.expressions.map((expr) => `(${expr})`).join(", ");
    } else {
      const columns = index.columns.map((col, i) => {
        const quotedCol = this.dialect.quoteIdentifier(col);
        const direction = index.directions?.[i]?.toUpperCase() ?? "";
        return direction ? `${quotedCol} ${direction}` : quotedCol;
      });
      columnsPart = columns.join(", ");
    }

    let sql = `CREATE ${uniqueKeyword}INDEX ${concurrentlyKeyword}${quotedIndexName} ON ${quotedTable} (${columnsPart})`;

    if (index.include && index.include.length > 0) {
      const includeCols = index.include.map((col) => this.dialect.quoteIdentifier(col)).join(", ");
      sql += ` INCLUDE (${includeCols})`;
    }

    if (index.where && Object.keys(index.where).length > 0) {
      const conditions = Object.entries(index.where)
        .map(([key, value]) => {
          const quotedKey = this.dialect.quoteIdentifier(key);
          return typeof value === "string" ? `${quotedKey} = '${value}'` : `${quotedKey} = ${value}`;
        })
        .join(" AND ");
      sql += ` WHERE ${conditions}`;
    }

    return sql;
  }

  private dropIndex(table: string, indexNameOrColumns: string | string[]): string {
    let indexName: string;
    if (typeof indexNameOrColumns === "string") {
      indexName = indexNameOrColumns;
    } else {
      indexName = `idx_${table}_${indexNameOrColumns.join("_")}`;
    }
    const quotedIndexName = this.dialect.quoteIdentifier(indexName);
    return `DROP INDEX IF EXISTS ${quotedIndexName}`;
  }

  private createFullTextIndex(table: string, columns: string[], options?: FullTextIndexOptions): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const indexName = options?.name ?? `idx_${table}_fulltext_${columns.join("_")}`;
    const quotedIndexName = this.dialect.quoteIdentifier(indexName);
    const language = options?.language ?? "english";

    const tsvectors = columns.map((col) => {
      const weight = options?.weights?.[col] ?? "A";
      return `setweight(to_tsvector('${language}', COALESCE(${this.dialect.quoteIdentifier(col)}, '')), '${weight}')`;
    });

    return `CREATE INDEX ${quotedIndexName} ON ${quotedTable} USING GIN ((${tsvectors.join(" || ")}))`;
  }

  private createGeoIndex(table: string, column: string, options?: GeoIndexOptions): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(column);
    const indexName = options?.name ?? `idx_${table}_geo_${column}`;
    const quotedIndexName = this.dialect.quoteIdentifier(indexName);

    return `CREATE INDEX ${quotedIndexName} ON ${quotedTable} USING GIST (${quotedColumn})`;
  }

  private createVectorIndex(table: string, column: string, options: VectorIndexOptions): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(column);
    const indexName = options.name ?? `idx_${table}_vector_${column}`;
    const quotedIndexName = this.dialect.quoteIdentifier(indexName);

    const opClass =
      options.similarity === "euclidean"
        ? "vector_l2_ops"
        : options.similarity === "dotProduct"
          ? "vector_ip_ops"
          : "vector_cosine_ops";

    const lists = options.lists ?? 100;

    return `CREATE INDEX ${quotedIndexName} ON ${quotedTable} USING ivfflat (${quotedColumn} ${opClass}) WITH (lists = ${lists})`;
  }

  private createTTLIndex(table: string, column: string, expireAfterSeconds: number): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(column);
    const indexName = `idx_${table}_ttl_${column}`;
    const quotedIndexName = this.dialect.quoteIdentifier(indexName);

    return `CREATE INDEX ${quotedIndexName} ON ${quotedTable} (${quotedColumn}) WHERE ${quotedColumn} < NOW() - INTERVAL '${expireAfterSeconds} seconds'`;
  }

  // ============================================================================
  // CONSTRAINTS
  // ============================================================================

  private addForeignKey(table: string, foreignKey: ForeignKeyDefinition): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(foreignKey.column);
    const quotedRefTable = this.dialect.quoteIdentifier(foreignKey.referencesTable);
    const quotedRefColumn = this.dialect.quoteIdentifier(foreignKey.referencesColumn);

    const constraintName =
      foreignKey.name ?? `fk_${table}_${foreignKey.column}_${foreignKey.referencesTable}`;
    const quotedConstraint = this.dialect.quoteIdentifier(constraintName);

    let sql = `ALTER TABLE ${quotedTable} ADD CONSTRAINT ${quotedConstraint} FOREIGN KEY (${quotedColumn}) REFERENCES ${quotedRefTable} (${quotedRefColumn})`;

    if (foreignKey.onDelete) {
      sql += ` ON DELETE ${this.mapForeignKeyAction(foreignKey.onDelete)}`;
    }

    if (foreignKey.onUpdate) {
      sql += ` ON UPDATE ${this.mapForeignKeyAction(foreignKey.onUpdate)}`;
    }

    return sql;
  }

  private dropForeignKey(table: string, name: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedConstraint = this.dialect.quoteIdentifier(name);
    return `ALTER TABLE ${quotedTable} DROP CONSTRAINT ${quotedConstraint}`;
  }

  private addPrimaryKey(table: string, columns: string[]): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumns = columns.map((c) => this.dialect.quoteIdentifier(c)).join(", ");
    const constraintName = `pk_${table}`;
    const quotedConstraint = this.dialect.quoteIdentifier(constraintName);

    return `ALTER TABLE ${quotedTable} ADD CONSTRAINT ${quotedConstraint} PRIMARY KEY (${quotedColumns})`;
  }

  private dropPrimaryKey(table: string): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const constraintName = `pk_${table}`;
    const quotedConstraint = this.dialect.quoteIdentifier(constraintName);

    return `ALTER TABLE ${quotedTable} DROP CONSTRAINT ${quotedConstraint}`;
  }

  private mapForeignKeyAction(
    action: "cascade" | "restrict" | "setNull" | "noAction",
  ): string {
    switch (action) {
      case "cascade": return "CASCADE";
      case "restrict": return "RESTRICT";
      case "setNull": return "SET NULL";
      case "noAction": return "NO ACTION";
      default: return "NO ACTION";
    }
  }
}
