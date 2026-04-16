# Task: Generate Package Inventory Tree

## Objective

For each package in `./warlock.js/`, generate a structural inventory of its `src/` directory.

## Instructions

For each package listed below, perform the following:

1. List all files and folders inside `./warlock.js/<package>/src/` recursively
2. For each `.ts` file, extract ONLY the following (do NOT read implementation logic):
   - Exported classes (name only)
   - Exported interfaces / types (name only)
   - Exported functions (name + parameter types + return type — signature only)
   - Exported constants / enums (name + type)
   - Exported decorators (name only)
3. Output the result as a structured markdown tree

## Packages to Inventory

### Completed
- [x] `cache` → `./tasks/inventory/cache.md`
- [x] `context` → `./tasks/inventory/context.md`
- [x] `logger` → `./tasks/inventory/logger.md`
- [x] `scheduler` → `./tasks/inventory/scheduler.md`
- [x] `seal` → `./tasks/inventory/seal.md`

### Remaining (process in this order)
- [x] `herald` → `./tasks/inventory/herald.md`

- [ ] `cascade`
- [x] `auth` → `./tasks/inventory/auth.md`
- [ ] `core`
- [ ] `create-warlock`

### Special Notes for Large Packages

#### cascade (ORM)
- Has TWO database drivers: PostgreSQL and MongoDB
- Document each driver separately
- Has a model system, query builder, relations (hasMany, belongsTo, etc.)
- If over token limit, split by: drivers → models → query builder → relations

#### core (Framework)
- Built on Fastify
- Has CLI tooling, routing, middleware, modules, request/response
- Has storage system, mail, uploads, many sub-systems
- If over token limit, split by subdirectory (each subdirectory = one output file)

#### auth
- Tightly coupled — depends on cascade, core, logger, seal
- Document the JWT system, guards, and route protection separately

## Output Format

Create one file per package at: `./tasks/inventory/<package-name>.md`

Use this format for each file:

```markdown
# @warlock.js/<package-name> — Inventory

## Package Info

- Version: <from package.json>
- Type: Standalone Package | Tightly Coupled Package
- Dependencies: <list @warlock.js/\* deps only>

## Directory Tree
```

src/
├── index.ts
├── models/
│ ├── User.ts
│ └── ...
└── utils/
└── ...

```

## Exports by File

### src/index.ts (barrel file)
- Re-exports: list what it re-exports

### src/models/User.ts
- **Class** `User` extends `Model`
- **Interface** `UserSchema` { id: number, name: string, ... }

### src/utils/hash.ts
- **Function** `hashPassword(password: string): Promise<string>`
- **Constant** `SALT_ROUNDS: number`
```

## Rules

- Do NOT read function/method bodies — signatures only
- Do NOT read test files
- Do NOT read node_modules
- If a file is very large (>500 lines), note the line count and list exports only
- If `src/` doesn't exist, check for alternative source directories
- Process ONE package at a time to control token usage
- If you hit token limits mid-package, save progress and note where you stopped
- For each file, include a one-line description of its purpose (what it does, not how). Infer this from the file name, exports, and first few lines — do NOT read full implementation.
