# Documentation Audit: Scheduler

## Summary
- **Total pages**: 0
- **OK**: 0
- **STUB**: 0
- **NEEDS_REVIEW**: 0
- **MISSING**: 100% (The entire package is undocumented)

## Missing Documentation Coverage (Public API)

The following aspects of the `@warlock.js/scheduler` package are NOT covered in the current documentation:

### Core Concepts
- [ ] What is the Scheduler? (Task scheduling system).
- [ ] Cron Expressions vs Fluent API.

### API Reference
- [ ] **Job Class**:
  - [ ] Fluent timing: `every()`, `everyMinute()`, `daily()`, `weekly()`, `monthly()`, etc.
  - [ ] Precise timing: `on()`, `at()`, `beginOf()`, `endOf()`.
  - [ ] Control methods: `inTimezone()`, `preventOverlap()`, `retry()`, `terminate()`.
- [ ] **Scheduler Class**:
  - [ ] Management: `addJob()`, `newJob()`, `removeJob()`, `getJob()`.
  - [ ] Lifecycle: `start()`, `stop()`, `shutdown()`.
  - [ ] Execution control: `runEvery()`, `runInParallel()`.
- [ ] **Helpers**: `job()` factory function and the `scheduler` singleton.
- [ ] **Cron Parser**: `CronParser` class and `parseCron()` utility.

### Configuration & Integration
- [ ] How the scheduler integrates with Warlock v4 (Auto-loading jobs).
- [ ] Shared storage for distributed scheduling (if any, or if it's currently local-only).

## Recommendations

### 1. Dedicated Section
Create a first-class documentation section for the Scheduler. It's a critical component for production apps (clearing logs, generating reports, periodic syncs).

### 2. Fluent API Showcase
The `Job` class has a beautiful fluent API (e.g., `job('sync').daily().at('03:00')`). This should be the centerpiece of the documentation.

### 3. v4 Decorators / Auto-loading
If Warlock v4 supports auto-loading jobs from `src/app/*/jobs/*.ts` (similar to events/routes), this MUST be documented.

### 4. Overlap & Retries
The `preventOverlap()` and `retry()` features are high-value enterprise features that distinguish this scheduler from simple `cron` wrappers. They deserve specific technical guides.
