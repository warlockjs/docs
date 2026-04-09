# Task: Audit Existing Tests

## Objective

Catalog all existing test files across all packages and identify what's tested vs what's not.

## Instructions

1. For each package in `./warlock.js/`, look for test files in:
   - `./warlock.js/<package>/tests/`
2. For each test file found, extract:
   - File path
   - Number of `describe` blocks
   - Number of `it`/`test` blocks
   - What module/class/function it tests (from describe name or imports)
3. Cross-reference with the package inventory (from task 001) to identify untested exports

## Output

Create the file at: `./tasks/inventory/tests-audit.md`

Format:

```markdown
# Test Audit

## Summary

- Packages with tests: X/10
- Total test files: N
- Total test cases: N
- Estimated coverage: low/medium/high per package

## By Package

### @warlock.js/seal

| Test File                  | Describes | Tests | Covers                           |
| -------------------------- | --------- | ----- | -------------------------------- |
| tests/string-rules.test.ts | 3         | 15    | StringRule, MinLength, MaxLength |

**Untested exports:** SchemaValidator, NumberRule, BooleanRule, ...

### @warlock.js/cascade

(same format)
```

## Rules

- Only count test structures, do NOT run tests
- If no test directory exists for a package, note it as "NO TESTS"
- Check for vitest.config or jest.config files to understand test setup
