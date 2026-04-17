# migration
source: migration/migration.ts
description: Base Migration class, MigrationContract interface, declarative create/alter factories, and supporting types/enums for defining cross-driver schema changes.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `ColumnDefinition, ForeignKeyDefinition, FullTextIndexOptions, GeoIndexOptions, IndexDefinition, MigrationDriverContract, TableIndexInformation, VectorIndexOptions` from `../contracts/migration-driver.contract`
- `DataSource` from `../data-source/data-source`
- `ChildModel, Model` from `../model/model`
- `MigrationDefaults` from `../types`
- `DatabaseDriver` from `../utils/connect-to-database`
- `ColumnBuilder` from `./column-builder`
- `ForeignKeyBuilder` from `./foreign-key-builder`
- `DetachedColumnBuilder` (type-only, inline dynamic import) from `./column-helpers`

## Exports
- `OperationType` — string-literal union enumerating all queueable migration op types [lines 21-54]
- `PendingOperation` — `{ type: OperationType; payload: unknown }` record shape [lines 59-62]
- `MigrationContract` — structural interface every migration class implements [lines 67-623]
- `MigrationConstructor` — constructor signature with static metadata (`migrationName`, `createdAt`, `transactional`, `order`) [lines 628-634]
- `Migration` — abstract base class providing fluent schema DSL and declarative factories [lines 684-2705]
- `migrate(model, options?)` — function returning an anonymous `Migration` subclass from inline up/down closures [lines 2707-2731]
- `IndexEntry` — composite-index entry shape for `Migration.create()` [lines 2752-2766]
- `UniqueEntry` — composite-unique entry shape for `Migration.create()` [lines 2780-2789]
- `MigrationCreateOptions` — options bag for `Migration.create()` [lines 2794-2882]
- `ColumnMap` — `Record<string, DetachedColumnBuilder>` passed to create/alter [line 2890]
- `MigrationAlterOptions` — options bag for `Migration.alter()` [lines 2895-2913]
- `AlterSchema` — rich schema map passed to `Migration.alter()` [lines 2939-3148]

## Classes / Functions / Types / Constants

### `OperationType` [lines 21-54]
- String-literal union of every operation queueable in `pendingOperations`.
- Variants:
  - `"addColumn"`
  - `"dropColumn"`
  - `"dropColumns"`
  - `"renameColumn"`
  - `"modifyColumn"`
  - `"createIndex"`
  - `"dropIndex"`
  - `"createUniqueIndex"`
  - `"dropUniqueIndex"`
  - `"createFullTextIndex"`
  - `"dropFullTextIndex"`
  - `"createGeoIndex"`
  - `"dropGeoIndex"`
  - `"createVectorIndex"`
  - `"dropVectorIndex"`
  - `"createTTLIndex"`
  - `"dropTTLIndex"`
  - `"addForeignKey"`
  - `"dropForeignKey"`
  - `"addPrimaryKey"`
  - `"dropPrimaryKey"`
  - `"addCheck"`
  - `"dropCheck"`
  - `"createTable"`
  - `"createTableIfNotExists"`
  - `"dropTable"`
  - `"dropTableIfExists"`
  - `"renameTable"`
  - `"truncateTable"`
  - `"createTimestamps"`
  - `"rawStatement"`
  - `"setSchemaValidation"`
  - `"removeSchemaValidation"`

### `PendingOperation` [lines 59-62]
- Readonly `{ type: OperationType; payload: unknown }` record queued on a migration instance and drained by `execute()` / `toSQL()`.

### `MigrationContract` [lines 67-623]
- Structural interface that every migration class implements. Mirrors the Migration class surface; a consumer can program against the contract without extending `Migration`.

#### `readonly table: string` [line 71]
- Table/collection name for this migration.

#### `readonly dataSource?: string | DataSource` [line 76]
- Optional data source override — string name or DataSource instance.

#### `readonly transactional?: boolean` [line 81]
- Whether to wrap migration in a transaction.

#### `up(): void | Promise<void>` [line 86]
- Defines schema changes executed when running migrations forward.

#### `down(): void | Promise<void>` [line 91]
- Defines rollback operations executed when rolling back.

#### `setDriver(driver: MigrationDriverContract): void` [line 99]
- Inject the migration driver. `@internal`.

#### `setMigrationDefaults(defaults?: MigrationDefaults): void` [line 107]
- Inject migration defaults (UUID strategy, primary-key type, etc.) resolved from the DataSource. `@internal`.

#### `getDriver(): MigrationDriverContract` [line 114]
- Return the injected migration driver.

