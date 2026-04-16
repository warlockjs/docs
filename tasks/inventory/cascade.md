# @warlock.js/cascade — Inventory

## Package Info

- Version: 4.0.165
- Type: Tightly Coupled Package
- Dependencies: `@warlock.js/context`, `@warlock.js/logger`, `@warlock.js/seal`

## Directory Tree

```
src/
├── context/
│   ├── database-data-source-context.ts
│   └── database-transaction-context.ts
├── contracts/
│   ├── database-driver.contract.ts
│   ├── database-id-generator.contract.ts
│   ├── database-remover.contract.ts
│   ├── database-restorer.contract.ts
│   ├── database-writer.contract.ts
│   ├── migration-driver.contract.ts
│   ├── query-builder.contract.ts
│   └── sync-adapter.contract.ts
├── data-source/
│   ├── data-source.ts
│   └── data-source-registry.ts
├── drivers/
│   ├── mongodb/
│   │   ├── mongodb-driver.ts
│   │   ├── mongodb-query-builder.ts
│   │   ├── mongodb-sync-adapter.ts
│   │   ├── mongodb-migration-driver.ts
│   │   ├── mongodb-id-generator.ts
│   │   └── types.ts
│   ├── postgres/
│   │   ├── postgres-driver.ts
│   │   ├── postgres-query-builder.ts
│   │   ├── postgres-query-parser.ts
│   │   ├── postgres-sql-serializer.ts
│   │   ├── postgres-migration-driver.ts
│   │   └── types.ts
│   └── sql/
│       ├── sql-dialect.contract.ts
│       └── sql-types.ts
├── errors/
│   ├── missing-data-source.error.ts
│   └── transaction-rollback.error.ts
├── events/
│   └── model-events.ts
├── expressions/
│   ├── aggregate-expressions.ts
│   └── index.ts
├── migration/
│   ├── column-builder.ts
│   ├── column-helpers.ts
│   ├── foreign-key-builder.ts
│   ├── index.ts
│   ├── migration-runner.ts
│   ├── migration.ts
│   ├── sql-grammar.ts
│   ├── sql-serializer.ts
│   └── types.ts
├── model/
│   ├── methods/
│   │   ├── accessor-methods.ts
│   │   ├── delete-methods.ts
│   │   ├── dirty-methods.ts
│   │   ├── hydration-methods.ts
│   │   ├── instance-event-methods.ts
│   │   ├── meta-methods.ts
│   │   ├── query-methods.ts
│   │   ├── restore-methods.ts
│   │   ├── scope-methods.ts
│   │   ├── serialization-methods.ts
│   │   ├── static-event-methods.ts
│   │   └── write-methods.ts
│   ├── model.ts
│   ├── model.types.ts
│   └── register-model.ts
├── query-builder/
│   └── query-builder.ts
├── relations/
│   ├── helpers.ts
│   ├── index.ts
│   ├── pivot-operations.ts
│   ├── relation-hydrator.ts
│   ├── relation-loader.ts
│   └── types.ts
├── remover/
│   └── database-remover.ts
├── restorer/
│   └── database-restorer.ts
├── sync/
│   ├── index.ts
│   ├── model-events.ts
│   ├── model-sync-operation.ts
│   ├── model-sync.ts
│   ├── sync-context.ts
│   ├── sync-manager.ts
│   └── types.ts
├── utils/
│   ├── connect-to-database.ts
│   ├── database-writer.utils.ts
│   ├── define-model.ts
│   ├── is-valid-date-value.ts
│   └── once-connected.ts
├── validation/
│   ├── mutators/
│   ├── plugins/
│   ├── rules/
│   ├── transformers/
│   ├── validators/
│   ├── database-seal-plugins.ts
│   ├── database-writer-validation-error.ts
│   └── index.ts
├── writer/
│   └── database-writer.ts
├── database-dirty-tracker.ts
├── index.ts
├── sql-database-dirty-tracker.ts
└── types.ts
```

## Exports by File

### src/drivers/mongodb/mongodb-driver.ts

_MongoDB driver implementation fulfilling the DriverContract, with support for CRUD, sessions, and atomic updates._

