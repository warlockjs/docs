# Warlock.js Framework Features - Allocation Plan

## Approach

Systematically allocate and document all Core features by **functional area** before writing detailed documentation. This ensures complete coverage and prevents gaps.

---

## Feature Allocation

### ✅ 1. Development Server (COMPLETED)

**Status**: Flow documented, HMR-only implementation understood

**Documentation Needs**:

- Getting Started guide
- HMR explanation
- Configuration reference
- Troubleshooting guide

**Priority**: HIGH

---

### 🔄 2. HTTP (Routes, Requests, Responses, Middleware)

**Components**:

- Router (41 methods)
- RouteBuilder (21 methods)
- Request (77 methods)
- Response (69 methods)
- UploadedFile
- Middleware system
- RESTful controllers

**v3 Comparison Needed**: Yes

- Router enhancements (nesting, semantic aliases, CRUD builder)
- Response streaming
- React rendering

**Documentation Needs**:

- Router complete API reference
- RouteBuilder fluent API guide
- Request/Response method documentation
- File upload handling
- Middleware patterns
- RESTful controller lifecycle

**Priority**: HIGH (Most used feature)

---

### 🔄 3. Storage

**Components**:

- Multi-driver system (32KB implementation)
- Local, S3 drivers
- File operations
- URL generation
- Scoped storage

**v3 Comparison Needed**: Yes (New system in v4)

**Documentation Needs**:

- Driver setup (Local, S3)
- File CRUD operations
- Public/signed URLs
- Scoped storage patterns
- Stream handling

**Priority**: HIGH (New major feature)

---

### 🔄 4. Validation

**Components**:

- Seal integration (18 validators)
- Database rules (unique, exists)
- File validation
- Request validation

**v3 Comparison Needed**: Yes (Array-style → Seal migration)

**Documentation Needs**:

- Seal validator API (all 18)
- Migration from v3 array-style
- Database validation rules
- File upload validation
- Custom validators

**Priority**: HIGH (Breaking change)

---

### ⏸️ 5. Build & Production

**Components**:

- Build process
- Production optimization
- Deployment tools
- Environment handling

**v3 Comparison Needed**: Yes

**Documentation Needs**:

- TBD (need to review build system)

**Priority**: MEDIUM

---

### ⏸️ 6. Connectors

**Components**:

- Database connector
- Cache connector
- HTTP connector
- Storage connector
- Communicator connector (Herald)
- Custom connector creation

**v3 Comparison Needed**: Unknown

**Documentation Needs**:

- Connector lifecycle
- Priority system
- Custom connector guide

**Priority**: MEDIUM

---

### ⏸️ 7. Auto Imports and Loaders

**Components**:

- Module auto-loading
- Route auto-loading
- Event auto-loading
- Config auto-loading
- Special files system

**v3 Comparison Needed**: Yes

**Documentation Needs**:

- File naming conventions
- Auto-loading behavior
- Special file types (main.ts, routes.ts, events/)

**Priority**: MEDIUM

---

### ⏸️ 8. Image Processing

**Components**:

- Image manipulation (20KB)
- Resize, crop, rotate
- Format conversion
- Watermarking
- Storage integration

**v3 Comparison Needed**: Yes

**Documentation Needs**:

- TBD (need to review capabilities)

**Priority**: LOW

---

### ⏸️ 9. Contexts

**Components**:

- Request context
- @warlock.js/context package
- Async context management

**v3 Comparison Needed**: Yes (New package)

**Documentation Needs**:

- When to use contexts
- Request context API
- Async context patterns

**Priority**: LOW

---

## Standalone Packages (Separate from Core)

### 📦 Herald (Message Bus) - NEW

**Priority**: HIGH (New major feature)

### 📦 Cascade (Database ORM)

- MongoDB driver
- PostgreSQL driver - NEW
- Relations, sync system - Enhanced

**Priority**: HIGH (PostgreSQL is new)

### 📦 Cache

**Priority**: MEDIUM

### 📦 Seal (Validation)

**Priority**: HIGH (Used in Core)

### 📦 Logger

**Priority**: LOW

### 📦 Scheduler

**Priority**: MEDIUM

### 📦 Auth

**Priority**: HIGH (Coupled with Core)

---

## Suggested Next Steps

### Option A: Complete Core First (Recommended)

1. ✅ Development Server (Done)
2. **HTTP System** (Router, Request, Response, RESTful)
3. **Storage System**
4. **Validation System**
5. Build & Production
6. Connectors
7. Auto Imports
8. Image Processing
9. Contexts

Then standalone packages: Herald → Cascade → Auth

### Option B: High-Priority Features Across All Packages

1. ✅ Development Server (Done)
2. **HTTP System**
3. **Herald** (New package)
4. **Cascade PostgreSQL** (New driver)
5. **Validation/Seal**
6. **Storage**
7. Auth
8. Remaining features

### Option C: Documentation-Driven

1. Review existing v3 docs structure
2. Identify what needs updating
3. Document new features
4. Write migration guide

---

## My Recommendation

**Go with Option A** - Complete Core systematically:

### Next: Feature 2 - HTTP System

**Scope**:

- Router API (routes.mdx update)
- RouteBuilder (new docs)
- Request/Response (update existing)
- RESTful controllers (update existing)

**Process**:

1. Review v3 http/ docs (11 files)
2. Compare with v4 source code
3. Identify gaps and new features
4. Create feature comparison document
5. Plan documentation structure

**Estimated Artifacts**:

- `feature-2-http-system.md` (comparison)
- HTTP documentation outline
- Migration notes (v3 → v4)

---

## Documentation Structure (Proposed)

```
docs/
├── getting-started/
├── core/
│   ├── development-server/     # NEW
│   ├── http/
│   │   ├── routing/
│   │   │   ├── basic-routes
│   │   │   ├── route-builder    # NEW
│   │   │   └── restful-resources
│   │   ├── request
│   │   ├── response
│   │   │   └── streaming        # NEW
│   │   ├── middleware
│   │   └── file-uploads
│   ├── storage/                 # NEW
│   ├── validation/
│   ├── repositories/
│   ├── connectors/              # NEW
│   └── ...
├── standalone-packages/
│   ├── herald/                  # NEW
│   ├── cascade/
│   │   └── postgresql/          # NEW
│   ├── seal/
│   └── ...
└── migration/
    └── v3-to-v4/
```

---

## Questions for You

### Documentation Approach

1. Should we complete full Core review before writing any docs?
2. Or review + write docs for each feature as we go?

### Next Feature

3. Proceed with **HTTP System** next?
4. Or different priority?

### Documentation Format

5. Keep existing v3 structure and enhance?
6. Or completely reorganize for v4?

Let me know which direction you prefer!