#### `execute(): Promise<void>` [line 121]
- Drain and execute all queued pending operations. `@internal`, deprecated in favor of `toSQL()`.

#### `addPendingIndex(index: IndexDefinition): void` [line 129]
- Queue an index definition (unique or regular). `@internal`.

#### `addForeignKeyOperation(fk: ForeignKeyDefinition): void` [line 137]
- Queue a foreign-key operation. `@internal`.

#### `createTable(): MigrationContract` [line 142]
- Queue table/collection creation.

#### `createTableIfNotExists(): MigrationContract` [line 147]
- Queue idempotent table/collection creation.

#### `dropTable(): MigrationContract` [line 152]
- Queue table/collection drop.

#### `dropTableIfExists(): MigrationContract` [line 157]
- Queue idempotent table/collection drop.

#### `renameTableTo(newName: string): MigrationContract` [line 164]
- Queue rename of the current table/collection.

#### `truncateTable(): MigrationContract` [line 169]
- Queue truncation — removes all rows without logging/triggers.

#### `string(column: string, length?: number): ColumnBuilder` [line 174]
- Add a VARCHAR column (default length 255).

#### `char(column: string, length: number): ColumnBuilder` [line 179]
- Add a fixed-length CHAR column.

#### `text(column: string): ColumnBuilder` [line 184]
- Add a TEXT column.

#### `mediumText(column: string): ColumnBuilder` [line 189]
- Add a MEDIUMTEXT column.

#### `longText(column: string): ColumnBuilder` [line 194]
- Add a LONGTEXT column.

#### `integer(column: string): ColumnBuilder` [line 199]
- Add an INTEGER column.

#### `int(column: string): ColumnBuilder` [line 204]
- Alias for `integer()`.

#### `smallInteger(column: string): ColumnBuilder` [line 209]
- Add a SMALLINT column.

#### `smallInt(column: string): ColumnBuilder` [line 214]
- Alias for `smallInteger()`.

#### `tinyInteger(column: string): ColumnBuilder` [line 219]
- Add a TINYINT column.

#### `tinyInt(column: string): ColumnBuilder` [line 224]
- Alias for `tinyInteger()`.

#### `bigInteger(column: string): ColumnBuilder` [line 229]
- Add a BIGINT column.

#### `bigInt(column: string): ColumnBuilder` [line 234]
- Alias for `bigInteger()`.

#### `float(column: string): ColumnBuilder` [line 239]
- Add a FLOAT column.

#### `double(column: string): ColumnBuilder` [line 244]
- Add a DOUBLE PRECISION column.

#### `decimal(column: string, precision?: number, scale?: number): ColumnBuilder` [line 249]
- Add a DECIMAL column with precision/scale.

#### `boolean(column: string): ColumnBuilder` [line 254]
- Add a BOOLEAN column.

#### `bool(column: string): ColumnBuilder` [line 259]
- Alias for `boolean()`.

#### `date(column: string): ColumnBuilder` [line 264]
- Add a DATE column.

#### `dateTime(column: string): ColumnBuilder` [line 269]
- Add a DATETIME column.

#### `timestamp(column: string): ColumnBuilder` [line 274]
- Add a TIMESTAMP column.

#### `time(column: string): ColumnBuilder` [line 279]
- Add a TIME column.

#### `year(column: string): ColumnBuilder` [line 284]
- Add a YEAR column.

#### `json(column: string): ColumnBuilder` [line 289]
- Add a JSON column.

#### `object(column: string): ColumnBuilder` [line 294]
- Alias for `json()`.

#### `binary(column: string): ColumnBuilder` [line 299]
- Add a BINARY / BLOB column.

#### `blob(column: string): ColumnBuilder` [line 304]
- Alias for `binary()`.

#### `uuid(column: string): ColumnBuilder` [line 309]
- Add a UUID column.

#### `ulid(column: string): ColumnBuilder` [line 314]
- Add a ULID column.

#### `ipAddress(column: string): ColumnBuilder` [line 319]
- Add an IP-address column.

#### `macAddress(column: string): ColumnBuilder` [line 324]
- Add a MAC-address column.

#### `point(column: string): ColumnBuilder` [line 329]
- Add a POINT geometry column.

#### `polygon(column: string): ColumnBuilder` [line 334]
- Add a POLYGON column.

#### `lineString(column: string): ColumnBuilder` [line 339]
- Add a LINESTRING column.

#### `geometry(column: string): ColumnBuilder` [line 344]
- Add a generic GEOMETRY column.

#### `vector(column: string, dimensions: number): ColumnBuilder` [line 349]
- Add an AI-embedding vector column (first declaration).

