# migration-driver.contract
source: contracts/migration-driver.contract.ts
description: Contract defining the abstract migration driver interface and its supporting column, index, and constraint types used by all database drivers.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `DataSource` from `../data-source/data-source`
- `MigrationDefaults` from `../types`
- `DriverContract` from `./database-driver.contract`
- `TableIndexInformation` from `./driver-blueprint.contract`

## Exports
- `TableIndexInformation` (re-export) — Index metadata type re-exported from driver-blueprint.contract  [line 5]
- `ColumnType` — Union of all column data types supported across database drivers  [lines 10-51]
- `ColumnDefinition` — Object type describing a column when adding or modifying  [lines 56-110]
- `IndexDefinition` — Object type describing an index definition  [lines 115-136]
- `FullTextIndexOptions` — Options for full-text search indexes  [lines 141-148]
- `GeoIndexOptions` — Options for geo-spatial indexes  [lines 153-162]
- `VectorIndexOptions` — Options for vector search indexes (AI/ML embeddings)  [lines 167-176]
- `ForeignKeyDefinition` — Foreign key constraint definition (SQL only)  [lines 181-194]
- `MigrationDriverContract` — Interface all migration drivers must implement  [lines 208-661]
- `MigrationDriverFactory` — Factory function type for constructing migration drivers  [lines 666-668]

## Classes / Functions / Types / Constants

### `ColumnType` [lines 10-51]
- String literal union of supported column types:
  - Text/string: `"string"`, `"char"`, `"text"`, `"mediumText"`, `"longText"`
  - Integer: `"integer"`, `"smallInteger"`, `"tinyInteger"`, `"bigInteger"`
  - Numeric: `"float"`, `"double"`, `"decimal"`
  - Boolean: `"boolean"`
  - Date/time: `"date"`, `"dateTime"`, `"timestamp"`, `"time"`, `"year"`
  - Structured: `"json"`, `"binary"`
  - Identifiers: `"uuid"`, `"ulid"`
  - Network: `"ipAddress"`, `"macAddress"`
  - Geo: `"point"`, `"polygon"`, `"lineString"`, `"geometry"`
  - AI/ML: `"vector"`
  - Enumerations: `"enum"`, `"set"`
  - PostgreSQL array types: `"arrayInt"`, `"arrayBigInt"`, `"arrayFloat"`, `"arrayDecimal"`, `"arrayBoolean"`, `"arrayText"`, `"arrayDate"`, `"arrayTimestamp"`, `"arrayUuid"`

### `ColumnDefinition` [lines 56-110]
- Object describing a column. Members:
  - `name: string` — Column name
  - `type: ColumnType` — Column data type
  - `length?: number` — Length for string/char types
  - `precision?: number` — Precision for decimal types
  - `scale?: number` — Scale for decimal types
  - `nullable?: boolean` — Whether the column allows NULL
  - `defaultValue?: unknown` — Default value (primitive, SQL string, or `{__type: 'CURRENT_TIMESTAMP'}`)
  - `onUpdateCurrent?: boolean` — MySQL ON UPDATE CURRENT_TIMESTAMP
  - `primary?: boolean` — Whether this is a primary key
  - `autoIncrement?: boolean` — Whether the column auto-increments
  - `unsigned?: boolean` — Whether the column is unsigned (numeric)
  - `unique?: boolean` — Whether the column has a unique constraint
  - `comment?: string` — Column comment/description
  - `values?: string[]` — Enum/set values
  - `dimensions?: number` — Vector dimensions (for vector type)
  - `isRawDefault?: boolean` — Treat defaultValue as raw SQL (true) vs escaped literal (false)
  - `after?: string` — Position column after another column (MySQL/MariaDB)
  - `first?: boolean` — Place as first column in table (MySQL/MariaDB)
  - `generated?: { expression: string; stored: boolean }` — Generated column config (stored=true STORED, false VIRTUAL)
  - `checkConstraint?: { expression: string; name: string }` — Inline CHECK constraint

### `IndexDefinition` [lines 115-136]
- Object describing an index. All members readonly:
  - `name?: string` — Index name (auto-generated if not provided)
  - `columns: string[]` — Columns included in the index
  - `unique?: boolean` — Whether this is a unique index
  - `type?: string` — Index type (driver-specific)
  - `where?: Record<string, unknown>` — Partial index condition
  - `sparse?: boolean` — Sparse index (MongoDB)
  - `directions?: Array<"asc" | "desc">` — Sort direction per column
  - `expressions?: string[]` — Expression-based index (PostgreSQL)
  - `include?: string[]` — Covering columns (PostgreSQL INCLUDE)
  - `concurrently?: boolean` — Create concurrently (PostgreSQL)

