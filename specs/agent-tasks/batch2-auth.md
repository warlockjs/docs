# Agent Task: Authentication Section

## Assignment

**Section**: Authentication  
**Pages**: 6  
**Priority**: HIGH (Batch 2)  
**Status**: ⏳ Not Started

---

## Pages to Write

| #   | File                 | Status |
| --- | -------------------- | ------ |
| 1   | `introduction.mdx`   | ⬜     |
| 2   | `configuration.mdx`  | ⬜     |
| 3   | `jwt.mdx`            | ⬜     |
| 4   | `middleware.mdx`     | ⬜     |
| 5   | `guards.mdx`         | ⬜     |
| 6   | `access-control.mdx` | ⬜     |

---

## STEP 1: Read Source Code First

### Auth Package

```
@warlock.js/auth/src/
├── commands/
│   ├── auth-cleanup-command.ts    # Token cleanup
│   └── jwt-secret-generator-command.ts
├── middleware/
│   └── auth.ts                    # Auth middleware
├── models/
│   ├── access-token.ts
│   └── refresh-token.ts
├── services/
│   └── auth.service.ts            # Core auth logic
├── utils/
│   └── ...
└── index.ts
```

### Efficient Reading Strategy

```
1. view_file_outline → auth.service.ts
2. grep_search "export" → find public API
3. Read middleware/auth.ts → understand request flow
4. Read models/ → token structure
```

---

## STEP 2: Key Features to Document

### JWT System

- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Token generation & validation
- `request.user` access

### Middleware

- `auth()` middleware
- Optional auth
- Guest-only routes

### Guards

- Route guards pattern
- Role-based guards
- Permission-based guards

### Access Control

- RBAC patterns
- Permission checking
- User roles

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/authentication/
├── _category_.json
├── introduction.mdx        # Auth overview, JWT flow
├── configuration.mdx       # auth.ts config
├── jwt.mdx                 # Access/refresh tokens
├── middleware.mdx          # Using auth middleware
├── guards.mdx              # Route guards
└── access-control.mdx      # RBAC, permissions
```

### Page Content Guidelines

**introduction.mdx**

- JWT-based authentication overview
- Access + Refresh token flow diagram (mermaid)
- `request.user` access

**jwt.mdx**

- Token generation
- Token validation
- Refresh token rotation
- CLI: `warlock jwt:secret`

**middleware.mdx**

- Applying auth middleware to routes
- Optional authentication
- Getting current user

**guards.mdx**

- Creating route guards
- Combining guards
- Guard helpers

---

## Code Example Pattern

```typescript
// src/app/users/routes.ts
import { router } from "@warlock.js/core";
import { auth } from "@warlock.js/auth";
import { profileController } from "./controllers/profile";

// Protected route
router.get("/profile", profileController).middleware(auth());

// Or using guard
router.group(
  {
    middleware: [auth()],
  },
  () => {
    router.get("/profile", profileController);
    router.get("/settings", settingsController);
  },
);
```

```typescript
// Accessing user in controller
export const profileController: RequestHandler = async (request, response) => {
  const user = request.user; // Current authenticated user
  return response.success({ user });
};
```

---

## Completion Criteria

- [ ] All 6 pages written
- [ ] JWT flow explained clearly
- [ ] Middleware usage documented
- [ ] Guards pattern documented
- [ ] RBAC examples included
- [ ] PROGRESS.md updated

---

## Notes

[Agent: Add notes here during work]