#### `enum(column: string, values: string[]): ColumnBuilder` [line 354]
- Add an enum column with allowed values.

#### `set(column: string, values: string[]): ColumnBuilder` [line 359]
- Add a set column (multi-select from allowed values).

#### `arrayInt(column: string): ColumnBuilder` [line 364]
- INTEGER[] array column.

#### `arrayBigInt(column: string): ColumnBuilder` [line 367]
- BIGINT[] array column.

#### `arrayFloat(column: string): ColumnBuilder` [line 370]
- REAL[] array column.

#### `arrayDecimal(column: string, precision?: number, scale?: number): ColumnBuilder` [line 373]
- DECIMAL[] array column with optional precision/scale.

#### `arrayBoolean(column: string): ColumnBuilder` [line 376]
- BOOLEAN[] array column.

#### `arrayText(column: string): ColumnBuilder` [line 379]
- TEXT[] array column.

#### `arrayDate(column: string): ColumnBuilder` [line 382]
- DATE[] array column.

#### `arrayTimestamp(column: string): ColumnBuilder` [line 385]
- TIMESTAMPTZ[] array column.

#### `arrayUuid(column: string): ColumnBuilder` [line 388]
- UUID[] array column.

#### `id(name?: string): ColumnBuilder` [line 393]
- Unsigned auto-increment integer primary key (default name `"id"`).

#### `bigId(name?: string): ColumnBuilder` [line 398]
- Unsigned auto-increment big-integer primary key.

#### `uuidId(name?: string): ColumnBuilder` [line 403]
- UUID primary-key column (no default value).

#### `primaryUuid(name?: string): ColumnBuilder` [line 420]
- UUID primary key with driver-resolved default (PG: `gen_random_uuid()`; Mongo: app-level).

#### `timestamps(): MigrationContract` [line 425]
- Add createdAt/updatedAt columns (driver-specific behavior).

#### `softDeletes(column?: string): ColumnBuilder` [line 430]
- Add a nullable deletedAt datetime column (default name `"deletedAt"`).

#### `dropColumn(column: string): MigrationContract` [line 435]
- Queue a DROP COLUMN.

#### `dropColumns(...columns: string[]): MigrationContract` [line 440]
- Queue drop of multiple columns.

#### `renameColumn(from: string, to: string): MigrationContract` [line 445]
- Queue a column rename.

#### `index(columns: string | string[], name?: string, options?: { include?: string[]; concurrently?: boolean }): MigrationContract` [lines 454-458]
- Create an index on one or more columns.

#### `dropIndex(nameOrColumns: string | string[]): MigrationContract` [line 463]
- Drop an index by name or by columns.

#### `unique(columns: string | string[], name?: string, options?: { include?: string[]; concurrently?: boolean }): MigrationContract` [lines 472-476]
- Create a unique constraint/index.

#### `dropUnique(columns: string | string[]): MigrationContract` [line 481]
- Drop a unique constraint/index.

#### `expressionIndex(expressions: string | string[], name?: string, options?: { concurrently?: boolean }): MigrationContract` [lines 490-494]
- Create an expression-based index (PostgreSQL).

#### `fullText(columns: string | string[], options?: FullTextIndexOptions): MigrationContract` [line 499]
- Create a full-text search index.

#### `dropFullText(name: string): MigrationContract` [line 504]
- Drop a full-text index by name.

#### `geoIndex(column: string, options?: GeoIndexOptions): MigrationContract` [line 509]
- Create a geo-spatial index.

#### `dropGeoIndex(column: string): MigrationContract` [line 514]
- Drop a geo-spatial index.

#### `vectorIndex(column: string, options: VectorIndexOptions): MigrationContract` [line 519]
- Create a vector search index for embeddings.

#### `dropVectorIndex(column: string): MigrationContract` [line 524]
- Drop a vector search index.

#### `ttlIndex(column: string, expireAfterSeconds: number): MigrationContract` [line 529]
- Create a TTL index (document expiration).

#### `dropTTLIndex(column: string): MigrationContract` [line 534]
- Drop a TTL index.

#### `primaryKey(columns: string[]): MigrationContract` [line 539]
- Add a composite primary key.

#### `dropPrimaryKey(): MigrationContract` [line 544]
- Drop the primary key constraint.

#### `foreign(column: string): ForeignKeyBuilder` [line 549]
- Start building a foreign-key constraint on an existing column.

#### `dropForeign(columnOrConstraint: string, referencesTable?: string): MigrationContract` [line 560]
- Drop a foreign key — auto-computes `fk_{table}_{column}_{referencesTable}` when `referencesTable` is provided, otherwise treats the argument as a raw constraint name.

