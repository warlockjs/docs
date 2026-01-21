# Agent Task: Getting Started Section

## Assignment

**Section**: Getting Started  
**Pages**: 6  
**Priority**: CRITICAL (Batch 1)  
**Status**: ✅ Complete

---

## Pages to Enhance

| #   | File                    | Status |
| --- | ----------------------- | ------ |
| 1   | `introduction.mdx`      | ✅     |
| 2   | `why-warlock.mdx`       | ✅     |
| 3   | `installation.mdx`      | ✅     |
| 4   | `concepts.mdx`          | ✅     |
| 5   | `project-structure.mdx` | ✅     |
| 6   | `env-config.mdx`        | ✅     |

---

## STEP 1: Read Source Code First

### Files to Analyze (in order)

```
1. @warlock.js/core/src/bootstrap/
   └── Understand app initialization flow

2. @warlock.js/core/src/config/
   └── Config loading, env handling

3. @warlock.js/core/src/warlock-config/
   └── warlock.config.ts structure

4. @warlock.js/core/src/application.ts
   └── Application class, lifecycle
```

### Efficient Reading Strategy

```typescript
// DO THIS:
1. view_file_outline → get structure
2. grep_search "export" → find public API
3. view_code_item → read specific functions

// DON'T DO THIS:
❌ Read entire files top-to-bottom
❌ Read internal/private implementations
❌ Read test files (unless needed for examples)
```

---

## STEP 2: Check Existing Content

Review existing pages that may need updating:

```
docs/warlock-docs-latest/docs/warlock/getting-started/
```

Check existing specs:

```
docs/warlock-docs-latest/specs/US-001.md (Introduction - DONE)
docs/warlock-docs-latest/specs/US-002.md (Why Warlock - DONE)
docs/warlock-docs-latest/specs/US-003.md to US-009.md
```

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/getting-started/
├── _category_.json
├── introduction.mdx
├── why-warlock.mdx
├── installation.mdx
├── concepts.mdx
├── project-structure.mdx
└── env-config.mdx
```

### Page Structure Template

```mdx
---
title: [Page Title]
description: [One-line description]
sidebar_position: [1-6]
---

# [Title]

[1-2 sentence intro - what this page covers]

## Why [Feature]?

[Motivation - why developers need this]

## Quick Start

[Simplest example to get started]

## Configuration

[Options with defaults shown]

## Examples

[Real-world usage patterns]

## Related

- [Link to related page]
```

---

## STEP 4: Update Progress Tracker

After completing each page, update this file:

```markdown
| 1 | `introduction.mdx` | ✅ |
```

---

## Style Requirements

- **Tone**: Friendly teammate
- **Target**: Junior developers
- **Philosophy**: "Why" before "How"
- **Code**: TypeScript, full imports, realistic examples
- **Imports**: `v` from `@warlock.js/seal`, NOT core

### Code Example Pattern

```typescript
// src/app/posts/routes.ts
import { router } from "@warlock.js/core";
import { createPostController } from "./controllers/create-post";

router.post("/posts", createPostController);
```

---

## Completion Criteria

- [ ] All 6 pages written
- [ ] `_category_.json` created
- [ ] All code examples are correct
- [ ] No TODOs or placeholders
- [ ] This tracker updated to show ✅ for each page
- [ ] Tested with `yarn dev` (Docusaurus)

---

## Notes

[Agent: Add notes here during work]
