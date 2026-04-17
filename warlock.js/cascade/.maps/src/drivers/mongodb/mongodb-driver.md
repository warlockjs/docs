# mongodb-driver
source: drivers/mongodb/mongodb-driver.ts
description: MongoDB driver implementing the Cascade driver contract with CRUD, transactions, and lifecycle.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `colors` from `@mongez/copper`
- `log` from `@warlock.js/logger`
- types from `mongodb`
- `EventEmitter` from `node:events`
- `databaseTransactionContext` from `../../context/database-transaction-context`
- contracts from `../../contracts`
- `dataSourceRegistry` from `../../data-source/data-source-registry`
- `DatabaseDirtyTracker` from `../../database-dirty-tracker`
- `TransactionRollbackError` from `../../errors/transaction-rollback.error`
- `SQLSerializer` from `../../migration/sql-serializer`
- `ModelDefaults` from `../../types`
- `isValidDateValue` from `../../utils/is-valid-date-value`
- `MongoDBBlueprint` from `./mongodb-blueprint`
- `MongoIdGenerator` from `./mongodb-id-generator`
- `MongoMigrationDriver` from `./mongodb-migration-driver`
- `MongoQueryBuilder` from `./mongodb-query-builder`
- `MongoSyncAdapter` from `./mongodb-sync-adapter`
- `MongoDriverOptions` from `./types`

## Exports
- `isMongoDBDriverLoaded` — checks if mongodb module loaded  [lines 100-102]
- `MongoDbDriver` — main driver class  [lines 122-1113]

## Classes
### MongoDbDriver  [lines 122-1113] — MongoDB driver implementation for Cascade
implements: DriverContract

fields:
- `client?: MongoClient`  [line 124]
- `database?: Db`  [line 125]
- `readonly name = "mongodb"`  [line 144]
- `_databaseName?: string` (protected)  [line 149]
- `readonly modelDefaults: Partial<ModelDefaults>`  [line 160]

methods:
- `get blueprint(): DriverBlueprintContract`  [lines 133-139] — lazy MongoDB blueprint accessor
- `constructor(config, driverOptions?: MongoDriverOptions)`  [lines 178-196] — stores config and merges transaction options
- `get databaseName(): string | undefined`  [lines 201-207] — resolves database name lazily
- `get isConnected(): boolean`  [lines 223-225] — connection status flag
- `getDatabase(): Db`  [lines 239-246] — returns live Db instance
  - throws: `Error` — when not connected
- `getIdGenerator(): IdGeneratorContract | undefined`  [lines 263-275] — returns cached Mongo id generator
- `connect(): Promise<void>`  [lines 281-369] — establishes Mongo connection and listeners
  - throws: `Error` — module missing or connect failed
  - side-effects: emits connected/disconnected, logs, attaches listeners
- `disconnect(): Promise<void>`  [lines 374-385] — closes connection gracefully
  - side-effects: emits disconnected, closes client
- `on(event, listener): void`  [lines 390-392] — subscribes driver lifecycle listener
  - side-effects: registers EventEmitter listener
- `insert(table, document, options?): Promise<InsertResult>`  [lines 397-412] — inserts single document
  - throws: `Error` — if not connected
- `insertMany(table, documents, options?): Promise<InsertResult[]>`  [lines 417-439] — inserts multiple documents
  - throws: `Error` — if not connected
- `update(table, filter, update, options?): Promise<UpdateResult>`  [lines 444-459] — updates single document
  - throws: `Error` — if not connected
- `replace<T>(table, filter, document, options?): Promise<T | null>`  [lines 464-474] — replaces one document
  - throws: `Error` — if not connected
- `findOneAndUpdate<T>(table, filter, update, options?): Promise<T | null>`  [lines 479-493] — finds and updates returning doc
- `upsert<T>(table, filter, document, options?): Promise<T>`  [lines 506-525] — inserts or updates one document
- `findOneAndDelete<T>(table, filter, options?): Promise<T | null>`  [lines 535-546] — finds and deletes one document
- `updateMany(table, filter, update, options?): Promise<UpdateResult>`  [lines 551-566] — updates many documents
- `delete(table, filter, options?): Promise<number>`  [lines 571-581] — deletes single document
- `deleteMany(table, filter, options?): Promise<number>`  [lines 586-597] — deletes matching documents
- `truncateTable(table, options?): Promise<number>`  [lines 606-612] — removes all documents in collection
- `serialize(data): Record<string, unknown>`  [lines 617-640] — serializes values for storage
- `getDirtyTracker(data): DatabaseDirtyTracker`  [lines 645-647] — returns new dirty tracker
- `deserialize(data): Record<string, unknown>`  [lines 652-665] — reinflates ObjectId and dates
- `queryBuilder<T>(table): QueryBuilderContract<T>`  [lines 670-672] — returns new Mongo query builder
- `beginTransaction(): Promise<DriverTransactionContract<ClientSession>>`  [lines 677-715] — starts Mongo transaction session
  - throws: `Error` — on commit failure, rolls back
  - side-effects: enters transaction context, starts session
- `transaction<T>(fn, options?): Promise<T>`  [lines 732-786] — runs callback within managed transaction
  - throws: `Error` — nested call or replica set missing
  - side-effects: starts/commits/aborts session, context enter/exit
- `atomic(table, filter, operations, options?): Promise<UpdateResult>`  [lines 793-808] — executes atomic updateMany operations
- `syncAdapter(): SyncAdapterContract`  [lines 815-821] — returns cached Mongo sync adapter
- `migrationDriver(): MigrationDriverContract`  [lines 827-833] — returns cached migration driver
- `getClient<Client>(): Client`  [lines 838-840] — returns active Mongo client
  - throws: `Error` — if not connected
- `getSQLSerializer(): SQLSerializer`  [lines 967-969] — unsupported SQL serializer
  - throws: `Error` — always, unsupported on MongoDB
- `query<T>(_sql, _params?): Promise<any>`  [lines 975-977] — unsupported raw SQL query
  - throws: `Error` — always, unsupported on MongoDB
- `createDatabase(name): Promise<boolean>`  [lines 992-1013] — creates new database via temp collection
  - throws: `Error` — on create failure
  - side-effects: creates and drops init collection, logs
- `dropDatabase(name): Promise<boolean>`  [lines 1021-1037] — drops an existing database
  - throws: `Error` — on drop failure
  - side-effects: drops database, logs
- `databaseExists(name): Promise<boolean>`  [lines 1045-1050] — checks database existence
- `listDatabases(): Promise<string[]>`  [lines 1057-1064] — lists user databases
- `dropTable(name): Promise<void>`  [lines 1076-1080] — drops a collection
  - throws: `Error` — if collection missing
  - side-effects: drops collection, logs
- `dropTableIfExists(name): Promise<void>`  [lines 1087-1091] — conditionally drops collection
- `dropAllTables(): Promise<void>`  [lines 1098-1112] — drops every collection in database
  - side-effects: drops collections, logs