- **Class** `MongoDbDriver` implements `DriverContract`
  - `public name: "mongodb"`
  - `public modelDefaults: Partial<ModelDefaults>`
  - `public client?: MongoClient`
  - `public database?: Db`
  - `public get blueprint(): DriverBlueprintContract`
  - `public get databaseName(): string | undefined`
  - `public get isConnected(): boolean`
  - `public getDatabase(): Db`
  - `public getIdGenerator(): IdGeneratorContract | undefined`
  - `public connect(): Promise<void>`
  - `public disconnect(): Promise<void>`
  - `public on(event: DriverEvent, listener: DriverEventListener): void`
  - `public insert(table: string, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<InsertResult>`
  - `public insertMany(table: string, documents: Record<string, unknown>[], options?: Record<string, unknown>): Promise<InsertResult[]>`
  - `public update(table: string, filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<UpdateResult>`
  - `public replace<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>`
  - `public findOneAndUpdate<T = unknown>(table: string, filter: Record<string, unknown>, update: UpdateOperations, options?: Record<string, unknown>): Promise<T | null>`
  - `public upsert<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T>`
  - `public findOneAndDelete<T = unknown>(table: string, filter: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>`
  - `public updateMany(table: string, filter: Record<string, unknown>, update: UpdateOperations, options?: Record<string, unknown>): Promise<UpdateResult>`
  - `public delete(table: string, filter?: Record<string, unknown>, options?: Record<string, unknown>): Promise<number>`
  - `public deleteMany(table: string, filter?: Record<string, unknown>, options?: Record<string, unknown>): Promise<number>`
  - `public truncateTable(table: string, options?: Record<string, unknown>): Promise<number>`
  - `public serialize(data: Record<string, unknown>): Record<string, unknown>`
  - `public getDirtyTracker(data: Record<string, unknown>): DatabaseDirtyTracker`
  - `public deserialize(data: Record<string, unknown>): Record<string, unknown>`
  - `public queryBuilder<T = unknown>(table: string): QueryBuilderContract<T>`
  - `public beginTransaction(): Promise<DriverTransactionContract<ClientSession>>`
  - `public transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: Record<string, unknown>): Promise<T>`
  - `public atomic(table: string, filter: Record<string, unknown>, operations: Record<string, unknown>, options?: Record<string, unknown>): Promise<UpdateResult>`

### src/drivers/mongodb/mongodb-query-builder.ts

_MongoDB-specific query builder using the aggregation pipeline._

- **Class** `MongoQueryBuilder<T = unknown>` extends `QueryBuilder<T>`
  - `public operations: Operation[]`
  - `public readonly dataSource: DataSource`
  - `public hydrateCallback?: (data: any, index: number) => any`
  - `public get collection(): Collection`
  - `public hydrate(callback: (data: any, index: number) => any): this`
  - `public onFetching(callback: (query: this) => void | Promise<void>): () => void`
  - `public onHydrating(callback: (records: any[], context: any) => void | Promise<void>): () => void`
  - `public onFetched(callback: (records: any[], context: any) => void | Promise<void>): () => void`
  - `public withoutGlobalScope(...scopeNames: string[]): this`
  - `public withoutGlobalScopes(): this`
  - `public scope(scopeName: string, ...args: any[]): this`
  - `public where(field: string, value: unknown): this`
  - `public orWhere(field: string, value: unknown): this`
  - `public whereRaw(expression: RawExpression, bindings?: unknown[]): this`
  - `public orWhereRaw(expression: RawExpression, bindings?: unknown[]): this`
  - `public whereColumn(first: string, operator: WhereOperator, second: string): this`
  - `public orWhereColumn(first: string, operator: WhereOperator, second: string): this`
  - `public whereBetweenColumns(field: string, lowerColumn: string, upperColumn: string): this`
  - `public whereDate(field: string, value: Date | string): this`
  - `public whereTime(field: string, value: string): this`
  - `public whereDay(field: string, value: number): this`
  - `public whereMonth(field: string, value: number): this`
  - `public whereYear(field: string, value: number): this`
  - `public whereJsonContains(path: string, value: unknown): this`
  - `public whereJsonDoesntContain(path: string, value: unknown): this`
  - `public whereJsonContainsKey(path: string): this`
  - `public whereJsonLength(path: string, operator: WhereOperator, value: number): this`
  - `public whereArrayLength(field: string, operator: WhereOperator, value: number): this`
  - `public whereId(value: string | number): this`
  - `public whereIds(values: Array<string | number>): this`
  - `public whereFullText(fields: string | string[], query: string): this`
  - `public whereLike(field: string, pattern: RegExp | string): this`
  - `public whereIn(field: string, values: unknown[]): this`
  - `public whereNull(field: string): this`
  - `public whereBetween(field: string, range: [unknown, unknown]): this`
  - `public whereExists(field: string): this`
  - `public limit(limit: number): this`
  - `public skip(skip: number): this`
  - `public orderBy(field: string, direction?: OrderDirection): this`
  - `public groupBy(...fields: GroupByInput[]): this`
  - `public having(field: string, operator: WhereOperator, value: unknown): this`
  - `public select(...fields: string[]): this`
  - `public get(): Promise<T[]>`
  - `public first(): Promise<T | null>`
  - `public count(): Promise<number>`
  - `public paginate(options: PaginationOptions): Promise<PaginationResult<T>>`