### `FullTextIndexOptions` [lines 141-148]
- Object describing full-text index options. All members readonly:
  - `name?: string` — Index name
  - `language?: string` — Language for text analysis
  - `weights?: Record<string, number>` — Field weights for relevance scoring

### `GeoIndexOptions` [lines 153-162]
- Object describing geo-spatial index options. All members readonly:
  - `name?: string` — Index name
  - `type?: "2dsphere" | "2d"` — Index type (default `"2dsphere"`)
  - `min?: number` — Minimum bound for 2d index
  - `max?: number` — Maximum bound for 2d index

### `VectorIndexOptions` [lines 167-176]
- Object describing vector index options for AI/ML embeddings. All members readonly:
  - `dimensions: number` — Vector dimensions (e.g., 1536 for OpenAI) (required)
  - `similarity?: "cosine" | "euclidean" | "dotProduct"` — Similarity metric
  - `name?: string` — Index name
  - `lists?: number` — Number of lists/clusters (IVF)

### `ForeignKeyDefinition` [lines 181-194]
- Object describing an SQL foreign key constraint. All members readonly:
  - `name?: string` — Constraint name
  - `column: string` — Local column name
  - `referencesTable: string` — Referenced table
  - `referencesColumn: string` — Referenced column
  - `onDelete?: "cascade" | "restrict" | "setNull" | "noAction"` — Action on delete
  - `onUpdate?: "cascade" | "restrict" | "setNull" | "noAction"` — Action on update

### `MigrationDriverContract` [lines 208-661]
- Interface all migration drivers must implement. Groups operations across tables/collections, columns, indexes, constraints, schema validation, transactions, defaults, extensions, and raw access.

#### Table / Collection Operations

#### `createTable(table: string): Promise<void>` [lines 213-218]
- Create a new table or collection.

#### `createTableIfNotExists(table: string): Promise<void>` [lines 220-225]
- Create a table/collection only if it doesn't already exist.

#### `dropTable(table: string): Promise<void>` [lines 227-232]
- Drop an existing table or collection.

#### `dropTableIfExists(table: string): Promise<void>` [lines 234-239]
- Drop table only if it exists (no error if missing).

#### `renameTable(from: string, to: string): Promise<void>` [lines 241-247]
- Rename a table or collection.

#### `truncateTable(table: string): Promise<void>` [lines 249-254]
- Truncate a table — remove all rows efficiently.

#### `tableExists(table: string): Promise<boolean>` [lines 256-262]
- Check whether a table or collection exists.

#### `listColumns(table: string): Promise<ColumnDefinition[]>` [lines 264-270]
- List all columns in a table.

#### `listTables(): Promise<string[]>` [lines 272-277]
- List all tables in the current database/connection.

#### `ensureMigrationsTable(tableName: string): Promise<void>` [lines 279-290]
- Ensure the migrations tracking table exists with columns `name` (unique), `batch`, `executedAt`, and optional `createdAt`. Default name `"_migrations"`.

#### Column Operations

#### `addColumn(table: string, column: ColumnDefinition): Promise<void>` [lines 296-304]
- Add a column to an existing table. No-op for schema-less databases like MongoDB.

#### `dropColumn(table: string, column: string): Promise<void>` [lines 306-314]
- Drop a column from an existing table. MongoDB optionally runs `$unset` on all documents.

#### `dropColumns(table: string, columns: string[]): Promise<void>` [lines 316-322]
- Drop multiple columns from an existing table.

#### `renameColumn(table: string, from: string, to: string): Promise<void>` [lines 324-331]
- Rename a column.

#### `modifyColumn(table: string, column: ColumnDefinition): Promise<void>` [lines 333-339]
- Modify an existing column's definition (the column name in the definition must match the existing column).

#### `createTimestampColumns(table: string): Promise<void>` [lines 341-350]
- Create standard `created_at`/`updated_at` columns; PostgreSQL uses TIMESTAMPTZ with NOW(), MongoDB is no-op or schema validation.

#### Index Operations

#### `createIndex(table: string, index: IndexDefinition): Promise<void>` [lines 356-362]
- Create an index on one or more columns.

#### `dropIndex(table: string, indexNameOrColumns: string | string[]): Promise<void>` [lines 364-370]
- Drop an index by name (string) or by its columns (array).

#### `createUniqueIndex(table: string, columns: string[], name?: string): Promise<void>` [lines 372-379]
- Create a unique index/constraint.

