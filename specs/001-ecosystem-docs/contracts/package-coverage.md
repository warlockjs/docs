# Package Coverage Contract

**Feature**: 001-ecosystem-docs
**Date**: 2026-01-15

## Overview

This contract defines what must be documented for each package to achieve "complete" status per the specification requirements.

## Coverage Requirements by Package

### @warlock.js/core (Priority: 1)

**Source**: `@warlock.js/core/`
**Docs**: `docs/warlock/`
**Status**: Partial → Complete

#### Required Documentation

| Category | Page | Source Reference | Status |
|----------|------|------------------|--------|
| Getting Started | introduction | - | ✅ Exists |
| Getting Started | installation | - | ⚠️ Needs review |
| Getting Started | quick-start | - | ⚠️ Needs creation |
| HTTP | request | `http/request.ts` | ✅ Exists |
| HTTP | response | `http/response.ts` | ✅ Exists |
| HTTP | middleware | `http/middleware/` | ⚠️ Needs expansion |
| HTTP | request-context | `http/` | ✅ Exists |
| HTTP | uploaded-files | `http/UploadedFile.ts` | ✅ Exists |
| Router | routes | `router/` | ⚠️ Needs creation |
| Router | router | `router/router.ts` | ⚠️ Needs creation |
| Validation | introduction | `validator/` | ✅ Exists |
| Validation | rules | `validator/rules/` | ✅ Exists |
| Validation | custom-validator | `validator/` | ✅ Exists |
| Upload | introduction | `modules/uploads/` | ✅ Exists |
| Upload | configurations | `modules/uploads/` | ✅ Exists |
| Mail | introduction | `mail/` | ✅ Exists |
| Mail | configurations | `mail/` | ✅ Exists |
| Output | output | `output/` | ⚠️ Needs creation |
| Repositories | introduction | `repositories/` | ⚠️ Needs creation |
| Repositories | restful | `restful/` | ⚠️ Needs creation |
| Testing | introduction | `tests/` | ⚠️ Needs creation |
| Production | deployment | `starters/` | ✅ Exists |

---

### @warlock.js/cascade (Priority: 2)

**Source**: `@warlock.js/cascade/`
**Docs**: `docs/cascade/`
**Status**: Partial → Complete

#### Required Documentation

| Category | Page | Source Reference | Status |
|----------|------|------------------|--------|
| Getting Started | introduction | - | ✅ Exists |
| Getting Started | installation | - | ⚠️ Needs review |
| Getting Started | connecting-to-database | `connection.ts` | ⚠️ Needs review |
| Models | introduction | `model/` | ⚠️ Needs review |
| Models | defining-models | `model/model.ts` | ⚠️ Needs review |
| Models | model-data | `model/base-model.ts` | ✅ Exists |
| Models | creating-documents | `model/crud-model.ts` | ⚠️ Needs review |
| Models | updating-documents | `model/crud-model.ts` | ⚠️ Needs review |
| Models | deleting-documents | `model/crud-model.ts` | ⚠️ Needs review |
| Queries | introduction | `query/` | ⚠️ Needs review |
| Queries | query-builder | `query/query.ts` | ⚠️ Needs review |
| Aggregate | introduction | `aggregate/` | ✅ Exists |
| Aggregate | filtering | `aggregate/WherePipeline.ts` | ✅ Exists |
| Aggregate | sorting | `aggregate/SortPipeline.ts` | ✅ Exists |
| Aggregate | grouping | `aggregate/GroupByPipeline.ts` | ✅ Exists |
| Aggregate | lookup | `aggregate/LookupPipeline.ts` | ✅ Exists |
| Relationships | embedded-documents | `model/` | ✅ Exists |
| Relationships | syncing-models | `model/ModelSync.ts` | ⚠️ Needs review |
| Casts | introduction | `casts/` | ⚠️ Needs creation |
| Casts | built-in-casts | `casts/` | ⚠️ Needs creation |
| Migration | introduction | `migration/` | ⚠️ Needs creation |
| Indexing | introduction | `blueprint/` | ✅ Exists |
| Indexing | blueprint | `blueprint/blueprint.ts` | ✅ Exists |

