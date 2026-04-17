# Sync System

The sync system provides event-based synchronization of embedded data across models with depth limiting, cycle detection, and batch optimization.

## Overview

When working with denormalized data (e.g., embedding user info in posts), the sync system automatically updates embedded copies when the source changes.

### Key Features

- **Event-based architecture**: Uses `@mongez/events` for decoupled sync registration
- **HMR support**: Cleanup function for Hot Module Replacement
- **Multi-level sync chains**: Category → Product → Module
- **Depth limiting**: Prevent infinite sync loops (default: 3 levels)
- **Cycle detection**: Prevent circular references
- **Batch optimization**: Group updates by depth and table
- **Array updates**: Support for embedded arrays with positional operators

## Quick Start

```typescript
// src/app/blog/events/sync.ts
import { modelSync } from "@warlock.js/cascade";
import { Category, Product, Tag, Post } from "../models";

export const cleanup = modelSync.register(() => {
  // When Category updates → update Product.category
  Category.sync(Product, "category")
    .embed("embedMinimal")
    .watchFields(["name", "slug"])
    .unsetOnDelete();

  // When Tag updates → update Post.tags[i]
  Tag.syncMany(Post, "tags").identifyBy("id");
});
```

## API

### `modelSync.register(callback)`

Registers sync operations and returns a cleanup function for HMR.

```typescript
export const cleanup = modelSync.register(() => {
  // Register syncs here
});
```

### `Model.sync(TargetModel, targetField)`

Create a sync for a single embedded document.

```typescript
Category.sync(Product, "category");
```

### `Model.syncMany(TargetModel, targetField)`

Create a sync for an array of embedded documents.

```typescript
Tag.syncMany(Post, "tags").identifyBy("id");
```

## Configuration Options

### `.embed(methodName)`

Specify the method to call for getting embedded data.

```typescript
Category.sync(Product, "category").embed("embedMinimal");
```

Standard embed methods:

- `"embedData"`: Standard embedded document (default)
- `"embedMinimal"`: Minimal fields for performance

### `.identifyBy(fieldName)`

Set the identifier field for array matching (required for `syncMany`).

```typescript
Tag.syncMany(Post, "tags").identifyBy("id");
```

### `.watchFields(fields)`

Only sync when specific fields change.

```typescript
Category.sync(Product, "category").watchFields(["name", "description"]);
```

### `.maxDepth(depth)`

Set the maximum sync depth (default: 3).

```typescript
Category.sync(Product, "category").maxDepth(2);
```

### `.unsetOnDelete()`

Unset the target field when the source is deleted.

```typescript
Category.sync(Product, "category").unsetOnDelete();
```

### `.removeOnDelete()`

Delete target documents when source is deleted.

```typescript
User.sync(Profile, "user").removeOnDelete();
```

## Multi-Level Sync

### Example: Category → Product → Module

```typescript
// events/sync.ts
export const cleanup = modelSync.register(() => {
  Category.sync(Product, "category").maxDepth(2);
  Product.syncMany(Module, "products").identifyBy("id");
});
```

When a category is updated:

1. **Depth 1**: Update `Product.category`
2. **Depth 2**: Update `Module.products[i].category`
3. **Depth 3**: Blocked by default (safety measure)

## Custom Embed Methods

```typescript
class User extends Model {
  public embedMinimal() {
    return {
      id: this.get("id"),
      name: this.get("name"),
    };
  }

  public embedData() {
    return {
      id: this.get("id"),
      name: this.get("name"),
      email: this.get("email"),
      avatar: this.get("avatar"),
    };
  }
}

// In events/sync.ts
User.sync(Comment, "author").embed("embedMinimal");
```

## Event Flow

```
Model.save()
    ↓
DatabaseWriter emits: model.{ModelName}.updated
    ↓
ModelSyncOperation (subscribed via @mongez/events)
    ↓
SyncManager.syncUpdateWithConfig()
    ↓
Database Driver updateMany()
```

## Error Handling

The sync system tries batch execution first, then falls back to individual operations:

```typescript
type SyncResult = {
  success: boolean;
  attempted: number;
  succeeded: number;
  failed: number;
  errors: Array<{ instruction: SyncInstruction; error: Error }>;
  depthReached: number;
  contexts: SyncContext[];
};
```

## Best Practices

1. **Set appropriate depth limits**: Avoid unnecessary deep syncing
2. **Use `watchFields()`**: Sync only relevant fields
3. **Implement custom embed methods**: Control what data is synced
4. **Always export cleanup**: Required for HMR support
5. **Group related syncs**: Put related syncs in the same register() call

## Limitations

- Maximum sync depth: 3 levels (configurable via `.maxDepth()`)
- Array updates require `.identifyBy()` to specify identifier field
- Circular references are blocked by default
- Sync operations are not atomic across multiple collections (use transactions)
