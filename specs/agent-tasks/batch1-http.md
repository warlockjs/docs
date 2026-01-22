# Agent Task: HTTP Section

## Assignment

**Section**: HTTP  
**Pages**: 12 (8 core + 4 RESTful nested)  
**Priority**: CRITICAL (Batch 1)  
**Status**: In Progress

---

## Pages to Write

### Core HTTP (8 pages)

| #   | File                 | Status |
| --- | -------------------- | ------ |
| 1   | `routing-basics.mdx` | ⬜     |
| 2   | `route-builder.mdx`  | ⬜     |
| 3   | `route-groups.mdx`   | ⬜     |
| 4   | `api-versioning.mdx` | ⬜     |
| 5   | `request.mdx`        | ⬜     |
| 6   | `response.mdx`       | ⬜     |
| 7   | `middleware.mdx`     | ⬜     |
| 8   | `cors.mdx`           | ⬜     |
| 9   | `rate-limiting.mdx`  | ⬜     |
| 10  | `file-uploads.mdx`   | ⬜     |
| 11  | `error-handling.mdx` | ⬜     |

### RESTful Nested (4 pages)

| #   | File                          | Status |
| --- | ----------------------------- | ------ |
| 12  | `restful/overview.mdx`        | ⬜     |
| 13  | `restful/controllers.mdx`     | ⬜     |
| 14  | `restful/lifecycle-hooks.mdx` | ⬜     |
| 15  | `restful/validation.mdx`      | ⬜     |

---

## STEP 1: Read Source Code First

### Primary Files to Analyze

```
@warlock.js/core/src/router/
├── router.ts              # 802 lines, 41 methods - MAIN
├── route-builder.ts       # 234 lines, 21 methods
├── route-registry.ts      # Route storage
└── types.ts               # Route types

@warlock.js/core/src/http/
├── request.ts             # 956 lines, 77 methods
├── response.ts            # 1139 lines, 69 methods
├── uploaded-file.ts       # File handling
├── middleware/            # Middleware system
└── plugins/               # CORS, rate limiting

@warlock.js/core/src/restful/
├── restful.ts             # 438 lines, 22 methods
└── types.ts
```

### Efficient Reading Strategy

```
1. view_file_outline → router.ts, request.ts, response.ts
2. grep_search "export class" → find main classes
3. grep_search "export type" → find public types
4. view_code_item → read specific methods
```

### Key Exports to Document

**Router**:

- `router.get()`, `post()`, `put()`, `delete()`, `patch()`
- `router.route()` → RouteBuilder
- `router.group()`, `router.prefix()`
- `router.restfulResource()`

**RouteBuilder**:

- `.get()`, `.post()`, `.list()`, `.create()`, `.show()`, `.update()`, `.destroy()`
- `.nest()`, `.crud()`

**Request**:

- `request.input()` — handles ALL form types (JSON, multipart, URL-encoded)
- `request.only()`, `request.except()`, `request.all()`
- `request.file()`, `request.files()`
- `request.header()`, `request.user`, `request.locale()`
- `request.validate()`

**Response**:

- `response.send()`, `response.success()`
- `response.badRequest()`, `response.notFound()`, etc.
- `response.stream()` — streaming API
- `response.render()` — React components

---

## STEP 2: Check Existing Content

```
docs/warlock-docs-latest/docs/warlock/http/
specs/US-011.md (HTTP section spec)
specs/core-features-v4.md (Router, Request, Response details)
```

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/http/
├── _category_.json
├── routing-basics.mdx
├── route-builder.mdx
├── route-groups.mdx
├── api-versioning.mdx
├── request.mdx
├── response.mdx
├── middleware.mdx
├── cors.mdx
├── rate-limiting.mdx
├── file-uploads.mdx
├── error-handling.mdx
└── restful/
    ├── _category_.json
    ├── overview.mdx
    ├── controllers.mdx
    ├── lifecycle-hooks.mdx
    └── validation.mdx
```

---

## Key Documentation Points

### Request Page

- Emphasize: `request.input()` auto-handles ALL form types
- No special handling needed for JSON vs multipart vs URL-encoded

### Response Page

- Document streaming: `response.stream()`
- React rendering: `response.render(<Component />)`

### RESTful Section

- **Value prop**: "Save tons of time on CRUD operations"
- Developer provides: Validation + Repository
- Framework handles: CRUD methods, lifecycle hooks, middleware

### Lifecycle Hooks

```typescript
beforeCreate, onCreate
beforeUpdate, onUpdate
beforePatch, onPatch
beforeDelete, onDelete
beforeSave, onSave (runs on create AND update)
```

---

## STEP 4: Update Progress Tracker

After each page, update status:

```markdown
| 1 | `routing-basics.mdx` | ✅ |
```

---

## Style Requirements

Same as other agents - see `specs/001-ecosystem-docs/style-guide.md`

---

## Completion Criteria

- [ ] All 15 pages written (11 core + 4 restful)
- [ ] Both `_category_.json` files created
- [ ] All code examples correct
- [ ] `request.input()` form handling documented
- [ ] Streaming documented
- [ ] RESTful lifecycle hooks documented
- [ ] This tracker updated
- [ ] Tested with `yarn dev`

---

## Notes

[Agent: Add notes here during work]
Review source code per file before documenting it, split it into higher sections (headings) then go all the way down.
