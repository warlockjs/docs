# TypeScript Import Patterns

This document defines the common import patterns used across the Warlock.js ecosystem for documentation consistency.

## @warlock.js/core

### HTTP & Routing

```ts
// Router and route handling
import { router } from "@warlock.js/core";

// Request and Response types
import { Request, Response } from "@warlock.js/core";
import { type Request, type Response } from "@warlock.js/core";

// Middleware
import { router, authMiddleware } from "@warlock.js/core";

// Request context
import { requestContext } from "@warlock.js/core";
```

### Configuration Types

```ts
// Auth configuration
import { AuthConfigurations, Guest } from "@warlock.js/core";

// HTTP configuration
import { HttpConfigurations } from "@warlock.js/core";
```

### Output Classes

```ts
// Output for response transformation
import { FinalOutput, Output, UploadOutput } from "@warlock.js/core";
```

### Repository System

```ts
import {
  FilterByOptions,
  RepositoryManager,
  RepositoryOptions,
} from "@warlock.js/core";

// RESTful controllers
import { Restful, RouteResource, UniqueRule } from "@warlock.js/core";
```

### Validation

```ts
// Rule types
import { UniqueRule, RouteResource } from "@warlock.js/core";
```

### Authentication

```ts
// JWT utilities
import { jwt } from "@warlock.js/core";

// Guest handling
import { router, Request, Response, guestLogin } from "@warlock.js/core";
import { Guest as BaseGuest } from "@warlock.js/core";
```

### Utilities

```ts
// Image processing
import { storagePath, Image } from "@warlock.js/core";

// Decorators
import { Sluggable, uploadable } from "@warlock.js/core";
import { Auth, uploadable } from "@warlock.js/core";
```

---

## @warlock.js/cascade

### Model Base

```ts
// Base model class
import { Model } from "@warlock.js/cascade";

// Model with casts
import { Model, Casts } from "@warlock.js/cascade";

// Model with casting utilities
import { Model, Casts, castModel } from "@warlock.js/cascade";
```

### Model Sync (Relationships)

```ts
import { Model, Casts, ModelSync } from "@warlock.js/cascade";
```

### Query System

```ts
import { query } from "@warlock.js/cascade";
```

### Aggregation

```ts
import { aggregate } from "@warlock.js/cascade";
```

### Connection

```ts
import { connection, database } from "@warlock.js/cascade";
```

---

## @warlock.js/cache

### Cache Manager

```ts
import { cache, CacheManager } from "@warlock.js/cache";
```

### Cache Drivers

```ts
import {
  CacheConfigurations,
  DatabaseCacheDriver,
  RedisCacheDriver,
  MemoryCacheDriver,
  FileCacheDriver,
  CACHE_FOR,
} from "@warlock.js/cache";
```

### Cache Constants

```ts
import { CACHE_FOR } from "@warlock.js/cache";
// CACHE_FOR.ONE_MINUTE, CACHE_FOR.ONE_HOUR, CACHE_FOR.ONE_DAY, etc.
```

---

## @warlock.js/seal (Validation)

### Validators

```ts
import { v } from "@warlock.js/seal";

// Specific validators
import { string, number, boolean, array, object } from "@warlock.js/seal";
```

---

## Import Conventions

### General Rules

1. **Use named imports** - Always prefer named imports over default imports
2. **Group imports by package** - Keep imports from the same package together
3. **Type imports** - Use `type` keyword when importing only types: `import { type Request } from "@warlock.js/core"`
4. **Destructure wisely** - Import only what you need, not entire modules

### Order

1. External packages (node_modules)
2. @warlock.js packages (core first, then cascade, then others)
3. Internal project imports (relative paths)
4. Type-only imports last

### Example File Structure

```ts
// External packages
import path from "path";

// Warlock packages
import { router, Request, Response } from "@warlock.js/core";
import { Model, Casts } from "@warlock.js/cascade";
import { cache } from "@warlock.js/cache";

// Project imports
import { User } from "../models/user";
import { userRepository } from "../repositories/users-repository";

// Type-only imports
import type { UserDocument } from "../types";
```

---

## Common Import Mistakes to Avoid

### Wrong

```ts
// Don't use barrel imports for everything
import * as core from "@warlock.js/core";

// Don't mix default and named unnecessarily
import core, { Request } from "@warlock.js/core";
```

### Correct

```ts
// Use specific named imports
import { Request, Response, router } from "@warlock.js/core";
```
