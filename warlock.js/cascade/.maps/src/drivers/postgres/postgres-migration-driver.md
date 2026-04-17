# postgres-migration-driver
source: drivers/postgres/postgres-migration-driver.ts
description: Implements MigrationDriverContract for PostgreSQL DDL — tables, columns, indexes, and constraints.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `databaseTransactionContext` from `../../context/database-transaction-context`
- `ColumnDefinition`, `ColumnType`, `ForeignKeyDefinition`, `FullTextIndexOptions`, `GeoIndexOptions`, `IndexDefinition`, `MigrationDriverContract`, `TableIndexInformation`, `VectorIndexOptions` from `../../contracts/migration-driver.contract`
- `MigrationDefaults`, `UuidStrategy` from `../../types`
- `PostgresDriver` from `./postgres-driver`

## Exports
- `PostgresMigrationDriver` — Full DDL migration driver for PostgreSQL  [lines 54-1061]

## Classes / Functions / Types / Constants

### class `PostgresMigrationDriver` implements `MigrationDriverContract`  [lines 54-1061]
- `readonly driver: PostgresDriver`  [line 67]
- `createTable(table): Promise<void>` — Creates empty table; side-effects: executes DDL  [lines 78-82]
- `createTableIfNotExists(table): Promise<void>` — Creates table only if absent  [lines 89-93]
- `dropTable(table): Promise<void>` — Drops table with CASCADE  [lines 100-103]
- `dropTableIfExists(table): Promise<void>` — Drops table if exists with CASCADE  [lines 110-113]
- `renameTable(from, to): Promise<void>` — Renames a table  [lines 121-125]
- `truncateTable(table): Promise<void>` — Removes all rows efficiently  [lines 132-135]
- `tableExists(table): Promise<boolean>` — Queries information_schema for existence  [lines 143-153]
- `listColumns(table): Promise<ColumnDefinition[]>` — Returns column definitions from information_schema  [lines 161-195]
- `listTables(): Promise<string[]>` — Lists all public-schema table names  [lines 202-211]
- `ensureMigrationsTable(tableName): Promise<void>` — Creates migrations tracking table if absent  [lines 220-232]
- `addColumn(table, column): Promise<void>` — Adds column with type, nullability, default, constraints  [lines 244-317]
- `dropColumn(table, column): Promise<void>` — Drops a single column  [lines 325-329]
- `dropColumns(table, columns): Promise<void>` — Drops multiple columns sequentially  [lines 337-341]
- `renameColumn(table, from, to): Promise<void>` — Renames a column  [lines 350-355]
- `modifyColumn(table, column): Promise<void>` — Alters type, nullability, and default separately  [lines 363-402]
- `createTimestampColumns(table): Promise<void>` — Adds created_at and updated_at TIMESTAMPTZ columns  [lines 411-427]
- `createIndex(table, index): Promise<void>` — Creates B-tree/expression/covering/partial/concurrent index  [lines 445-492]
- `dropIndex(table, indexNameOrColumns): Promise<void>` — Drops index by name or derived name  [lines 500-511]
- `createUniqueIndex(table, columns, name?): Promise<void>` — Creates unique index via createIndex  [lines 520-522]
- `dropUniqueIndex(table, columns): Promise<void>` — Drops unique index  [lines 530-532]
- `createFullTextIndex(table, columns, options?): Promise<void>` — Creates GIN tsvector index  [lines 545-563]
- `dropFullTextIndex(table, name): Promise<void>` — Drops full-text index by name  [lines 571-573]
- `createGeoIndex(table, column, options?): Promise<void>` — Creates GiST spatial index  [lines 582-595]
- `dropGeoIndex(table, column): Promise<void>` — Drops geo index  [lines 603-605]
- `createVectorIndex(table, column, options): Promise<void>` — Creates ivfflat pgvector index  [lines 614-637]
- `dropVectorIndex(table, column): Promise<void>` — Drops vector index  [lines 645-647]
- `createTTLIndex(table, column, expireAfterSeconds): Promise<void>` — Creates partial index for TTL cleanup  [lines 659-676]
- `dropTTLIndex(table, column): Promise<void>` — Drops TTL index  [lines 684-686]
- `listIndexes(table): Promise<TableIndexInformation[]>` — Queries pg_indexes for index metadata  [lines 694-723]
- `isExtensionAvailable(extension): Promise<boolean>` — Checks pg_available_extensions  [lines 734-747]
- `getExtensionDocsUrl(extension): string | undefined` — Returns known extension documentation URL  [lines 754-763]
- `addForeignKey(table, foreignKey): Promise<void>` — Adds FK constraint with ON DELETE/UPDATE  [lines 775-796]
- `dropForeignKey(table, name): Promise<void>` — Drops a named FK constraint  [lines 804-808]
- `addPrimaryKey(table, columns): Promise<void>` — Adds primary key constraint  [lines 816-825]
- `dropPrimaryKey(table): Promise<void>` — Drops primary key constraint  [lines 832-838]
- `addCheck(table, name, expression): Promise<void>` — Adds a CHECK constraint  [lines 847-852]
- `dropCheck(table, name): Promise<void>` — Drops a CHECK constraint  [lines 860-864]
- `setSchemaValidation(_table, _schema): Promise<void>` — No-op for PostgreSQL  [lines 875-878]
- `removeSchemaValidation(_table): Promise<void>` — No-op for PostgreSQL  [lines 883-885]
- `beginTransaction(): Promise<void>` — Executes BEGIN  [lines 894-896]
- `commit(): Promise<void>` — Executes COMMIT  [lines 901-903]
- `rollback(): Promise<void>` — Executes ROLLBACK  [lines 908-910]
- `supportsTransactions(): boolean` — Returns true  [lines 915-917]
- `getDefaultTransactional(): boolean` — Returns true; DDL is transactional  [lines 927-929]
- `getUuidDefault(migrationDefaults?): string` — Returns UUID generation SQL expression  [lines 953-967]
- `raw<T>(callback): Promise<T>` — Passes driver to callback for raw access  [lines 978-980]
