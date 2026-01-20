# Warlock.js Documentation - Multi-Agent Execution Strategy

> **Purpose**: Parallelize documentation across agents with minimal tokens

---

## Agent Assignment Strategy

### Principle: One Agent = One Section

Each agent handles a complete section independently. Sections chosen to minimize cross-dependencies.

---

## Parallel Batches

### Batch 1: High Priority (Start Immediately)

| Agent       | Section                           | Pages | Dependencies           |
| ----------- | --------------------------------- | ----- | ---------------------- |
| **Agent A** | Getting Started                   | 6     | None                   |
| **Agent B** | HTTP (routing, request, response) | 8     | None                   |
| **Agent C** | HTTP/RESTful (nested)             | 4     | None                   |
| **Agent D** | Validation                        | 5     | Seal package knowledge |

### Batch 2: Core Features (After Batch 1)

| Agent       | Section        | Pages | Dependencies      |
| ----------- | -------------- | ----- | ----------------- |
| **Agent E** | Repositories   | 6     | Cascade knowledge |
| **Agent F** | Database       | 5     | Cascade knowledge |
| **Agent G** | Authentication | 6     | Core middleware   |
| **Agent H** | Storage        | 6     | None              |

### Batch 3: Secondary Features

| Agent       | Section    | Pages | Dependencies   |
| ----------- | ---------- | ----- | -------------- |
| **Agent I** | Cache      | 4     | None           |
| **Agent J** | Dev Server | 6     | Core knowledge |
| **Agent K** | Mail + CLI | 8     | None           |

### Batch 4: Low Priority

| Agent       | Section               | Pages | Dependencies   |
| ----------- | --------------------- | ----- | -------------- |
| **Agent L** | Production + Advanced | 13    | Core knowledge |
| **Agent M** | Upcoming Features     | 2     | None           |

---

## Agent Prompt Template

Copy this to each agent, customizing the SECTION and PAGES:

```
# Task: Write Warlock.js Documentation

## Your Section: [SECTION_NAME]
## Pages to Write: [LIST_OF_PAGES]

## Critical References (READ FIRST):
1. Style Guide: `docs/warlock-docs-latest/specs/001-ecosystem-docs/style-guide.md`
2. Master Plan: `docs/warlock-docs-latest/DOCS_MASTER_PLAN.md` (just your section)
3. Source Code: `@warlock.js/core/src/[relevant-module]`

## Documentation Philosophy:
- Target: Junior developers (make it EASY)
- Tone: Friendly teammate, "Why" before "How"
- Explicit over convention (show config overrides)
- Code follows @warlock.js/template patterns
- `v` imports from `@warlock.js/seal`, not core

## Output Location:
`docs/warlock-docs-latest/docs/warlock/[section]/[page].mdx`

## Per-Page Structure:
1. Title + brief intro (1-2 sentences)
2. Why use this feature (motivation)
3. Basic usage (simplest example)
4. Configuration options (explicit defaults)
5. Advanced usage (progressive complexity)
6. Common patterns / Best practices
7. Related links

## Code Example Format:
- TypeScript always
- Full imports shown
- Realistic examples (not /hello world)
- Comments explaining non-obvious parts

## DO NOT:
- Read entire codebase (view only relevant files)
- Duplicate content from other sections
- Create placeholder pages (complete content only)
- Skip validation rules for code examples
```

---

## Shared Resources for Agents

### 1. Style Guide Location

`docs/warlock-docs-latest/specs/001-ecosystem-docs/style-guide.md`

### 2. Code Pattern Examples

`docs/warlock-docs-latest/specs/US-001.md` (see Code Example Pattern section)

### 3. Source Reference Mapping

| Section         | Source Files to Read                    |
| --------------- | --------------------------------------- |
| Getting Started | `core/src/bootstrap`, `core/src/config` |
| HTTP            | `core/src/http`, `core/src/router`      |
| RESTful         | `core/src/restful`                      |
| Validation      | `core/src/validation`, `seal/src`       |
| Repositories    | `core/src/repositories`                 |
| Database        | `core/src/database`, `cascade/src`      |
| Authentication  | `auth/src`                              |
| Storage         | `core/src/storage`                      |
| Cache           | `cache/src`, `core/src/cache`           |
| Dev Server      | `core/src/dev2-server`                  |
| Mail            | `core/src/mail`                         |
| CLI             | `core/src/cli`                          |
| Advanced        | Various (connectors, context, etc.)     |

---

## Token Optimization Tips

### For Agent Spawning:

1. **Minimal Context**: Give agent only:
   - Section name + page list
   - Style guide path (not content)
   - Source file paths (not content)

2. **Lazy Loading**: Agent reads files on-demand, not upfront

3. **No Cross-References**: Each section is self-contained

4. **Single Responsibility**: One agent = one section = one PR

### For Agent Execution:

1. **Use `view_file_outline` first** (cheaper than full file read)
2. **Grep for specific exports** (don't read entire files)
3. **Focus on public API only** (skip implementation details)

---

## Completion Checklist

### Per-Page:

- [ ] MDX file created in correct location
- [ ] Front matter with title, description, sidebar_position
- [ ] All code examples are runnable
- [ ] No TODOs or placeholders
- [ ] Cross-links to related pages

### Per-Section:

- [ ] `_category_.json` created
- [ ] All pages in section complete
- [ ] Section tested in Docusaurus dev server

---

## Suggested Agent Order (Sequential Start)

If starting agents one at a time:

```
Day 1: Agent A (Getting Started) + Agent B (HTTP core)
Day 2: Agent C (RESTful) + Agent D (Validation)
Day 3: Agent E (Repositories) + Agent F (Database)
Day 4: Agent G (Auth) + Agent H (Storage)
Day 5: Agent I (Cache) + Agent J (Dev Server)
Day 6: Agent K (Mail + CLI) + Agent L (Production + Advanced)
Day 7: Agent M (Upcoming) + Review/QA pass
```

---

## Quality Gates

Before merging agent output:

1. **Build Test**: `yarn build` passes
2. **Link Check**: No broken internal links
3. **Code Validation**: Examples are syntactically correct
4. **Style Consistency**: Matches style guide
5. **Completeness**: No placeholder text

---

## Emergency Contacts (Cross-Section Dependencies)

If an agent needs info from another section:

| If writing... | May need to reference... |
| ------------- | ------------------------ |
| Validation    | Seal standalone docs     |
| RESTful       | Repositories section     |
| Database      | Cascade standalone docs  |
| Auth          | Core middleware docs     |
| Multi-tenancy | Context + Middleware     |
