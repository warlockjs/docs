# Relations
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Defines, loads, and mutates all four ORM relationship types (hasOne, hasMany, belongsTo, belongsToMany) for Cascade models, preventing N+1 queries and providing pivot-table management.

## What lives here
- `types.ts` — all TypeScript types and interfaces for the relations system
- `helpers.ts` — fluent helper functions for declaring relationship definitions on model classes
- `relation-loader.ts` — batch-loads relations for model arrays, resolves dot-notation nesting
- `relation-hydrator.ts` — restores eager-loaded relations onto model instances from plain snapshots
- `pivot-operations.ts` — attach, detach, sync, and toggle mutations on belongsToMany pivot tables
- `index.ts` — barrel re-exporting every public symbol from this folder

## Public API
- `hasMany(model, options?): RelationDefinition` — builds a hasMany relation definition
- `hasOne(model, options?): RelationDefinition` — builds a hasOne relation definition
- `belongsTo(model, options?): RelationDefinition` — builds a belongsTo relation definition; accepts string shorthand
- `belongsToMany(model, options): RelationDefinition` — builds a belongsToMany definition; `options.pivot` required
- `RelationLoader<TModel>.load(relations, constraints?): Promise<void>` — batch-loads relations, mutates each model
- `RelationHydrator.hydrate(model, relationDefs, relationsSnapshot): void` — restores snapshot relations onto a model
- `PivotOperations.attach(ids, pivotData?): Promise<void>` — inserts pivot rows, skipping already-attached IDs
- `PivotOperations.detach(ids?): Promise<void>` — removes pivot rows; all rows if ids omitted
- `PivotOperations.sync(ids, pivotData?): Promise<void>` — detaches removed, attaches new to match target set
- `PivotOperations.toggle(ids, pivotData?): Promise<void>` — attaches unattached, detaches already-attached
- `createPivotOperations(model, relationName): PivotOperations` — factory resolving relation and returning instance
- `type RelationType` — `"hasOne" | "hasMany" | "belongsTo" | "belongsToMany"`
- `type RelationDefinition` — readonly structural description of one relation
- `type RelationDefinitions` — `Record<string, RelationDefinition>` for model static `relations` property
- `type HasManyOptions` — config options for `hasMany` helper
- `type HasOneOptions` — config options for `hasOne` helper
- `type BelongsToOptions` — config options for `belongsTo` helper
- `type BelongsToManyOptions` — config options for `belongsToMany` helper; `pivot` required
- `type RelationConstraintCallback` — `(query: QueryBuilderContract) => void`
- `type RelationConstraints` — `Record<string, boolean | RelationConstraintCallback>`
- `type LoadedRelationResult` — `Model | Model[] | null`
- `type LoadedRelationsMap` — `Map<string, LoadedRelationResult>`
- `type PivotData` — `Record<string, unknown>` for extra pivot row columns
- `type PivotIds` — `(number | string)[]` for pivot operation targets
- `type SerializedRelation` — `null | ModelSnapshot | ModelSnapshot[]`
- `type ModelSnapshot` — `{ data: Record<string, unknown>; relations: Record<string, SerializedRelation> }`

## How it fits together
`helpers.ts` produces `RelationDefinition` objects that are stored as a static `relations` map on each model class; all keys and types come from `types.ts`. At query time `RelationLoader` reads those definitions, issues batched database queries grouped by foreign key, and writes results into each model's `loadedRelations` Map — supporting dot-notation paths by recursing into nested `RelationLoader` instances. When a model is restored from a serialized cache snapshot, `RelationHydrator` walks the plain-object snapshot and re-hydrates the same `loadedRelations` Map without hitting the database. For belongsToMany relations, `PivotOperations` (or the `createPivotOperations` factory) wraps the pivot table with attach/detach/sync/toggle mutations that operate independently of the loading pipeline.

## Working examples
```typescript
import {
  hasMany,
  hasOne,
  belongsTo,
  belongsToMany,
  RelationLoader,
  RelationHydrator,
  PivotOperations,
  createPivotOperations,
  type RelationDefinitions,
  type RelationConstraints,
  type PivotData,
  type PivotIds,
  type ModelSnapshot,
} from "@warlock.js/cascade";

// --- Define relations on a model ---
class User extends Model {
  static relations: RelationDefinitions = {
    posts: hasMany("Post", { foreignKey: "userId" }),
    profile: hasOne("Profile"),
    organization: belongsTo("Organization", { foreignKey: "organizationId" }),
    roles: belongsToMany("Role", {
      pivot: "user_roles",
      localKey: "userId",
      foreignKey: "roleId",
    }),
  };
}

// --- Batch-load relations (no N+1) ---
const users = await User.query().list();
const loader = new RelationLoader(users, User);
const constraints: RelationConstraints = {
  posts: (query) => query.where("isPublished", true),
  "posts.comments": true,
};
await loader.load(["posts", "posts.comments", "profile", "roles"], constraints);

// Access loaded data
const firstUser = users[0];
console.log(firstUser.loadedRelations.get("posts")); // Post[]
console.log(firstUser.loadedRelations.get("profile")); // Profile | null

// --- Restore from snapshot (cache hydration) ---
const snapshot: ModelSnapshot = {
  data: { id: 1, name: "Alice" },
  relations: {
    profile: { data: { bio: "..." }, relations: {} },
  },
};
const user = new User();
RelationHydrator.hydrate(user, User.relations, snapshot.relations);

// --- Pivot operations ---
const pivotOps = createPivotOperations(user, "roles");

const ids: PivotIds = [1, 2, 3];
const extra: PivotData = { assignedAt: new Date() };
await pivotOps.attach(ids, extra);
await pivotOps.detach([2]);
await pivotOps.sync([1, 3, 4]);
await pivotOps.toggle([3, 5]);
```

## DO NOT
- Do NOT call `new PivotOperations(...)` on a relation that is not `belongsToMany` — the constructor throws an `Error` if the type or pivot configuration is missing.
- Do NOT reference model names in `RelationDefinition` that have not been registered with `@RegisterModel()` — `RelationLoader` and `RelationHydrator` resolve models from the registry at runtime and will throw if the name is absent.
- Do NOT mutate a `RelationDefinition` object after creation — all fields are `readonly`; create a new definition via the helper functions instead.
- Do NOT use `RelationHydrator.hydrate` as a substitute for `RelationLoader.load` on live data — the hydrator only restores from a pre-serialized `ModelSnapshot` and does not issue any database queries.
- Do NOT pass dot-notation paths like `"posts.comments"` to `PivotOperations` — nested loading is handled exclusively by `RelationLoader.load`.
