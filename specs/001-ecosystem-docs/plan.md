# Implementation Plan: Warlock.js Ecosystem Documentation

**Branch**: `001-ecosystem-docs` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ecosystem-docs/spec.md`

## Summary

Complete documentation overhaul for the Warlock.js ecosystem covering all major packages (core, cascade, auth, seal, cache) with depth-first priority. Documentation will be extracted from `@warlock.js/*.ts` source files, written in MDX format using TypeScript examples, and deployed via Docusaurus 3.4 with version switching between v3.x (frozen) and v4.x (active development).

## Technical Context

**Language/Version**: TypeScript 5.2+ (for code examples), MDX (for documentation)
**Primary Dependencies**: Docusaurus 3.4.0, React 18, Tailwind CSS 3.4, Prism React Renderer
**Storage**: Static files (MDX in `/docs/` directory)
**Testing**: Manual review + link checking (docusaurus build validates links)
**Target Platform**: Web (static site hosted via GitHub Pages)
**Project Type**: Documentation site (single project)
**Performance Goals**: Page load < 3 seconds, search results < 500ms
**Constraints**: Must maintain backward compatibility with existing v3.x documentation URLs
**Scale/Scope**: 13 packages to document, ~100+ documentation pages estimated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Synchronization | ✅ PASS | API docs extracted from `@warlock.js/*.ts` source files per clarification |
| II. API-First Documentation | ✅ PASS | FR-004 requires all public APIs documented with TypeScript signatures |
| III. Developer Experience | ✅ PASS | User stories prioritize getting started in 15 minutes (SC-001) |
| IV. TypeScript & Real-World Examples | ✅ PASS | FR-006 mandates TypeScript for all examples |
| V. Copy-Paste Ready Code | ✅ PASS | FR-005 requires complete, copy-paste ready examples with imports |

**Gate Status**: PASSED - All 5 constitution principles satisfied by spec requirements.

## Project Structure

### Documentation (this feature)

```text
specs/001-ecosystem-docs/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (documentation structure contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
docs/                    # v4.x documentation (current/latest)
├── warlock/            # Core framework docs
│   ├── getting-started/
│   ├── http/
│   ├── validation/
│   ├── upload/
│   ├── auth/
│   ├── mail/
│   ├── logger/
│   ├── repositories/
│   ├── localization/
│   ├── utils/
│   └── production/
├── cascade/            # MongoDB ODM docs
│   ├── getting-started/
│   ├── models/
│   ├── queries/
│   ├── aggregate/
│   ├── relationships/
│   ├── indexing/
│   └── advanced/
├── seal/               # Validation library docs (well-structured)
│   ├── getting-started/
│   ├── concepts/
│   ├── base-validator/
│   ├── string-validator/
│   ├── number-validator/
│   ├── date-validator/
│   ├── array-validator/
│   ├── object-validator/
│   ├── advanced/
│   └── guides/
└── cache/              # Caching library docs
    ├── getting-started/
    ├── drivers/
    ├── advanced/
    └── guides/

versioned_docs/         # v3.x documentation (frozen)
└── version-3.x/

@warlock.js/            # Source packages (API extraction source)
├── core/               # Main framework
├── cascade/            # MongoDB ODM
├── auth/               # Authentication
├── seal/               # Validation
├── cache/              # Caching
├── logger/             # Logging
├── postman/            # API documentation generator
├── scheduler/          # Task scheduling
├── herald/             # Event system
├── context/            # Request context
├── template/           # Templating
└── vest/               # Testing utilities
```

**Structure Decision**: Documentation site using Docusaurus standard structure. Source packages in `@warlock.js/` serve as API reference source. Existing v3.x docs preserved in `versioned_docs/`.

## Complexity Tracking

No constitution violations to justify. Implementation follows standard Docusaurus patterns.