#### `schemaValidation(schema: object): MigrationContract` [line 565]
- Set JSON-schema validation (MongoDB).

#### `dropSchemaValidation(): MigrationContract` [line 570]
- Remove JSON-schema validation (MongoDB).

#### `hasTable(tableName: string): Promise<boolean>` [line 575]
- Check table existence.

#### `hasColumn(columnName: string): Promise<boolean>` [line 580]
- Check column existence on current table.

#### `getColumns(): Promise<ColumnDefinition[]>` [line 585]
- List all columns on the current table.

#### `listTables(): Promise<string[]>` [line 590]
- List all tables in the active database/connection.

#### `getIndexes(): Promise<TableIndexInformation[]>` [line 595]
- List all indexes on the current table.

#### `hasIndex(indexName: string): Promise<boolean>` [line 600]
- Check whether a named index exists on the current table.

#### `raw(sql: string): this` [line 607]
- Queue a raw SQL statement.

#### `withConnection<T>(callback: (connection: unknown) => Promise<T>): Promise<T>` [line 614]
- Execute raw operations via the native driver connection.

#### `vector(column: string, dimensions: number): ColumnBuilder` [line 622]
- Second declaration of `vector()` in the contract — redundant duplicate of the earlier member at line 349.

### `MigrationConstructor` [lines 628-634]
- Constructor signature for `Migration` subclasses.
- Members:
  - `new (): MigrationContract`
  - `migrationName?: string`
  - `createdAt?: string`
  - `transactional?: boolean`
  - `order?: number`

### `Migration` [lines 684-2705]
- Abstract base class implementing `MigrationContract`. Queues operations into `pendingOperations` and either executes them via the driver (legacy `execute()`) or serializes to SQL via `toSQL()`.
- Subclass via `extends Migration`, `extends Migration.for(Model)`, `Migration.create(Model, columns, options)`, `Migration.alter(Model, schema, options)`, or the `migrate()` function.
- side-effects: pushes to internal `pendingOperations` on every DSL method; `execute()` mutates driver state; `toSQL()` drains the queue.
- throws: `executeOperation("rawStatement")` throws `Error("Unsupported database driver for statement execution")` when the driver exposes neither `query()` nor `command()`.

##### Static members

#### `static migrationName?: string` [line 695]
- Optional label stored in the migrations record table.

#### `static readonly order?: number` [line 708]
- Optional sort order; alphabetical when omitted.

#### `static readonly createdAt?: string` [line 726]
- Optional ISO-8601 timestamp override (normally extracted from filename).

#### `static for<T extends ChildModel<Model>>(model: T): MigrationConstructor` [lines 801-808]
- Factory returning an abstract `Migration` subclass bound to a model's `table` and `dataSource`.

#### `static create: (model: ChildModel<Model<any>>, columns: ColumnMap, options?: MigrationCreateOptions) => MigrationConstructor` [lines 2690-2694]
- Declarative "create table" migration factory (implementation attached below class body — see `Migration.create` implementation section).

#### `static alter: (model: ChildModel<Model<any>>, schema: AlterSchema, options?: MigrationAlterOptions) => MigrationConstructor` [lines 2700-2704]
- Declarative "alter table" migration factory (implementation attached below class body — see `Migration.alter` implementation section).

##### Instance properties

#### `readonly table!: string` [line 702]
- Target table/collection name (required on every subclass).

#### `readonly dataSource?: string | DataSource` [line 716]
- Optional per-migration DataSource override.

#### `readonly transactional?: boolean` [line 736]
- Whether to wrap the migration in a DDL transaction.

##### Abstract methods

#### `abstract up(): void | Promise<void>` [line 765]
- Define forward schema changes.

#### `abstract down(): void | Promise<void>` [line 773]
- Define rollback operations.

##### Driver injection

#### `setDriver(driver: MigrationDriverContract): void` [lines 822-824]
- Stores the driver on the instance. `@internal`.

#### `setMigrationDefaults(defaults?: MigrationDefaults): void` [lines 832-834]
- Stores migration defaults (UUID/primary-key strategies) on the instance. `@internal`.

#### `getDriver(): MigrationDriverContract` [lines 841-843]
- Returns the injected driver.

#### `get databaseEngine(): DatabaseDriver` [lines 848-850]
- Getter — returns the underlying engine's `DatabaseDriver` name (MongoDB, PostgreSQL, ...).

##### Execute / serialize

#### `async execute(): Promise<void>` [lines 863-869]
- Drain and execute every queued operation via `executeOperation`. Deprecated in favor of `toSQL()`.

