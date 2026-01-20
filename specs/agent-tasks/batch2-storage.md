# Agent Task: Storage Section

## Assignment

**Section**: Storage  
**Pages**: 6  
**Priority**: MEDIUM-HIGH (Batch 2)  
**Status**: ⏳ Not Started

---

## Pages to Write

| #   | File                  | Status |
| --- | --------------------- | ------ |
| 1   | `introduction.mdx`    | ⬜     |
| 2   | `configuration.mdx`   | ⬜     |
| 3   | `drivers.mdx`         | ⬜     |
| 4   | `file-operations.mdx` | ⬜     |
| 5   | `urls.mdx`            | ⬜     |
| 6   | `scoped-storage.mdx`  | ⬜     |

---

## STEP 1: Read Source Code First

### Storage System

```
@warlock.js/core/src/storage/
├── storage.ts             # 32KB - Main storage class
├── scoped-storage.ts      # 21KB - Scoped storage
├── storage-file.ts        # 11KB - File abstraction
├── types.ts               # 24KB - Type definitions
├── drivers/               # Storage drivers
│   ├── local/
│   └── s3/
├── context/               # Storage context
└── utils/
```

### Efficient Reading Strategy

```
1. view_file_outline → storage.ts, scoped-storage.ts
2. grep_search "export class" → find main classes
3. grep_search "public " → find public methods
4. Read drivers/ for driver-specific features
```

---

## STEP 2: Key Features to Document

### Multi-Driver System

- Local driver (file system)
- S3 driver (AWS S3, compatible services)
- Driver switching

### File Operations

- Upload files
- Move, copy, delete
- Read file contents
- Stream files

### URL Generation

- Public URLs
- Signed URLs (temporary access)
- Custom URL handlers

### Scoped Storage

- Per-user storage
- Per-tenant storage (multi-tenancy)
- Scoped paths

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/storage/
├── _category_.json
├── introduction.mdx        # Storage system overview
├── configuration.mdx       # storage.ts config
├── drivers.mdx             # Local, S3 drivers
├── file-operations.mdx     # CRUD on files
├── urls.mdx                # Public, signed URLs
└── scoped-storage.mdx      # Per-user, per-tenant
```

### Page Content Guidelines

**introduction.mdx**

- Multi-driver architecture
- When to use Storage vs direct file handling
- Basic usage example

**drivers.mdx**

- Local driver setup
- S3 driver setup (AWS, DigitalOcean Spaces, MinIO)
- Switching drivers per environment

**file-operations.mdx**

- `storage.put(path, content)`
- `storage.get(path)`
- `storage.move()`, `storage.copy()`, `storage.delete()`
- Working with UploadedFile

**urls.mdx**

- `storage.url(path)` - public URL
- `storage.signedUrl(path, expiry)` - temporary URL
- URL customization

**scoped-storage.mdx**

- Creating scoped storage
- User-specific paths
- Multi-tenant patterns

---

## Code Example Pattern

```typescript
// src/config/storage.ts
import { env } from "@warlock.js/core";

export const storage = {
  default: env("STORAGE_DRIVER", "local"),

  drivers: {
    local: {
      root: "storage",
      publicPath: "/uploads",
    },
    s3: {
      bucket: env("S3_BUCKET"),
      region: env("S3_REGION"),
      accessKeyId: env("S3_ACCESS_KEY"),
      secretAccessKey: env("S3_SECRET_KEY"),
    },
  },
};
```

```typescript
// Using storage
import { storage } from "@warlock.js/core";

// Upload file
await storage.put("avatars/user-123.jpg", fileBuffer);

// Get public URL
const url = storage.url("avatars/user-123.jpg");

// Get signed URL (expires in 1 hour)
const signedUrl = storage.signedUrl("private/document.pdf", "1h");

// Scoped storage
const userStorage = storage.scope(`users/${userId}`);
await userStorage.put("avatar.jpg", file);
```

---

## Completion Criteria

- [ ] All 6 pages written
- [ ] Both drivers documented (Local, S3)
- [ ] File operations fully covered
- [ ] URL generation documented
- [ ] Scoped storage explained
- [ ] PROGRESS.md updated

---

## Notes

[Agent: Add notes here during work]
