# drivers/mongodb

MongoDB implementation of all Cascade driver contracts. The `MongoDbDriver` is the entry point and lazily constructs the blueprint, ID generator, migration driver, and sync adapter on demand. Query building is handled by `MongoQueryBuilder`, which accumulates operations that `MongoQueryParser` compiles into MongoDB aggregation pipelines. The `MongoIdGenerator` provides atomic auto-increment integer IDs backed by a counters collection.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [types.md](./types.md) — PipelineStage, Operation, and MongoDriverOptions type definitions
- [mongodb-blueprint.md](./mongodb-blueprint.md) — MongoDB schema introspection: collection and index listing
- [mongodb-driver.md](./mongodb-driver.md) — Main MongoDB DriverContract implementation
- [mongodb-id-generator.md](./mongodb-id-generator.md) — Atomic auto-increment integer ID generator using a counters collection
- [mongodb-migration-driver.md](./mongodb-migration-driver.md) — MongoDB MigrationDriverContract implementation (collection/index DDL)
- [mongodb-query-builder.md](./mongodb-query-builder.md) — Fluent aggregation pipeline query builder for MongoDB
- [mongodb-query-operations.md](./mongodb-query-operations.md) — Internal helper class for appending pipeline stage operations
- [mongodb-query-parser.md](./mongodb-query-parser.md) — Translates abstract query operations into a MongoDB aggregation pipeline
- [mongodb-sync-adapter.md](./mongodb-sync-adapter.md) — Batch sync adapter executing SyncInstructions against MongoDB collections
