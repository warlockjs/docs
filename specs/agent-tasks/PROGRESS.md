# Warlock.js Docs - Agent Progress Tracker

> **Purpose**: Track all agent progress across batches
> Always reference for the framework as `Warlock.js` not `Warlock`

---

## Overall Progress

| Batch   | Sections                              | Pages | Status                 |
| ------- | ------------------------------------- | ----- | ---------------------- |
| Batch 1 | Getting Started, HTTP, Validation     | 23    | ⏳ In Progress (12/23) |
| Batch 2 | Repositories, Database, Auth, Storage | 23    | ⏳ Not Started         |
| Batch 3 | Cache, Dev Server, Mail, CLI          | 18    | ⏳ Not Started         |
| Batch 4 | Production, Advanced, Upcoming        | 15    | ⏳ Not Started         |

**Total**: ~79 pages

---

## Batch 1 Status

### Agent A: Getting Started (12 pages) ✅ Complete

**Task File**: `specs/agent-tasks/batch1-getting-started.md`
**Instructions**: `specs/agent-tasks/AGENT_INSTRUCTIONS.md`

| Page                    | Status | Agent Notes                                         |
| ----------------------- | ------ | --------------------------------------------------- |
| introduction.mdx        | ✅     | Fixed missing response param in listPostsController |
| why-warlock.mdx         | ✅     | Added comparison table and trade-offs               |
| installation.mdx        | ✅     | Wizard flow, HMR explanation                        |
| concepts.mdx            | ✅     | Mermaid diagram for request lifecycle               |
| project-structure.mdx   | ✅     | Complete directory structure with examples          |
| env-config.mdx          | ✅     | All config files from v4 template, storage.ts       |
| connectors.mdx          | ✅     | Refined definition, corrected priority order        |
| localization.mdx        | ✅     | Updated to use t() and groupedTranslations()        |
| dev-server-overview.mdx | ✅     | Added --fresh flag, config.key() usage              |
| autoloading.mdx         | ✅     | Fixed naming consistency                            |
| generating.mdx          | ✅     | Generator Z documentation complete                  |
| _category_.json         | ✅     | Exists                                              |

---

### Agent B: HTTP (12 pages)

**Task File**: `specs/agent-tasks/batch1-http.md`

| Page                        | Status | Agent Notes |
| --------------------------- | ------ | ----------- |
| routing-basics.mdx          | ⬜     |             |
| route-builder.mdx           | ⬜     |             |
| route-groups.mdx            | ⬜     |             |
| api-versioning.mdx          | ⬜     |             |
| request.mdx                 | ⬜     |             |
| response.mdx                | ⬜     |             |
| middleware.mdx              | ⬜     |             |
| cors.mdx                    | ⬜     |             |
| rate-limiting.mdx           | ⬜     |             |
| file-uploads.mdx            | ⬜     |             |
| error-handling.mdx          | ⬜     |             |
| restful/overview.mdx        | ⬜     |             |
| restful/controllers.mdx     | ⬜     |             |
| restful/lifecycle-hooks.mdx | ⬜     |             |
| restful/validation.mdx      | ⬜     |             |

---

### Agent C: Validation (5 pages)

**Task File**: `specs/agent-tasks/batch1-validation.md`

| Page                  | Status | Agent Notes |
| --------------------- | ------ | ----------- |
| introduction.mdx      | ⬜     |             |
| schema-validation.mdx | ⬜     |             |
| framework-plugins.mdx | ⬜     |             |
| custom-rules.mdx      | ⬜     |             |
| error-messages.mdx    | ⬜     |             |

---

## Batch 2 Status

### Agent D: Repositories (6 pages)

**Task File**: `specs/agent-tasks/batch2-repositories.md`

| Page                    | Status | Agent Notes |
| ----------------------- | ------ | ----------- |
| introduction.mdx        | ⬜     |             |
| crud-operations.mdx     | ⬜     |             |
| filtering.mdx           | ⬜     |             |
| pagination.mdx          | ⬜     |             |
| caching.mdx             | ⬜     |             |
| custom-repositories.mdx | ⬜     |             |

---

### Agent E: Database (5 pages)

**Task File**: `specs/agent-tasks/batch2-database.md`

| Page              | Status | Agent Notes |
| ----------------- | ------ | ----------- |
| introduction.mdx  | ⬜     |             |
| configuration.mdx | ⬜     |             |
| migrations.mdx    | ⬜     |             |
| seeds.mdx         | ⬜     |             |
| examples.mdx      | ⬜     |             |

---

### Agent F: Authentication (6 pages)

**Task File**: `specs/agent-tasks/batch2-auth.md`

| Page               | Status | Agent Notes |
| ------------------ | ------ | ----------- |
| introduction.mdx   | ⬜     |             |
| configuration.mdx  | ⬜     |             |
| jwt.mdx            | ⬜     |             |
| middleware.mdx     | ⬜     |             |
| guards.mdx         | ⬜     |             |
| access-control.mdx | ⬜     |             |

---

### Agent G: Storage (6 pages)

**Task File**: `specs/agent-tasks/batch2-storage.md`

| Page                | Status | Agent Notes |
| ------------------- | ------ | ----------- |
| introduction.mdx    | ⬜     |             |
| configuration.mdx   | ⬜     |             |
| drivers.mdx         | ⬜     |             |
| file-operations.mdx | ⬜     |             |
| urls.mdx            | ⬜     |             |
| scoped-storage.mdx  | ⬜     |             |

---

## Batch 3 Status

(Task files to be created when Batch 2 starts)

---

## Batch 4 Status

(Task files to be created when Batch 3 starts)

---

## How to Update This Tracker

Agents should update their section after completing each page:

```markdown
| introduction.mdx | ✅ | Completed with code examples |
```

Status legend:

- ⬜ Not started
- 🔄 In progress
- ✅ Complete
- ❌ Blocked

---

## Quality Checklist (Per Section)

Before marking a section complete:

- [ ] All pages written
- [ ] `_category_.json` created
- [ ] Code examples are runnable
- [ ] No TODOs or placeholders
- [ ] Internal links work
- [ ] Tested with `yarn dev`
