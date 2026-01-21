# Agent Instructions for Warlock.js v4 Documentation

> **Purpose**: Guidelines for agents writing Warlock.js v4 documentation

---

## Critical Rules

### 1. Framework Reference

- **Always use `Warlock.js`** — Never just "Warlock"
- Example: "Warlock.js uses a three-layer pattern" ✅
- Not: "Warlock uses a three-layer pattern" ❌

### 2. Source of Truth

- **Template is truth**: Always verify config files, env variables, and code examples against `create-warlock/templates/warlock/`
- **Check actual code**: Before documenting features, verify in `@warlock.js/core/src/` or relevant package

### 3. Port and Host

- Default port: **2030** (not 3000)
- Default host: **localhost** (not 127.0.0.1)
- Example: `http://localhost:2030`

### 4. Environment Variables

Use the correct variable names from the template:

- `HTTP_PORT` / `HTTP_HOST` (not `PORT` / `HOST`)
- `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_AUTH`
- `CACHE_DRIVER`
- Variable interpolation: `BASE_URL=http://${HTTP_HOST}:${HTTP_PORT}`

### 5. Import Order

- Type imports first: `import type { X } from "..."`
- Then value imports: `import { x } from "..."`
- Always import from `@warlock.js/...` packages, not `@mongez/...`

### 6. Config API

- Use `config.key("path.to.value")` not `config("path.to.value")`
- Use `config.get("section")` for entire config sections

### 7. Translation API

- Use `t("key")` not `trans("key")`
- Use `groupedTranslations()` for defining translations:

```typescript
groupedTranslations({
  keyName: {
    en: "English text",
    ar: "النص العربي",
  },
});
```

### 8. Config Files (from template)

Must match actual template files:

- `app.ts` — AppConfigurations
- `database.ts` — ConnectionOptions (not DatabaseConfigurations)
- `http.ts` — HttpConfigurations
- `auth.ts` — AuthConfigurations (includes NO_EXPIRATION, refresh tokens)
- `cache.ts` — CacheConfigurations (5 drivers: file, memory, memoryExtended, redis, database)
- `mail.ts` — MailConfigurations
- `storage.ts` — StorageConfigurations (not uploads.ts)
- `log.ts` — LogConfigurations
- `validation.ts` — ValidationConfiguration

### 9. Connector Priority (from code)

Correct order from `ConnectorPriority` enum:

1. Database (1)
2. Communicator (2)
3. Cache (3)
4. HTTP (4)
5. Storage (5)

---

## Before Writing Any Page

1. **Check the template**: `create-warlock/templates/warlock/`
2. **Check the source code**: `@warlock.js/core/src/` or relevant package
3. **Verify types**: Use actual TypeScript types from the codebase
4. **Test examples**: Ensure code examples would actually compile

---

## Code Example Patterns

### Controller Pattern

```typescript
import { type RequestHandler } from "@warlock.js/core";

export const myController: RequestHandler = async (request, response) => {
  // Implementation
  return response.success({ data });
};
```

### Route Pattern

```typescript
import { router } from "@warlock.js/core";
import { myController } from "./controllers/my.controller";

router.get("/path", myController);
```

### Validation Pattern

```typescript
import { v } from "@warlock.js/seal";

export const mySchema = v.object({
  field: v.string().required(),
});
```

---

## Quality Checklist

Before completing any page:

- [ ] All references use "Warlock.js" not "Warlock"
- [ ] Port 2030 used (not 3000)
- [ ] Host localhost used (not 127.0.0.1)
- [ ] ENV variables match template (.env.example)
- [ ] Config file examples match template (src/config/)
- [ ] Imports use @warlock.js packages
- [ ] Type imports come before value imports
- [ ] No placeholders or TODOs
- [ ] Code examples would compile
