# migration-driver.contract
source: contracts/migration-driver.contract.ts
description: Defines MigrationDriverContract and all schema-migration types for database-agnostic DDL operations.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DataSource` from `../data-source/data-source`
- `MigrationDefaults` from `../types`
- `DriverContract` from `./database-driver.contract`
- `TableIndexInformation` from `./driver-blueprint.contract`

## Exports
- `TableIndexInformation` — re-exported index metadata  [line 5]
- `ColumnType` — union of all supported column type strings  [lines 10-51]
- `ColumnDefinition` — full column specification  [lines 56-110]
- `IndexDefinition` — index creation options  [lines 115-136]
- `FullTextIndexOptions` — full-text index config  [lines 141-148]
- `GeoIndexOptions` — geo-spatial index config  [lines 153-162]
- `VectorIndexOptions` — vector/AI index config  [lines 167-176]
- `ForeignKeyDefinition` — FK constraint definition  [lines 181-194]
- `MigrationDriverContract` — DDL driver interface  [lines 208-661]
- `MigrationDriverFactory` — factory function type  [lines 666-668]

## Types / Interfaces

### `ColumnDefinition` [lines 56-110]
- `name: string`
- `type: ColumnType`
- `length?: number`
- `precision?: number`
- `scale?: number`
- `nullable?: boolean`
- `defaultValue?: unknown`
- `onUpdateCurrent?: boolean` — MySQL ON UPDATE CURRENT_TIMESTAMP
- `primary?: boolean`
- `autoIncrement?: boolean`
- `unsigned?: boolean`
- `unique?: boolean`
- `comment?: string`
- `values?: string[]` — enum/set members
- `dimensions?: number` — vector column size
- `isRawDefault?: boolean`
- `after?: string` — MySQL column positioning
- `first?: boolean` — MySQL column positioning
- `generated?: { expression: string; stored: boolean }`
- `checkConstraint?: { expression: string; name: string }`

### `MigrationDriverContract` [lines 208-661]
DDL contract for all schema operations across SQL and NoSQL drivers.
- `createTable(table): Promise<void>` [line 218]
- `createTableIfNotExists(table): Promise<void>` [line 225]
- `dropTable(table): Promise<void>` [line 232]
- `dropTableIfExists(table): Promise<void>` [line 239]
- `renameTable(from, to): Promise<void>` [line 247]
- `truncateTable(table): Promise<void>` [line 254] — side-effects: removes all rows
- `tableExists(table): Promise<boolean>` [line 262]
- `listColumns(table): Promise<ColumnDefinition[]>` [line 270]
- `listTables(): Promise<string[]>` [line 277]
- `ensureMigrationsTable(tableName): Promise<void>` [line 290] — side-effects: creates tracking table
- `addColumn(table, column): Promise<void>` [line 304]
- `dropColumn(table, column): Promise<void>` [line 314]
- `dropColumns(table, columns): Promise<void>` [line 322]
- `renameColumn(table, from, to): Promise<void>` [line 331]
- `modifyColumn(table, column): Promise<void>` [line 339]
- `createTimestampColumns(table): Promise<void>` [line 350]
- `createIndex(table, index): Promise<void>` [line 362]
- `dropIndex(table, indexNameOrColumns): Promise<void>` [line 370]
- `createUniqueIndex(table, columns, name?): Promise<void>` [line 379]
- `dropUniqueIndex(table, columns): Promise<void>` [line 387]
- `createFullTextIndex(table, columns, options?): Promise<void>` [lines 400-404]
- `dropFullTextIndex(table, name): Promise<void>` [line 412]
- `createGeoIndex(table, column, options?): Promise<void>` [line 421]
- `dropGeoIndex(table, column): Promise<void>` [line 429]
- `createVectorIndex(table, column, options): Promise<void>` [line 438]
- `dropVectorIndex(table, column): Promise<void>` [line 446]
- `createTTLIndex(table, column, expireAfterSeconds): Promise<void>` [line 457]
- `dropTTLIndex(table, column): Promise<void>` [line 465]
- `listIndexes(table): Promise<TableIndexInformation[]>` [line 473]
- `addForeignKey(table, foreignKey): Promise<void>` [line 487]
- `dropForeignKey(table, name): Promise<void>` [line 495]
- `addPrimaryKey(table, columns): Promise<void>` [line 503]
- `dropPrimaryKey(table): Promise<void>` [line 510]
- `addCheck(table, name, expression): Promise<void>` [line 521]
- `dropCheck(table, name): Promise<void>` [line 529]
- `setSchemaValidation(table, schema): Promise<void>` [line 543] — MongoDB only
- `removeSchemaValidation(table): Promise<void>` [line 550]
- `beginTransaction(): Promise<void>` [line 559]
- `commit(): Promise<void>` [line 564]
- `rollback(): Promise<void>` [line 569]
- `supportsTransactions(): boolean` [line 574]
- `getDefaultTransactional(): boolean` [line 591]
- `getUuidDefault(migrationDefaults?): string | undefined` [line 623]
- `isExtensionAvailable(extension): Promise<boolean>` [line 635]
- `getExtensionDocsUrl(extension): string | undefined` [line 643]
- `raw<T>(callback): Promise<T>` [line 655]
- `driver: DriverContract` [line 660]

### `MigrationDriverFactory` [lines 666-668]
- Factory function: `(source: DataSource | DriverContract) => MigrationDriverContract`
