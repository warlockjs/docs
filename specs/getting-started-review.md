# Getting Started Section - Review

## Current Pages (7)

| #   | Page                  | Lines | Status            |
| --- | --------------------- | ----- | ----------------- |
| 1   | introduction.mdx      | 80    | UPDATE            |
| 2   | installation.mdx      | 74    | MINOR UPDATE      |
| 3   | project-structure.mdx | 266   | UPDATE            |
| 4   | environment.mdx       | 83    | MERGE w/ config   |
| 5   | configurations.mdx    | 81    | MERGE w/ env      |
| 6   | autoloading.mdx       | 53    | MOVE → Dev Server |
| 7   | generating.mdx        | 32    | MOVE → CLI        |

## New Pages Needed

| Page                    | Status         |
| ----------------------- | -------------- |
| why-warlock.mdx         | CREATE         |
| concepts.mdx            | CREATE         |
| connectors.mdx          | CREATE         |
| localization.mdx        | CREATE or MOVE |
| dev-server-overview.mdx | CREATE         |

---

## Page-by-Page Analysis

### 1. introduction.mdx (UPDATE)

**Good to Keep:**

- Quick Example code
- Key Features list structure
- Tooling mention (Generator Z)
- Next Steps section

**Issues:**

- Line 4: Says "MongoDB" only - needs PostgreSQL mention
- Line 9: "Built on MongoDB" - v4 supports PostgreSQL too
- Line 42: "Full MongoDB support" - outdated
- "Why Warlock?" section exists but small - move to separate page
- No HMR mention in core features

**Actions:**

1. Update description to include PostgreSQL
2. Remove "Why Warlock" section (separate page)
3. Add HMR, Dev Server v2 to Key Features
4. Add Storage system to features
5. Update Next Steps with new page order

---

### 2. installation.mdx (MINOR UPDATE)

**Good to Keep:**

- Tabs for Yarn/NPM/Pnpm ✅
- VSCode Extension mention ✅
- Clean structure ✅

**Issues:**

- Line 11: "MongoDB Requirements" link - add PostgreSQL option
- Line 55: `yarn start` - clarify this starts dev server

**Actions:**

1. Add PostgreSQL as database option
2. Add note about dev server starting
3. Maybe add "What to expect" section (files created, output)

---

### 3. project-structure.mdx (UPDATE)

**Good to Keep:**

- Detailed directory tree ✅
- Module concept explanation ✅
- Each directory purpose ✅

**Issues:**

- Very long (266 lines) - consider splitting
- No `.warlock/` directory mentioned (v4 cache)
- No `warlock.config.ts` explanation

**Actions:**

1. Add `.warlock/` directory (cache, manifest)
2. Expand `warlock.config.ts` explanation
3. Keep module structure (still accurate)
4. Maybe shorten or use tabs better

---

### 4. environment.mdx (MERGE)

**Good to Keep:**

- Default .env example
- Variable explanations
- Environment file types

**Issues:**

- DB variables assume MongoDB only
- Should be merged with configurations

**Actions:**

1. Add PostgreSQL env variables example
2. Merge with configurations.mdx
3. New title: "Environment & Configurations"

---

### 5. configurations.mdx (MERGE)

**Good to Keep:**

- Config file list
- App configuration explanation
- Links to other config pages

**Issues:**

- Should be merged with environment
- Missing warlock.config.ts
- Missing connector config

**Actions:**

1. Merge with environment.mdx
2. Add warlock.config.ts section
3. Update config file list for v4

---

### 6. autoloading.mdx (MOVE)

**Analysis:**

- This content now belongs in Development Server section
- New loading order with HMR
- Events handling changed

**Actions:**

1. Move to Development Server section
2. Rename: "Special Files & Autoloading"
3. Update for v4 loading order:
   - Locales → Events → Main → Routes

---

### 7. generating.mdx (MOVE)

**Analysis:**

- Better fit for CLI section
- Can be expanded with CLI commands

**Actions:**

1. Move to CLI section
2. Keep Generator Z content
3. Add CLI commands (warlock dev, warlock build, etc.)

---

## Proposed New Structure

```
getting-started/
├── 1. introduction.mdx        (UPDATE)
├── 2. why-warlock.mdx         (CREATE NEW)
├── 3. installation.mdx        (MINOR UPDATE)
├── 4. concepts.mdx            (CREATE NEW)
├── 5. project-structure.mdx   (UPDATE)
├── 6. env-config.mdx          (MERGE env + config)
├── 7. connectors.mdx          (CREATE NEW)
├── 8. localization.mdx        (CREATE/MOVE)
└── 9. dev-server-overview.mdx (CREATE NEW)
```

---

## Priority Order for Writing

### High Priority (Do First)

1. **introduction.mdx** - First page users see
2. **why-warlock.mdx** - Marketing/positioning (NEW)
3. **installation.mdx** - Quick start

### Medium Priority

4. **concepts.mdx** - Mental models (NEW)
5. **project-structure.mdx** - Reference
6. **env-config.mdx** - Combined page

### Lower Priority

7. **connectors.mdx** - New concept (NEW)
8. **localization.mdx** - Move/adapt
9. **dev-server-overview.mdx** - Link to full section (NEW)

---

## Questions for You

1. **introduction.mdx**: Keep the quick example or update it?
2. **project-structure.mdx**: Keep full tree or shorten?
3. **Localization**: Move from separate section or create new?
4. **Start updating or create all new pages first?**