#### `toSQL(): string[]` [lines 892-897]
- Serialize all queued operations to SQL via the driver's grammar serializer; clears the queue after emitting.

##### Schema inspection

#### `async hasTable(tableName: string): Promise<boolean>` [lines 1111-1113]
- Delegates to `driver.tableExists`.

#### `async hasColumn(columnName: string): Promise<boolean>` [lines 1130-1133]
- Loads columns via `getColumns()` and checks by name.

#### `async getColumns(): Promise<ColumnDefinition[]>` [lines 1148-1150]
- Delegates to `driver.listColumns`.

#### `async listTables(): Promise<string[]>` [lines 1165-1167]
- Delegates to `driver.listTables`.

#### `async getIndexes(): Promise<TableIndexInformation[]>` [lines 1172-1174]
- Delegates to `driver.listIndexes`.

#### `async hasIndex(indexName: string): Promise<boolean>` [lines 1179-1182]
- Checks `getIndexes()` results.

##### Internal helpers

#### `addPendingIndex(index: IndexDefinition): void` [lines 1198-1210]
- Routes unique indexes to the `createUniqueIndex` op and non-unique to the `createIndex` op. `@internal`.

#### `addForeignKeyOperation(fk: ForeignKeyDefinition): void` [lines 1220-1225]
- Queues an `addForeignKey` op. `@internal`.

##### Table operations

#### `createTable(): this` [lines 1239-1242]
- Queue `createTable`.

#### `createTableIfNotExists(): this` [lines 1247-1250]
- Queue `createTableIfNotExists`.

#### `dropTable(): this` [lines 1257-1260]
- Queue `dropTable`.

#### `dropTableIfExists(): this` [lines 1269-1272]
- Queue `dropTableIfExists`.

#### `renameTableTo(newName: string): this` [lines 1280-1283]
- Queue a `renameTable` op.

#### `truncateTable(): this` [lines 1293-1296]
- Queue a `truncateTable` op.

##### Column types — string

#### `string(column: string, length = 255): ColumnBuilder` [lines 1315-1322]
- Queue VARCHAR column; returns a ColumnBuilder for chaining.

#### `char(column: string, length: number): ColumnBuilder` [lines 1331-1338]
- Queue CHAR(length) column.

#### `text(column: string): ColumnBuilder` [lines 1346-1353]
- Queue TEXT column.

#### `mediumText(column: string): ColumnBuilder` [lines 1361-1368]
- Queue MEDIUMTEXT column.

#### `longText(column: string): ColumnBuilder` [lines 1376-1383]
- Queue LONGTEXT column.

##### Column types — numeric

#### `integer(column: string): ColumnBuilder` [lines 1395-1402]
- Queue INTEGER column.

#### `int(column: string): ColumnBuilder` [lines 1407-1409]
- Alias delegating to `integer()`.

#### `smallInteger(column: string): ColumnBuilder` [lines 1417-1424]
- Queue SMALLINT column.

#### `smallInt(column: string): ColumnBuilder` [lines 1429-1431]
- Alias delegating to `smallInteger()`.

#### `tinyInteger(column: string): ColumnBuilder` [lines 1439-1446]
- Queue TINYINT column.

#### `tinyInt(column: string): ColumnBuilder` [lines 1451-1453]
- Alias delegating to `tinyInteger()`.

#### `bigInteger(column: string): ColumnBuilder` [lines 1461-1468]
- Queue BIGINT column.

#### `bigInt(column: string): ColumnBuilder` [lines 1473-1475]
- Alias delegating to `bigInteger()`.

#### `float(column: string): ColumnBuilder` [lines 1483-1490]
- Queue FLOAT column.

#### `double(column: string): ColumnBuilder` [lines 1498-1505]
- Queue DOUBLE PRECISION column.

#### `decimal(column: string, precision = 8, scale = 2): ColumnBuilder` [lines 1520-1530]
- Queue DECIMAL(precision, scale) column.

##### Column types — boolean

#### `boolean(column: string): ColumnBuilder` [lines 1542-1549]
- Queue BOOLEAN column.

#### `bool(column: string): ColumnBuilder` [lines 1554-1556]
- Alias delegating to `boolean()`.

##### Column types — date/time

#### `date(column: string): ColumnBuilder` [lines 1568-1575]
- Queue DATE column.

#### `dateTime(column: string): ColumnBuilder` [lines 1583-1590]
- Queue DATETIME column.

#### `timestamp(column: string): ColumnBuilder` [lines 1598-1605]
- Queue TIMESTAMP column.

#### `time(column: string): ColumnBuilder` [lines 1613-1620]
- Queue TIME column.

