# Model
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> This folder defines the abstract `Model` base class, its supporting types, and the global model registry that together form the core ORM layer of Cascade.

## What lives here
- `model.ts` — Abstract `Model` base class with data access, dirty tracking, query helpers, lifecycle events, relations, and serialization
- `model.types.ts` — Type definitions for scoping, schema shape, and the `ChildModel` static-side interface
- `register-model.ts` — Global model registry and `@RegisterModel` decorator for string-based model resolution

## Public API
- `Model<TSchema>` — Abstract base; extend to define a database model
- `ChildModel<TModel>` — Static-side type for this-typed factory methods
- `ModelSchema` — `Record<string, any>` alias for model data shape
- `ScopeTiming` — `"before" | "after"` union for global scope timing
- `GlobalScopeDefinition` — `{ callback, timing }` stored scope definition
- `GlobalScopeOptions` — `{ timing?: ScopeTiming }` for `addGlobalScope`
- `LocalScopeCallback` — `(query, ...args) => void` reusable scope function
- `RegisterModel(options?)` — Decorator that registers model in global registry
- `registerModelInRegistry(name, model)` — Manual registry insertion
- `getModelFromRegistry(name)` — Retrieve model class by string name
- `getAllModelsFromRegistry()` — Returns `Map<string, ChildModel<Model>>`
- `cleanupModelsRegistery()` — Clears entire registry (testing/teardown)
- `removeModelFromRegistery(name)` — Remove a single entry from registry
- `resolveModelClass(model)` — Resolves string or class to `ChildModel`

## How it fits together
`Model` depends on `DataSource` and `DriverContract` (from `../contracts`) to obtain a query builder and dirty tracker, and on `ModelEvents` (from `../events`) for lifecycle hooks. The bulk of method logic is delegated to pure functions in `./methods/*`, keeping the class itself as a thin orchestration layer. `register-model.ts` is a standalone module that `Model` consumes via `getModelFromRegistry`/`getAllModelsFromRegistry` to provide `Model.getModel()` and `Model.getAllModels()` without circular imports. `model.types.ts` only imports from `../contracts` and `./model`, and its types are re-exported directly from `model.ts` so consumers have a single import path.

## Working examples
```typescript
import { Model, RegisterModel } from "@warlock.js/cascade";
import type { ModelSchema } from "@warlock.js/cascade";

interface UserSchema extends ModelSchema {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

@RegisterModel()
class User extends Model<UserSchema> {
  public static table = "users";
}

// Create and save
const user = await User.create({ name: "Alice", email: "alice@example.com", isActive: true });

// Query with relations
const users = await User.with("posts").where("isActive", true).get();

// Dirty tracking
user.set("name", "Bob");
console.log(user.hasChanges());       // true
console.log(user.isDirty("name"));    // true
console.log(user.getDirtyColumns());  // ["name"]
await user.save();

// Global scope
User.addGlobalScope("active", (query) => query.where("isActive", true));

// Snapshot round-trip (cache)
const snapshot = user.toSnapshot();
const restored = User.fromSnapshot(snapshot);

// Registry lookup
const UserModel = User.getModel("User");
if (UserModel) {
  const found = await UserModel.find(1);
}

// Resolve model by string or class reference
import { resolveModelClass } from "@warlock.js/cascade";
const ModelClass = resolveModelClass("User");
```

## DO NOT
- Do NOT import `model.types.ts` directly — all its types are re-exported from `model.ts`, use that single entry point instead
- Do NOT mutate `Model.globalScopes` or `Model.localScopes` maps directly — use `addGlobalScope`/`removeGlobalScope`/`addScope`/`removeScope` to keep scope state consistent
- Do NOT call `replaceData()` in application code — it is an internal method intended only for use by the writer after validation, and bypasses dirty tracking semantics
- Do NOT call `cleanupModelsRegistery()` in production code — it clears all registered models and is intended only for test teardown
- Do NOT use `updateOrCreate()` in new code — it is deprecated in favor of `upsert()`, which is atomic and more efficient
