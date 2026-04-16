# @warlock.js/core — Data Inventory

### src/repositories/repository.manager.ts
*Base repository manager providing ORM-agnostic data access, filtering, caching, and pagination.*

- **Class** `RepositoryManager<T = unknown, F = Record<string, any>>`
  - `protected _adapter?: RepositoryAdapterContract<T>`
  - `protected source?: any`
  - `protected filterBy: FilterRules`
  - `protected get adapter(): RepositoryAdapterContract<T>`
  - `protected defaultOptions: Partial<RepositoryOptions>`
  - `protected simpleSelectColumns: string[]`
  - `protected isActiveColumn?: string`
  - `protected isActiveValue?: any`
  - `protected name?: string`
  - `protected isCacheable: boolean`
  - `protected cacheDriver: CacheDriver<any, any>`
  - `protected eventsCallbacks: any[]`
  - `public constructor(adapter?: RepositoryAdapterContract<T>)`
  - `public registerEvents(): void`
  - `public cleanuEvents(): void`
  - `protected createDefaultAdapter(): RepositoryAdapterContract<T>`
  - `public getName(): string`
  - `protected getIsActiveColumn(): string`
  - `protected getIsActiveValue(): any`
  - `public newQuery(): QueryBuilderContract<T>`
  - `public newModel(data?: any): T`
  - `protected getIsActiveFilter(): Record<string, any>`
  - `public async find(id: string | number | T): Promise<T | null>`
  - `public async findBy(column: string, value: any): Promise<T | null>`
  - `public async findActive(id: string | number | T): Promise<T | null>`
  - `public async findByActive(column: string, value: any): Promise<T | null>`
  - `public async first(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async firstId(options?: TypedRepositoryOptions<F>): Promise<string | number | undefined>`
  - `public async firstActiveId(options?: TypedRepositoryOptions<F>): Promise<string | number | undefined>`
  - `public async firstCachedId(options?: TypedRepositoryOptions<F>): Promise<string | number | undefined>`
  - `public async firstActiveCachedId(options?: TypedRepositoryOptions<F>): Promise<string | number | undefined>`
  - `public async firstUuid(options?: TypedRepositoryOptions<F>): Promise<string | undefined>`
  - `public async firstActiveUuid(options?: TypedRepositoryOptions<F>): Promise<string | undefined>`
  - `public async firstCachedUuid(options?: TypedRepositoryOptions<F>): Promise<string | undefined>`
  - `public async firstActiveCachedUuid(options?: TypedRepositoryOptions<F>): Promise<string | undefined>`
  - `public async firstCached(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async firstActive(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async firstActiveCached(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async last(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async lastCached(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async lastActive(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async lastActiveCached(options?: TypedRepositoryOptions<F>): Promise<T | null>`
  - `public async list(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>`
  - `public async list(options: TypedRepositoryOptionsWithCursor<F>): Promise<CursorPaginationResult<T>>`
  - `private async _listImpl(options?: RepositoryOptions): Promise<PaginationResult<T> | CursorPaginationResult<T>>`
  - `public async all(options?: TypedAllRepositoryOptions<F>): Promise<T[]>`
  - `public async listActive(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>`
  - `public async listActive(options: TypedRepositoryOptionsWithCursor<F>): Promise<CursorPaginationResult<T>>`
  - `public async allActive(options?: TypedAllRepositoryOptions<F>): Promise<T[]>`
  - `public async exists(filter?: TypedRepositoryOptions<F>): Promise<boolean>`
  - `public async existsActive(filter?: TypedRepositoryOptions<F>): Promise<boolean>`
  - `public async idExists(id: number | string): Promise<boolean>`
  - `public async idExistsActive(id: number | string): Promise<boolean>`
  - `protected prepareOptions(options?: TypedRepositoryOptions<F>): TypedRepositoryOptions<F>`
  - `protected asTyped(opts: RepositoryOptions): TypedRepositoryOptions<F>`
  - `protected asTypedAll(opts: AllRepositoryOptions): TypedAllRepositoryOptions<F>`
  - `protected applyOptionsToQuery(query: QueryBuilderContract<T>, options: RepositoryOptions): RepositoryOptions`
  - `public async create(data: any): Promise<T>`
  - `public async update(id: string | number | any, data: any): Promise<T>`
  - `public async delete(id: string | number): Promise<void>`
  - `public async updateMany(filter: any, data: any): Promise<number>`
  - `public async deleteMany(filter: any): Promise<number>`
  - `public async chunk(size: number, callback: ChunkCallback<T>, options?: TypedRepositoryOptions<F>): Promise<void>`
  - `public async chunkActive(size: number, callback: ChunkCallback<T>, options?: TypedRepositoryOptions<F>): Promise<void>`
  - `public async latest(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>`
  - `public async latest(options: TypedRepositoryOptionsWithCursor<F>): Promise<CursorPaginationResult<T>>`
  - `public async oldest(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>`
  - `public async oldest(options: TypedRepositoryOptionsWithCursor<F>): Promise<CursorPaginationResult<T>>`
  - `public async latestActive(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>`
  - `public async latestActive(options: TypedRepositoryOptionsWithCursor<F>): Promise<CursorPaginationResult<T>>`
  - `public async oldestActive(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>`
  - `public async oldestActive(options: TypedRepositoryOptionsWithCursor<F>): Promise<CursorPaginationResult<T>>`
  - `protected async beforeListing(options: any): Promise<void>`
  - `protected async onList(result: PaginationResult<T>, options: any): Promise<void>`
  - `protected async onCreating(data: any): Promise<void>`
  - `protected async onCreate(record: T, data: any): Promise<void>`
  - `protected async onUpdating(id: string | number, data: any): Promise<void>`
  - `protected async onUpdate(record: T, data: any): Promise<void>`
  - `protected async onSaving(data: any, mode: SaveMode): Promise<void>`
  - `protected async onSave(record: T, data: any, mode: SaveMode): Promise<void>`
  - `protected async onDeleting(id: string | number): Promise<void>`
  - `protected async onDelete(id: string | number): Promise<void>`
  - `public async count(options?: TypedRepositoryOptions<F>): Promise<number>`
  - `public async countActive(options?: TypedRepositoryOptions<F>): Promise<number>`
  - `public async countCached(options?: TypedRepositoryOptions<F>): Promise<number>`
  - `public async countActiveCached(options?: TypedRepositoryOptions<F>): Promise<number>`
  - `public setCacheDriver(driver: any): this`
  - `public getCacheDriver(): any`
  - `protected cacheKey(key: string | Record<string, any>, moreOptions?: Record<string, any>): string`
  - `protected async cache(key: string, value: any): Promise<void>`
  - `public async getCached(id: string | number): Promise<T | null>`
  - `public async findCached(id: string | number): Promise<T | null>`
  - `public async getCachedBy(column: string, value: any, cacheKeyOptions?: Record<string, any>): Promise<T | null>`
  - `public async allCached(options?: TypedAllRepositoryOptions<F>): Promise<T[]>`
  - `public async allActiveCached(options?: TypedAllRepositoryOptions<F>): Promise<T[]>`
  - `public async listCached(options?: TypedRepositoryOptions<F>): Promise<PaginationResult<T>>`
  - `public async listActiveCached(options?: TypedRepositoryOptions<F>): Promise<PaginationResult<T>>`
  - `public async getActiveCached(id: string | number): Promise<T | undefined>`
  - `public async cacheModel(model: T): Promise<void>`
  - `public cleanup(): void`
  - `public $cleanup(): void`
  - `public async clearCache(key?: CacheKey): Promise<void>`
  - `public async clearModelCache(model: T): Promise<void>`
  - `protected mapModels(documents: any[]): T[]`
  - `public async findOrCreate(where: TypedRepositoryOptions<F>, data: Record<string, any>): Promise<T>`
  - `public async updateOrCreate(where: TypedRepositoryOptions<F>, data: Record<string, any>): Promise<T>`

