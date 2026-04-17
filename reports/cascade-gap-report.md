# Cascade Documentation Gap Report

_Generated 2026-04-17 against `@warlock.js/cascade` source maps at `warlock.js/cascade/.maps/src/`._

Cascade has evolved into a **multi-driver** ORM supporting MongoDB **and** PostgreSQL (with MySQL reserved in the `DatabaseDriver` union but not yet implemented), a full Laravel-style query builder with scopes and relations, a phase-aware SQL migration system, a bidirectional sync engine, and a `@warlock.js/seal` validation integration. The existing docs describe a **MongoDB-only** system roughly matching the legacy `mongez-monpulse`/early-Cascade API surface. The bulk of the current public API is undocumented, and the parts that are documented frequently reference methods that no longer exist or exist under different names.

## Existing Pages (54 total)

### Getting Started (4)
- `docs/cascade/getting-started/introduction.mdx` — Marketing intro, "delightful MongoDB" framing, old feature list.
- `docs/cascade/getting-started/installation.mdx` — `npm i @warlock.js/cascade`, mentions Mongez Config, MongoDB 6.0.6+ only.
- `docs/cascade/getting-started/connecting-to-database.mdx` — `connectToDatabase` with MongoDB options; references a non-existent `Connection` class and a `useDatabase` method.
- `docs/cascade/getting-started/roadmap.mdx` — Terminology + sequential journey through docs.

### Models (13)
- `docs/cascade/models/index.mdx` — High-level "why models" overview.
- `docs/cascade/models/introduction.mdx` — Defining a model, `collection`, `save`/`create`, `id`/`_id`.
- `docs/cascade/models/create-document.mdx` — `new + save` vs `Model.create` patterns.
- `docs/cascade/models/saving-models.mdx` — `save()`, `Category.update(id, data)`, `silentSaving()`, events hook example.
- `docs/cascade/models/fetching-documents.mdx` — `find`, `findOrFail`, `list`, `withTrashed`, `with`, pagination via `list`.
- `docs/cascade/models/model-data.mdx` — `get`/`set`/`has`/`only`/`except`/`merge`/`unset`/`increment`/`decrement`/`original`.
- `docs/cascade/models/casting-data.mdx` — Built-in cast types, `location`, `localized`, embedded model casts.
- `docs/cascade/models/casting-custom-fields.mdx` — Function casts, get/set direction flag.
- `docs/cascade/models/default-values.mdx` — `protected defaults = { … }`, function defaults.
- `docs/cascade/models/embedded-documents.mdx` — `embeddedData` getter, `embedded`, `embedAllExcept*` toggles.
- `docs/cascade/models/destroying-models.mdx` — `destroy()`, `softDelete`, `restore()`, `forceDelete()`.
- `docs/cascade/models/events.mdx` — Before/after events via `Model.events()`.
- `docs/cascade/models/aggregate.mdx` — Thin pointer to `Model.aggregate()`.
- `docs/cascade/models/indexing.mdx` — `public static indexes = [...]` array definition.

### Queries (4)
- `docs/cascade/queries/introduction.mdx` — Positions the `query` singleton as "direct database power".
- `docs/cascade/queries/listing-documents.mdx` — `query.list`, `query.first`, `query.last`, `query.latest`, `query.distinct`, `query.count`, `query.explain`, `query.aggregate`.
- `docs/cascade/queries/saving-documents.mdx` — `query.create`, `createMany`, `update`, `updateMany`, `replace`, `upsert`.
- `docs/cascade/queries/deleting-documents.mdx` — `query.delete`, `query.deleteOne`.

### Aggregate (13)
- `docs/cascade/aggregate/introduction.mdx` — What is Aggregate framework / pipeline / stage.
- `docs/cascade/aggregate/aggregate-manager.mdx` — `new Aggregate("users")`.
- `docs/cascade/aggregate/selecting-columns.mdx` — `select`/`deselect`/`project`.
- `docs/cascade/aggregate/agg.mdx` — `$agg` helper: count/sum/avg/min/max/first/last + gt/gte/lt/lte/eq/ne/in/nin/exists/regex/like/notLike/isNull/notNull/between/notBetween/condition/booleanCondition/concat/concatWith/year/month/dayOfMonth/dayOfWeek/firstYear/lastYear/firstMonth/lastMonth/firstDayOfMonth/lastDayOfMonth/push/columns/columnName.
- `docs/cascade/aggregate/filtering.mdx` — Full `where*` API on Aggregate class.
- `docs/cascade/aggregate/skip.mdx` / `limit.mdx` / `sort.mdx` / `unwind.mdx` / `group-by.mdx` / `lookup.mdx` — Aggregate pipeline stage helpers.
- `docs/cascade/aggregate/fetching.mdx` — `get`/`first`/`last`/`paginate`/`count`/`chunk`/`explain`/`values`/`unique`/`uniqueHeavy`.
- `docs/cascade/aggregate/advanced.mdx` — `min`/`max`/`avg`/`sum`/`distinct`/`distinctHeavy` on Aggregate.
- `docs/cascade/aggregate/delete.mdx` / `update.mdx` — `Aggregate.delete`, `Aggregate.update`, `Aggregate.unset`.
- `docs/cascade/aggregate/model-aggregate.mdx` — `Model.aggregate()`, override get callback, `paginate`, `chunk`.

### Events (4)
- `docs/cascade/events/introduction.mdx` — Before/after naming conventions intro.
- `docs/cascade/events/model-events.mdx` — 8 events × 3 scopes (self/model/global), payloads.
- `docs/cascade/events/query-events.mdx` — `query.onCreating/onCreated/onUpdating/onUpdated/onDeleting/onDeleted/onFetching/onFetched`.
- `docs/cascade/events/aggregate-events.mdx` — `Aggregate.events()` with `onFetching/onUpdating/onDeleting`.

### Indexing (3)
- `docs/cascade/indexing/introduction.mdx` — Why indexes + pointers.
- `docs/cascade/indexing/blueprint.mdx` — `new Blueprint("users")`, `index`, `unique`, `textIndex`, `geoIndex`, `dropIndex`, `listIndexes`, `truncate`, `drop`, `stats`, `size`, `blueprint()` factory.
- `docs/cascade/indexing/model-blueprint.mdx` — `Model.blueprint()`.

### Relationships (4)
- `docs/cascade/relationships/introduction.mdx` — Embedded vs referenced concepts.
- `docs/cascade/relationships/embedded-documents.mdx` — `embeddedData`, `embedded`, `associate`/`reassociate`/`disassociate`, embed-variant property names.
- `docs/cascade/relationships/joins.mdx` — `Model.joinable()`, `static joinings = { … }`, `Model.aggregate().joining()`, `countJoining`.
- `docs/cascade/relationships/syncing-models.mdx` — `ModelSync`, `Model.sync(field)`, `Model.syncMany(field)`, `unsetOnDelete`, `removeOnDelete`, `ignoreOnDelete`, `updateWhenChange`, `where`.

### Advanced (4)
- `docs/cascade/advanced/introduction.mdx` — Placeholder index.
- `docs/cascade/advanced/auto-increment.mdx` — `public autoIncrement = true`.
- `docs/cascade/advanced/master-mind.mdx` — `masterMind.getLastId`/`setLastId`/`generateNextId`/`renameCollection`/`updateAllLastId`/`getNextId`.
- `docs/cascade/advanced/todo.mdx` — TODO stub.

### Migrations (0)
- `docs/cascade/migrations/` exists but is empty (no `.mdx` files).

---

## Coverage by Feature Area

### Top-level exports (`connectToDatabase`, `transaction`, data sources)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `connectToDatabase(options)` with `driver`, `database`, MongoDB/PG option branches | `utils/connect-to-database.md` | ⚠️ Partial (MongoDB-only, no `driver` field, no `mysql`/`postgres`) |
| `DatabaseDriver` union `"mongodb" \| "postgres" \| "mysql"` | `utils/connect-to-database.md` | ❌ Missing |
| `getDatabaseDriver()` | `utils/connect-to-database.md` | ❌ Missing |
| `transaction(fn, options?)` (top-level utility) | `utils/connect-to-database.md` | ❌ Missing |
| `onceConnected` / `onceDisconnected` | `utils/once-connected.md` | ⚠️ Partial (only `onceConnected`, uses outdated Connection class) |
| `DataSource`, `DataSourceOptions`, multi-source support | `data-source/data-source.md` | ❌ Missing |
| `dataSourceRegistry`, events `registered/default-registered/connected/disconnected` | `data-source/data-source-registry.md` | ❌ Missing |
| `DatabaseDataSourceContext`, per-async-scope data source switching | `context/database-data-source-context.md` | ❌ Missing |
| `DatabaseTransactionContext`, session-bound transactions | `context/database-transaction-context.md` | ❌ Missing |
| `MissingDataSourceError` | `errors/missing-data-source.error.ts` | ❌ Missing |

