# postgres-migration-driver
source: drivers/postgres/postgres-migration-driver.ts
description: PostgreSQL migration driver implementing DDL operations for tables, columns, indexes, and constraints.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `databaseTransactionContext` from `../../context/database-transaction-context`
- `ColumnDefinition` (type) from `../../contracts/migration-driver.contract`
- `ColumnType` (type) from `../../contracts/migration-driver.contract`
- `ForeignKeyDefinition` (type) from `../../contracts/migration-driver.contract`
- `FullTextIndexOptions` (type) from `../../contracts/migration-driver.contract`
- `GeoIndexOptions` (type) from `../../contracts/migration-driver.contract`
- `IndexDefinition` (type) from `../../contracts/migration-driver.contract`
- `MigrationDriverContract` (type) from `../../contracts/migration-driver.contract`
- `TableIndexInformation` (type) from `../../contracts/migration-driver.contract`
- `VectorIndexOptions` (type) from `../../contracts/migration-driver.contract`
- `MigrationDefaults` (type) from `../../types`
- `UuidStrategy` (type) from `../../types`
- `PostgresDriver` (type) from `./postgres-driver`

## Exports
- `PostgresMigrationDriver` — PostgreSQL DDL driver implementing `MigrationDriverContract`  [lines 54-1061]

## Classes / Functions / Types / Constants

### `PostgresMigrationDriver` [lines 54-1061]
- Implements `MigrationDriverContract` for PostgreSQL. Wraps a `PostgresDriver` to provide schema operations: tables, columns, indexes (B-tree, GIN, GiST, ivfflat, TTL), constraints (FK, PK, CHECK), extension introspection, transactions, and UUID default resolution.

#### `constructor(driver: PostgresDriver)` [line 67]
- Stores the PostgreSQL driver instance on the public readonly `driver` property.

#### `createTable(table: string): Promise<void>` [lines 78-82]
- Executes `CREATE TABLE <quoted>()`. Columns must be added via `addColumn`.

#### `createTableIfNotExists(table: string): Promise<void>` [lines 89-93]
- Executes `CREATE TABLE IF NOT EXISTS <quoted>()`.

#### `dropTable(table: string): Promise<void>` [lines 100-103]
- Executes `DROP TABLE <quoted> CASCADE`.

#### `dropTableIfExists(table: string): Promise<void>` [lines 110-113]
- Executes `DROP TABLE IF EXISTS <quoted> CASCADE`.

#### `renameTable(from: string, to: string): Promise<void>` [lines 121-125]
- Executes `ALTER TABLE <from> RENAME TO <to>`.

#### `truncateTable(table: string): Promise<void>` [lines 132-135]
- Executes `TRUNCATE TABLE <quoted>`.

#### `tableExists(table: string): Promise<boolean>` [lines 143-153]
- Queries `information_schema.tables` for the given name in `public` schema; returns boolean.

#### `listColumns(table: string): Promise<ColumnDefinition[]>` [lines 161-195]
- Queries `information_schema.columns` ordered by ordinal position, mapping each row to `ColumnDefinition` (name, type via `mapPostgresTypeToColumnType`, length, precision, scale, nullable, defaultValue).

#### `listTables(): Promise<string[]>` [lines 202-211]
- Queries `information_schema.tables` in `public` schema; returns sorted table names.

#### `ensureMigrationsTable(tableName: string): Promise<void>` [lines 220-232]
- Creates migrations tracking table if absent with columns: `id` SERIAL PK, `name` VARCHAR(255) UNIQUE, `batch` INTEGER, `executedAt` TIMESTAMPTZ DEFAULT NOW(), `createdAt` TIMESTAMPTZ.

#### `addColumn(table: string, column: ColumnDefinition): Promise<void>` [lines 244-317]
- Builds `ALTER TABLE ... ADD COLUMN` SQL. Promotes `autoIncrement` integer/bigInteger to `SERIAL`/`BIGSERIAL`. Supports generated columns (STORED only; VIRTUAL ignored), NOT NULL, defaults (CURRENT_TIMESTAMP marker → NOW(), boolean, numeric, raw vs. quoted-literal via `isRawDefault`), primary and unique inline constraints.