### src/repositories/contracts/query-builder.contract.ts
*Contract interface for database query building.*

- **Interface** `QueryBuilderContract<T>`
  - `where(field: string, value: any): this`
  - `where(field: string, operator: WhereOperator, value: any): this`
  - `where(conditions: Record<string, any>): this`
  - `where(callback: (query: this) => void): this`
  - `orWhere(field: string, value: any): this`
  - `orWhere(field: string, operator: WhereOperator, value: any): this`
  - `orWhere(conditions: Record<string, any>): this`
  - `whereIn(field: string, values: any[]): this`
  - `whereNotIn(field: string, values: any[]): this`
  - `whereNull(field: string): this`
  - `whereNotNull(field: string): this`
  - `whereBetween(field: string, range: [any, any]): this`
  - `whereLike(field: string, pattern: string): this`
  - `pretty(): string`
  - `select(fields: string[]): this`
  - `select(...fields: string[]): this`
  - `deselect(fields: string[]): this`
  - `deselect(...fields: string[]): this`
  - `orderBy(field: string, direction?: "asc" | "desc"): this`
  - `sortBy(orderBy: Record<string, "asc" | "desc">): this`
  - `random(limit?: number): this`
  - `limit(limit: number): this`
  - `offset(offset: number): this`
  - `skip(count: number): this`
  - `applyFilters(filters: FilterRules<this>, data: any, options: FilterOptions): this`
  - `get(): Promise<T[]>`
  - `first(): Promise<T | null>`
  - `count(): Promise<number>`
  - `paginate(page: number, limit: number): Promise<PaginationResult<T>>`
  - `cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>`
  - `chunk(size: number, callback: ChunkCallback<T>): Promise<void>`
  - `with?(relation: string): this`
  - `joinWith?(...relations: string[]): this`
  - `clone(): this`
  - `similarTo(column: string, embedding: number[], alias?: string): this`

