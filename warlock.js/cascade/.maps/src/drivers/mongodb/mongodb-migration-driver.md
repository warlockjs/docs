# mongodb-migration-driver
source: drivers/mongodb/mongodb-migration-driver.ts
description: MongoDB implementation of MigrationDriverContract with schema-less no-ops and native index support.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ClientSession`, `CreateIndexesOptions`, `Db`, `IndexDescription` from `mongodb`
- `databaseTransactionContext` from `../../context/database-transaction-context`
- `ColumnDefinition`, `ForeignKeyDefinition`, `FullTextIndexOptions`, `GeoIndexOptions`, `IndexDefinition`, `MigrationDriverContract`, `TableIndexInformation`, `VectorIndexOptions` from `../../contracts/migration-driver.contract`
- `MigrationDefaults` from `../../types`
- `MongoDbDriver` from `./mongodb-driver`

## Exports
- `MongoMigrationDriver` — MongoDB migration driver; DDL, indexes, schema validation  [lines 36-770]

## Classes / Functions / Types / Constants

### class `MongoMigrationDriver` implements `MigrationDriverContract`  [lines 36-770]
- readonly `driver: MongoDbDriver`  [line 45]
- `async createTable(table: string): Promise<void>`  [lines 73-83]  — side-effects: creates MongoDB collection
- `async createTableIfNotExists(table: string): Promise<void>`  [lines 88-98]  — side-effects: creates collection if absent
- `async dropTable(table: string): Promise<void>`  [lines 105-107]  — throws: if collection missing; side-effects: drops collection
- `async dropTableIfExists(table: string): Promise<void>`  [lines 112-118]  — side-effects: drops collection silently
- `async renameTable(from: string, to: string): Promise<void>`  [lines 123-125]  — side-effects: renames collection
- `async truncateTable(table: string): Promise<void>`  [lines 132-134]  — side-effects: deleteMany all documents
- `async tableExists(table: string): Promise<boolean>`  [lines 139-142]
- `async listColumns(_table: string): Promise<ColumnDefinition[]>`  [lines 150-153]  — no-op; returns empty array
- `async listTables(): Promise<string[]>`  [lines 158-161]
- `async ensureMigrationsTable(tableName: string): Promise<void>`  [lines 171-180]  — side-effects: creates collection and unique index
- `async addColumn(_table, _column): Promise<void>`  [lines 191-193]  — no-op for schema-less MongoDB
- `async dropColumn(table, column): Promise<void>`  [lines 200-203]  — side-effects: $unset field on all documents
- `async dropColumns(table, columns): Promise<void>`  [lines 208-215]  — side-effects: $unset multiple fields on all documents
- `async renameColumn(table, from, to): Promise<void>`  [lines 220-223]  — side-effects: $rename field on all documents
- `async modifyColumn(_table, _column): Promise<void>`  [lines 230-232]  — no-op for schema-less MongoDB
- `async createTimestampColumns(_table): Promise<void>`  [lines 242-244]  — no-op; timestamps handled at app level
- `async createIndex(table, index): Promise<void>`  [lines 256-292]  — side-effects: creates MongoDB index
- `async dropIndex(table, indexNameOrColumns): Promise<void>`  [lines 299-311]  — side-effects: drops index by name or columns
- `async createUniqueIndex(table, columns, name?): Promise<void>`  [lines 316-322]  — side-effects: creates unique index
- `async dropUniqueIndex(table, columns): Promise<void>`  [lines 327-341]  — side-effects: drops matching unique index
- `async createFullTextIndex(table, columns, options?): Promise<void>`  [lines 352-378]  — side-effects: creates text index
- `async dropFullTextIndex(table, name): Promise<void>`  [lines 383-385]  — side-effects: drops text index
- `async createGeoIndex(table, column, options?): Promise<void>`  [lines 390-413]  — side-effects: creates 2dsphere/2d index
- `async dropGeoIndex(table, column): Promise<void>`  [lines 418-432]  — side-effects: drops geo index
- `async createVectorIndex(table, column, options): Promise<void>`  [lines 440-477]  — side-effects: creates Atlas vector or fallback index
- `async dropVectorIndex(table, column): Promise<void>`  [lines 482-507]  — side-effects: drops Atlas or regular vector index
- `async createTTLIndex(table, column, expireAfterSeconds): Promise<void>`  [lines 512-519]  — side-effects: creates TTL index
- `async dropTTLIndex(table, column): Promise<void>`  [lines 524-538]  — side-effects: drops TTL index
- `async listIndexes(table): Promise<TableIndexInformation[]>`  [lines 546-558]
- `async addForeignKey(_table, _foreignKey): Promise<void>`  [lines 570-572]  — no-op; MongoDB has no FK constraints
- `async dropForeignKey(_table, _name): Promise<void>`  [lines 577-579]  — no-op
- `async addPrimaryKey(_table, _columns): Promise<void>`  [lines 586-588]  — no-op; _id is always primary key
- `async dropPrimaryKey(_table): Promise<void>`  [lines 593-595]  — no-op
- `async addCheck(_table, _name, _expression): Promise<void>`  [lines 603-605]  — no-op
- `async dropCheck(_table, _name): Promise<void>`  [lines 610-612]  — no-op
- `async setSchemaValidation(table, schema): Promise<void>`  [lines 635-642]  — side-effects: sets collMod $jsonSchema validator
- `async removeSchemaValidation(table): Promise<void>`  [lines 647-653]  — side-effects: removes collMod validator
- `async beginTransaction(): Promise<void>`  [lines 664-667]  — side-effects: starts MongoDB session
- `async commit(): Promise<void>`  [lines 672-678]  — side-effects: commits and ends session
- `async rollback(): Promise<void>`  [lines 683-689]  — side-effects: aborts and ends session
- `supportsTransactions(): boolean`  [lines 694-696]
- `getDefaultTransactional(): boolean`  [lines 707-709]
- `getUuidDefault(_migrationDefaults?): undefined`  [lines 724-726]
- `async isExtensionAvailable(_extension): Promise<boolean>`  [lines 737-739]
- `getExtensionDocsUrl(_extension): string | undefined`  [lines 746-748]
- `async raw<T>(callback): Promise<T>`  [lines 767-769]  — side-effects: executes arbitrary DB operations