#### `year(column: string): ColumnBuilder` [lines 1628-1635]
- Queue YEAR column.

##### Column types — JSON & binary

#### `json(column: string): ColumnBuilder` [lines 1647-1654]
- Queue JSON column.

#### `object(column: string): ColumnBuilder` [lines 1659-1661]
- Alias delegating to `json()`.

#### `binary(column: string): ColumnBuilder` [lines 1669-1676]
- Queue BINARY/BLOB column.

#### `blob(column: string): ColumnBuilder` [lines 1681-1683]
- Alias delegating to `binary()`.

##### Column types — identifiers

#### `uuid(column: string): ColumnBuilder` [lines 1695-1702]
- Queue UUID column.

#### `ulid(column: string): ColumnBuilder` [lines 1710-1717]
- Queue ULID column.

##### Column types — network

#### `ipAddress(column: string): ColumnBuilder` [lines 1729-1736]
- Queue IP-address column.

#### `macAddress(column: string): ColumnBuilder` [lines 1744-1751]
- Queue MAC-address column.

##### Column types — geo / spatial

#### `point(column: string): ColumnBuilder` [lines 1763-1770]
- Queue geo POINT column.

#### `polygon(column: string): ColumnBuilder` [lines 1778-1785]
- Queue POLYGON column.

#### `lineString(column: string): ColumnBuilder` [lines 1793-1800]
- Queue LINESTRING column.

#### `geometry(column: string): ColumnBuilder` [lines 1808-1815]
- Queue generic GEOMETRY column.

##### Column types — AI/ML

#### `vector(column: string, dimensions: number): ColumnBuilder` [lines 1836-1843]
- Queue a vector column for AI embeddings with fixed dimensionality.

##### Column types — enum/set

#### `enum(column: string, values: string[]): ColumnBuilder` [lines 1861-1868]
- Queue enum column with allowed-values list.

#### `set(column: string, values: string[]): ColumnBuilder` [lines 1877-1884]
- Queue set column with allowed-values list.

##### Column types — PostgreSQL arrays

#### `arrayInt(column: string): ColumnBuilder` [lines 1898-1902]
- Queue INTEGER[] column.

#### `arrayBigInt(column: string): ColumnBuilder` [lines 1912-1916]
- Queue BIGINT[] column.

#### `arrayFloat(column: string): ColumnBuilder` [lines 1926-1930]
- Queue REAL[] column.

#### `arrayDecimal(column: string, precision?: number, scale?: number): ColumnBuilder` [lines 1944-1948]
- Queue DECIMAL[] column with optional precision/scale.

#### `arrayBoolean(column: string): ColumnBuilder` [lines 1958-1962]
- Queue BOOLEAN[] column.

#### `arrayText(column: string): ColumnBuilder` [lines 1972-1976]
- Queue TEXT[] column.

#### `arrayDate(column: string): ColumnBuilder` [lines 1986-1990]
- Queue DATE[] column.

#### `arrayTimestamp(column: string): ColumnBuilder` [lines 2000-2004]
- Queue TIMESTAMPTZ[] column.

#### `arrayUuid(column: string): ColumnBuilder` [lines 2014-2018]
- Queue UUID[] column.

##### Shortcuts

#### `id(name = "id"): ColumnBuilder` [lines 2038-2040]
- Shortcut: unsigned auto-increment integer primary key.

#### `bigId(name = "id"): ColumnBuilder` [lines 2048-2050]
- Shortcut: unsigned auto-increment big-integer primary key.

#### `uuidId(name = "id"): ColumnBuilder` [lines 2058-2060]
- Shortcut: UUID primary key (no default value).

#### `primaryUuid(name = "id"): ColumnBuilder` [lines 2082-2091]
- UUID primary key with driver-resolved default via `driver.getUuidDefault(this._migrationDefaults)` (e.g. `gen_random_uuid()` on PG).

#### `timestamps(): this` [lines 2107-2110]
- Queue `createTimestamps` op (createdAt / updatedAt).

#### `softDeletes(column = "deletedAt"): ColumnBuilder` [lines 2118-2120]
- Add a nullable datetime column for soft deletion.

##### Drop column operations

#### `dropColumn(column: string): this` [lines 2132-2135]
- Queue a `dropColumn` op.

#### `dropColumns(...columns: string[]): this` [lines 2143-2146]
- Queue a `dropColumns` op with multiple names.

#### `renameColumn(from: string, to: string): this` [lines 2155-2161]
- Queue a `renameColumn` op.

##### Index operations