### src/drivers/mongodb/mongodb-sync-adapter.ts

_Adapter for synchronizing embedded MongoDB documents using positional operators._

- **Class** `MongoSyncAdapter` implements `SyncAdapterContract`
  - `public executeBatch(instructions: SyncInstruction[]): Promise<number>`
  - `public executeOne(instruction: SyncInstruction): Promise<number>`
  - `public executeArrayUpdate(instruction: SyncInstruction): Promise<number>`

### src/drivers/mongodb/mongodb-migration-driver.ts

_Migration driver for MongoDB, handling explicit collection and index creation._

- **Class** `MongoMigrationDriver` implements `MigrationDriverContract`
  - `public constructor(driver: MongoDbDriver)`
  - `public createTable(table: string): Promise<void>`
  - `public dropTable(table: string): Promise<void>`
  - `public truncateTable(table: string): Promise<void>`
  - `public tableExists(table: string): Promise<boolean>`
  - `public listTables(): Promise<string[]>`
  - `public createIndex(table: string, index: IndexDefinition): Promise<void>`
  - `public dropIndex(table: string, indexNameOrColumns: string | string[]): Promise<void>`
  - `public createFullTextIndex(table: string, columns: string[], options?: FullTextIndexOptions): Promise<void>`
  - `public createGeoIndex(table: string, column: string, options?: GeoIndexOptions): Promise<void>`
  - `public createVectorIndex(table: string, column: string, options: VectorIndexOptions): Promise<void>`
  - `public createTTLIndex(table: string, column: string, expireAfterSeconds: number): Promise<void>`
  - `public listIndexes(table: string): Promise<TableIndexInformation[]>`
  - `public setSchemaValidation(table: string, schema: object): Promise<void>`
  - `public removeSchemaValidation(table: string): Promise<void>`

### src/drivers/mongodb/mongodb-id-generator.ts

_Atomic ID generator for MongoDB using a counters collection._

- **Class** `MongoIdGenerator` implements `IdGeneratorContract`
  - `public readonly counterCollection: string`
  - `public generateNextId(options: GenerateIdOptions): Promise<number>`
  - `public getLastId(table: string): Promise<number>`
  - `public setLastId(table: string, id: number): Promise<void>`

---

### src/drivers/postgres/postgres-driver.ts

_PostgreSQL driver with connection pooling and SQL serialization support._

