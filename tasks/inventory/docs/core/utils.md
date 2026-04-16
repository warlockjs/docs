# @warlock.js/core Audit — Utilities

**Status:** 🟡 Significant Gaps
**Corpus:** `src/utils/`

## Utilities Coverage Map

| Feature | Inventory Signature | Documentation Coverage | Gap Status |
| :--- | :--- | :--- | :--- |
| **Path Resolvers** | `storagePath/rootPath/etc` | 100% | 🟢 Healthy |
| **Environment** | `isProduction/environment` | 80% | 🟢 Healthy |
| **Date Helpers** | `now/today/formatDate` | 0% | 🔴 Silent |
| **String Utilities** | `toCamelCase/toKebabCase` | 0% | 🔴 Silent |
| **Object Utilities** | `get/set/pick/only` | 0% | 🔴 Silent |
| **Array Utilities** | `unique/first/last/random` | 0% | 🔴 Silent |
| **URL Helpers** | `url/fullUrl` | 100% | 🟢 Healthy |
| **JSON Utilities** | `toJSON` | 100% | 🟢 Healthy |

---

## Technical Findings

### 1. The "Mongez" Legacy Utilities (Total Blackout)
Warlock re-exports a massive library of utility functions for String, Array, and Object manipulation (inherited from its deep integration with Mongez libraries).
- **Gap**: There is zero documentation for these. Developers will likely install `lodash` or `underscore` because they are unaware that `get`, `set`, `pick`, `only`, `toCamelCase`, `toKebabCase`, etc., are already available and optimized in `@warlock.js/core`. This is 100% a "Silent API".

### 2. Date Helpers
The `now()`, `today()`, `tomorrow()`, and `yesterday()` helpers provide a unified way to handle dates without direct `new Date()` calls, supporting potential mocking in tests.
- **Gap**: Undocumented. Developers are unaware of the fluent date API provided by Core.

### 3. Missing Sleep & Promises
While `sleep()` has its own page, other promise-based utilities like `promiseAllObject` are documented but might be missed as they feel "hidden" in the utils directory.

---

## Action Plan (Utils)
- [ ] Create a "String Utilities" guide covering case transformations and manipulation.
- [ ] Create an "Object & Array" guide covering `get/set/pick/only` and array helpers.
- [ ] Document the "Date Helpers" (`now`, `today`, etc.) in a dedicated page.
- [ ] Consolidate these under a "Global Utilities" sidebar section.
