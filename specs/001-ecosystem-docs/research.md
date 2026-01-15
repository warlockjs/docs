# Research: Warlock.js Ecosystem Documentation

**Feature**: 001-ecosystem-docs
**Date**: 2026-01-15

## Research Questions Resolved

### RQ-1: Documentation Generation Approach

**Question**: How should API documentation be generated from source code?

**Decision**: Manual documentation with source-guided API extraction

**Rationale**:
- Automated TypeDoc generation produces reference-only docs lacking narrative guidance
- Manual writing allows progressive disclosure and real-world examples per constitution principles
- Source files provide accurate type signatures; human writers add context and examples

**Alternatives Considered**:
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| TypeDoc auto-generation | Fast, always accurate | No narrative, poor DX | Rejected |
| Manual only | Full control | May drift from source | Rejected |
| Source-guided manual | Accurate types + good narrative | More effort | **Selected** |

---

### RQ-2: Package Documentation Priority Order

**Question**: In what order should packages be documented?

**Decision**: Depth-first with priority order:
1. **Warlock Core** - Foundation for all apps
2. **Cascade** - Data layer (most complex)
3. **Auth** - Common next step after basic setup
4. **Seal** - Already well-documented, needs review
5. **Cache** - Already well-documented, needs review
6. **Utility packages** - As needed, may be subsections

**Rationale**:
- Core and Cascade are foundational - every Warlock.js app needs them
- Auth is the most requested feature after basic CRUD
- Seal and Cache are standalone and already have good structure
- Per clarification: depth-first ensures major packages are complete before starting utilities

**Alternatives Considered**:
- Breadth-first: Rejected - causes incomplete docs across all packages
- Feature-based: Rejected - doesn't match package-based navigation structure

---

### RQ-3: Version Management Strategy

**Question**: How should v3.x and v4.x documentation coexist?

**Decision**: Docusaurus built-in versioning
- v3.x: Frozen in `versioned_docs/version-3.x/`
- v4.x: Current/latest in `docs/`
- Version dropdown in navbar for switching

**Rationale**:
- Docusaurus versioning already configured in `docusaurus.config.ts`
- v3.x users can still access old docs
- All new work targets v4.x per clarification
- URLs remain stable with version prefix

**Configuration** (existing in docusaurus.config.ts):
```ts
versions: {
  current: {
    label: "4.x (Latest)",
    path: "docs",
  },
  "3.x": {
    label: "3.x",
    path: "v3",
    banner: "unmaintained",
  },
}
```

---

### RQ-4: Code Example Validation

**Question**: How do we ensure code examples compile and work?

**Decision**: Manual testing in a separate Warlock.js project

**Process**:
1. Create example code in documentation
2. Copy to test Warlock.js project
3. Run TypeScript compiler to verify
4. Test runtime behavior for complex examples
5. Update docs if issues found

**Rationale**:
- Docusaurus doesn't support TypeScript compilation of MDX code blocks
- Manual validation ensures SC-003 (examples compile successfully)
- Future improvement: Automated test suite for examples

**Alternatives Considered**:
- mdx-code-runner: Not mature enough for production
- Docusaurus live code: Only works for React, not Node.js/server code
- Separate test suite: Adds maintenance burden, deferred to future

---

### RQ-5: Cross-Package Reference Pattern

**Question**: How should documentation link between packages?

**Decision**: Relative MDX links with explicit package prefixes

**Pattern**:
```mdx
<!-- From warlock/http/request.mdx to cascade model -->
See [Model.create](../../cascade/models/creating-documents.mdx) for database operations.

<!-- From cascade to warlock -->
Use with [Request validation](../../warlock/validation/introduction.mdx).
```

**Rationale**:
- Docusaurus validates links at build time (broken links = build failure)
- Relative paths ensure version-aware linking
- Explicit package prefix helps readers understand cross-package relationships

---

### RQ-6: Navigation and Sidebar Structure

**Question**: How should the sidebar navigation be organized?

**Decision**: Package-based top-level with category grouping

**Structure**:
```
Warlock (main section)
├── Getting Started
├── HTTP (Request, Response, Middleware)
├── Validation
├── Upload
├── Auth (links to separate auth package)
├── Mail
├── Logger
└── Production

Cascade (main section)
├── Getting Started
├── Models
├── Queries
├── Aggregation
├── Relationships
└── Advanced

Seal (main section) - already well-structured

Cache (main section) - already well-structured
```

**Rationale**:
- Matches existing `sidebars.ts` configuration
- Users can focus on one package at a time
- Logical progression within each package

---

## Existing Documentation Assessment

### Well-Documented (Review Only)

| Package | Status | Notes |
|---------|--------|-------|
| Seal | ✅ Comprehensive | 40+ pages, all validators covered |
| Cache | ✅ Comprehensive | All drivers, advanced features |

### Needs Major Work

| Package | Status | Gap |
|---------|--------|-----|
| Warlock Core | ⚠️ Partial | Missing: modules, events, testing |
| Cascade | ⚠️ Partial | Missing: some advanced features |
| Auth | ⚠️ Basic | Needs expansion |

### Undocumented

| Package | Status | Priority |
|---------|--------|----------|
| Logger (@warlock.js/logger) | ❌ None | Low (utility) |
| Postman | ❌ None | Low (utility) |
| Scheduler | ❌ None | Medium |
| Herald | ❌ None | Low (internal) |
| Context | ❌ None | Low (internal) |
| Template | ❌ None | Low (utility) |
| Vest | ❌ None | Low (testing) |

---

## Technical Findings

### Docusaurus Configuration

- **Version**: 3.4.0 (latest stable)
- **Styling**: Tailwind CSS 3.4
- **Theme**: Dark mode only (forced)
- **Search**: Built-in Algolia-compatible
- **Build**: Static site generation

### Source Package Structure

Each `@warlock.js/*` package follows:
```
@warlock.js/package-name/
├── index.ts          # Main exports
├── types.ts          # Type definitions
├── feature/
│   ├── index.ts
│   └── implementation.ts
└── utils/
```

### Key APIs to Document (from source scan)

**@warlock.js/core**:
- Application bootstrap
- Request/Response handling
- Router and middleware
- Validation system
- Output formatting
- Module system

**@warlock.js/cascade**:
- Model base class
- Query builder
- Aggregation pipeline
- Relationships (embedded, syncing)
- Migration system
- Casts and blueprints

**@warlock.js/auth**:
- JWT service
- Auth middleware
- Access tokens
- Guest authentication
- Password casting

---

## Recommendations

1. **Start with Warlock Core Getting Started** - Highest impact for new users
2. **Audit existing Cascade docs** - Ensure alignment with source
3. **Preserve Seal/Cache structure** - Already meets constitution requirements
4. **Defer utility packages** - Document as needed, not comprehensively
5. **Establish page template** - Ensure consistency across all docs
