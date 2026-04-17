# Cascade Tests

This directory contains the test suite for `@warlock.js/cascade`.

## Structure

```
tests/
├── unit/              # Unit tests (no database required)
├── integration/       # Integration tests (with real databases)
├── fixtures/          # Test data and models
└── helpers/           # Test utilities
```

## Running Tests

```bash
# Run all tests
yarn test

# Run with coverage
yarn test:coverage

# Run only unit tests
yarn test:unit

# Run only integration tests
yarn test:integration

# Watch mode
yarn test:watch
```

## Writing Tests

### Unit Tests

- Located in `tests/unit/`
- Use mock drivers and query builders
- No database connections required
- Fast execution

### Integration Tests

- Located in `tests/integration/`
- Use testcontainers for real databases
- Test actual database operations
- Slower execution

### Helpers

**Mock Driver** (`helpers/mock-driver.ts`)

```typescript
import { createMockDriver } from "../helpers/mock-driver";

const mockDriver = createMockDriver("mongodb");
```

**Test Model Factory** (`helpers/test-model-factory.ts`)

```typescript
import { createTestModel } from "../helpers/test-model-factory";

const TestModel = createTestModel("users");
```

## Coverage Goals

- Overall: 80%+
- Core modules: 90%+
- Critical paths: 95%+
