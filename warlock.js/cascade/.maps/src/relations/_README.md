# relations

Defines, loads, and mutates all four ORM relationship types (hasOne, hasMany, belongsTo, belongsToMany). The `helpers` module produces `RelationDefinition` objects that are stored on each model class. At query time `RelationLoader` issues batched database queries to prevent N+1 reads; `RelationHydrator` restores eager-loaded relations from plain snapshots without hitting the database. `PivotOperations` handles attach/detach/sync/toggle mutations on belongsToMany pivot tables.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [types.md](./types.md) — All TypeScript types and interfaces for the relations system
- [helpers.md](./helpers.md) — Fluent helper functions for declaring hasMany, hasOne, belongsTo, and belongsToMany definitions
- [index.md](./index.md) — Barrel re-exporting all public relation symbols
- [pivot-operations.md](./pivot-operations.md) — Attach, detach, sync, and toggle mutations on belongsToMany pivot tables
- [relation-hydrator.md](./relation-hydrator.md) — Static class restoring eager-loaded relations onto model instances from snapshots
- [relation-loader.md](./relation-loader.md) — Generic class batch-loading all relation types for arrays of model instances