### src/repositories/contracts/repository-adapter.contract.ts
*Contract interface for database adapters.*

- **Interface** `RepositoryAdapterContract<T>`
  - `query(): QueryBuilderContract<T>`
  - `registerEvents(eventsCallback: any): any[]`
  - `resolveRepositoryName(): string`
  - `serializeModel(model: T): any`
  - `deserializeModel(data: any): T`
  - `find(id: any): Promise<T | null>`
  - `findBy(column: string, value: any): Promise<T | null>`
  - `create(data: any): Promise<T>`
  - `update(id: any, data: any): Promise<T>`
  - `delete(id: any): Promise<void>`
  - `updateMany(filter: any, data: any): Promise<number>`
  - `deleteMany(filter: any): Promise<number>`
  - `count(filter?: any): Promise<number>`
  - `paginate(page: number, limit: number): Promise<PaginationResult<T>>`
  - `cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>`
  - `chunk(size: number, callback: ChunkCallback<T>): Promise<void>`
  - `createModel(data: any): T`

### src/repositories/contracts/types.ts
*Shared types and interfaces for repository management.*

- **Type** `PaginationResult<T>`
- **Type** `CursorPaginationResult<T>`
- **Type** `CursorPaginationOptions`
- **Type** `ChunkCallback<T>`
- **Type** `WhereOperator`
- **Type** `FilterOperator`
- **Type** `FilterFunction<Q = any>`
- **Type** `FilterRule<Q = any>`
- **Type** `FilterRules<Q = any>`
- **Type** `FilterOptions`
- **Type** `PaginationMode`
- **Type** `RepositoryOptions`
- **Interface** `RepositoryOptionsWithPages`
- **Interface** `RepositoryOptionsWithCursor`
- **Type** `CachedRepositoryOptions`
- **Type** `AllRepositoryOptions`
- **Type** `TypedRepositoryOptions<F = Record<string, any>>`
- **Type** `TypedAllRepositoryOptions<F = Record<string, any>>`
- **Type** `TypedRepositoryOptionsWithPages<F = Record<string, any>>`
- **Type** `TypedRepositoryOptionsWithCursor<F = Record<string, any>>`
- **Type** `RepositoryEvent`
- **Type** `SaveMode`
- **Type** `RepositoryConfigurations`

### src/repositories/adapters/cascade/cascade-adapter.ts
*Repository adapter for @warlock.js/cascade ORM.*

- **Class** `CascadeAdapter<T extends Model<any>>`
  - `public constructor(private model: ChildModel<T>)`
  - `public query(): QueryBuilderContract<T>`
  - `public registerEvents(eventsCallback: any): any[]`
  - `public find(id: any): Promise<T | null>`
  - `public findBy(column: string, value: any): Promise<T | null>`
  - `public serializeModel(model: T): any`
  - `public deserializeModel(data: any): T`
  - `public resolveRepositoryName(): string`
  - `public create(data: any): Promise<T>`
  - `public update(id: any, data: any): Promise<T>`
  - `public delete(id: any): Promise<void>`
  - `public updateMany(filter: any, data: any): Promise<number>`
  - `public deleteMany(filter: any): Promise<number>`
  - `public count(filter?: any): Promise<number>`
  - `public async paginate(page: number, limit: number): Promise<PaginationResult<T>>`
  - `public async cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>`
  - `public async chunk(size: number, callback: ChunkCallback<T>): Promise<void>`
  - `public createModel(data: any): T`

### src/repositories/adapters/cascade/cascade-query-builder.ts
*Query builder wrapper for @warlock.js/cascade query engine.*

