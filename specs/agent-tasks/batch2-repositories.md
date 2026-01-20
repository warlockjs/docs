# Agent Task: Repositories Section

## Assignment

**Section**: Repositories  
**Pages**: 6  
**Priority**: HIGH (Batch 2)  
**Status**: ⏳ Not Started

---

## Pages to Write

| #   | File                      | Status |
| --- | ------------------------- | ------ |
| 1   | `introduction.mdx`        | ⬜     |
| 2   | `crud-operations.mdx`     | ⬜     |
| 3   | `filtering.mdx`           | ⬜     |
| 4   | `pagination.mdx`          | ⬜     |
| 5   | `caching.mdx`             | ⬜     |
| 6   | `custom-repositories.mdx` | ⬜     |

---

## STEP 1: Read Source Code First

### Primary File

```
@warlock.js/core/src/repositories/
├── repository.manager.ts    # 1308 lines, 90 methods - MAIN FILE
├── types.ts                 # Repository types
└── index.ts                 # Exports
```

### Efficient Reading Strategy

```
1. view_file_outline → repository.manager.ts
2. grep_search "public " → find public methods
3. grep_search "filterBy" → understand filtering system
4. grep_search "listCached|firstCached" → caching methods
```

### Key Classes/Methods to Document

**RepositoryManager** (Abstract Base):

```typescript
// Finding Records
find(id)
findBy(column, value)
findActive(id)
first(options?)
firstCached(options?)
last(options?)

// Listing Records
list(options?)           // With pagination
listCached(options?)
listActive(options?)
all(options?)            // No pagination

// CRUD
create(data)
update(id, data)
patch(id, data)
delete(id)
bulkDelete(ids)

// Aggregation
count(options?)
sum(column, options?)
avg(column, options?)
min(column, options?)
max(column, options?)

// Chunking
chunk(size, callback, options?)

// Filtering (KEY FEATURE)
protected filterBy = {
  email: "=",
  role: "in",
  active: "scope",    // NEW - applies query scope
  status: "where",
  date: "between",
};

// Caching
cache()
flushCache()
flushCacheFor(record)
```

---

## STEP 2: Understand Repository Layer

### What Repositories Provide

1. **Adapter Pattern**: Works with Cascade, could work with Prisma
2. **Caching Layer**: Built-in cache for common queries
3. **Filtering System**: Declarative filterBy rules
4. **Pagination**: Page-based and cursor-based
5. **Active Record Pattern**: `*Active` methods for soft-deleted records

### Key Documentation Focus

- **Data Layer**: Repositories combine cache + models
- **Abstraction**: Works with any adapter (Cascade, future: Prisma)
- **filterBy System**: Powerful declarative filtering

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/repositories/
├── _category_.json
├── introduction.mdx        # What repos are, why use them
├── crud-operations.mdx     # find, create, update, delete
├── filtering.mdx           # filterBy, scopes, where
├── pagination.mdx          # Page-based, cursor-based
├── caching.mdx             # Repository-level caching
└── custom-repositories.mdx # Creating your own repositories
```

### Page Content Guidelines

**introduction.mdx**

- Explain repository as data layer abstraction
- Show basic repository structure
- Relationship to RESTful controllers

**filtering.mdx** (KEY PAGE)

- filterBy configuration
- Filter types: `=`, `in`, `scope`, `where`, `between`
- Scope filters (NEW in v4)
- Dynamic filtering from request

**pagination.mdx**

- Page-based: `list({ page: 1, limit: 20 })`
- Cursor-based: `list({ cursor: 'xyz', limit: 20 })`
- Pagination response format

**caching.mdx**

- `listCached()`, `firstCached()`, etc.
- Cache invalidation
- `flushCache()`, `flushCacheFor(record)`

---

## STEP 4: Update Progress Tracker

After each page, update status.

---

## Code Example Pattern

```typescript
// src/app/posts/repositories/posts.repository.ts
import { RepositoryManager } from "@warlock.js/core";
import { Post } from "../models/post";

export class PostsRepository extends RepositoryManager<Post> {
  public model = Post;

  // Declarative filtering
  protected filterBy = {
    author: "=",
    status: "in",
    published: "scope",
    createdAt: "between",
  };
}

export const postsRepository = new PostsRepository();
```

---

## Completion Criteria

- [ ] All 6 pages written
- [ ] filterBy system fully documented
- [ ] Scope filters documented
- [ ] Caching methods documented
- [ ] Pagination (both types) documented
- [ ] This tracker updated
- [ ] Tested with `yarn dev`

---

## Notes

[Agent: Add notes here during work]