#### `index(columns: string | string[], name?: string, options?: { include?: string[]; concurrently?: boolean }): this` [lines 2183-2199]
- Queue `createIndex` op with optional include-columns / concurrently flag.

#### `dropIndex(nameOrColumns: string | string[]): this` [lines 2213-2219]
- Queue `dropIndex` op by name or columns.

#### `unique(columns: string | string[], name?: string, options?: { include?: string[]; concurrently?: boolean }): this` [lines 2236-2252]
- Queue `createUniqueIndex` op.

#### `dropUnique(columns: string | string[]): this` [lines 2260-2264]
- Queue `dropUniqueIndex` op.

#### `expressionIndex(expressions: string | string[], name?: string, options?: { concurrently?: boolean }): this` [lines 2291-2307]
- Queue expression-based `createIndex` op (PostgreSQL-specific).

##### Full-text index

#### `fullText(columns: string | string[], options?: FullTextIndexOptions): this` [lines 2320-2327]
- Queue `createFullTextIndex` op.

#### `dropFullText(name: string): this` [lines 2335-2338]
- Queue `dropFullTextIndex` op by name.

##### Geo index

#### `geoIndex(column: string, options?: GeoIndexOptions): this` [lines 2357-2363]
- Queue `createGeoIndex` op.

#### `dropGeoIndex(column: string): this` [lines 2371-2374]
- Queue `dropGeoIndex` op by column.

##### Vector index

#### `vectorIndex(column: string, options: VectorIndexOptions): this` [lines 2395-2401]
- Queue `createVectorIndex` op.

#### `dropVectorIndex(column: string): this` [lines 2409-2412]
- Queue `dropVectorIndex` op.

##### TTL index

#### `ttlIndex(column: string, expireAfterSeconds: number): this` [lines 2434-2440]
- Queue `createTTLIndex` op with expiration seconds.

#### `dropTTLIndex(column: string): this` [lines 2448-2451]
- Queue `dropTTLIndex` op by column.

##### Primary key

#### `primaryKey(columns: string[]): this` [lines 2463-2466]
- Queue composite `addPrimaryKey` op.

#### `dropPrimaryKey(): this` [lines 2473-2476]
- Queue `dropPrimaryKey` op.

##### Check constraints

#### `check(name: string, expression: string): this` [lines 2499-2505]
- Queue an `addCheck` SQL CHECK constraint.

#### `dropCheck(name: string): this` [lines 2518-2524]
- Queue a `dropCheck` constraint by name.

##### Foreign keys (SQL)

#### `foreign(column: string): ForeignKeyBuilder` [lines 2549-2551]
- Start a `ForeignKeyBuilder` for an existing column.

#### `dropForeign(columnOrConstraint: string, referencesTable?: string): this` [lines 2573-2579]
- Queue `dropForeignKey` op. When `referencesTable` is supplied, auto-computes `fk_{table}_{column}_{referencesTable}`; otherwise passes the argument through as the raw constraint name.

##### Schema validation (NoSQL)

#### `schemaValidation(schema: object): this` [lines 2605-2611]
- Queue `setSchemaValidation` op (MongoDB).

#### `dropSchemaValidation(): this` [lines 2618-2624]
- Queue `removeSchemaValidation` op (MongoDB).

##### Raw access

#### `async withConnection<T>(callback: (connection: unknown) => Promise<T>): Promise<T>` [lines 2646-2648]
- Run a callback with direct driver connection (delegates to `driver.raw`).

#### `raw(sql: string): this` [lines 2672-2678]
- Queue a raw SQL statement for in-order execution (works for PG/MySQL; MongoDB uses `$eval`).

### `migrate(model: ChildModel<Model<any>>, options?: { createdAt?: string; name?: string; up?: (this: MigrationContract) => void | Promise<void>; down?: (this: MigrationContract) => void | Promise<void>; transactional?: boolean }): MigrationConstructor` [lines 2707-2731]
- Function factory returning an anonymous `Migration` subclass wiring a model's table plus inline `up`/`down` closures.
- side-effects: none at call time; the returned class stores static metadata (`migrationName`, `createdAt`, `transactional`).

### `IndexEntry` [lines 2752-2766]
- Composite-index option passed into `Migration.create`.
- Fields:
  - `columns: string | string[]`
  - `name?: string`
  - `using?: "btree" | "hash" | "gin" | "gist" | "brin" | "ivfflat" | "hnsw" | (string & {})`
  - `include?: string[]`
  - `concurrently?: boolean`

### `UniqueEntry` [lines 2780-2789]
- Composite unique-constraint option.
- Fields:
  - `columns: string | string[]`
  - `name?: string`
  - `include?: string[]`
  - `concurrently?: boolean`