---

### @warlock.js/auth (Priority: 3)

**Source**: `@warlock.js/auth/`
**Docs**: `docs/warlock/auth/`
**Status**: Partial → Complete

#### Required Documentation

| Category | Page | Source Reference | Status |
|----------|------|------------------|--------|
| Auth | introduction | - | ✅ Exists |
| Auth | configurations | `contracts/` | ✅ Exists |
| Auth | auth-model | `models/auth.ts` | ✅ Exists |
| Auth | auth-middleware | `middleware/` | ✅ Exists |
| Auth | jwt | `services/jwt.ts` | ✅ Exists |
| Auth | guests | `models/guest/` | ✅ Exists |
| Auth | access-tokens | `models/access-token/` | ⚠️ Needs creation |

---

### @warlock.js/seal (Priority: 4)

**Source**: `@warlock.js/seal/`
**Docs**: `docs/seal/`
**Status**: Complete (review only)

#### Documentation Status

| Category | Status | Notes |
|----------|--------|-------|
| Getting Started | ✅ Complete | 3 pages |
| Core Concepts | ✅ Complete | 5 pages |
| Base Validator | ✅ Complete | 5 pages |
| String Validator | ✅ Complete | 3 pages |
| Number Validator | ✅ Complete | 5 pages |
| Date Validator | ✅ Complete | 4 pages |
| Scalar Validator | ✅ Complete | 2 pages |
| Boolean Validator | ✅ Complete | 1 page |
| Any Validator | ✅ Complete | 1 page |
| Array Validator | ✅ Complete | 3 pages |
| Object Validator | ✅ Complete | 3 pages |
| Advanced | ✅ Complete | 3 pages |
| Guides | ✅ Complete | 4 pages |

**Action**: Review for constitution compliance, no new pages needed.

---

### @warlock.js/cache (Priority: 5)

**Source**: `@warlock.js/cache/`
**Docs**: `docs/cache/`
**Status**: Complete (review only)

#### Documentation Status

| Category | Status | Notes |
|----------|--------|-------|
| Getting Started | ✅ Complete | 4 pages |
| Cache Manager | ✅ Complete | 3 pages |
| Drivers | ✅ Complete | 7 pages |
| Advanced Features | ✅ Complete | 5 pages |
| Utilities & Guides | ✅ Complete | 3 pages |

**Action**: Review for constitution compliance, no new pages needed.

---

## Utility Packages (Deferred)

These packages are documented as needed, not comprehensively:

| Package | Priority | Documentation Plan |
|---------|----------|-------------------|
| @warlock.js/logger | Low | Subsection in Warlock |
| @warlock.js/postman | Low | Subsection in Warlock |
| @warlock.js/scheduler | Medium | Standalone if time permits |
| @warlock.js/herald | Deferred | Internal use primarily |
| @warlock.js/context | Deferred | Internal use primarily |
| @warlock.js/template | Deferred | Internal use primarily |
| @warlock.js/vest | Deferred | Testing utilities |

---

## Completion Criteria

A package is "complete" when:

1. ✅ All "Required Documentation" pages exist
2. ✅ All pages follow the Documentation Structure Contract
3. ✅ All public APIs are documented with TypeScript signatures
4. ✅ All code examples are copy-paste ready
5. ✅ Cross-references link to related content
6. ✅ Constitution compliance verified

## Progress Tracking

| Package | Required Pages | Existing | Gap | Status |
|---------|---------------|----------|-----|--------|
| core | 22 | 14 | 8 | 64% |
| cascade | 22 | 12 | 10 | 55% |
| auth | 7 | 6 | 1 | 86% |
| seal | 34 | 34 | 0 | 100% |
| cache | 22 | 22 | 0 | 100% |
