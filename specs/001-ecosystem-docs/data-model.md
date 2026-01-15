# Data Model: Warlock.js Ecosystem Documentation

**Feature**: 001-ecosystem-docs
**Date**: 2026-01-15

## Overview

This document defines the entities and relationships for the documentation system. Since this is a documentation project (not an application), the "data model" describes the content structure rather than database entities.

## Entities

### Package

A distinct module in the Warlock.js ecosystem.

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Package identifier (e.g., "core", "cascade") |
| displayName | string | Human-readable name (e.g., "Warlock Core") |
| description | string | One-line description of purpose |
| sourceDir | path | Location in `@warlock.js/` |
| docsDir | path | Location in `docs/` |
| version | semver | Current package version |
| dependencies | Package[] | Other packages this depends on |
| status | enum | "complete" | "partial" | "planned" |

**Instances**:

| name | displayName | docsDir | status |
|------|-------------|---------|--------|
| core | Warlock | docs/warlock | partial |
| cascade | Cascade | docs/cascade | partial |
| auth | Auth | docs/warlock/auth | partial |
| seal | Seal | docs/seal | complete |
| cache | Cache | docs/cache | complete |
| logger | Logger | docs/warlock/logger | planned |
| scheduler | Scheduler | - | planned |
| postman | Postman | - | planned |
| herald | Herald | - | deferred |
| context | Context | - | deferred |
| template | Template | - | deferred |
| vest | Vest | - | deferred |

---

### DocumentationPage

A single MDX file covering one topic.

| Attribute | Type | Description |
|-----------|------|-------------|
| id | string | Unique page identifier (file path) |
| title | string | Page title (h1) |
| package | Package | Parent package |
| category | string | Sidebar category |
| sidebarPosition | number | Order in sidebar |
| content | MDX | Page content |
| relatedPages | DocumentationPage[] | Cross-references |
| apiReferences | APIReference[] | APIs documented on this page |

**Required Sections** (per constitution):
1. Introduction (what is this?)
2. Why use it (rationale)
3. How to use it (examples)
4. API Reference (if applicable)
5. Related pages (cross-references)

---

### CodeExample

A runnable code snippet within a documentation page.

| Attribute | Type | Description |
|-----------|------|-------------|
| language | "ts" | "json" | "bash" | Code language |
| title | string? | Optional file path indicator |
| imports | string[] | Required import statements |
| code | string | The example code |
| output | string? | Expected output (if shown) |
| prerequisites | string[] | Setup requirements |
| isComplete | boolean | True if copy-paste ready |

**Validation Rules** (per constitution):
- `language` MUST be specified
- `imports` MUST be complete (no implicit imports)
- `isComplete` MUST be true for all examples
- No placeholder names ("foo", "bar", "test")

---

### APIReference

Documentation of a public API element.

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | API name (class, method, function) |
| type | "class" | "method" | "function" | "interface" | "type" |
| signature | string | TypeScript signature |
| parameters | Parameter[] | Function/method parameters |
| returnType | string | Return type annotation |
| description | string | What it does |
| examples | CodeExample[] | Usage examples |
| sourceFile | path | Location in source code |

**Parameter**:
| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Parameter name |
| type | string | TypeScript type |
| description | string | What it represents |
| defaultValue | string? | Default if optional |
| required | boolean | Is it required? |

---

### Version

A major release of the framework.

| Attribute | Type | Description |
|-----------|------|-------------|
| id | string | Version identifier ("3.x", "4.x") |
| label | string | Display label ("3.x", "4.x (Latest)") |
| path | string | URL path prefix |
| status | "current" | "unmaintained" | "deprecated" |
| docsRoot | path | Root directory for this version |

**Instances**:
| id | label | path | status | docsRoot |
|----|-------|------|--------|----------|
| 4.x | 4.x (Latest) | /docs | current | docs/ |
| 3.x | 3.x | /v3 | unmaintained | versioned_docs/version-3.x/ |

---

### Category

A grouping of pages in the sidebar.

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Category name |
| label | string | Display label |
| package | Package | Parent package |
| collapsed | boolean | Default collapsed state |
| position | number | Order in sidebar |
| pages | DocumentationPage[] | Pages in this category |

---

## Relationships

```text
Package (1) ──────── (n) DocumentationPage
    │                         │
    │                         │ contains
    │                         ▼
    │                 (n) CodeExample
    │                         │
    │                         │ references
    │                         ▼
    │                 (n) APIReference
    │
    └──── depends on ──── (n) Package

Version (1) ──────── (n) Package (versioned docs)

Category (1) ──────── (n) DocumentationPage
```

---

## Page Templates

### Getting Started Page

```mdx
---
sidebar_position: 1
---

# Getting Started with {Package}

Brief intro paragraph explaining what this package does.

## Prerequisites

- Node.js 18+
- {other requirements}

## Installation

\`\`\`bash
npm install @warlock.js/{package}
\`\`\`

## Quick Example

\`\`\`ts title="src/example.ts"
import { Something } from "@warlock.js/{package}";

// Complete, runnable example
\`\`\`

## Next Steps

- [Link to next page](./next-page.mdx)
```

### API Reference Page

```mdx
---
sidebar_position: N
---

# {ClassName}

Brief description of what this class/function does.

## Import

\`\`\`ts
import { ClassName } from "@warlock.js/{package}";
\`\`\`

## Constructor / Usage

\`\`\`ts
const instance = new ClassName(options);
\`\`\`

## Methods

### methodName()

\`\`\`ts
methodName(param1: Type, param2?: Type): ReturnType
\`\`\`

Description of what method does.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| param1 | Type | Yes | What it is |
| param2 | Type | No | What it is (default: value) |

**Returns:** Description of return value

**Example:**

\`\`\`ts title="src/example.ts"
// Complete example with imports
\`\`\`

## See Also

- [Related Page](./related.mdx)
```

---

## State Transitions

### Page Lifecycle

```text
[Draft] → [Review] → [Published] → [Needs Update] → [Review] → [Published]
                                        ↑
                          (source code change triggers)
```

### Documentation Status per Package

```text
[Planned] → [In Progress] → [Partial] → [Complete]
                 ↓              ↓
            [Blocked]     [Needs Review]
```
