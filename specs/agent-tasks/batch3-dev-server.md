# Agent Task: Dev Server Section

## Assignment

**Section**: Dev Server  
**Pages**: 6  
**Priority**: MEDIUM (Batch 3)  
**Status**: ⏳ Not Started

---

## Pages to Write

| #   | File                    | Status |
| --- | ----------------------- | ------ |
| 1   | `overview.mdx`          | ⬜     |
| 2   | `hmr.mdx`               | ⬜     |
| 3   | `health-checks.mdx`     | ⬜     |
| 4   | `typings-generator.mdx` | ⬜     |
| 5   | `configuration.mdx`     | ⬜     |
| 6   | `troubleshooting.mdx`   | ⬜     |

---

## STEP 1: Read Source Code First

### Dev Server

```
@warlock.js/core/src/dev2-server/
├── index.ts
├── health-checker/        # TypeScript, ESLint checks
├── connectors/            # Dev connectors
└── ...
```

### Reference Document

**IMPORTANT**: Read this first!

```
docs/warlock-docs-latest/specs/dev-server-complete-flow.md
```

This contains complete HMR architecture documentation.

---

## STEP 2: Key Features to Document

### HMR (Hot Module Replacement)

- How HMR works
- `yarn dev` vs `yarn dev -f` (--fresh)
- Import transformation
- Cache busting

### Health Checks

- TypeScript checker (worker thread)
- ESLint checker (worker thread)
- Enable/disable options

### Typings Generator

- Auto-generated config types
- IDE auto-complete support
- When it runs

### Special Files

- `main.ts` files
- `routes.ts` files
- `events/` directory
- Loading order: locales → events → main → routes

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/dev-server/
├── _category_.json
├── overview.mdx            # Dev server intro
├── hmr.mdx                 # Hot Module Replacement
├── health-checks.mdx       # TS/ESLint worker threads
├── typings-generator.mdx   # Config auto-complete
├── configuration.mdx       # warlock.config.ts devServer
└── troubleshooting.mdx     # Common issues
```

### Page Content Guidelines

**hmr.mdx**

- `yarn dev` - start with HMR
- `yarn dev -f` or `yarn dev --fresh` - clear .warlock cache
- What supports HMR
- What doesn't (and why)

**health-checks.mdx**

- TypeScript checking in worker thread
- ESLint checking in worker thread
- Configuration to enable/disable
- Interpreting results

**typings-generator.mdx**

- Auto-generated types for config files
- How to get IDE auto-complete
- When type generation runs

**troubleshooting.mdx**

- Common issues:
  - Circular dependencies
  - Event listener cleanup
  - Cache clearing (`.warlock/` folder)
  - Import resolution errors

---

## Code Example Pattern

```bash
# Start dev server
yarn dev

# Start fresh (clear cache)
yarn dev -f
yarn dev --fresh
```

```typescript
// warlock.config.ts
export default {
  devServer: {
    port: 3000,
    healthCheck: {
      typescript: true,
      eslint: true,
    },
    watch: {
      ignored: ["node_modules", ".git"],
    },
  },
};
```

---

## Completion Criteria

- [ ] All 6 pages written
- [ ] HMR fully explained
- [ ] Health checks documented
- [ ] Typings generator documented
- [ ] Troubleshooting covers top 3 issues
- [ ] PROGRESS.md updated

---

## Notes

[Agent: Add notes here during work]
