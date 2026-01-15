<!--
## Sync Impact Report
- Version change: N/A → 1.0.0 (initial ratification)
- Added principles:
  1. Code Synchronization (new)
  2. API-First Documentation (new)
  3. Developer Experience (new)
  4. TypeScript & Real-World Examples (new)
  5. Copy-Paste Ready Code (new)
- Added sections:
  - Documentation Standards
  - Review & Maintenance Process
  - Governance
- Templates requiring updates:
  - .specify/templates/plan-template.md - ✅ compatible (Constitution Check section exists)
  - .specify/templates/spec-template.md - ✅ compatible (requirements align)
  - .specify/templates/tasks-template.md - ✅ compatible (documentation tasks supported)
- Follow-up TODOs: None
-->

# Warlock.js Documentation Constitution

## Core Principles

### I. Code Synchronization

Documentation MUST remain synchronized with the `@warlock.js` source packages at all times.

- All documented APIs, methods, and features MUST exist in the current package version
- When package code changes, corresponding documentation MUST be updated in the same release cycle
- Deprecated features MUST be clearly marked with migration paths before removal
- Version-specific documentation MUST accurately reflect the package version it describes (v3.x, v4.x, etc.)
- Stale or outdated documentation is considered a defect and MUST be treated with the same urgency as code bugs

**Rationale**: Users rely on documentation as the source of truth. Divergence between docs and code causes confusion, wasted debugging time, and erodes trust in the framework.

### II. API-First Documentation

Every public API, method, class, and configuration option MUST be fully documented.

- All exports from `@warlock.js/*` packages MUST have corresponding documentation
- TypeScript type signatures MUST be included for all APIs showing parameters, return types, and generics
- Method signatures MUST document all parameters with descriptions and default values
- Configuration objects MUST list all options with types, defaults, and valid values
- Events MUST document when they fire, what data they provide, and how to subscribe

**Rationale**: Developers need complete API reference to use the framework effectively. Missing API documentation forces users to read source code, which defeats the purpose of documentation.

### III. Developer Experience

Documentation MUST prioritize ease of use and progressive disclosure.

- Every major feature MUST have a "Getting Started" or "Quick Start" section
- Documentation MUST progress from simple examples to advanced use cases
- Navigation MUST be intuitive with clear categorization (Warlock, Cascade, Seal, Cache)
- Search functionality MUST return relevant results for common queries
- Cross-references MUST link related concepts and APIs
- Each page MUST answer "What is this?", "Why would I use it?", and "How do I use it?"

**Rationale**: Good developer experience reduces onboarding friction and increases framework adoption. Frontend developers (the primary audience) should not need deep backend knowledge to be productive.

### IV. TypeScript & Real-World Examples

All code examples MUST use TypeScript and demonstrate practical, real-world use cases.

- Examples MUST use TypeScript with proper type annotations (no `any` unless unavoidable)
- Examples MUST show realistic scenarios that users would encounter in production
- Examples MUST include necessary imports and context to be understandable
- Variable and function names MUST be meaningful and follow TypeScript conventions
- Edge cases and error handling SHOULD be demonstrated where relevant
- Examples MUST NOT use placeholder data like "foo", "bar", "test" - use domain-relevant names

**Rationale**: The Warlock.js ecosystem is TypeScript-first. Real examples help users understand not just how to use an API, but when and why to use it in their applications.

### V. Copy-Paste Ready Code

All code examples MUST be self-contained and immediately executable.

- Examples MUST include all required imports at the top
- Examples MUST NOT depend on undefined variables or external context without explanation
- Multi-file examples MUST clearly indicate file paths and relationships
- Examples MUST specify which package version they apply to when version-specific
- Configuration examples MUST show complete, valid configurations
- If an example requires setup (database, environment variables), prerequisites MUST be clearly stated

**Rationale**: Developers often copy examples directly into their projects. Self-contained examples reduce friction and prevent errors from missing dependencies or context.

## Documentation Standards

### Formatting Requirements

- Use MDX format for all documentation files
- Maintain consistent heading hierarchy (h1 for page title, h2 for sections, h3 for subsections)
- Code blocks MUST specify the language (```ts, ```json, etc.)
- Use Docusaurus admonitions (:::tip, :::warning, :::danger) for callouts
- Keep line lengths reasonable for readability (<100 characters preferred)
- Use tables for comparing options or listing configurations

### Content Organization

- Group documentation by package (Warlock, Cascade, Seal, Cache)
- Each package MUST have: Introduction, Installation, Getting Started, API Reference
- Related pages MUST be linked using relative paths
- Sidebar organization MUST reflect logical learning progression
- Version-specific content MUST be clearly labeled

## Review & Maintenance Process

### Documentation Review Checklist

Before merging documentation changes:

1. Code examples compile without errors
2. All imports are valid and complete
3. API signatures match current package version
4. Links resolve correctly (no broken links)
5. Formatting follows standards
6. New pages are added to sidebar navigation

### Maintenance Schedule

- Documentation MUST be reviewed when corresponding packages are updated
- Broken links SHOULD be checked periodically
- User feedback and issues SHOULD inform documentation improvements
- Version migrations MUST include documentation updates

## Governance

### Amendment Process

1. Propose changes via pull request with rationale
2. Changes to Core Principles require explicit review and approval
3. Document the change in the Sync Impact Report
4. Update version number according to semantic versioning

### Versioning Policy

- **MAJOR**: Removing or fundamentally redefining a Core Principle
- **MINOR**: Adding new principles, sections, or substantially expanding guidance
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Documentation Versioning

Documentation follows simple major versioning aligned with Warlock.js releases:
- v3.x documentation for Warlock.js 3.x
- v4.x documentation for Warlock.js 4.x (current/latest)
- Future major versions will have corresponding documentation versions

### Compliance

- All documentation contributions MUST adhere to this constitution
- Pull requests that violate Core Principles SHOULD be revised before merging
- Constitution violations discovered in existing docs SHOULD be tracked and remediated

**Version**: 1.0.0 | **Ratified**: 2026-01-15 | **Last Amended**: 2026-01-15