#### `dropUniqueIndex(table: string, columns: string[]): Promise<void>` [lines 381-387]
- Drop a unique index/constraint identified by columns.

#### Specialized Indexes

#### `createFullTextIndex(table: string, columns: string[], options?: FullTextIndexOptions): Promise<void>` [lines 393-404]
- Create a full-text search index.

#### `dropFullTextIndex(table: string, name: string): Promise<void>` [lines 406-412]
- Drop a full-text search index by name.

#### `createGeoIndex(table: string, column: string, options?: GeoIndexOptions): Promise<void>` [lines 414-421]
- Create a geo-spatial index.

#### `dropGeoIndex(table: string, column: string): Promise<void>` [lines 423-429]
- Drop a geo-spatial index (located via column).

#### `createVectorIndex(table: string, column: string, options: VectorIndexOptions): Promise<void>` [lines 431-438]
- Create a vector search index for AI embeddings.

#### `dropVectorIndex(table: string, column: string): Promise<void>` [lines 440-446]
- Drop a vector search index.

#### `createTTLIndex(table: string, column: string, expireAfterSeconds: number): Promise<void>` [lines 448-457]
- Create a TTL index for automatic document expiration. Primarily MongoDB; SQL drivers may throw "not supported".

#### `dropTTLIndex(table: string, column: string): Promise<void>` [lines 459-465]
- Drop a TTL index.

#### `listIndexes(table: string): Promise<TableIndexInformation[]>` [lines 467-473]
- List all indexes on a table.

#### Constraints (SQL)

#### `addForeignKey(table: string, foreignKey: ForeignKeyDefinition): Promise<void>` [lines 479-487]
- Add a foreign key constraint. No-op for MongoDB.

#### `dropForeignKey(table: string, name: string): Promise<void>` [lines 489-495]
- Drop a foreign key constraint by name.

#### `addPrimaryKey(table: string, columns: string[]): Promise<void>` [lines 497-503]
- Add a primary key constraint over given columns.

#### `dropPrimaryKey(table: string): Promise<void>` [lines 505-510]
- Drop the primary key constraint.

#### `addCheck(table: string, name: string, expression: string): Promise<void>` [lines 512-521]
- Add a CHECK constraint validating that all rows satisfy the given SQL expression.

#### `dropCheck(table: string, name: string): Promise<void>` [lines 523-529]
- Drop a CHECK constraint by name.

#### Schema Validation (NoSQL)

#### `setSchemaValidation(table: string, schema: object): Promise<void>` [lines 535-543]
- Set JSON-schema validation rules on a collection. Primarily MongoDB; SQL databases ignore.

#### `removeSchemaValidation(table: string): Promise<void>` [lines 545-550]
- Remove schema validation rules from a collection.

#### Transactions

#### `beginTransaction(): Promise<void>` [lines 556-559]
- Begin a database transaction.

#### `commit(): Promise<void>` [lines 561-564]
- Commit the current transaction.

#### `rollback(): Promise<void>` [lines 566-569]
- Rollback the current transaction.

#### `supportsTransactions(): boolean` [lines 571-574]
- Whether the driver supports transactions.

#### `getDefaultTransactional(): boolean` [lines 576-591]
- Default transactional behavior for this driver. PostgreSQL returns true, MongoDB returns false. Overridable by migration-level or config-level `transactional`.

#### Defaults

#### `getUuidDefault(migrationDefaults?: MigrationDefaults): string | undefined` [lines 597-623]
- Default UUID generation expression for the driver. Used by `Migration.primaryUuid()`. SQL drivers return native expressions (e.g., `gen_random_uuid()`); NoSQL drivers return `undefined`. Accepts `uuidStrategy` and raw `uuidExpression` overrides via `MigrationDefaults`.

#### Extensions

#### `isExtensionAvailable(extension: string): Promise<boolean>` [lines 629-635]
- Check whether a database extension/plugin is available on the server. Returns true when DB doesn't require explicit extension installation.

#### `getExtensionDocsUrl(extension: string): string | undefined` [lines 637-643]
- Return the official docs/install URL for a named extension, or `undefined` to fall back to a generic search.

#### Raw Access

#### `raw<T>(callback: (connection: unknown) => Promise<T>): Promise<T>` [lines 649-655]
- Execute raw operations with direct driver access via a callback receiving the native driver/connection.

#### `driver: DriverContract` [line 660]
- Property exposing the underlying database driver.

### `MigrationDriverFactory` [lines 666-668]
- Factory function type: `(source: DataSource | DriverContract) => MigrationDriverContract`. Used to construct a migration driver from either a `DataSource` or a raw `DriverContract`.