- **Class** `PostgresDriver` implements `DriverContract`
  - `public readonly name: "postgres"`
  - `public readonly dialect: PostgresDialect`
  - `public readonly modelDefaults: Partial<ModelDefaults>`
  - `public get pool(): PgPool`
  - `public get isConnected(): boolean`
  - `public get blueprint(): DriverBlueprintContract`
  - `public connect(): Promise<void>`
  - `public disconnect(): Promise<void>`
  - `public on(event: string, listener: DriverEventListener): void`
  - `public serialize(data: Record<string, unknown>): Record<string, unknown>`
  - `public getDirtyTracker(data: Record<string, unknown>): SqlDatabaseDirtyTracker`
  - `public deserialize(data: Record<string, unknown>): Record<string, unknown>`
  - `public insert(table: string, document: Record<string, unknown>): Promise<InsertResult>`
  - `public insertMany(table: string, documents: Record<string, unknown>[]): Promise<InsertResult[]>`
  - `public update(table: string, filter: Record<string, unknown>, update: UpdateOperations): Promise<UpdateResult>`
  - `public findOneAndUpdate<T = unknown>(table: string, filter: Record<string, unknown>, update: UpdateOperations): Promise<T | null>`
  - `public updateMany(table: string, filter: Record<string, unknown>, update: UpdateOperations): Promise<UpdateResult>`
  - `public replace<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>): Promise<T | null>`
  - `public upsert<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T>`
  - `public findOneAndDelete<T = unknown>(table: string, filter: Record<string, unknown>): Promise<T | null>`
  - `public delete(table: string, filter?: Record<string, unknown>): Promise<number>`
  - `public deleteMany(table: string, filter?: Record<string, unknown>): Promise<number>`
  - `public truncateTable(table: string, options?: { cascade?: boolean }): Promise<number>`
  - `public queryBuilder<T = unknown>(table: string): QueryBuilderContract<T>`
  - `public beginTransaction(): Promise<DriverTransactionContract<PgPoolClient>>`
  - `public transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: Record<string, unknown>): Promise<T>`
  - `protected buildUpdateQuery(table: string, filter: Record<string, unknown>, update: UpdateOperations, limit?: number): { sql: string, params: any[] }`
  - `protected buildWhereClause(filter: Record<string, unknown>, startPlaceholderIndex: number): { whereClause: string, whereParams: any[] }`

### src/drivers/postgres/postgres-query-builder.ts

_PostgreSQL-specific query builder using standard SQL syntax._

- **Class** `PostgresQueryBuilder<T = unknown>` extends `QueryBuilder<T>`
  - _Extends core QueryBuilder with SQL-specific dialect handling._
  - `public toSql(): { sql: string, params: any[] }`
  - `public get(): Promise<T[]>`
  - `public first(): Promise<T | null>`
  - `public count(): Promise<number>`

### src/drivers/postgres/postgres-migration-driver.ts

_SQL-based migration driver for PostgreSQL._

- **Class** `PostgresMigrationDriver` implements `MigrationDriverContract`
  - `public createTable(table: string, columns: ColumnDefinition[]): Promise<void>`
  - `public dropTable(table: string): Promise<void>`
  - `public addColumn(table: string, column: ColumnDefinition): Promise<void>`
  - `public dropColumn(table: string, column: string): Promise<void>`
  - `public renameColumn(table: string, from: string, to: string): Promise<void>`
  - `public createIndex(table: string, index: IndexDefinition): Promise<void>`
  - `public dropIndex(table: string, name: string): Promise<void>`

---

### src/model/model.ts

_The central base class for all ORM models, providing data management, dirty tracking, and lifecycle orchestration._

