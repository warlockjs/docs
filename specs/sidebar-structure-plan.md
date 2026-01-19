# Warlock.js v4 - Final Sidebar Structure

## Approved Structure

```
docs/warlock/
│
├── 1. Getting Started/
│   ├── Introduction
│   ├── Why Warlock? (comparison + philosophy)
│   ├── Installation
│   ├── Concepts
│   ├── Project Structure
│   ├── Environment & Configurations (merged)
│   ├── Connectors
│   ├── Localization
│   └── Development Server (Overview)
│
├── 2. Development Server/
│   ├── Introduction
│   ├── HMR
│   ├── Autoloading (Special Files)
│   ├── Events & HMR Side Effects
│   ├── Configuration
│   ├── Health Checks
│   ├── Type Generators
│   └── Troubleshooting
│
├── 3. Http/
│   ├── Introduction
│   ├── Routing
│   ├── Route Builder (NEW)
│   ├── Request
│   ├── Response & Streaming
│   ├── Middleware
│   ├── RESTful Controllers
│   ├── Uploading Files
│   │   └── (Reference Storage for advanced)
│   └── Configuration
│
├── 4. Validation/
│   ├── Introduction (Seal integration)
│   ├── Schema Validation
│   ├── Validation Rules
│   ├── Database Rules (unique, exists)
│   ├── File Validation
│   └── Custom Validators
│
├── 5. Repositories/
│   ├── Introduction (Adapter pattern)
│   ├── Listing & Filters
│   ├── Scope Filters (NEW)
│   ├── Cursor Pagination (NEW)
│   ├── Caching
│   └── Custom Adapters (Cascade, Prisma, etc.)
│
├── 6. Storage/
│   ├── Introduction
│   ├── Configuration
│   ├── Drivers (Local, S3)
│   ├── File Operations
│   ├── URLs (public, signed)
│   └── Advanced Upload Techniques
│       └── (Custom driver selection, etc.)
│
├── 7. Database/
│   ├── Introduction (Cascade integration)
│   ├── Configuration
│   ├── Models
│   └── Decorators
│
├── 8. Auth/
│   └── (existing structure - update)
│
├── 9. Mail/
│   ├── Introduction
│   ├── Configuration
│   ├── Sending Emails
│   └── React Templates (NEW)
│
├── 10. Cache/
│   └── (existing structure - update)
│
├── 11. CLI/
│   ├── Commands Overview
│   ├── Generating Modules
│   └── Custom Commands
│
├── 12. Production/
│   ├── Building
│   └── Deployment
│
├── 13. Advanced/
│   ├── Image Processing
│   ├── Logger
│   ├── Utilities
│   ├── Extending Framework
│   └── Deep Concepts (theory + examples)
│
└── Future:
    ├── Testing
    └── API Docs Generation (Postman + Swagger)
```

---

## Key Decisions Made

| Decision         | Resolution                                |
| ---------------- | ----------------------------------------- |
| Env & Config     | Merged into one page                      |
| Repositories     | Separate section (adapter pattern)        |
| Localization     | Part of Getting Started                   |
| Image Processing | Advanced section                          |
| File Uploads     | HTTP section (basic) + Storage (advanced) |
| Configurations   | Part of Getting Started                   |
| Deep Concepts    | New Advanced subsection                   |

---

## Getting Started - Detailed Pages

```
1. Introduction
   - What is Warlock.js
   - Key features
   - Philosophy

2. Installation
   - Prerequisites (Node.js, etc.)
   - Create new project
   - Quick commands

3. Concepts
   - Modules (app structure)
   - Controllers, Services, Models
   - Request lifecycle
   - Dependency flow

4. Project Structure
   - Directory layout
   - File naming conventions
   - Module structure

5. Environment & Configurations
   - .env files
   - Config files (src/config/)
   - Using env in config
   - Accessing config values

6. Connectors
   - What are connectors
   - Built-in connectors
   - Connector lifecycle
   - Priority system

7. Localization
   - Setup
   - Usage
   - Translations

8. Development Server (Overview)
   - What it does
   - How to start
   - Link to full section
```

---

## Development Server - Detailed Pages

```
1. Introduction
   - What is Dev Server v2
   - Benefits (HMR, fast reload)
   - Architecture overview

2. HMR
   - How it works
   - Import transformation
   - Cache busting
   - What files support HMR

3. Autoloading (Special Files)
   - main.ts files
   - routes.ts files
   - events/ directory
   - locales.ts files
   - Loading order

4. Events & HMR Side Effects
   - Event registration during HMR
   - Cleanup patterns
   - Avoiding duplicate listeners
   - Best practices

5. Configuration
   - warlock.config.ts
   - Watch options
   - Batch size, debounce

6. Health Checks
   - TypeScript checker
   - ESLint checker
   - Enable/disable
   - Interpreting results

7. Type Generators
   - Auto-generated types
   - Config types
   - When they run

8. Troubleshooting
   - Common issues
   - Cache clearing
   - Import resolution errors
   - Circular dependencies
```

---

## Next Steps

1. **Start with Getting Started section**

   - Review existing pages
   - Update for v4
   - Create new pages (Concepts, Connectors)

2. **Then Development Server**

   - Mostly new pages
   - Use dev-server-complete-flow.md as reference

3. **Continue with HTTP, Validation, etc.**

---

## Progress Tracking

- [ ] Getting Started (8 pages)
- [ ] Development Server (8 pages)
- [ ] Http (9 pages)
- [ ] Validation (6 pages)
- [ ] Repositories (6 pages)
- [ ] Storage (6 pages)
- [ ] Database (4 pages)
- [ ] Auth (update existing)
- [ ] Mail (4 pages)
- [ ] Cache (update existing)
- [ ] CLI (3 pages)
- [ ] Production (2 pages)
- [ ] Advanced (5 pages)

**Total: ~60+ pages**