### Model class (static properties)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `static collection` | model.md | ✅ Covered (under that name) |
| `static table` (new SQL-friendly name) | model.md:166 | ❌ Missing (docs still say `collection`) |
| `static primaryKey` | model.md:239 | ❌ Missing |
| `static dataSource: string \| DataSource` | model.md:216 | ❌ Missing (multi-source attach) |
| `static builder` (custom QueryBuilder subclass) | model.md:221 | ❌ Missing |
| `static resource` / `resourceColumns` / `toJsonColumns` | model.md:180-199 | ❌ Missing |
| `static schema: ObjectValidator` (seal) | model.md:266 | ❌ Missing |
| `static strictMode: "strip" \| "fail" \| "allow"` | model.md:289 | ❌ Missing |
| `static autoGenerateId`, `initialId`, `incrementIdBy`, `randomInitialId`, `randomIncrement` | model.md:313-389 | ⚠️ Partial (`auto-increment.mdx` covers a simplified `autoIncrement = true` surface that does not exist) |
| `static createdAtColumn` / `updatedAtColumn` (configurable, can be `false`) | model.md:394-399 | ❌ Missing |
| `static deleteStrategy: "trash" \| "permanent" \| "soft"` | model.md:419 | ❌ Missing (docs only describe `softDelete = true` booleans) |
| `static deletedAtColumn`, `static trashTable` | model.md:435-450 | ❌ Missing |
| `static globalScopes`, `static localScopes` | model.md:456-462 | ❌ Missing |
| `static relations: Record<string, any>` | model.md:493 | ❌ Missing (hasOne/hasMany/belongsTo/belongsToMany config) |
| `static embed: string[]` | model.md:244 | ⚠️ Partial (docs mention `embedded` array but not `static embed`) |

### Model instance fields & methods
| Feature / Symbol | Map source | Status |
|---|---|---|
| `isNew`, `data`, `original` | model.md:503-510, model-data.mdx | ✅ Covered |
| `readonly dirtyTracker: DatabaseDirtyTracker` | model.md:522 | ❌ Missing |
| `events: ModelEvents` on instance | model.md:528 | ❌ Missing |
| `loadedRelations` Map | model.md:544 | ❌ Missing |
| `load(...relations): Promise<this>` | model.md:593 | ❌ Missing |
| `isLoaded(name)`, `getRelation(name)` | model.md:616-638 | ❌ Missing |
| `get id` (number or string) | model.md:734 | ⚠️ Partial (docs assume numeric only) |
| `get uuid` | model.md:741 | ❌ Missing |
| Typed accessors `string()`, `number()`, `boolean()` | model.md:783-799 | ❌ Missing |
| `atomicUpdate`, `atomicIncrement`, `atomicDecrement` (instance) | model.md:906-932 | ❌ Missing |
| `get isActive`, `get createdAt`, `get updatedAt`, `isCreatedBy(user)` | model.md:937-968 | ❌ Missing |
| Dirty tracking: `hasChanges`, `isDirty`, `getDirtyColumns`, `getDirtyColumnsWithValues`, `getRemovedColumns` | dirty-methods.md, model.md:983-1047 | ❌ Missing |
| Instance events `on/once/off/emitEvent` | instance-event-methods.md, model.md:1078-1110 | ❌ Missing |
| `generateNextId()` | meta-methods.md | ❌ Missing |
| `self()` (typed constructor reference) | model.md:1671 | ❌ Missing |
| `clone()` / `deepFreeze()` | hydration-methods.md | ❌ Missing |
| `getTableName`, `getPrimaryKey`, `getSchema`, `schemaHas`, `getStrictMode`, `getConnection` | model.md:1726-1763 | ❌ Missing |
| `replaceData(data)` | model.md:2167 | ❌ Missing |
| `serialize()`, `toSnapshot()`, static `fromSnapshot(snapshot)`, static `hydrate(data)`, `toJSON()` | hydration/serialization maps, model.md:2222-2291 | ❌ Missing |
| `get embedData` getter (new, replaces `embeddedData`) | model.md:2027 | ⚠️ Partial (docs use old `embeddedData` name; new getter is `embedData`) |

### Model statics — queries
| Feature / Symbol | Map source | Status |
|---|---|---|
| `Model.query()` returns `QueryBuilderContract` | model.md:1260 | ❌ Missing |
| `Model.newQueryBuilder()` | model.md:1413 | ❌ Missing |
| `Model.where(...)` shorthand | model.md:1514 | ❌ Missing |
| `Model.first/last/find/all/latest/count/paginate` | query-methods.md | ⚠️ Partial (only `find`, `findOrFail`, `list`, basic `paginate` described — names are different: real `find` = `findById`, `list` is not a real static; doc uses `User.list({ … })` but map shows `findAll(filter)` / `Model.where(…).get()`) |
| `Model.with(...)` typed overloads, `joinWith(...)` | model.md:1289-1392 | ⚠️ Partial (only passing model class in `with: [Category]` via `list` mentioned) |
| `Model.update(id, data)` | model.md:1538-1590 | ⚠️ Partial (docs show `Category.update(1, {…})` but that calls `updateById` under the hood) |
| `Model.findAndUpdate`, `findOneAndUpdate`, `findAndReplace` | model.md:1598-1629 | ❌ Missing |
| `Model.findOneAndDelete(filter, options?)` | model.md:2005 | ❌ Missing |
| `Model.delete(filter?)`, `deleteOne(filter?)` | model.md:1768-1783 | ⚠️ Partial (`delete` shown via `query.delete` only; model-level `delete` / `deleteOne` statics missing) |
| `Model.increase/decrease/atomic` | model.md:1538-1590 | ❌ Missing |
| `Model.createMany(data[])`, `findOrCreate(filter, data?)`, `upsert(filter, data)`, `updateOrCreate` | write-methods.md, model.md:1868-1988 | ❌ Missing (only `create` described) |
| `buildQuery`, `buildNewQueryBuilder`, `resolveDataSource` helpers | query-methods.md | ❌ Missing |

### Scopes
| Feature / Symbol | Map source | Status |
|---|---|---|
| `static addGlobalScope(name, cb, { timing })`, `removeGlobalScope` | scope-methods.md, model.md:1192 | ❌ Missing |
| `static addScope(name, cb)` / `removeScope` (local scopes) | scope-methods.md | ❌ Missing |
| `ScopeTiming` `"before" \| "after"` | model.types.md | ❌ Missing |
| `query.scope(name, ...args)` to invoke a local scope | query-builder.md | ❌ Missing |
| `query.withoutGlobalScope(...names)`, `withoutGlobalScopes()` | query-builder.md | ❌ Missing |
| `GlobalScopeDefinition`, `LocalScopeCallback`, `GlobalScopeOptions` | model.types.md | ❌ Missing |

### Soft delete / restore
| Feature / Symbol | Map source | Status |
|---|---|---|
| `DeleteStrategy` union `"trash" \| "permanent" \| "soft"` | types.md | ❌ Missing (docs only teach a boolean `softDelete`) |
| `DatabaseRemover` pipeline with three strategies | remover/database-remover.md | ❌ Missing |
| `DatabaseRestorer` | restorer/database-restorer.md | ❌ Missing |
| `Model.restore(id, options?)` — single static restore | model.md:1810, restore-methods.md | ⚠️ Partial (`Category.restore({filter})` shown as bulk — but real API takes an `id` number/string, not a filter; bulk is a separate `restoreAll`) |
| `Model.restoreAll(options?)` | restore-methods.md | ❌ Missing |
| `trashTable`, `deletedAtColumn`, `RestorerOptions` id-conflict modes (`fail`/`overwrite`/etc.) | restorer + types map | ❌ Missing |
| Restoring events `restoring`/`restored` | events/model-events.md | ❌ Missing |