- **Class** `Model<TSchema>`
  - **Static Properties**
    - `public static table: string` - Table/collection name.
    - `public static primaryKey: string` - Defaults to `"id"`.
    - `public static dataSource?: string | DataSource` - Assigned data source.
    - `public static schema?: ObjectValidator` - @warlock.js/seal validation schema.
    - `public static strictMode: StrictMode` - Defaults to `"strip"`.
    - `public static autoGenerateId: boolean` - Defaults to `true` (NoSQL).
    - `public static deleteStrategy?: DeleteStrategy` - `"trash" | "permanent" | "soft"`.
    - `public static relations: Record<string, any>` - Relationship definitions.
    - `public static globalScopes: Map<string, GlobalScopeDefinition>`
    - `public static localScopes: Map<string, LocalScopeCallback>`
  - **Instance Properties**
    - `public isNew: boolean` - New vs. persisted flag.
    - `public data: TSchema` - Raw model data.
    - `public readonly dirtyTracker: DatabaseDirtyTracker`
    - `public events: ModelEvents<any>` - Instance-level event emitter.
    - `public loadedRelations: Map<string, any>`
    - `protected isActiveColumn: string` - Defaults to `"isActive"`.
  - **Static Methods**
    - `public static query(): QueryBuilderContract` - Start a new query.
    - `public static find(id: string | number): Promise<Model | null>`
    - `public static create(data: Partial<TSchema>): Promise<Model>`
    - `public static insertMany(data: Partial<TSchema>[]): Promise<Model[]>`
    - `public static upsert(filter: Partial<TSchema>, data: Partial<TSchema>, options?: Record<string, unknown>): Promise<Model>`
    - `public static first(filter?: Record<string, unknown>): Promise<Model | null>`
    - `public static all(filter?: Record<string, unknown>): Promise<Model[]>`
    - `public static paginate(options?: PaginationOptions): Promise<PaginationResult>`
    - `public static count(filter?: Record<string, unknown>): Promise<number>`
    - `public static on(event: ModelEventName, listener: ModelEventListener): () => void`
    - `public static with(...relations: string[]): QueryBuilderContract`
    - `public static joinWith(...relations: string[]): QueryBuilderContract`
    - `public static addGlobalScope(name: string, callback: Function, options?: GlobalScopeOptions): void`
    - `public static addScope(name: string, callback: LocalScopeCallback): void`
    - `public static fromSnapshot(snapshot: ModelSnapshot): Model`
    - `public static hydrate(data: Record<string, unknown>): Model`
  - **Instance Methods**
    - `public get(field: string, defaultValue?: any): any` - Access data with dot-notation.
    - `public set(field: string, value: any): this` - Set data and mark dirty.
    - `public has(field: string): boolean`
    - `public unset(...fields: string[]): this`
    - `public merge(values: Record<string, unknown>): this`
    - `public async save(options?: WriterOptions): Promise<this>` - Persist changes.
    - `public async destroy(options?: { strategy?: DeleteStrategy }): Promise<RemoverResult>`
    - `public async load(...relations: string[]): Promise<this>` - Lazy-load relations.
    - `public hasChanges(): boolean`
    - `public isDirty(column: string): boolean`
    - `public toJSON(): any`
    - `public toSnapshot(): ModelSnapshot`
    - `public clone(): this`
    - `public self(): ChildModel` - Reference to constructor.

### src/model/register-model.ts

_Service for registering and retrieving models by string name to resolve circular dependencies._

- **Function** `RegisterModel(name?: string): ClassDecorator` - Decorator to register a model.
- **Function** `registerModelInRegistry(name: string, model: any): void`
- **Function** `getModelFromRegistry(name: string): any`
- **Function** `getAllModelsFromRegistry(): Map<string, any>`

### src/events/model-events.ts

_Async event system for model lifecycle hooks._

- **Class** `ModelEvents<TModel>`
  - `public on(event: ModelEventName, listener: ModelEventListener): () => void`
  - `public once(event: ModelEventName, listener: ModelEventListener): () => void`
  - `public emit(event: ModelEventName, model: TModel, context: any): Promise<void>`
  - `public onSaving(listener: ModelEventListener): () => void`
  - `public onSaved(listener: ModelEventListener): () => void`
  - `public onCreating(listener: ModelEventListener): () => void`
  - `public onCreated(listener: ModelEventListener): () => void`
  - `public onUpdating(listener: ModelEventListener): () => void`
  - `public onUpdated(listener: ModelEventListener): () => void`
  - `public onDeleting(listener: ModelEventListener): () => void`
  - `public onDeleted(listener: ModelEventListener): () => void`
- **Constant** `globalModelEvents: ModelEvents<Model>` - Global lifecycle hooks.

### src/utils/define-model.ts

_Declarative utility for defining models without class boilerplate._

- **Function** `defineModel<TSchema>(options: DefineModelOptions<TSchema>): ModelClass`
- **Type** `DefineModelOptions<TSchema>`
  - `table: string`
  - `name?: string`
  - `schema: ObjectValidator`
  - `deleteStrategy?: DeleteStrategy`
  - `properties?: Record<string, any>` - Instance properties/methods.
  - `statics?: Record<string, any>` - Static methods.