#### `dropColumn(table: string, column: string): Promise<void>` [lines 325-329]
- Executes `ALTER TABLE ... DROP COLUMN`.

#### `dropColumns(table: string, columns: string[]): Promise<void>` [lines 337-341]
- Sequentially drops each column via `dropColumn`.

#### `renameColumn(table: string, from: string, to: string): Promise<void>` [lines 350-355]
- Executes `ALTER TABLE ... RENAME COLUMN ... TO ...`.

#### `modifyColumn(table: string, column: ColumnDefinition): Promise<void>` [lines 363-402]
- Issues separate ALTER statements: `ALTER COLUMN ... TYPE`, then `SET NOT NULL` / `DROP NOT NULL` based on `nullable`, then `SET DEFAULT` (CURRENT_TIMESTAMP marker → NOW(), strings quoted).

#### `createTimestampColumns(table: string): Promise<void>` [lines 411-427]
- Adds `created_at` and `updated_at` timestamp columns, NOT NULL, default `NOW()` (raw).

#### `createIndex(table: string, index: IndexDefinition): Promise<void>` [lines 445-492]
- Builds `CREATE [UNIQUE] INDEX [CONCURRENTLY] name ON table (...)`. Supports expression-based indexes (wrapped in parens), per-column directions, `INCLUDE` covering clause, and partial `WHERE` conditions from key/value map (strings are single-quoted). Default name `idx_<table>_<cols>`.

#### `dropIndex(table: string, indexNameOrColumns: string | string[]): Promise<void>` [lines 500-511]
- Accepts explicit index name or column list (derives `idx_<table>_<cols>`). Executes `DROP INDEX IF EXISTS`.

#### `createUniqueIndex(table: string, columns: string[], name?: string): Promise<void>` [lines 520-522]
- Delegates to `createIndex` with `unique: true`.

#### `dropUniqueIndex(table: string, columns: string[]): Promise<void>` [lines 530-532]
- Delegates to `dropIndex` with the columns list.

#### `createFullTextIndex(table: string, columns: string[], options?: FullTextIndexOptions): Promise<void>` [lines 545-563]
- Creates a GIN index over concatenated `setweight(to_tsvector(lang, COALESCE(col, '')), 'weight')` for each column. Default language `english`, default weight `A`. Default name `idx_<table>_fulltext_<cols>`.

#### `dropFullTextIndex(table: string, name: string): Promise<void>` [lines 571-573]
- Delegates to `dropIndex` using the provided name.

#### `createGeoIndex(table: string, column: string, options?: GeoIndexOptions): Promise<void>` [lines 582-595]
- Creates a GiST index on the column. Default name `idx_<table>_geo_<column>`.

#### `dropGeoIndex(table: string, column: string): Promise<void>` [lines 603-605]
- Drops the derived geo index name.

#### `createVectorIndex(table: string, column: string, options: VectorIndexOptions): Promise<void>` [lines 614-637]
- Creates an `ivfflat` index using pgvector op class based on `options.similarity` (`euclidean` → `vector_l2_ops`, `dotProduct` → `vector_ip_ops`, else `vector_cosine_ops`). `WITH (lists = <n>)`, default 100. Default name `idx_<table>_vector_<column>`.

#### `dropVectorIndex(table: string, column: string): Promise<void>` [lines 645-647]
- Drops the derived vector index name.

#### `createTTLIndex(table: string, column: string, expireAfterSeconds: number): Promise<void>` [lines 659-676]
- PostgreSQL has no native TTL; creates a partial index with predicate `<column> < NOW() - INTERVAL '<N> seconds'`. Caller must schedule cleanup separately (e.g., pg_cron).

#### `dropTTLIndex(table: string, column: string): Promise<void>` [lines 684-686]
- Drops the derived TTL index name.

#### `listIndexes(table: string): Promise<TableIndexInformation[]>` [lines 694-723]
- Queries `pg_indexes` for schema `public` and maps each entry, parsing `UNIQUE`, `_pkey` suffix, column list (regex), and index type from `USING` keyword (btree, gin, gist, hash, ivfflat); flags `partial` when `WHERE` is present.