### Events
| Feature / Symbol | Map source | Status |
|---|---|---|
| `ModelEventName` — 16 events | events/model-events.md | ⚠️ Partial (docs list only 8 CRUD events; real set adds `validating`, `validated`, `fetching`, `hydrating`, `fetched`, `restoring`, `restored` plus `saving`/`saved` meta variants) |
| `ModelEvents<TModel>` class (instance + static) | events/model-events.md | ❌ Missing |
| `globalModelEvents` singleton | events/model-events.md | ❌ Missing |
| `Model.events()`, `Model.on/once/off`, `Model.globalEvents()`, `Model.$cleanup()` | static-event-methods.md, model.md:2075-2148 | ⚠️ Partial (`events()` shown; `on`/`once`/`off`/`$cleanup`/`globalEvents` missing) |
| Instance `on/once/off/emitEvent(event, context?)` | instance-event-methods.md | ❌ Missing |
| `OnDeletedEventContext` payload type | events/model-events.md | ❌ Missing |
| `getModelUpdatedEvent`, `getModelDeletedEvent`, `getModelEvent`, `MODEL_EVENT_PREFIX`, `ModelSyncEventType` | sync/model-events.md | ❌ Missing |

### Query builder (QueryBuilderContract)
| Feature / Symbol | Map source | Status |
|---|---|---|
| Fluent where family (50+ methods: `whereRaw`, `whereColumn`, `whereColumns`, `whereBetweenColumns`, `whereDate*`, `whereTime`, `whereDay/Month/Year`, `whereJson*`, `whereArrayLength`, `whereId/Ids/Uuid/Ulid`, `whereFullText`, `whereSearch`, `textSearch`, `whereNot`, `whereExists` subquery variant, `whereArrayContains`, `whereArrayHasOrEmpty`, etc.) | contracts/query-builder.contract.md | ❌ Missing entirely |
| `select` family (`selectRaw`, `selectSub`, `selectAggregate`, `selectCase`, `selectWhen`, `selectJson`, `selectConcat`, `selectCoalesce`, `selectWindow`, `selectExists`, `selectCount`) | query-builder.contract.md | ❌ Missing |
| Joins (`join`, `leftJoin`, `rightJoin`, `innerJoin`, `fullJoin`, `crossJoin`, `joinRaw`, `joinWith`) | query-builder.contract.md | ❌ Missing |
| Eager loading: `with(relation, callback?)`, `withCount`, `has`, `whereHas`, `doesntHave`, `whereDoesntHave` | query-builder.contract.md | ❌ Missing |
| Ordering: `orderBy`, `orderByDesc`, `orderByRaw`, `orderByRandom`, `latest`, `oldest` | query-builder.contract.md | ❌ Missing |
| Limiting / cursor: `cursor`, `cursorPaginate`, `CursorPaginationOptions`, `CursorPaginationResult` | query-builder.contract.md | ❌ Missing |
| Grouping: `groupBy`, `groupByRaw`, `having`, `havingRaw` | query-builder.contract.md | ❌ Missing |
| Execution: `get`, `first`, `firstOrFail`, `last`, `count`, `sum`, `avg`, `min`, `max`, `distinct`, `pluck`, `value`, `exists`, `notExists`, `countDistinct`, `increment`/`decrement`, `incrementMany`/`decrementMany`, `chunk`, `paginate` | query-builder.contract.md | ❌ Missing (only Aggregate-class APIs documented, under old names) |
| `tap`, `when`, `clone`, `raw`, `extend` | query-builder.md | ❌ Missing |
| `parse()`, `pretty()`, `explain()` inspection | query-builder.md | ❌ Missing |
| `similarTo(column, embedding, alias?)` vector search | query-builder maps | ❌ Missing |
| `Op` / `JoinWithConstraint` types | query-builder.md | ❌ Missing |
| `hydrate(callback)`, `onFetching/onHydrating/onFetched` builder lifecycle | query-builder.md | ❌ Missing |

### Aggregate expressions (`$agg`)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `$agg.count / sum / avg / min / max / distinct / floor / first / last` (new minimal, database-agnostic set) | expressions/aggregate-expressions.md | ⚠️ Partial (docs show old `$agg` surface with 40+ methods for gt/lt/like/regex/condition/concat/date helpers — that surface has been removed in the new `AggregateExpression` model and now lives on `QueryBuilder` `where*`/`select*` APIs) |
| `isAggregateExpression(value)` type guard | expressions/aggregate-expressions.md | ❌ Missing |
| `AggregateExpression`, `AggregateFunction` types | expressions/aggregate-expressions.md | ❌ Missing |

### Relations (new system)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `RelationType`, `RelationDefinition`, `HasManyOptions`, `HasOneOptions`, `BelongsToOptions`, `BelongsToManyOptions` | relations/types.md | ❌ Missing |
| Helper functions `hasMany(model, options?)`, `hasOne(model, options?)`, `belongsTo(model, options?)`, `belongsToMany(model, options)` | relations/helpers.md | ❌ Missing (docs describe old `joinings = { ... }` static + `Model.joinable()` API which is no longer exported at top level) |
| `static relations = { posts: hasMany(Post), ... }` declaration pattern | model.md:493, helpers.md | ❌ Missing |
| `PivotOperations` (attach/detach/sync/toggle with optional pivotData) | relations/pivot-operations.md | ❌ Missing |
| `createPivotOperations(model, relationName)` factory | relations/pivot-operations.md | ❌ Missing |
| `PivotData`, `PivotIds` types | relations/types.md | ❌ Missing |
| `RelationHydrator` + `ModelSnapshot` + `SerializedRelation` | relations/relation-hydrator.md | ❌ Missing |
| `RelationLoader` (batch loader) | relations/relation-loader.md | ❌ Missing |
| `RelationConstraintCallback`, `RelationConstraints`, `LoadedRelationResult`, `LoadedRelationsMap`, `RelationDefinitions` | relations/types.md | ❌ Missing |

### Sync system (cross-database/cross-model propagation)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `modelSync` singleton + `ModelSyncFacade` (`sync`, `syncMany`, `register`, `clear`, `count`) | sync/model-sync.md | ❌ Missing (docs still describe `Post.sync(field)` static + `syncWith: ModelSync[]` property, but current API is `modelSync.sync(source, target, field)` or `Model.sync(target, field)`) |
| `ModelSyncOperation` with `embed`, `identifyBy`, `maxDepth`, `watchFields`, `unsetOnDelete`, `removeOnDelete`, `unsubscribe`, `$cleanup`, `getConfig` | sync/model-sync-operation.md | ⚠️ Partial (`unsetOnDelete`, `removeOnDelete`, `updateWhenChange` described in docs; `embed`, `identifyBy`, `maxDepth`, `watchFields`, `unsubscribe`, `$cleanup`, `getConfig` missing; `ignoreOnDelete` in docs does not exist in real API) |
| `SyncManager` (`syncUpdate`, `syncUpdateWithConfig`, `syncDelete`, `syncDeleteWithConfig`) | sync/sync-manager.md | ❌ Missing |
| `SyncContext`, `SyncResult`, `SyncInstruction`, `SyncConfig`, `SyncInstructionOptions`, `ModelSyncConfig`, `SyncEventPayload` types | sync/types.md | ❌ Missing |
| `SyncContextManager`, `DEFAULT_MAX_SYNC_DEPTH = 3`, cycle detection | sync/sync-context.md | ❌ Missing |
| `SyncAdapterContract`, `MongoSyncAdapter`, `PostgresSyncAdapter` | contracts + drivers maps | ❌ Missing |
| Sync events: `syncing`, `synced`, payload shape | sync/types.md | ❌ Missing |
| `EmbedKey` `"embedData" \| "embedParent" \| "embedMinimal"` | sync/types.md | ❌ Missing |
| HMR-safe `modelSync.register(cb)` pattern | sync/model-sync.md | ❌ Missing |