- **Class** `CascadeQueryBuilder<T extends Model>`
  - `public constructor(private query: CascadeQueryBuilderContract<T>)`
  - `public where(field: string, value: any): this`
  - `public where(field: string, operator: WhereOperator, value: any): this`
  - `public where(conditions: Record<string, any>): this`
  - `public where(callback: (query: this) => void): this`
  - `public pretty(): string`
  - `public orWhere(field: string, value: any): this`
  - `public orWhere(field: string, operator: WhereOperator, value: any): this`
  - `public orWhere(conditions: Record<string, any>): this`
  - `public whereIn(field: string, values: any[]): this`
  - `public whereNotIn(field: string, values: any[]): this`
  - `public whereNull(field: string): this`
  - `public whereNotNull(field: string): this`
  - `public whereBetween(field: string, range: [any, any]): this`
  - `public whereLike(field: string, pattern: string): this`
  - `public similarTo(column: string, embedding: number[], alias?: string): this`
  - `public select(fields: string[]): this`
  - `public select(...fields: string[]): this`
  - `public deselect(fields: string[]): this`
  - `public deselect(...fields: string[]): this`
  - `public orderBy(field: string, direction?: "asc" | "desc"): this`
  - `public sortBy(orderBy: Record<string, "asc" | "desc">): this`
  - `public random(limit: number): this`
  - `public limit(limit: number): this`
  - `public offset(offset: number): this`
  - `public skip(count: number): this`
  - `public applyFilters(filters: FilterRules<this>, data: any, options: FilterOptions): this`
  - `public async get(): Promise<T[]>`
  - `public async first(): Promise<T | null>`
  - `public async count(): Promise<number>`
  - `public async paginate(page: number, limit: number): Promise<PaginationResult<T>>`
  - `public async cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>`
  - `public async chunk(size: number, callback: ChunkCallback<T>): Promise<void>`
  - `public with(relation: string): this`
  - `public joinWith(...relations: string[]): this`
  - `public clone(): this`

### src/repositories/adapters/cascade/filter-applicator.ts
*Maps repository filter rules to Cascade query builder operations.*

- **Class** `FilterApplicator`
  - `public apply(query: CascadeQueryBuilder<any>, filters: FilterRules, data: any, options: FilterOptions): void`
  - `private parseFilterRule(key: string, rule: FilterRule): any`
  - `private applyFilterRule(query: CascadeQueryBuilder<any>, rule: any, value: any, data: any, options: FilterOptions): void`
  - `private getFilterHandler(type: string): Function | undefined`
  - `private applyWhereOperator(query: QueryBuilderContract, operator: string, column?: string, columns?: string[], value?: any): void`
  - `private handleBoolean(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleInt(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleNotInt(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleIntComparison(query: QueryBuilderContract, column: any, columns: any, value: any, operator: string): void`
  - `private handleInInt(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleNumber(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleInNumber(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleFloat(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleNull(query: QueryBuilderContract, column?: string, columns?: string[]): void`
  - `private handleNotNull(query: QueryBuilderContract, column?: string, columns?: string[]): void`
  - `private handleScope(query: QueryBuilderContract, column?: string, _columns?: string[], value?: any): void`
  - `private handleWith(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleJoinWith(query: QueryBuilderContract, column?: string, columns?: string[], value?: any): void`
  - `private handleSimilarTo(query: QueryBuilderContract, column?: string, _columns?: string[], value?: any): void`
  - `private handleDate(query: QueryBuilderContract, column?: string, columns?: string[], value?: any, options?: FilterOptions): void`
  - `private handleDateComparison(query: QueryBuilderContract, column: any, columns: any, value: any, options: any, operator: string,): void`
  - `private handleDateBetween(query: QueryBuilderContract, column?: string, columns?: string[], value?: any, options?: FilterOptions): void`
  - `private handleInDate(query: QueryBuilderContract, column?: string, columns?: string[], value?: any, options?: FilterOptions): void`
  - `private handleDateTime(query: QueryBuilderContract, column?: string, columns?: string[], value?: any, options?: FilterOptions): void`
  - `private handleDateTimeComparison(query: QueryBuilderContract, column: any, columns: any, value: any, options: any, operator: string): void`
  - `private handleDateTimeBetween(query: QueryBuilderContract, column?: string, columns?: string[], value?: any, options?: FilterOptions): void`
  - `private handleInDateTime(query: QueryBuilderContract, column?: string, columns?: string[], value?: any, options?: FilterOptions): void`
  - `private parseDate(value: any, format?: string): Date`
  - `private parseDateTime(value: any, format?: string): Date`

### src/restful/restful.ts
*Abstract base class for building RESTful controllers with CRUD hooks.*

