# Tasks: Warlock.js Ecosystem Documentation

**Input**: Design documents from `/specs/001-ecosystem-docs/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested - documentation project uses manual review and `yarn build` for link validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Documentation**: `docs/{package}/` at repository root
- **Source reference**: `@warlock.js/{package}/` for API extraction
- All documentation files use `.mdx` extension

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project validation and documentation standards setup

- [x] T001 Verify Docusaurus development server runs with `yarn start`
- [x] T002 Verify existing v3.x docs are accessible at `/v3/` path
- [x] T003 [P] Create documentation page template file at specs/001-ecosystem-docs/templates/page-template.mdx
- [x] T004 [P] Create API reference template file at specs/001-ecosystem-docs/templates/api-template.mdx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core documentation infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Review and update sidebars.ts to ensure correct navigation structure for all packages
- [x] T006 [P] Verify cross-package link format works (test link from docs/warlock/ to docs/cascade/)
- [x] T007 [P] Extract and document common TypeScript import patterns from @warlock.js/core/index.ts
- [x] T008 Create documentation style guide at specs/001-ecosystem-docs/style-guide.md

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Getting Started with Warlock.js (Priority: P1) 🎯 MVP

**Goal**: A new developer can create their first working API endpoint within 15 minutes

**Independent Test**: Follow the Getting Started guide from scratch and verify a working API endpoint is created without consulting external resources

### Implementation for User Story 1

- [ ] T009 [US1] Review and update introduction page at docs/warlock/getting-started/introduction.mdx
- [ ] T010 [US1] Review and update installation guide at docs/warlock/getting-started/installation.mdx
- [ ] T011 [US1] Create quick-start tutorial at docs/warlock/getting-started/quick-start.mdx
- [ ] T012 [US1] Create "Your First API" tutorial at docs/warlock/getting-started/first-api.mdx
- [ ] T013 [P] [US1] Create routes documentation at docs/warlock/http/routes.mdx extracting from @warlock.js/core/router/
- [ ] T014 [P] [US1] Create router documentation at docs/warlock/http/router.mdx extracting from @warlock.js/core/router/router.ts
- [ ] T015 [US1] Review and expand middleware documentation at docs/warlock/http/middleware.mdx
- [ ] T016 [US1] Add cross-references from Getting Started to HTTP and Router sections
- [ ] T017 [US1] Validate all code examples in US1 pages compile successfully

**Checkpoint**: At this point, User Story 1 should be fully functional - a developer can complete the Getting Started guide

---

## Phase 4: User Story 2 - Building Data Models with Cascade (Priority: P1)

**Goal**: A developer can define complete models with schema, validation, embedded documents, and relationships

**Independent Test**: Create a model with casting, validation, and relationships following only Cascade documentation

### Implementation for User Story 2

- [ ] T018 [US2] Review and update Cascade introduction at docs/cascade/getting-started/introduction.mdx
- [ ] T019 [US2] Review and update Cascade installation at docs/cascade/getting-started/installation.mdx
- [ ] T020 [US2] Review and update database connection guide at docs/cascade/getting-started/connecting-to-database.mdx
- [ ] T021 [P] [US2] Review models introduction at docs/cascade/models/introduction.mdx
- [ ] T022 [P] [US2] Review defining-models documentation at docs/cascade/models/defining-models.mdx
- [ ] T023 [P] [US2] Review creating-documents documentation at docs/cascade/models/creating-documents.mdx
- [ ] T024 [P] [US2] Review updating-documents documentation at docs/cascade/models/updating-documents.mdx
- [ ] T025 [P] [US2] Review deleting-documents documentation at docs/cascade/models/deleting-documents.mdx
- [ ] T026 [US2] Create casts introduction at docs/cascade/casts/introduction.mdx extracting from @warlock.js/cascade/casts/
- [ ] T027 [US2] Create built-in casts reference at docs/cascade/casts/built-in-casts.mdx extracting from @warlock.js/cascade/casts/
- [ ] T028 [P] [US2] Review queries introduction at docs/cascade/queries/introduction.mdx
- [ ] T029 [P] [US2] Review query-builder documentation at docs/cascade/queries/query-builder.mdx
- [ ] T030 [US2] Review syncing-models documentation at docs/cascade/relationships/syncing-models.mdx
- [ ] T031 [US2] Create migration system documentation at docs/cascade/advanced/migrations.mdx extracting from @warlock.js/cascade/migration/
- [ ] T032 [US2] Add cross-references between Cascade and Warlock Core sections
- [ ] T033 [US2] Validate all code examples in US2 pages compile successfully

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - developers can build APIs with data models

---

## Phase 5: User Story 3 - Implementing User Authentication (Priority: P2)

**Goal**: A developer can implement login, registration, and protected routes using auth documentation

**Independent Test**: Implement JWT authentication with protected routes following only auth documentation

### Implementation for User Story 3

- [ ] T034 [US3] Review auth introduction at docs/warlock/auth/introduction.mdx
- [ ] T035 [US3] Review auth configurations at docs/warlock/auth/configurations.mdx
- [ ] T036 [P] [US3] Review auth-model documentation at docs/warlock/auth/auth-model.mdx
- [ ] T037 [P] [US3] Review auth-middleware documentation at docs/warlock/auth/auth-middleware.mdx
- [ ] T038 [P] [US3] Review JWT documentation at docs/warlock/auth/jwt.mdx
- [ ] T039 [US3] Create access-tokens documentation at docs/warlock/auth/access-tokens.mdx extracting from @warlock.js/auth/models/access-token/
- [ ] T040 [US3] Review guests documentation at docs/warlock/auth/guests.mdx
- [ ] T041 [US3] Add cross-references from Auth to Middleware and Router sections
- [ ] T042 [US3] Validate all code examples in US3 pages compile successfully

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work - developers can build authenticated APIs

---

## Phase 6: User Story 4 - Creating RESTful APIs with Validation (Priority: P2)

**Goal**: A developer can implement a validated RESTful API for any entity using documentation alone

**Independent Test**: Create a complete CRUD API with validation rules following only documentation

### Implementation for User Story 4

- [ ] T043 [US4] Create output documentation at docs/warlock/http/output.mdx extracting from @warlock.js/core/output/
- [ ] T044 [US4] Create repositories introduction at docs/warlock/repositories/introduction.mdx extracting from @warlock.js/core/repositories/
- [ ] T045 [US4] Create RESTful documentation at docs/warlock/repositories/restful.mdx extracting from @warlock.js/core/restful/
- [ ] T046 [P] [US4] Review validation introduction at docs/warlock/validation/introduction.mdx
- [ ] T047 [P] [US4] Review validation rules documentation in docs/warlock/validation/rules/
- [ ] T048 [US4] Review custom-validator documentation at docs/warlock/validation/custom-validator.mdx
- [ ] T049 [US4] Add cross-references between Repositories, Validation, and Cascade Models
- [ ] T050 [US4] Validate all code examples in US4 pages compile successfully

**Checkpoint**: At this point, developers can build complete RESTful APIs with validation

---

## Phase 7: User Story 5 - Advanced Features and Package Integration (Priority: P3)

**Goal**: A developer can implement caching, scheduling, uploads, and mail using package documentation

**Independent Test**: Implement any advanced feature following only its documentation section

### Implementation for User Story 5

- [ ] T051 [US5] Review Cache documentation for constitution compliance (docs/cache/)
- [ ] T052 [P] [US5] Review upload introduction at docs/warlock/upload/introduction.mdx
- [ ] T053 [P] [US5] Review upload configurations at docs/warlock/upload/configurations.mdx
- [ ] T054 [P] [US5] Review uploading-files documentation at docs/warlock/upload/uploading-files.mdx
- [ ] T055 [P] [US5] Review mail introduction at docs/warlock/mail/introduction.mdx
- [ ] T056 [P] [US5] Review mail configurations at docs/warlock/mail/configurations.mdx
- [ ] T057 [US5] Review logger documentation at docs/warlock/logger/introduction.mdx
- [ ] T058 [US5] Add cross-references between advanced features and core documentation
- [ ] T059 [US5] Validate all code examples in US5 pages compile successfully

**Checkpoint**: At this point, developers can use all advanced features

---

## Phase 8: User Story 6 - API Documentation and Testing (Priority: P3)

**Goal**: A developer can generate Postman collections and write integration tests

**Independent Test**: Generate a Postman collection and run integration tests following only documentation

### Implementation for User Story 6

- [ ] T060 [US6] Create Postman generator documentation at docs/warlock/utils/postman.mdx extracting from @warlock.js/postman/
- [ ] T061 [US6] Create testing introduction at docs/warlock/testing/introduction.mdx extracting from @warlock.js/core/tests/
- [ ] T062 [US6] Create testing setup guide at docs/warlock/testing/setup.mdx
- [ ] T063 [US6] Create integration testing guide at docs/warlock/testing/integration-tests.mdx
- [ ] T064 [US6] Add cross-references from Testing to all related sections
- [ ] T065 [US6] Validate all code examples in US6 pages compile successfully

**Checkpoint**: All user stories complete - full documentation coverage achieved

---

## Phase 9: Review (Seal & Cache)

**Purpose**: Review existing complete documentation for constitution compliance

- [ ] T066 [P] Review Seal documentation for constitution compliance (docs/seal/)
- [ ] T067 [P] Verify Seal code examples include all imports and are copy-paste ready
- [ ] T068 [P] Verify Cache code examples include all imports and are copy-paste ready
- [ ] T069 Add any missing cross-references between Seal and Warlock validation
- [ ] T070 Add any missing cross-references between Cache and Warlock core

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 [P] Verify all internal links work with `yarn build`
- [ ] T072 [P] Verify search returns relevant results for common queries
- [ ] T073 Update sidebar navigation for any new sections added
- [ ] T074 Add "Related" sections to all pages that lack them
- [ ] T075 Create migration guide from v3.x to v4.x at docs/warlock/guides/migration.mdx
- [ ] T076 Final review: Verify each page answers "what", "why", and "how"
- [ ] T077 Run full `yarn build` and fix any remaining issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and can proceed in parallel
  - US3 and US4 are both P2 and can proceed in parallel (after US1/US2 if sequential)
  - US5 and US6 are both P3 and can proceed in parallel
- **Review (Phase 9)**: Can run in parallel with any user story
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational - benefits from US1 router docs
- **User Story 4 (P2)**: Can start after Foundational - benefits from US2 model docs
- **User Story 5 (P3)**: Can start after Foundational - independent advanced features
- **User Story 6 (P3)**: Can start after Foundational - benefits from all prior stories

### Within Each User Story

- Review existing pages first
- Create new pages in dependency order
- Add cross-references after content is complete
- Validate code examples last

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- US1 and US2 can run in parallel (both P1)
- US3 and US4 can run in parallel (both P2)
- US5 and US6 can run in parallel (both P3)
- Review phase tasks can run in parallel with user story implementation
- All model/page creation tasks marked [P] within a story can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all model documentation reviews together:
Task: "Review models introduction at docs/cascade/models/introduction.mdx"
Task: "Review defining-models documentation at docs/cascade/models/defining-models.mdx"
Task: "Review creating-documents documentation at docs/cascade/models/creating-documents.mdx"
Task: "Review updating-documents documentation at docs/cascade/models/updating-documents.mdx"
Task: "Review deleting-documents documentation at docs/cascade/models/deleting-documents.mdx"

# Launch query documentation reviews together:
Task: "Review queries introduction at docs/cascade/queries/introduction.mdx"
Task: "Review query-builder documentation at docs/cascade/queries/query-builder.mdx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test Getting Started guide with a real new developer
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Getting Started) → Test independently → Deploy (MVP!)
3. Add User Story 2 (Cascade Models) → Test independently → Deploy
4. Add User Story 3 (Auth) + User Story 4 (RESTful/Validation) → Deploy
5. Add User Story 5 (Advanced) + User Story 6 (Testing) → Deploy
6. Complete Review + Polish → Final release

### Parallel Team Strategy

With multiple contributors:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Contributor A: User Story 1 (Warlock Getting Started)
   - Contributor B: User Story 2 (Cascade Models)
   - Contributor C: Review Phase (Seal/Cache)
3. Stories complete and cross-references added

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Run `yarn build` after each major phase to catch broken links
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Source files in `@warlock.js/` are read-only reference material