### `MigrationCreateOptions` [lines 2794-2882]
- Options accepted by `Migration.create()`.
- Fields:
  - `order?: number` (default 0)
  - `createdAt?: string`
  - `primaryKey?: "uuid" | "int" | "bigInt" | false`
  - `timestamps?: boolean` (default true)
  - `transactional?: boolean`
  - `index?: IndexEntry[]`
  - `unique?: UniqueEntry[]`
  - `up?: (this: Migration) => void | Promise<void>`
  - `raw?: string | string[]`
  - `down?: (this: Migration) => void | Promise<void>`

### `ColumnMap` [line 2890]
- `Record<string, DetachedColumnBuilder>` — column definitions keyed by column name; values come from the standalone helpers in `./column-helpers`.

### `MigrationAlterOptions` [lines 2895-2913]
- Options accepted by `Migration.alter()`.
- Fields:
  - `order?: number`
  - `createdAt?: string`
  - `transactional?: boolean`
  - `up?: (this: Migration) => void | Promise<void>`
  - `down?: (this: Migration) => void | Promise<void>`

### `AlterSchema` [lines 2939-3148]
- Schema map consumed by `Migration.alter()`. All fields are optional.
- Fields:
  - `add?: ColumnMap`
  - `drop?: string[]`
  - `rename?: Record<string, string>`
  - `modify?: ColumnMap`
  - `addIndex?: Array<{ columns: string | string[]; name?: string; options?: { include?: string[]; concurrently?: boolean } }>`
  - `dropIndex?: Array<string | string[]>`
  - `addUnique?: Array<{ columns: string | string[]; name?: string; options?: { include?: string[]; concurrently?: boolean } }>`
  - `dropUnique?: Array<string | string[]>`
  - `addExpressionIndex?: Array<{ expressions: string | string[]; name?: string; options?: { concurrently?: boolean } }>`
  - `addFullText?: Array<{ columns: string | string[]; options?: FullTextIndexOptions }>`
  - `dropFullText?: string[]`
  - `addGeoIndex?: Array<{ column: string; options?: GeoIndexOptions }>`
  - `dropGeoIndex?: string[]`
  - `addVectorIndex?: Array<{ column: string; options: VectorIndexOptions }>`
  - `dropVectorIndex?: string[]`
  - `addTTLIndex?: Array<{ column: string; expireAfterSeconds: number }>`
  - `dropTTLIndex?: string[]`
  - `addForeign?: Array<{ column: string; references: string | { table: string }; on?: string; onDelete?: "cascade" | "restrict" | "setNull" | "noAction"; onUpdate?: "cascade" | "restrict" | "setNull" | "noAction" }>`
  - `dropForeign?: Array<{ columnOrConstraint: string; referencesTable?: string }>`
  - `addCheck?: Array<{ name: string; expression: string }>`
  - `dropCheck?: string[]`
  - `raw?: string | string[]`

### `Migration.create` implementation [lines 3226-3309]
- Attaches a function assigned to `Migration.create` that builds a `DeclarativeMigration` subclass whose `up()` calls `createTableIfNotExists()`, adds a primary key based on `migrationDefaults.primaryKey`/override (`"uuid" | "int" | "bigInt" | false`), wires columns via `wireColumns()`, optionally appends `timestamps()`, composite `index`/`unique`, raw SQL, and a user `up` closure; `down()` runs the optional user `down` then `dropTableIfExists()`.
- side-effects: reassigns the static `Migration.create` property after the class body.

### `Migration.alter` implementation [lines 3333-3515]
- Attaches a function assigned to `Migration.alter` that builds an `AlterMigration` subclass whose `up()` runs ordered sections of `AlterSchema` (column add/drop/rename/modify, indexes, unique, expression, fulltext, geo, vector, TTL, foreign keys, check constraints, raw SQL, then optional user `up`) and whose `down()` only runs the optional user `down` (no auto-rollback).
- side-effects: reassigns the static `Migration.alter` property after the class body.

### `wireColumns(migration, columns)` (internal helper, not exported) [lines 3159-3193]
- `function wireColumns(migration: Migration, columns: ColumnMap): void`
- Fixes the placeholder name on each detached column builder, pushes its `addColumn` op on the migration, and transfers pending indexes / foreign keys / vector indexes collected in the detached sink into the real migration.
- side-effects: mutates both the detached definitions (rename `__placeholder__`) and the target migration's `pendingOperations`.

### Sentinel flag [line 3520]
- `(Migration as any).__declarativeFactoriesAttached = true;` — marker confirming static factory wiring has executed.