- **Abstract Class** `Restful<T extends Model>`
  - `protected middleware: RestfulMiddleware`
  - `protected recordName: string`
  - `protected recordsListName: string`
  - `protected abstract repository: RepositoryManager<T>`
  - `protected returnOn: Record<string, "record" | "records">`
  - `public cache: boolean`
  - `public async find(id: number): Promise<T | null>`
  - `public async list(request: Request, response: Response): Promise<any>`
  - `public async get(request: Request, response: Response): Promise<any>`
  - `public async create(request: Request, response: Response): Promise<any>`
  - `public async update(request: Request, response: Response): Promise<any>`
  - `public async patch(request: Request, response: Response): Promise<any>`
  - `public async delete(request: Request, response: Response): Promise<any>`
  - `public async bulkDelete(request: Request, response: Response): Promise<any>`
  - `protected async beforeCreate(_request: Request, _response: Response, _record: T): Promise<any>`
  - `protected async onCreate(_request: Request, _response: Response, _record: T): Promise<any>`
  - `protected async beforeUpdate(_request: Request, _response: Response, _record: T, _oldRecord?: T): Promise<any>`
  - `protected async onUpdate(_request: Request, _response: Response, _record: T, _oldRecord: T): Promise<any>`
  - `protected async beforeDelete(_request: Request, _response: Response, _record: T): Promise<any>`
  - `protected async onDelete(_request: Request, _response: Response, _record: T): Promise<any>`
  - `protected async beforePatch(_request: Request, _response: Response, _record: T, _oldRecord?: T): Promise<any>`
  - `protected async onPatch(_request: Request, _response: Response, _record: T, _oldRecord: T): Promise<any>`
  - `protected async beforeSave(_request: Request, _response: Response, _record?: T, _oldRecord?: T): Promise<any>`
  - `protected async onSave(_request: Request, _response: Response, _record: T, _oldRecord?: T): Promise<any>`
  - `protected async callMiddleware(method: string, request: Request, response: Response, _record?: any): Promise<any>`

### src/database/create-database-action.ts
*CLI action to create a new database.*

- **Function** `createDatabaseAction(command: CommandActionData): Promise<void>`

### src/database/drop-tables-action.ts
*CLI action to drop all tables in a database.*

- **Function** `dropTablesAction(command: CommandActionData): Promise<void>`

### src/database/migrate-action.ts
*CLI action for running and managing database migrations.*

- **Function** `migrateAction(options: CommandActionData): Promise<void>`
- **Function** `loadMigrationFile(absPath: string): Promise<void>`
- **Function** `migrationFiles(): Promise<string[]>`
- **Function** `loadAllMigrations(): Promise<void>`

### src/database/seed-command-action.ts
*CLI action for running database seeders.*

- **Function** `seedCommandAction(options: CommandActionData): Promise<void>`
- **Function** `listSeedsFiles(): Promise<Seeder[]>`
- **Function** `loadSeedFile(absPath: string): Promise<Seeder>`

### src/database/utils.ts
*Database utilities for password hashing and computed fields.*

- **Constant** `useHashedPassword: () => any`
- **Function** `useComputedModel(callback: ComputedCallbackModel): ComputedCallback`
- **Function** `useComputedSlug(field?: string, scope?: "global" | "sibling"): ComputedCallback`

### src/database/models/database-log/database-log.ts
*Database log model.*

- **Class** `DatabaseLogModel`
  - `public static table: string`
  - `public static schema: any`

### src/database/seeds/seeder.ts
*Seeder type and factory.*

- **Type** `Seeder`
- **Function** `seeder(seeder: Seeder): Seeder`

### src/database/seeds/seeders.manager.ts
*Manager for registering and running database seeders.*

- **Class** `SeedersManager`
  - `public seeders: Seeder[]`
  - `protected datasource?: DataSource`
  - `public constructor(protected options?: SeedersManagerOptions)`
  - `public register(...seeders: Seeder[]): this`
  - `protected async init(): Promise<void>`
  - `public async run(withTransaction?: boolean): Promise<void>`
  - `public prepareSeeders(): void`
  - `public async storeSeedsResults(seeder: Seeder, result: SeedResult): Promise<void>`
  - `protected getMetadata(seeder: Seeder): Promise<SeederMetadata>`
  - `protected get driver(): DriverContract`
  - `protected async seederIsExecutedBefore(seeder: Seeder): Promise<boolean>`

### src/database/seeds/seeds-table-migration.ts
*Migration for the seeds metadata table.*

- **Class** `SeedsTableMigration`
  - `public static migrationName: string`
  - `public table: string`
  - `public up(): void`
  - `public down(): void`

### src/database/seeds/types.ts
*Shared types for database seeding.*

- **Type** `SeedResult`
- **Type** `SeederMetadata`
