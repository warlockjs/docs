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

Process them in this order:

1. `context` (smallest, start here)
2. `logger`
3. `scheduler`
4. `seal`
5. `cache`
6. `herald`
7. `cascade`
8. `auth`
9. `core`

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
