# Agent Task: Validation Section

## Assignment

**Section**: Validation  
**Pages**: 5  
**Priority**: HIGH (Batch 1)  
**Status**: ⏳ Not Started

---

## Pages to Write

| #   | File                    | Status |
| --- | ----------------------- | ------ |
| 1   | `introduction.mdx`      | ⬜     |
| 2   | `schema-validation.mdx` | ⬜     |
| 3   | `framework-plugins.mdx` | ⬜     |
| 4   | `custom-rules.mdx`      | ⬜     |
| 5   | `error-messages.mdx`    | ⬜     |

---

## STEP 1: Read Source Code First

### Seal Package (Standalone Validation)

```
@warlock.js/seal/src/
├── validators/           # All validator classes
├── rules/                # Rule implementations
├── plugins/              # Plugin system
├── factory/              # v.object(), v.string(), etc.
└── index.ts              # Main exports including `v`
```

### Core Validation Extensions

```
@warlock.js/core/src/validation/
├── init.ts               # Seal initialization with Warlock config
├── validateAll.ts        # HTTP validation integration
├── database/             # unique(), exists() rules
├── file/                 # v.file() validator
├── plugins/              # Warlock-specific plugins
└── validators/           # Extended validators
```

### Efficient Reading Strategy

```
1. view_file_outline → seal/src/validators/
2. grep_search "export class.*Validator" → find all validators
3. view_code_item → ObjectValidator, StringValidator, etc.
4. Read core/src/validation/database/ → unique, exists implementation
5. Read core/src/validation/file/ → FileValidator
```

### Key Framework Extensions to Document

```typescript
// Core adds these to Seal:

// 1. File Validator
v.file().required().image().maxSize("5mb").extensions(["jpg", "png"]);

// 2. Database Rules
v.string().unique("users", "email"); // Check uniqueness
v.string().exists("categories", "id"); // Check existence

// 3. HTTP Integration
request.validate(schema); // Auto-validation in middleware
```

---

## STEP 2: Understand Seal vs Core Split

### What's in Seal (Standalone)

- All base validators (string, number, object, array, etc.)
- Core rules (required, min, max, email, etc.)
- Framework-agnostic, works anywhere

### What Core Adds (Framework Integration)

- `v.file()` — File upload validation
- `unique()` rule — Database uniqueness check
- `exists()` rule — Database existence check
- `request.validate()` — HTTP layer integration
- Automatic error response formatting

**Documentation Focus**: This section focuses on the FRAMEWORK EXTENSIONS, not re-documenting Seal basics.

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/validation/
├── _category_.json
├── introduction.mdx       # Seal integration overview
├── schema-validation.mdx  # In-depth v.object(), v.array() usage
├── framework-plugins.mdx  # v.file(), unique(), exists()
├── custom-rules.mdx       # Creating custom validation rules
└── error-messages.mdx     # Customizing error messages
```

### Page Content Guidelines

**introduction.mdx**

- Explain Seal is standalone, Core extends it
- Show basic schema definition
- Point to Seal docs for full validator reference

**schema-validation.mdx**

- Object validation with v.object()
- Array validation with v.array()
- Nested schemas
- Optional vs required fields

**framework-plugins.mdx** (MOST IMPORTANT)

- `v.file()` — full API with examples
- `unique('table', 'column')` — async database check
- `exists('table', 'column')` — async database check
- How these integrate with HTTP validation

**custom-rules.mdx**

- Creating custom rule functions
- Registering rules globally
- Async rules (database queries)

**error-messages.mdx**

- Default error format
- Customizing messages
- Localized error messages

---

## STEP 4: Update Progress Tracker

After each page, update status:

```markdown
| 1 | `introduction.mdx` | ✅ |
```

---

## Style Requirements

- Import `v` from `@warlock.js/seal`, NOT from core
- Show realistic validation schemas (User registration, Post creation)
- Always show both success and error scenarios

### Code Example Pattern

```typescript
// src/app/users/controllers/register.ts
import { type RequestHandler } from "@warlock.js/core";
import { v } from "@warlock.js/seal";

export const registerController: RequestHandler = async (request, response) => {
  // Validation happens automatically via middleware
  const data = request.validated();
  // ... create user
};

registerController.validation = {
  schema: v.object({
    name: v.string().required().minLength(2),
    email: v.string().required().email().unique("users", "email"),
    password: v.string().required().minLength(8),
    avatar: v.file().image().maxSize("2mb"),
  }),
};
```

---

## Completion Criteria

- [ ] All 5 pages written
- [ ] `_category_.json` created
- [ ] v.file() fully documented
- [ ] unique()/exists() fully documented
- [ ] HTTP validation integration documented
- [ ] This tracker updated
- [ ] Tested with `yarn dev`

---

## Notes

[Agent: Add notes here during work]