### Migrations (full page is missing)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `Migration` abstract base with `up()`/`down()` | migration/migration.md | ❌ Missing (no docs at all in `docs/cascade/migrations/`) |
| `Migration.for(ModelClass)` scoped subclass | migration/migration.md | ❌ Missing |
| Fluent DDL methods on `Migration`: create/drop/rename table, column add/drop/modify, index, FK, `toSQL()`, `execute()` | migration/migration.md | ❌ Missing |
| `ColumnBuilder` fluent API (`nullable`, `notNullable`, `default`, `defaultString`, `useCurrent`, `useCurrentOnUpdate`, `unique`, `index`, `vectorIndex`, `primary`, `autoIncrement`, `unsigned`, `comment`, `check`, `after`, `first`, `references`, `on`, `onDelete`, `onUpdate`, `cascadeAll`, `change`/`modify`, `generatedAs`, `stored`, `virtual`) | migration/column-builder.md | ❌ Missing |
| `DetachedColumnBuilder` for standalone column definitions | migration/column-helpers.md | ❌ Missing |
| `ForeignKeyBuilder` | migration/foreign-key-builder.md | ❌ Missing |
| Standalone column helpers: `string`, `char`, `text`, `mediumText`, `longText`, `integer`/`int`, `smallInteger`/`smallInt`, `tinyInteger`/`tinyInt`, `bigInteger`/`bigInt`, `float`, `double`, `decimal`, `boolCol`/`bool`, `date`, `dateTime`, `timestamp`, `time`, `year`, `json`/`objectCol`, `binary`/`blobCol`, `uuid`, `ulid`, `ipAddress`, `macAddress`, `point`, `polygon`, `lineString`, `geometry`, `vector`, `enumCol`, `setCol`, `arrayInt`/`arrayBigInt`/`arrayFloat`/`arrayDecimal`/`arrayBoolean`/`arrayText`/`arrayDate`/`arrayTimestamp`/`arrayUuid` | migration/column-helpers.md | ❌ Missing |
| Index types: `FullTextIndexOptions`, `GeoIndexOptions`, `VectorIndexOptions` | contracts/migration-driver.contract.md | ❌ Missing |
| `MigrationRunner` + singleton `migrationRunner` (`register`, `registerMany`, `run`, `rollback`, `runAll`, `exportSQL`, `rollbackLast`, `rollbackBatches`, `rollbackAll`, `fresh`, `status`, `getExecutedMigrations`) | migration/migration-runner.md | ❌ Missing |
| `SQLGrammar` phase-aware sorter, `SQLSerializer` | migration/sql-grammar.md, sql-serializer.md | ❌ Missing |
| Types: `MigrationResult`, `MigrationStatus`, `PendingMigration`, `MigrationRecord`, `MigrationRunnerOptions`, `RunMigrationsOptions`, `RollbackOptions`, `SQLStatementType`, `TaggedSQL`, `PendingOperation`, `OperationType`, `MigrationContract`, `MigrationConstructor` | migration/types.md, migration.md | ❌ Missing |
| `MigrationDefaults`, `UuidStrategy` ("v4"/"v7") | types.md | ❌ Missing |