---

### src/query-builder/query-builder.ts

_Pure, driver-agnostic operation recorder used to build chainable queries._

- **Class** `QueryBuilder<T>`
  - `public operations: Op[]` - List of recorded operations.
  - `public pendingGlobalScopes?: Map<string, any>`
  - `public eagerLoadRelations: Map<string, any>`
  - `public countRelations: string[]`
  - `public where(field: string, operator: string, value: any): this`
  - `public orWhere(field: string, operator: string, value: any): this`
  - `public whereRaw(expression: any, bindings?: any[]): this`
  - `public whereIn(field: string, values: any[]): this`
  - `public whereNull(field: string): this`
  - `public whereBetween(field: string, range: [any, any]): this`
  - `public whereColumn(first: string, operator: string, second: string): this`
  - `public whereDate(field: string, value: Date | string): this`
  - `public whereJsonContains(path: string, value: any): this`
  - `public whereExists(callback: Function): this`
  - `public whereHas(relation: string, callback: Function): this`
  - `public with(relation: string, callback?: Function): this`
  - `public joinWith(...relations: string[]): this`
  - `public select(...fields: string[]): this`
  - `public selectRaw(expression: any, bindings?: any[]): this`
  - `public deselect(fields: string[]): this`
  - `public orderBy(field: string, direction?: string): this`
  - `public limit(value: number): this`
  - `public skip(value: number): this`
  - `public groupBy(fields: string | string[]): this`
  - `public having(field: string, operator: string, value: any): this`
  - `public when(condition: any, callback: Function): this`
  - `public tap(callback: Function): this`
  - `public clone(): this`
  - `protected addOperation(type: string, data: Record<string, any>): void`
  - `protected subQuery(): QueryBuilder`

### src/contracts/query-builder.contract.ts

_Interface defining the execution and builder methods across all drivers._

- **Interface** `QueryBuilderContract<T>` extends `QueryBuilder<T>`
  - `get(): Promise<T[]>`
  - `first(): Promise<T | null>`
  - `count(): Promise<number>`
  - `paginate(options: PaginationOptions): Promise<PaginationResult<T>>`
  - `chunk(size: number, callback: ChunkCallback<T>): Promise<void>`
  - `toSql(): DriverQuery`
  - `pluck<K>(column: string): Promise<K[]>`
  - `sum(column: string): Promise<number>`
  - `avg(column: string): Promise<number>`
  - `min(column: string): Promise<number>`
  - `max(column: string): Promise<number>`

---

### src/relations/helpers.ts

_Factory functions for defining declarative relationships on models._

- **Function** `hasMany(model: string, options?: HasManyOptions): RelationDefinition`
- **Function** `hasOne(model: string, options?: HasOneOptions): RelationDefinition`
- **Function** `belongsTo(model: string, options?: BelongsToOptions | string): RelationDefinition`
- **Function** `belongsToMany(model: string, options: BelongsToManyOptions): RelationDefinition`

### src/relations/relation-loader.ts

_Service for resolving and loading relationship data across model instances._

- **Class** `RelationLoader`
  - `public constructor(models: Model[], modelClass: ChildModel)`
  - `public load(relations: string[]): Promise<void>`
  - `protected loadRelation(relationName: string, constraints?: Function): Promise<void>`

### src/relations/pivot-operations.ts

_Manager for many-to-many junction table operations._

- **Class** `PivotOperations`
  - `public attach(ids: PivotIds, pivotData?: PivotData): Promise<void>`
  - `public detach(ids?: PivotIds): Promise<void>`
  - `public sync(ids: PivotIds, pivotData?: PivotData): Promise<void>`
  - `public toggle(ids: PivotIds, pivotData?: PivotData): Promise<void>`
- **Function** `createPivotOperations(model: Model, relationName: string): PivotOperations`

### src/relations/relation-hydrator.ts

_Service for restoring model instances and their loaded relations from snapshots._

