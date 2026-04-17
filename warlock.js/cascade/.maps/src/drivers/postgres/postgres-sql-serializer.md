# postgres-sql-serializer
source: drivers/postgres/postgres-sql-serializer.ts
description: PostgreSQL-specific SQL serializer converting pending migration operations into valid PostgreSQL DDL statements.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `SqlDialectContract` (type) from `../sql/sql-dialect.contract`
- `PendingOperation` (type) from `../../migration/migration`
- `SQLSerializer` from `../../migration/sql-serializer`
- `ColumnDefinition`, `ForeignKeyDefinition`, `FullTextIndexOptions`, `GeoIndexOptions`, `IndexDefinition`, `VectorIndexOptions` (types) from `../../contracts/migration-driver.contract`

## Exports
- `PostgresSQLSerializer` — PostgreSQL DDL serializer extending `SQLSerializer`  [lines 18-465]

## Classes / Functions / Types / Constants

### `PostgresSQLSerializer` [lines 18-465]
- Extends `SQLSerializer`. Takes a `SqlDialectContract` via constructor (used for identifier quoting and SQL type resolution) and dispatches each `PendingOperation` type to a dedicated private emitter producing PostgreSQL-compatible DDL. Handles tables, columns, indexes (including full-text GIN, geo GIST, vector ivfflat, TTL partial), foreign keys, primary keys, timestamps, and auto-injects the `vector` extension when a `vector` column is added. Pure string builder — performs no I/O.

#### `constructor(dialect: SqlDialectContract)` [lines 19-21]
- Stores the private readonly `dialect` used for quoting identifiers and resolving SQL types; calls `super()`.

#### `serialize(operation: PendingOperation, table: string): string | string[] | null` [lines 23-117]
- Dispatches on `operation.type` to the matching private emitter. Supports: createTable / createTableIfNotExists / dropTable / dropTableIfExists / renameTable / truncateTable; addColumn / dropColumn / dropColumns / renameColumn / modifyColumn; createIndex / dropIndex; createUniqueIndex (delegates to `createIndex` with `unique: true`) / dropUniqueIndex (delegates to `dropIndex`); createFullTextIndex / dropFullTextIndex; createGeoIndex / dropGeoIndex (name derived as `idx_{table}_geo_{payload}`); createVectorIndex / dropVectorIndex (name derived as `idx_{table}_vector_{payload}`); createTTLIndex / dropTTLIndex (name derived as `idx_{table}_ttl_{payload}`); addForeignKey / dropForeignKey; addPrimaryKey / dropPrimaryKey; createTimestamps (returns two statements); rawStatement (returns payload as-is). Returns `null` for addCheck, dropCheck, setSchemaValidation, removeSchemaValidation, and unknown types.