### PostgreSQL driver (entirely undocumented)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `PostgresDriver`, `PostgresDialect`, `PostgresBlueprint`, `PostgresMigrationDriver`, `PostgresQueryBuilder`, `PostgresQueryParser`, `PostgresSQLSerializer`, `PostgresSyncAdapter` | drivers/postgres/* | ❌ Missing |
| `PostgresConnectionConfig`, `PostgresPoolConfig`, `PostgresTransactionOptions`, `PostgresIsolationLevel`, `PostgresNotification`, `PostgresCopyOptions`, `PostgresQueryResult` | drivers/postgres/types.md | ❌ Missing |
| PG-specific builder: `similarTo(column, embedding, alias?)` (pgvector cosine), `whereArrayContains/NotContains/HasOrEmpty/NotHaveOrEmpty`, `random(limit)`, `firstOrFail`, `firstOr`, `firstOrNew`, `explain`, `pluckOne` | drivers/postgres/postgres-query-builder.md | ❌ Missing |
| Connection via `connectToDatabase({ driver: "postgres", ... })` | connect-to-database.md | ❌ Missing |
| Transactions + isolation levels on Postgres | drivers/postgres/* | ❌ Missing |
| PG pub/sub `NOTIFY` payloads | drivers/postgres/types.md | ❌ Missing |
| SQL support classes: `SqlDialectContract`, `SqlQueryResult`, `SqlJoinType`, `SqlJoinClause`, `SqlOrderClause`, `SqlGroupClause`, `SqlHavingClause`, `SqlWhereType`, `SqlWhereOperation`, `SqlSelectClause`, `SqlQueryConfig`, `SqlInsertOperation`, `SqlUpdateOperation`, `SqlDeleteOperation`, `SqlAggregateFunction` | drivers/sql/sql-types.md | ❌ Missing |
| `SqlDatabaseDirtyTracker` (nested-JSON-preserving diff) | sql-database-dirty-tracker.md | ❌ Missing |

### MongoDB driver internals
| Feature / Symbol | Map source | Status |
|---|---|---|
| `MongoDbDriver`, `MongoDBBlueprint`, `MongoIdGenerator`, `MongoMigrationDriver`, `MongoQueryBuilder`, `MongoQueryOperations`, `MongoQueryParser`, `MongoSyncAdapter` | drivers/mongodb/* | ⚠️ Partial (only legacy `Aggregate` + `Blueprint` surfaces described; `MongoQueryBuilder` API matches `QueryBuilderContract` and is new) |
| `PipelineStage`, `Operation`, `MongoDriverOptions`, `MongoQueryParserOptions` | drivers/mongodb/types.md | ❌ Missing |
| `isMongoDBDriverLoaded()` utility | drivers/mongodb/mongodb-driver.md | ❌ Missing |

### Validation integration (@warlock.js/seal)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `static schema: ObjectValidator` on Model | model.md:266 | ❌ Missing |
| `onValidating` / `onValidated` events | events/model-events.md | ❌ Missing |
| `DatabaseWriterValidationError` (custom error with structured validation result) | validation/database-writer-validation-error.md | ❌ Missing |
| `EmbedModelValidator` class, `v.embed(...)` / `v.embedMany(...)` seal factory methods | validation/validators/embed-validator.md, validation/plugins/embed-validator-plugin.md | ❌ Missing |
| `embedValidator` seal plugin (auto-registers on import) | validation/database-seal-plugins.md | ❌ Missing |
| `DatabaseSealPlugins` type | validation/database-seal-plugins.md | ❌ Missing |
| `EmbedOptions` `{ errorMessage?, embed? }` | validation/plugins/embed-validator-plugin.md | ❌ Missing |
| Mutators: `databaseModelMutator`, `databaseModelsMutator` | validation/mutators/embed-mutator.md | ❌ Missing |
| Rules: `databaseModelRule`, `databaseModelsRule` | validation/rules/database-model-rule.md | ❌ Missing |
| Transformer: `databaseModelTransformer` | validation/transformers/embed-model-transformer.md | ❌ Missing |
| `useModelTransformer(callback)` helper | utils/database-writer.utils.md | ❌ Missing |
| `StrictMode` `"strip"/"fail"/"allow"` unknown-field handling | types.md | ❌ Missing |

### Declarative model factory
| Feature / Symbol | Map source | Status |
|---|---|---|
| `defineModel({ table, schema, ... })` | utils/define-model.md | ❌ Missing |
| `DefineModelOptions`, `ModelType<T>` helper | utils/define-model.md | ❌ Missing |
| Model registry: `RegisterModel` decorator, `registerModelInRegistry`, `getModelFromRegistry`, `getAllModelsFromRegistry`, `cleanupModelsRegistery`, `removeModelFromRegistery`, `resolveModelClass` | model/register-model.md | ❌ Missing |

### Writer / dirty tracker
| Feature / Symbol | Map source | Status |
|---|---|---|
| `DatabaseWriter` pipeline (validation → events → sync → persist → reset dirty) | writer/database-writer.md | ❌ Missing |
| `WriterOptions`, `WriterResult`, `ModelTransformCallback` | contracts + utils | ❌ Missing |
| `DatabaseDirtyTracker` diffing behaviour, `mergeChanges`, `replaceCurrentData`, `unset`, `isDirty`, `hasChanges` | database-dirty-tracker.md, dirty-methods.md | ❌ Missing |
| `SqlDatabaseDirtyTracker` JSON-aware subclass | sql-database-dirty-tracker.md | ❌ Missing |

### Driver contracts (for people writing drivers)
| Feature / Symbol | Map source | Status |
|---|---|---|
| `DriverContract`, `DriverTransactionContract`, `TransactionContext`, `DriverEvent`, `DriverEventListener`, `CreateDatabaseOptions`, `DropDatabaseOptions`, `InsertResult`, `UpdateResult`, `UpdateOperations` | contracts/database-driver.contract.md | ❌ Missing |
| `IdGeneratorContract`, `GenerateIdOptions` | contracts/database-id-generator.contract.md | ❌ Missing |
| `DriverBlueprintContract`, `TableIndexInformation` | contracts/driver-blueprint.contract.md | ❌ Missing |
| `MigrationDriverContract`, `ColumnType`, `ColumnDefinition`, `IndexDefinition`, `ForeignKeyDefinition`, `MigrationDriverFactory` | contracts/migration-driver.contract.md | ❌ Missing |
| `RemoverContract`, `RemoverOptions`, `RemoverResult` | contracts/database-remover.contract.md | ❌ Missing |
| `RestorerContract`, `RestorerOptions`, `RestorerResult` | contracts/database-restorer.contract.md | ❌ Missing |
| `WriterContract`, `WriterOptions`, `WriterResult`, `BuildUpdateOperationsResult` | contracts/database-writer.contract.md | ❌ Missing |

### Utilities
| Feature / Symbol | Map source | Status |
|---|---|---|
| `isValidDateValue(value)`, `isoRegex` | utils/is-valid-date-value.md | ❌ Missing |

---

## Errors in Existing Docs

The following items in the existing docs describe methods, classes, or behaviours that **do not exist in the current source** (or exist under different names/signatures). Each needs correcting or removing.

### `getting-started/connecting-to-database.mdx`
- **`new Connection()` / `connection.connect(...)`** — no `Connection` class is exported. Multi-connection is done through `dataSourceRegistry` + `connectToDatabase({ name, isDefault, ... })` or creating `DataSource` instances directly.
- **`useDatabase` method** — no such method exists; switching active source is done via `DatabaseDataSourceContext` / named data sources.
- MongoDB-only options; no mention of `driver: "mongodb" | "postgres"` which is required in the current `ConnectionOptions`.
- **MongoDB 6.0.6** hard requirement is likely obsolete (driver adapts to user-provided client options).

### `getting-started/introduction.mdx` & `installation.mdx`
- Framed as "MongoDB experience" only — Cascade is now explicitly multi-driver (MongoDB, PostgreSQL). Install sections should mention that `mongodb` or `pg` become peer dependencies depending on driver.
- Refers to **Mongez Config** dependency — this is not required by current `@warlock.js/cascade`.

### `models/introduction.mdx` / `models/index.mdx` / `models/create-document.mdx`
- `public static collection = "users"` — collection remains for MongoDB, but the canonical property in the current source is `static table`. Both may resolve, but docs should prefer `table` or at least mention the alias.
- `const user = await User.create({...})` — correct; but docs never mention `createMany`, `findOrCreate`, `upsert`, `updateOrCreate`.

### `models/saving-models.mdx`
- **`category.set("name", "Sports")`** — correct.
- **`await category.save({ refresh: true })`** — no `refresh` option exists in `WriterOptions`.
- **`await category.save({}, { cast: false })`** — `save()` takes **one** argument (`WriterOptions`); there is no second "cast options" argument, and `cast: false` is not an option of the current save pipeline.
- **`await category.silentSaving()`** — no such method on `Model`. Events are disabled by passing `{ skipEvents: true }` or similar on the writer options; verify against `WriterOptions`.
- **`Category.update(1, { name: "Sports" })`** — `updateById(ModelClass, id, data)` exists; docs should clarify the signature and mention it returns the updated model (not a count).

### `models/fetching-documents.mdx`
- **`User.find(1)`** — correct; delegates to `findById`.
- **`User.findOrFail(1)`** — **no `findOrFail` static exists** on `Model` in the current map. `firstOrFail()` exists on `QueryBuilderContract`.
- **`User.list()` / `User.list({ isActive: true })`** — no `Model.list` static in the current source. The equivalent is `Model.all(filter)` or `Model.where(...).get()`.
- **`User.list({ withTrashed: true })`** — `withTrashed` is not part of `PaginationOptions`/where; soft-deleted filtering is handled via scope removal or explicit `deleted_at` where clauses.
- **`{ with: [Category] }`** passed to `list` — not supported; eager loading uses `Model.with(...relations)` returning a `QueryBuilderContract` that you then call `.get()` on.
- **`{ page, limit, sort }` inline in `list`** — actual API is `Model.paginate({ page, limit })` and `orderBy(...)`.

### `models/destroying-models.mdx`
- **`public softDelete = true`** — no `softDelete` boolean in the map. Soft delete is controlled by `static deleteStrategy: "trash" | "soft" | "permanent"` and `static deletedAtColumn`/`static trashTable`.
- **`Category.destroy(1)` / `Category.destroy({ name })`** — no static `destroy` in the current map. Instance method `destroy(options?)` exists; bulk deletion is `Model.delete(filter?)`/`deleteOne(filter?)`.
- **`category.isTrashed()`** — not in the map; likely replaced by checking the `deletedAtColumn` field directly.
- **`Category.restore({ isActive: false })`** — `restoreRecord(ModelClass, id, options?)` takes an **id**, not a filter. Bulk is `restoreAllRecords(ModelClass, options?)` (i.e. `Model.restoreAll`).
- **`category.forceDelete()` / `Category.forceDelete(1)`** — not in the map. Force delete is done by passing `{ strategy: "permanent" }` or `{ force: true }` to `destroy(options)`.

### `models/events.mdx` & `events/model-events.mdx`
- Docs list only **8 events** (creating/created/updating/updated/saving/saved/deleting/deleted). Actual `ModelEventName` includes 16: add `validating`, `validated`, `fetching`, `hydrating`, `fetched`, `restoring`, `restored`.
- Docs say "return `false` from a before event to cancel" — verify against the emitter; `ModelEvents.emit` in the map invokes listeners sequentially but does not clearly indicate short-circuit-on-false. Needs confirmation.
- Protected `onCreating`/`onCreated`/etc. "self events" (overriding in subclass) are described but not found in `Model` class map; likely historical and may no longer auto-fire.

### `models/casting-data.mdx`
- **`castModel(Category)`** is described as "still supported for backward compatibility" — verify this is still re-exported; the current validation path uses `EmbedModelValidator` + `v.embed(Category)` from seal, not `castModel`.
- `Casts` type and string cast names are not listed as exports in the current map; may have moved/renamed.

### `models/aggregate.mdx` & `aggregate/*` (entire directory)
- The `Aggregate` class, `new Aggregate("users")`, `aggregate.where().get()`, `groupBy*`, `groupByYearMonth`, `groupByDate`, `unwind`, `lookup` etc. are **legacy APIs from pre-rewrite Cascade**. The current codebase exposes `QueryBuilder` via `Model.query()` / `Model.aggregate()` with `QueryBuilderContract` methods. Most `$agg` helpers (gt/lte/like/concat/year/month/etc.) have been moved to driver-agnostic `where*`/`select*` builder methods; `$agg` now exposes only `count/sum/avg/min/max/distinct/floor/first/last`.
- `wherePipeline`, `parsePipelines`, `limitPipeline`, etc. referenced in `aggregate/lookup.mdx` are **not exported** according to the map.
- `Model.joinable()`, `static joinings = { ... }`, `.joining(name)`, `countJoining` referenced in `relationships/joins.mdx` are **not present in the map**. Joining is now done via `QueryBuilder.join(table, localField, foreignField)` / `QueryBuilder.joinWith(relation)` + the `relations` static.
- `Aggregate.events()` with `onFetching`/`onUpdating`/`onDeleting` — `Aggregate` class not in map; events are now on `QueryBuilder` via `onFetching`/`onHydrating`/`onFetched` lifecycle callbacks.

### `queries/*` (entire directory)
- The `query` singleton (`import { query } from "@warlock.js/cascade"`) and its methods `query.list`, `query.first`, `query.last`, `query.latest`, `query.distinct`, `query.count`, `query.explain`, `query.aggregate`, `query.create`, `query.createMany`, `query.update`, `query.updateMany`, `query.replace`, `query.upsert`, `query.delete`, `query.deleteOne`, plus the `query.onCreating/...` event subscribers are **not in the current map**. The collection-less equivalent is to instantiate a `QueryBuilder` / `MongoQueryBuilder` / `PostgresQueryBuilder` against a data source, or to call `dataSourceRegistry.get().driver.query(table)`.

### `indexing/blueprint.mdx` & `model-blueprint.mdx`
- `new Blueprint("users")`, `usersBlueprint.index`, `unique`, `textIndex`, `geoIndex`, `dropIndex`, `listIndexes`, `truncate`, `drop`, `stats`, `size`, `totalSize`, `averageDocumentSize`, `count` — the current driver-blueprint maps (`MongoDBBlueprint`, `PostgresBlueprint`) implement `DriverBlueprintContract`; this legacy `Blueprint` class (and the `blueprint("users")` helper) does not appear in the exports.
- `Model.blueprint()` static does not appear on `Model` in the map; index creation now flows through the migration system (`Migration.for(Model).index(...)`) or model-level `static indexes` declarations consumed by the migration driver.

### `advanced/auto-increment.mdx` & `advanced/master-mind.mdx`
- `public autoIncrement = true` and `public autoIncrement = { start: 1000 }` — the Model class uses separate static properties: `autoGenerateId`, `initialId`, `randomInitialId`, `incrementIdBy`, `randomIncrement`. No single `autoIncrement` field exists.
- `masterMind.getLastId/setLastId/generateNextId/renameCollection/updateAllLastId/getNextId` / `MasterMind` class — **not exported** in the current map. Sequential ID generation is implemented via `IdGeneratorContract`/`MongoIdGenerator`/`GenerateIdOptions`; `generateModelNextId` is used internally.

### `relationships/syncing-models.mdx`
- `import { ModelSync } from "@warlock.js/cascade"` — `ModelSync` type is not listed as an export; the facade is `modelSync` (lowercase singleton) and the per-operation class is `ModelSyncOperation`.
- `public syncWith: ModelSync[]` static array pattern — **not in the map**. The new API is `modelSync.sync(SourceModel, TargetModel, field)` (or `Model.sync(TargetModel, field)` / `Model.syncMany(TargetModel, field)`), typically registered inside a `modelSync.register(cb)` HMR scope.
- `Post.sync("category")` / `Post.syncMany("comments")` — `static sync(TargetModel, targetField)` and `static syncMany(TargetModel, targetField)` exist on `Model`, but the **first argument is the target model class**, not a string field name. Docs pass just `("category")` which is the field name in the old API.
- `ignoreOnDelete()` — **does not exist** in `ModelSyncOperationContract` per the map. Options are `unsetOnDelete()` and `removeOnDelete()` (default is `unsetOnDelete`).
- `updateWhenChange([...fields])` → current name is `watchFields([...fields])`.
- `.where(query => { ... })` — not listed on `ModelSyncOperationContract`; filtering is achieved via `identifyBy`, `watchFields`, and `maxDepth`.
- Missing: `embed("embedData"|"embedParent"|"embedMinimal")`, `identifyBy(field)`, `maxDepth(n)`, `unsubscribe()`, `$cleanup()`, `getConfig()`.

### `relationships/embedded-documents.mdx`
- `post.associate("comments", comment)`, `reassociate`, `disassociate` — **not in the model map**. Pivot/array management now uses `PivotOperations` (`attach`/`detach`/`sync`/`toggle`) for many-to-many and the `embedData` getter + writer pipeline for embedded docs.
- `author.embeddedData` — should be renamed to `embedData` (current getter name).
- `public embedded = [...]` array — current static property is `static embed: string[]`.

### `relationships/joins.mdx`
- Entire page is built around `Model.joinable()` + `static joinings`. This API is **not in the current map**. Replace with `Model.with(...relations)` + `static relations = { posts: hasMany(Post, { foreignKey }) }` pattern.

### `events/query-events.mdx` & `events/aggregate-events.mdx`
- Both depend on the legacy `query` singleton and `Aggregate` class events. Neither surface appears in the current map. Replace with `QueryBuilder.onFetching/onHydrating/onFetched` and `ModelEvents` lifecycle hooks.

### `advanced/todo.mdx`
- Placeholder listing "missing aggregate methods"; now superseded by this gap report.

---

## Action Plan

### New Pages to Write

Organized by new/expanded sections. Each bullet proposes a target path and the scope it should cover.

**Getting Started & connections**
- `docs/cascade/getting-started/drivers.mdx` — Supported drivers (`mongodb`, `postgres`, reserved `mysql`); peer-dep install matrix; `driver` option in `connectToDatabase`.
- `docs/cascade/getting-started/data-sources.mdx` — `DataSource`, `DataSourceOptions`, `dataSourceRegistry`, named sources, `isDefault`, registry events, `MissingDataSourceError`.
- `docs/cascade/getting-started/transactions.mdx` — Top-level `transaction(fn, options?)`, `TransactionContext`, `DriverTransactionContract`, `DatabaseTransactionContext`, Postgres isolation levels.
- `docs/cascade/getting-started/multi-database.mdx` — Using multiple data sources simultaneously, per-model `static dataSource`, context-scoped switching via `DatabaseDataSourceContext`.

**Models — full rewrite/expansion**
- `docs/cascade/models/configuration.mdx` — Full enumeration of Model static properties (`table`, `primaryKey`, `dataSource`, `schema`, `strictMode`, `createdAtColumn`, `updatedAtColumn`, `deleteStrategy`, `deletedAtColumn`, `trashTable`, `embed`, `resource`, `toJsonColumns`, `builder`).
- `docs/cascade/models/ids.mdx` — `autoGenerateId`, `initialId`, `randomInitialId`, `incrementIdBy`, `randomIncrement`, `UuidStrategy` (v4/v7), `get uuid`, `generateNextId()`, `IdGeneratorContract`, `GenerateIdOptions`. Replaces current `auto-increment.mdx` + `master-mind.mdx`.
- `docs/cascade/models/strict-mode.mdx` — `StrictMode` `"strip" | "fail" | "allow"` and how unknown fields are handled during save.
- `docs/cascade/models/dirty-tracking.mdx` — `dirtyTracker`, `hasChanges`, `isDirty`, `getDirtyColumns`, `getDirtyColumnsWithValues`, `getRemovedColumns`, `replaceData`; `SqlDatabaseDirtyTracker` note.
- `docs/cascade/models/field-accessors.mdx` — `get`/`set`/`has`/`only`/`merge`/`unset`/`increment`/`decrement`, typed accessors `string()`/`number()`/`boolean()`, `MISSING_VALUE` sentinel.
- `docs/cascade/models/atomic-updates.mdx` — Instance `atomicUpdate`/`atomicIncrement`/`atomicDecrement`; static `increase`/`decrease`/`atomic`/`updateById`/`findAndUpdate`/`findOneAndUpdate`/`findAndReplace`; `UpdateOperations` shape.
- `docs/cascade/models/hydration-serialization.mdx` — `hydrate`, `fromSnapshot`, `toSnapshot`, `serialize`, `toJSON`, `clone`, `deepFreeze`, `replaceData`, `ModelSnapshot`.
- `docs/cascade/models/define-model.mdx` — `defineModel({ table, schema, … })` declarative factory; `DefineModelOptions`, `ModelType<T>`, `RegisterModel` decorator, global model registry helpers.
- `docs/cascade/models/resources.mdx` — `static resource`, `resourceColumns`, `toJsonColumns`, `toJSON` serialization contract.
- `docs/cascade/models/soft-delete.mdx` — Full soft delete / trash system: `DeleteStrategy`, `trashTable`, `deletedAtColumn`, `destroy({ strategy: ... })`, `restore(id)`, `restoreAll()`, `DatabaseRemover`, `DatabaseRestorer`, restore conflict modes.

**Query Builder (new section — replaces `queries/`)**
- `docs/cascade/query-builder/introduction.mdx` — `QueryBuilderContract`, driver-agnostic design, `Model.query()` vs `Model.newQueryBuilder()`.
- `docs/cascade/query-builder/where.mdx` — Exhaustive `where*` reference from `QueryBuilderContract`.
- `docs/cascade/query-builder/select-project.mdx` — `select`, `selectRaw`, `selectSub`, `selectAggregate`, `selectCase`, `selectWhen`, `selectJson`, `selectConcat`, `selectCoalesce`, `selectWindow`, `selectExists`, `selectCount`, `clearSelect`, `addSelect`.
- `docs/cascade/query-builder/joins.mdx` — `join`, `leftJoin`, `rightJoin`, `innerJoin`, `fullJoin`, `crossJoin`, `joinRaw`, `joinWith(relation)`.
- `docs/cascade/query-builder/ordering-limits.mdx` — `orderBy`, `orderByDesc`, `orderByRaw`, `orderByRandom`, `latest`, `oldest`, `limit`, `skip`, `offset`, `take`.
- `docs/cascade/query-builder/grouping-having.mdx` — `groupBy`, `groupByRaw`, `having`, `havingRaw`, `GroupByInput`, `HavingInput`.
- `docs/cascade/query-builder/aggregates.mdx` — `count`, `sum`, `avg`, `min`, `max`, `distinct`, `countDistinct`, `pluck`, `value`, `exists`, `notExists`, `$agg` namespace, `AggregateExpression`, `isAggregateExpression`.
- `docs/cascade/query-builder/execution.mdx` — `get`, `first`, `firstOrFail`, `last`, `chunk`, `paginate`, `cursorPaginate`, `PaginationOptions`, `PaginationResult`, `CursorPaginationOptions`, `CursorPaginationResult`, `ChunkCallback`.
- `docs/cascade/query-builder/utilities.mdx` — `tap`, `when`, `clone`, `raw`, `extend`, `parse`, `pretty`, `explain`.
- `docs/cascade/query-builder/lifecycle.mdx` — Builder `onFetching`, `onHydrating`, `onFetched`, `hydrate` callback; tie-in with model fetched events.

**Scopes**
- `docs/cascade/scopes/global-scopes.mdx` — `addGlobalScope(name, cb, { timing })`, `ScopeTiming`, `GlobalScopeDefinition`, `withoutGlobalScope`, `withoutGlobalScopes`, `GlobalScopeOptions`.
- `docs/cascade/scopes/local-scopes.mdx` — `addScope`/`removeScope` (or `addLocalModelScope`/`removeLocalModelScope`), calling `query.scope(name, ...args)`, `LocalScopeCallback`.

**Relations (rewrite)**
- `docs/cascade/relationships/defining-relations.mdx` — `static relations = { posts: hasMany(Post), ... }`, `hasMany`/`hasOne`/`belongsTo`/`belongsToMany`, `RelationDefinition`, `HasManyOptions`, `HasOneOptions`, `BelongsToOptions`, `BelongsToManyOptions`.
- `docs/cascade/relationships/eager-loading.mdx` — `Model.with(relation | [relations] | { relation: callback })`, `withCount`, `has`, `whereHas`, `doesntHave`, `whereDoesntHave`, `RelationConstraints`, `LoadedRelationResult`, `RelationLoader`.
- `docs/cascade/relationships/pivot.mdx` — `belongsToMany`, `PivotOperations.attach/detach/sync/toggle(ids, pivotData?)`, `createPivotOperations`, `PivotData`, `PivotIds`.
- `docs/cascade/relationships/join-based-eager.mdx` — `joinWith(relation | callback)` vs `with` separate-query mode.
- Rewrite `docs/cascade/relationships/embedded-documents.mdx` around `static embed`, `get embedData`, writer-based embed propagation (instead of associate/reassociate/disassociate).
- Rewrite `docs/cascade/relationships/syncing-models.mdx` around `modelSync` singleton, `Model.sync(Target, field)`, `Model.syncMany(Target, field)`, `ModelSyncOperation` fluent API (`embed`/`identifyBy`/`maxDepth`/`watchFields`/`unsetOnDelete`/`removeOnDelete`), `modelSync.register(cb)` HMR scope, `SyncContext`, `SyncResult`, `SyncManager`, sync events.

**Validation**
- `docs/cascade/validation/schema.mdx` — `static schema: ObjectValidator`, integrating with `@warlock.js/seal`, validating on save, `DatabaseWriterValidationError`, `onValidating`/`onValidated` events.
- `docs/cascade/validation/embed-validator.mdx` — `v.embed(Model)` / `v.embedMany(Model)`, `EmbedModelValidator`, `EmbedOptions` (`errorMessage`, `embed`), mutators/rules/transformers chain.
- `docs/cascade/validation/strict-mode.mdx` — `StrictMode` handling during validate.
- `docs/cascade/validation/custom-transformers.mdx` — `useModelTransformer(callback)`, `ModelTransformCallback`.

**Migrations (new section — currently empty folder)**
- `docs/cascade/migrations/introduction.mdx` — Overview of migrations, phase ordering, `SQLGrammar`, `TaggedSQL`, `SQLStatementType`.
- `docs/cascade/migrations/writing-migrations.mdx` — Extending `Migration`, `up()`/`down()`, `Migration.for(Model)`, migration naming, `createdAt`, `order`.
- `docs/cascade/migrations/table-operations.mdx` — `createTable`, `dropTable`, `renameTable`, `hasTable`, etc. (pull from `MigrationContract`).
- `docs/cascade/migrations/columns.mdx` — `ColumnBuilder` fluent API (`nullable`, `default`, `defaultString`, `useCurrent`, `useCurrentOnUpdate`, `primary`, `autoIncrement`, `unsigned`, `unique`, `index`, `vectorIndex`, `comment`, `check`, `after`, `first`, `change`/`modify`, `generatedAs`/`stored`/`virtual`).
- `docs/cascade/migrations/column-helpers.mdx` — All standalone column helper functions (`string`, `integer`, `uuid`, `vector(dim)`, `enumCol`, `arrayText`, etc.) and `DetachedColumnBuilder`.
- `docs/cascade/migrations/foreign-keys.mdx` — `ColumnBuilder.references/on/onDelete/onUpdate/cascadeAll`, `ForeignKeyBuilder`, `ForeignKeyDefinition`.
- `docs/cascade/migrations/indexes.mdx` — `IndexDefinition`, `FullTextIndexOptions`, `GeoIndexOptions`, `VectorIndexOptions`; on-column vs on-table declarations.
- `docs/cascade/migrations/running.mdx` — `migrationRunner.register`, `registerMany`, `run`, `rollback`, `runAll`, `rollbackLast`, `rollbackBatches`, `rollbackAll`, `fresh`, `status`, `exportSQL`, `getExecutedMigrations`; `MigrationRunnerOptions`, `RunMigrationsOptions`, `RollbackOptions`.
- `docs/cascade/migrations/defaults.mdx` — `MigrationDefaults`, `UuidStrategy`, primary-key type, shared defaults.

**PostgreSQL driver (new section)**
- `docs/cascade/drivers/postgres/introduction.mdx` — Install `pg`, `connectToDatabase({ driver: "postgres", ... })`, pool config.
- `docs/cascade/drivers/postgres/connection.mdx` — `PostgresConnectionConfig`, `PostgresPoolConfig`, environment.
- `docs/cascade/drivers/postgres/transactions.mdx` — `PostgresTransactionOptions`, `PostgresIsolationLevel`, savepoints.
- `docs/cascade/drivers/postgres/features.mdx` — JSONB, arrays, `whereJson*`, `whereArrayContains`, pgvector `similarTo`, `NOTIFY`/`PostgresNotification`, `PostgresCopyOptions` bulk COPY.
- `docs/cascade/drivers/postgres/query-builder.mdx` — PG-specific additions: `random`, `firstOr`, `firstOrNew`, `pluckOne`, `explain` plan shape, pretty SQL output.
- `docs/cascade/drivers/postgres/migrations.mdx` — `PostgresMigrationDriver`, PG-specific column types, identity columns, SERIAL, enum types.

**MongoDB driver (revised section)**
- `docs/cascade/drivers/mongodb/introduction.mdx` — Install `mongodb`, connection options, `MongoDriverOptions`.
- `docs/cascade/drivers/mongodb/query-builder.mdx` — How `QueryBuilderContract` operations become aggregation pipelines; MongoDB-specific methods (`$lookup` via `joinWith`, `similarTo` Atlas vector search).
- `docs/cascade/drivers/mongodb/id-generator.mdx` — `MongoIdGenerator` auto-increment counters; replaces legacy MasterMind.
- `docs/cascade/drivers/mongodb/blueprint.mdx` — `MongoDBBlueprint` (replaces old `Blueprint` class) via `DriverBlueprintContract`.
- `docs/cascade/drivers/mongodb/sync-adapter.mdx` — `MongoSyncAdapter`.

**Events (expanded)**
- Expand `docs/cascade/events/model-events.mdx` to cover all 16 events, `ModelEvents` class, instance-level `on/once/off/emitEvent`, `globalModelEvents`, `$cleanup`, `ModelEventListener`, `OnDeletedEventContext`, sync event helpers (`getModelUpdatedEvent`, `getModelDeletedEvent`, `getModelEvent`, `MODEL_EVENT_PREFIX`, `ModelSyncEventType`).

**Contracts / advanced**
- `docs/cascade/contracts/driver-contract.mdx` — `DriverContract`, `DriverEvent`, `DriverTransactionContract`, `TransactionContext`, `InsertResult`, `UpdateResult`, `UpdateOperations`, `CreateDatabaseOptions`, `DropDatabaseOptions`.
- `docs/cascade/contracts/writer-remover-restorer.mdx` — `WriterContract`/`WriterOptions`/`WriterResult`, `RemoverContract`/`RemoverOptions`/`RemoverResult`, `RestorerContract`/`RestorerOptions`/`RestorerResult`.
- `docs/cascade/contracts/blueprint-migration.mdx` — `DriverBlueprintContract`, `MigrationDriverContract`, `MigrationDriverFactory`, `TableIndexInformation`.
- `docs/cascade/contracts/query-builder-contract.mdx` — Reference of `QueryBuilderContract` (mostly tables) for people writing adapters.
- `docs/cascade/contracts/sync-adapter.mdx` — `SyncAdapterContract`, `SyncInstruction`.
- `docs/cascade/advanced/writing-a-driver.mdx` — How to implement a new driver (touches on SQL dialect contract, serializer, parser).

**Utilities**
- `docs/cascade/utilities/date-helpers.mdx` — `isValidDateValue`, `isoRegex`.
- `docs/cascade/utilities/connection-helpers.mdx` — `onceConnected`, `onceDisconnected`, `getDatabaseDriver`, `transaction`.

### Existing Pages to Update

- `docs/cascade/getting-started/introduction.mdx` — Rewrite around multi-driver positioning. Remove "MongoDB experience" framing. Update feature list to call out PostgreSQL, sync system, seal validation, migrations, scopes, relations.
- `docs/cascade/getting-started/installation.mdx` — Remove Mongez Config requirement. Add driver peer-dep matrix (`mongodb` / `pg`). Replace MongoDB-only version note with driver-specific notes.
- `docs/cascade/getting-started/connecting-to-database.mdx` — Replace `Connection` class / `useDatabase` / "Singleton pattern" narrative with `connectToDatabase({ driver, name?, isDefault? })` + `DataSource` + `dataSourceRegistry`. Add PostgreSQL connection example. Update `onceConnected` usage against the new registry event model. Remove non-existent options.
- `docs/cascade/getting-started/roadmap.mdx` — Replace MongoDB-centric terminology ("Collection"→"Table/Collection"). Add roadmap entries for Data Source, Scopes, Relations, Migrations, Sync, Validation, Postgres.
- `docs/cascade/models/introduction.mdx` / `models/index.mdx` — Use `static table` as primary property; keep `collection` as a MongoDB alias note. Fix `castModel` references.
- `docs/cascade/models/create-document.mdx` — Add `createMany`, `findOrCreate`, `upsert`, `updateOrCreate`. Fix "auto-generates `_id`" claim to be MongoDB-specific.
- `docs/cascade/models/saving-models.mdx` — Remove `refresh: true`, the `{ cast: false }` second arg, and `silentSaving()` (unless verified). Replace with real `WriterOptions`. Clarify `Model.update(id, data)` (maps to `updateById`) and return value.
- `docs/cascade/models/fetching-documents.mdx` — Full rewrite: `Model.find`, `Model.first`, `Model.all(filter)`, `Model.where(...).get()`, `Model.paginate({ page, limit })`, `Model.with(relation, cb?)`. Remove `findOrFail` (or clarify it's builder-only via `firstOrFail`). Remove `list`, remove `withTrashed` (replace with scope/where examples). Show pagination/sorting via builder, not inline in `list`.
- `docs/cascade/models/destroying-models.mdx` — Replace `softDelete = true` with `static deleteStrategy: "trash" | "soft" | "permanent"`. Remove `isTrashed`, `forceDelete`, static `destroy(filter)`. Correct `restore` signatures (single id vs `restoreAll`). Add `trashTable`/`deletedAtColumn` config, restoration events, conflict modes.
- `docs/cascade/models/events.mdx` — Update event list to include `validating`, `validated`, `fetching`, `hydrating`, `fetched`, `restoring`, `restored`. Add instance-level event API (`on/once/off/emitEvent`). Add `globalEvents`. Verify "return false to cancel" behaviour or remove.
- `docs/cascade/models/casting-data.mdx` — Verify `Casts` type still exists and how `location`/`localized` map to the new pipeline. Replace `castModel` deprecation note with clear guidance: for validation, use `v.embed(Model)` from seal; for field reading/writing, the `static embed` list plus `embedData` getter applies.
- `docs/cascade/models/casting-custom-fields.mdx` — Verify function-cast signature still supports "direction" param in current writer pipeline.
- `docs/cascade/models/default-values.mdx` — Verify `protected defaults = {}` property still exists in current Model; if it was renamed or moved to a writer-side defaults config, update accordingly.
- `docs/cascade/models/embedded-documents.mdx` — Replace `embeddedData` with `embedData`, `embedded` array with `static embed`. Add `embedAllExcept*` property verification (may have changed names).
- `docs/cascade/models/aggregate.mdx` — Retitle as "Query & Aggregation". Replace legacy Aggregate class with `Model.query()` → `QueryBuilderContract` and `$agg` expression builders.
- `docs/cascade/models/indexing.mdx` — Replace `public static indexes = [...]` pattern with migration-based `Migration.for(Model).index(...)` pattern, cross-link to migrations section.
- `docs/cascade/queries/*` — Rework entire `queries/` section (or redirect to new `query-builder/` section). Likely delete `introduction.mdx`, `listing-documents.mdx`, `saving-documents.mdx`, `deleting-documents.mdx` in favour of the new `query-builder/` pages since the `query` singleton no longer exists.
- `docs/cascade/aggregate/*` — Delete or rewrite: the `Aggregate` class, `$agg` extended helpers, `parsePipelines`, `wherePipeline`, etc. are all gone. A minimal surviving page could document the new `$agg` namespace (count/sum/avg/min/max/distinct/floor/first/last) and the `select*`/`where*` methods that replace the old helpers.
- `docs/cascade/events/query-events.mdx` / `events/aggregate-events.mdx` — Replace with `QueryBuilder` lifecycle (`onFetching`/`onHydrating`/`onFetched`) and model-level event equivalents; delete aggregate-specific events.
- `docs/cascade/indexing/blueprint.mdx` / `indexing/model-blueprint.mdx` — Remove the `Blueprint` class docs; replace with `DriverBlueprintContract` plus migration-based index creation docs. Keep a short "inspect existing indexes" page via `MongoDBBlueprint` / `PostgresBlueprint` APIs.
- `docs/cascade/relationships/embedded-documents.mdx` — See rewrite note above (`embedData`, `static embed`, drop associate/reassociate/disassociate).
- `docs/cascade/relationships/joins.mdx` — Full rewrite: remove `joinable`/`joinings`/`joining`/`countJoining`; replace with `joinWith`/`with`/`withCount` and the `static relations` helpers.
- `docs/cascade/relationships/syncing-models.mdx` — Full rewrite to match `modelSync` facade + `ModelSyncOperation` fluent API (see errors section above).
- `docs/cascade/advanced/auto-increment.mdx` — Rewrite as `ids.mdx` in models section. Fix property names (`autoGenerateId`/`initialId`/`incrementIdBy`/`randomIncrement`/`randomInitialId`). Add UUID strategy (`uuid()` accessor, `UuidStrategy`).
- `docs/cascade/advanced/master-mind.mdx` — Remove or replace entirely; no `masterMind`/`MasterMind` export in current code. Reference `IdGeneratorContract`/`MongoIdGenerator` for MongoDB sequential ID mechanics.
- `docs/cascade/advanced/introduction.mdx` — Refresh index: drop master-mind, add "Writing a Driver", "Sync Internals", "Validation Plugin Authoring".
- `docs/cascade/advanced/todo.mdx` — Delete (superseded by this report).