- **Class** `RelationHydrator`
  - `public hydrate(model: Model, snapshot: ModelSnapshot): void`
  - `public static snapshot(model: Model): ModelSnapshot`

---

### src/data-source/data-source.ts

_Wrapper coupling a database driver with configuration metadata._

- **Class** `DataSource`
  - `public readonly name: string`
  - `public readonly driver: DriverContract`
  - `public readonly isDefault: boolean`
  - `public get idGenerator(): IdGeneratorContract | undefined`

### src/data-source/data-source-registry.ts

_Central registry for managing named and default data sources._

- **Class** `DataSourceRegistry`
  - `public register(options: DataSourceOptions): DataSource`
  - `public get(name?: string): DataSource`
  - `public on(event: string, listener: Function): void`
- **Constant** `dataSourceRegistry: DataSourceRegistry`

### src/migration/migration.ts

_Base class for defining database schema changes._

- **Class** `Migration`
  - `public abstract up(): Promise<void> | void`
  - `public abstract down(): Promise<void> | void`
  - `public static readonly table: string`
  - `public static for(model: any): typeof Migration` - Helper to bind migration to a model.
  - `public createTable(): this`
  - `public dropTable(): this`
  - `public column(name: string): ColumnBuilder`
  - `public string(name: string, length?: number): ColumnBuilder`
  - `public integer(name: string): ColumnBuilder`
  - `public boolean(name: string): ColumnBuilder`
  - `public id(name?: string): ColumnBuilder`
  - `public timestamps(): void`

### src/sync/sync-manager.ts

_Service for orchestrating multi-level data synchronization across models._

- **Class** `SyncManager`
  - `public syncUpdate(sourceId: any, data: any, changedFields: string[]): Promise<SyncResult>`
  - `public syncDelete(sourceId: any): Promise<SyncResult>`
  - `protected collectInstructions(payload: any): Promise<SyncInstruction[]>`

### src/utils/connect-to-database.ts

_Global utility for initializing database connections._

- **Function** `connectToDatabase(options: ConnectOptions): Promise<void>`
- **Function** `onceConnected(callback: Function): void`

---

### src/expressions/aggregate-expressions.ts

_Database-agnostic aggregation expressions for groups (SUM, AVG, COUNT, etc.)._

- **Type** `AggregateExpression` - Abstract aggregate definition.
- **Constant** `$agg`
  - `count(): AggregateExpression`
  - `sum(field: string): AggregateExpression`
  - `avg(field: string): AggregateExpression`
  - `min(field: string): AggregateExpression`
  - `max(field: string): AggregateExpression`
  - `distinct(field: string): AggregateExpression`
  - `floor(field: string): AggregateExpression`
  - `first(field: string): AggregateExpression`
  - `last(field: string): AggregateExpression`

---

### src/validation/mutators/embed-mutator.ts

_Mutators to convert raw input (IDs or objects) into model instances for validation._

- **Function** `databaseModelMutator: Mutator` - Fetches a single model instance from registry/DB.
- **Function** `databaseModelsMutator: Mutator` - Fetches multiple model instances from registry/DB.

### src/validation/plugins/embed-validator-plugin.ts

_Seal.js plugin for injecting model embedding validators._

- **Constant** `embedValidator: SealPlugin` - Injects `v.embed()` and `v.embedMany()` into Seal.

### src/validation/rules/database-model-rule.ts

_Validation rules ensuring the input is a valid model instance._

- **Constant** `databaseModelRule: SchemaRule` - Validates a single model instance.
- **Constant** `databaseModelsRule: SchemaRule` - Validates a list of model instances.

### src/validation/transformers/embed-model-transformer.ts

_Transformer for converting model instances into embedded document format._

- **Function** `databaseModelTransformer: TransformerCallback` - Extracts data defined by the `embed` option.

### src/validation/validators/embed-validator.ts

_Core validator class for model embedding operations._

- **Class** `EmbedModelValidator` extends `BaseValidator`
  - `public model(model: ChildModel | string, errorMessage?: string): this`
  - `public models(model: ChildModel | string, errorMessage?: string): this`
  - `public embed(embed?: string | string[]): this`
