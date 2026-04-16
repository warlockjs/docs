# @warlock.js/core Audit — Data Layer

**Status:** 🟡 Significant Gaps
**Corpus:** `src/repositories/`, `src/database/`, `src/restful/`

## Data Layer Coverage Map

| Feature | Inventory Signature | Documentation Coverage | Gap Status |
| :--- | :--- | :--- | :--- |
| **Repository Basics** | `list/all/find/first` | 100% | 🟢 Healthy |
| **Active Variants** | `listActive/findActive` | 40% (Listings only) | 🟡 Needs Example |
| **Cached Variants** | `listCached/allCached` | 90% | 🟢 Healthy |
| **Upsert Methods** | `findOrCreate/updateOrCreate` | 0% | 🔴 Silent |
| **Vector Search** | `query.similarTo()` | 0% | 🔴 Silent |
| **Query Debugging** | `query.pretty()` | 0% | 🔴 Silent |
| **Database Actions** | `MigrateAction/SeedAction` | 0% (Programmatic) | 🔴 Silent |
| **Restful Hooks** | `beforeSave/onSave/etc` | 100% | 🟢 Healthy |

---

## Technical Findings

### 1. The Upsert Mystery (Silent Utilities)
`RepositoryManager.findOrCreate()` and `updateOrCreate()` are essential for robust data handling (e.g., syncing external data or ensuring settings exist).
- **Gap**: Zero documentation. Developers often reinvent this logic manually because these built-in methods are "Silent".

### 2. Vector Search (similarTo)
Warlock v4 introduces vector search capabilities through the `similarTo()` query builder method.
- **Gap**: Completely silent. There is no guide on how to perform similarity searches on embeddings using Warlock’s fluent API. This is a missed opportunity for "AI-Ready" marketing.

### 3. Active Column Customization
The repository handles "Active" records using default columns.
- **Gap**: Documentation for `isActiveColumn` and `isActiveValue` properties is missing. Developers don't know they can change `isActive` to `status === 'published'` at the repository level.

### 4. Programmatic Database Orchestration
While the CLI commands are documented, the underlying `MigrateAction` and `SeedersManager` classes are silent. 
- **Impact**: Developers wanting to trigger migrations or seeds via a dashboard (Request Controller) have no guidance on the programmatic API.

---

## Action Plan (Data)
- [ ] Add a "Record Utilities" section to Repository documentation covering `findOrCreate` and `updateOrCreate`.
- [ ] Create a "Vector Search" or "Advanced Querying" section in the Query Builder guide for `similarTo()`.
- [ ] Document `isActiveColumn` customization in the "Repository Advanced" section.
- [ ] Document programmatic usage of `MigrateAction` and `SeedersManager`.
