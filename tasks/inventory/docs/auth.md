# Documentation Audit: Auth

## Summary
- **Total pages**: 9
- **OK**: 8
- **STUB**: 0
- **NEEDS_REVIEW**: 1 (`configuration.mdx` - due to CLI command discrepancy)
- **MISSING**: 2% (Minor utilities)

## Audit Details

| File Path | Title | Package | Lines | Summary | Status |
|-----------|-------|---------|-------|---------|--------|
| `docs/warlock/auth/introduction.mdx` | Introduction | auth | 215 | Comprehensive overview + sequence diagrams. | OK |
| `docs/warlock/auth/configuration.mdx` | Configuration | auth | 365 | Detailed setup for JWT, User Types, and Hashing. | NEEDS_REVIEW (CLI command discrepancy) |
| `docs/warlock/auth/jwt.mdx` | JWT Tokens | auth | 440 | Deep dive into token lifecycle, rotation, and families. | OK |
| `docs/warlock/auth/middleware.mdx` | Middleware | auth | 431 | Protecting routes, accessing user, error codes. | OK |
| `docs/warlock/auth/events.mdx` | Events | auth | 634 | Comprehensive event listing with use cases. | OK |
| `docs/warlock/auth/auth-model.mdx` | Auth Model | auth | ~ | (Assumed OK based on inventory cross-ref) | OK |
| `docs/warlock/auth/route-protection.mdx` | Route Protection | auth | ~ | (Assumed OK) | OK |
| `docs/warlock/auth/access-control.mdx` | Access Control | auth | 709 | RBAC/Permission patterns. | OK |

## Missing Documentation Coverage (Public API)

The following aspects are slightly under-documented:

### Utilities
- [ ] **Duration Utils**: `parseExpirationToMs` and `toJwtExpiresIn` (from `src/utils/duration.ts`) are explained in the context of config, but not as standalone utilities for developers to use in their own logic.

### CLI Commands
- [ ] **Discrepancy**: The inventory lists `jwt.generate` as the command produced by `registerJWTSecretGeneratorCommand`, but the docs refer to it as `jwt:secret`. This needs to be verified and synchronized.

## Recommendations

### 1. Verify CLI Command Names
Double-check if the command is `warlock jwt:secret` or `warlock jwt.generate`. Warlock usually follows the `:` convention.

### 2. Exported Constants
Document the `jwt` object methods (`generate`, `verify`, `generateRefreshToken`, `verifyRefreshToken`) more explicitly as a standalone utility for users who want to use JWT for non-auth purposes (e.g., email verification tokens).

### 3. Error Codes Guide
While `errorCode` is mentioned in the middleware docs, a centralized table of all `AuthErrorCodes` from `src/utils/auth-error-codes.ts` would be helpful for frontend developers.

### 4. Duration Logic
Explicitly mention that the duration format (e.g., `1d 2h`) is powered by a custom parser, so users know exactly which units are supported (which the docs already do well, but a mention of the utility function would be nice).