#### `isExtensionAvailable(extension: string): Promise<boolean>` [lines 734-747]
- Queries `pg_available_extensions`; returns true on permission/query errors to avoid false negatives.

#### `getExtensionDocsUrl(extension: string): string | undefined` [lines 754-763]
- Returns curated URLs for `vector`, `postgis`, `pg_trgm`, `uuid_ossp`; otherwise falls back to `https://www.postgresql.org/docs/current/<ext>.html`.

#### `addForeignKey(table: string, foreignKey: ForeignKeyDefinition): Promise<void>` [lines 775-796]
- Adds `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ...`. Default constraint name `fk_<table>_<column>_<refTable>`. Appends `ON DELETE`/`ON UPDATE` via `mapForeignKeyAction` when set.

#### `dropForeignKey(table: string, name: string): Promise<void>` [lines 804-808]
- Executes `ALTER TABLE ... DROP CONSTRAINT <name>`.

#### `addPrimaryKey(table: string, columns: string[]): Promise<void>` [lines 816-825]
- Adds PK constraint named `pk_<table>` over the given columns.

#### `dropPrimaryKey(table: string): Promise<void>` [lines 832-838]
- Drops constraint named `pk_<table>`.

#### `addCheck(table: string, name: string, expression: string): Promise<void>` [lines 847-852]
- Adds `CHECK (<expression>)` constraint with the given name.

#### `dropCheck(table: string, name: string): Promise<void>` [lines 860-864]
- Drops the named constraint via `ALTER TABLE ... DROP CONSTRAINT`.

#### `setSchemaValidation(_table: string, _schema: object): Promise<void>` [lines 875-878]
- No-op. PostgreSQL relies on CHECK constraints rather than MongoDB-style validators.

#### `removeSchemaValidation(_table: string): Promise<void>` [lines 883-885]
- No-op.

#### `beginTransaction(): Promise<void>` [lines 894-896]
- Executes `BEGIN`.

#### `commit(): Promise<void>` [lines 901-903]
- Executes `COMMIT`.

#### `rollback(): Promise<void>` [lines 908-910]
- Executes `ROLLBACK`.

#### `supportsTransactions(): boolean` [lines 915-917]
- Always returns `true`.

#### `getDefaultTransactional(): boolean` [lines 927-929]
- Returns `true`; PostgreSQL DDL is transactional, so migrations wrap by default.

#### `getUuidDefault(migrationDefaults?: MigrationDefaults): string` [lines 953-967]
- Resolves UUID default expression: `migrationDefaults.uuidExpression` wins; otherwise maps `uuidStrategy` (`v4` → `gen_random_uuid()`, `v7` → `uuidv7()`) with `v4` fallback.

#### `raw<T>(callback: (connection: unknown) => Promise<T>): Promise<T>` [lines 978-980]
- Invokes the callback with the underlying `PostgresDriver` for escape-hatch raw access.

## Notes / Ambiguities
- Private `transactionClient` getter (lines 58-60) reads the active session from `databaseTransactionContext`, but is not referenced elsewhere in this file — `execute` routes through `this.driver.query` directly. Transaction binding appears to rely on driver-level context, not this getter.
- Private helpers `execute` (lines 992-994), `mapForeignKeyAction` (lines 999-1007), and `mapPostgresTypeToColumnType` (lines 1012-1060) are intentionally omitted per RULES ("Skip private").
- `addColumn` generated-column branch silently drops `virtual: true` since PostgreSQL only supports STORED.
- `modifyColumn` uses multiple ALTER statements; unlike `addColumn`, its default-value handling does not honor `isRawDefault` (strings are always single-quoted).
- `listIndexes` column extraction is a simple regex on the first parenthesized group, so expression indexes or `INCLUDE` clauses may be parsed imperfectly.
- `getUuidDefault` strategy map documents `v7` → `uuid_generate_v7()` in the JSDoc example but implementation returns `uuidv7()`.
