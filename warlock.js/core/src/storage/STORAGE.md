# 🗄️ Storage Module

A comprehensive, framework-level storage system for Warlock.js supporting multiple drivers with a unified API.

## Features

| Feature                                        |   Local   | S3  | R2  | Spaces |
| ---------------------------------------------- | :-------: | :-: | :-: | :----: |
| **File Operations** (put/get/delete/copy/move) |    ✅     | ✅  | ✅  |   ✅   |
| **Stream Support** (putStream/getStream)       |    ✅     | ✅  | ✅  |   ✅   |
| **Batch Delete** (deleteMany)                  |    ✅     | ✅  | ✅  |   ✅   |
| **Temporary URLs**                             | ✅ (HMAC) | ✅  | ✅  |   ✅   |
| **Presigned Uploads**                          |    ❌     | ✅  | ✅  |   ✅   |
| **Visibility (ACL)**                           |    ❌     | ✅  | ✅  |   ✅   |
| **Storage Class**                              |    ❌     | ✅  | ✅  |   ✅   |
| **Metadata**                                   |    ❌     | ✅  | ✅  |   ✅   |
| **Events/Hooks**                               |    ✅     | ✅  | ✅  |   ✅   |

---

## Quick Start

```typescript
import { storage } from "@warlock.js/core";

// Upload a file
await storage.put(buffer, "uploads/image.jpg");

// Get file contents
const buffer = await storage.get("uploads/image.jpg");

// Delete a file
await storage.delete("uploads/image.jpg");
```

---

## Configuration

```typescript
// config/storage.ts
import { storageConfig } from "@warlock.js/core";

export default storageConfig({
  default: "local",

  drivers: {
    local: {
      driver: "local",
      root: "/path/to/storage",
      urlPrefix: "/uploads",
      signatureKey: "your-secret-key", // For temporary URLs
    },

    s3: {
      driver: "s3",
      bucket: "my-bucket",
      region: "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      urlPrefix: "https://cdn.example.com",
    },

    r2: {
      driver: "r2",
      bucket: "my-bucket",
      region: "auto",
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      accountId: process.env.R2_ACCOUNT_ID,
      publicDomain: "files.example.com",
    },

    spaces: {
      driver: "spaces",
      bucket: "my-space",
      region: "nyc3",
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
    },
  },

  // Optional: Dynamic driver selection (multi-tenancy)
  resolver: async () => {
    const tenant = getCurrentTenant();
    return tenant?.storageDriver || "local";
  },
});
```

---

## StorageFile Class

All put/copy/move operations return a `StorageFile` instance with cached metadata.

### Getting a StorageFile Instance

```typescript
// From put operations (returns with cached metadata)
const file = await storage.put(buffer, "uploads/image.jpg");
file.hash; // "sha256:abc123..." (from put, no extra fetch)
file.url; // "/uploads/uploads/image.jpg"

// From existing file path (fetches metadata on demand)
const file = await storage.file("uploads/image.jpg");
```

### Properties (Sync)

```typescript
file.name; // "image.jpg"
file.extension; // "jpg"
file.path; // "uploads/image.jpg"
file.directory; // "uploads"
file.url; // Public URL (cached or computed)
file.absolutePath; // Full path (local driver only)
file.driver; // "local" | "s3" | "r2" | "spaces"
file.hash; // SHA-256 hash (from put operations)
file.isDeleted; // false
```

### Data Methods (Async, Lazy Loaded)

```typescript
const data = await file.data(); // Full StorageFileData
const size = await file.size(); // Size in bytes
const mime = await file.mimeType(); // "image/jpeg"
const date = await file.lastModified(); // Date object
const etag = await file.etag(); // ETag (cloud)
```

### Content Methods

```typescript
const buffer = await file.contents(); // Buffer
const stream = await file.stream(); // Readable stream
const text = await file.text(); // UTF-8 string
const base64 = await file.base64(); // Base64 string
const dataUrl = await file.dataUrl(); // data:image/jpeg;base64,...
```

### File Operations

```typescript
// Copy (returns new StorageFile at destination)
const backup = await file.copy("backup/image.jpg");

// Move (returns same StorageFile with updated path)
await file.move("archive/image.jpg");

// Rename (move in same directory)
await file.rename("new-name.jpg");

// Delete
await file.delete();
```

### Cloud-Specific Methods

```typescript
await file.setVisibility("public");
const visibility = await file.getVisibility();
await file.setStorageClass("GLACIER");
```

---

## File Operations

### Basic Operations

```typescript
// Store a file
const file = await storage.put(buffer, "path/to/file.jpg", {
  mimeType: "image/jpeg",
  cacheControl: "max-age=31536000",
  visibility: "public",
});

// Store from various sources
await storage.putFromUrl("https://example.com/image.jpg", "downloads/image.jpg");
await storage.putFromBase64("data:image/png;base64,...", "uploads/image.png");

// Retrieve file
const buffer = await storage.get("path/to/file.jpg");

// Check existence
if (await storage.exists("path/to/file.jpg")) { ... }

// Get public URL
const url = storage.url("path/to/file.jpg");

// Copy and move
await storage.copy("source.jpg", "destination.jpg");
await storage.move("old-path.jpg", "new-path.jpg");

// List files
const files = await storage.list("uploads/", { recursive: true, limit: 100 });
```

### Stream Operations (Large Files)

```typescript
import { createReadStream } from "fs";

// Upload from stream
const stream = createReadStream("/path/to/large-file.zip");
await storage.putStream(stream, "uploads/large-file.zip");

// Download as stream
const downloadStream = await storage.getStream("uploads/large-file.zip");
downloadStream.pipe(response);
```

### Batch Operations

```typescript
// Delete multiple files at once
const results = await storage.deleteMany([
  "uploads/file1.jpg",
  "uploads/file2.jpg",
  "uploads/file3.jpg",
]);

// Check results
results.forEach(({ location, deleted, error }) => {
  console.log(`${location}: ${deleted ? "deleted" : error}`);
});
```

---

## Temporary URLs

### Generate a Temporary URL

```typescript
// Get a temporary URL (expires in 1 hour by default)
const url = await storage.temporaryUrl("private/document.pdf");
// Returns: /temp-files/eyJwYXRoIjoicHJpdmF0ZS9kb2N1bWVudC5wZGYiLCJleHAiOjE3MDMwMDE2MDAsInNpZyI6IjEyMzQ1NiJ9

// Custom expiration (30 minutes)
const url = await storage.temporaryUrl("private/document.pdf", 1800);
```

### Validate a Token (Route Handler)

```typescript
import { storage } from "@warlock.js/core";

// Route to serve temporary files: GET /temp-files/:token
router.get("/temp-files/:token", async (request, response) => {
  const result = await storage.validateTemporaryToken(request.params.token);

  if (!result.valid) {
    return response.status(403).json({ error: result.error });
    // error: "expired" | "invalid_signature" | "invalid_token" | "missing_key" | "file_not_found"
  }

  // For local driver - use sendFile for maximum efficiency
  if (result.absolutePath) {
    response.header("Content-Type", result.mimeType);
    return response.sendFile(result.absolutePath);
  }

  // For cloud driver - stream the file (or redirect to presigned URL)
  const stream = await result.getStream!();
  response.header("Content-Type", result.mimeType);
  stream.pipe(response.raw);
});
```

### Validation Result

```typescript
type TemporaryTokenValidation = {
  valid: boolean;
  error?: "expired" | "invalid_signature" | "invalid_token" | "missing_key" | "file_not_found";

  // Available when valid:
  path?: string; // Relative path: "private/document.pdf"
  absolutePath?: string; // Full path: "/var/storage/private/document.pdf" (local only)
  expiresAt?: Date; // Expiration time
  mimeType?: string; // Auto-detected: "application/pdf"
  driver?: StorageDriverContract;

  // Convenience methods:
  getFile?: () => Promise<Buffer>;
  getStream?: () => Promise<Readable>;
};
```

### Cloud Presigned URLs

```typescript
// For cloud drivers, get presigned download URL
const presignedUrl = await storage.getPresignedUrl("file.pdf", { expiresIn: 3600 });

// Get presigned upload URL (for direct browser uploads)
const uploadUrl = await storage.getPresignedUploadUrl("uploads/new-file.pdf", {
  contentType: "application/pdf",
  expiresIn: 3600,
});
```

---

## Metadata

```typescript
// Get file info without downloading
const info = await storage.metadata("uploads/image.jpg");
// { path, name, size, isDirectory, lastModified, mimeType, etag, storageClass }

// Get just the size
const size = await storage.size("uploads/image.jpg");
```

---

## Cloud-Specific Features

### Visibility (ACL)

```typescript
// Make file public
await storage.setVisibility("uploads/image.jpg", "public");

// Make file private
await storage.setVisibility("uploads/image.jpg", "private");

// Check visibility
const visibility = await storage.getVisibility("uploads/image.jpg");
```

### Storage Class

```typescript
// Move to cheaper storage tier
await storage.setStorageClass("archives/old-file.zip", "GLACIER");
```

---

## Events

```typescript
// Listen to storage events
storage.on("beforePut", async ({ driver, location, size }) => {
  console.log(`Uploading ${location} (${size} bytes)`);
});

storage.on("afterPut", async ({ driver, location, file }) => {
  console.log(`Uploaded ${file.url}`);
});

storage.on("beforeDelete", async ({ driver, location }) => {
  await logDeletion(location);
});

storage.on("afterDelete", async ({ driver, location }) => {
  await clearCache(location);
});

// Remove listener
storage.off("afterPut", handler);
```

**Available Events:**

- `beforePut` / `afterPut`
- `beforeDelete` / `afterDelete`
- `beforeCopy` / `afterCopy`
- `beforeMove` / `afterMove`

---

## Driver Selection

```typescript
// Use default driver
await storage.put(buffer, "file.jpg");

// Use specific driver
await storage.use("s3").put(buffer, "file.jpg");

// Use cloud driver with full capabilities
const cloudDriver = storage.useCloud("s3");
await cloudDriver.setVisibility("file.jpg", "public");

// Check if current driver is cloud
if (await storage.isCloud()) {
  await storage.setVisibility("file.jpg", "public");
}
```

---

## Path Helpers

```typescript
// Get absolute filesystem path (local driver only)
const absolutePath = await storage.path("uploads/image.jpg");

// Prepend a prefix
const path = storage.prepend("tenant-123", "uploads/image.jpg");
// → "tenant-123/uploads/image.jpg"

// Append suffix before extension
const thumb = storage.append("image.jpg", "_thumb");
// → "image_thumb.jpg"
```

---

## Architecture

```
@warlock.js/core/storage/
├── storage.ts          # Main Storage facade
├── config.ts           # Configuration accessor
├── types.ts            # TypeScript types & contracts
├── index.ts            # Public exports
├── STORAGE.md          # This documentation
├── drivers/
│   ├── local-driver.ts   # Local filesystem driver
│   ├── cloud-driver.ts   # Abstract S3-compatible base
│   ├── s3-driver.ts      # AWS S3 driver
│   ├── r2-driver.ts      # Cloudflare R2 driver
│   └── do-spaces-driver.ts # DigitalOcean Spaces driver
└── utils/
    └── mime.ts           # MIME type utilities
```

---

## Type Reference

```typescript
// File result
type StorageFile = {
  path: string;
  url: string;
  size: number;
  hash: string;
  mimeType: string;
  driver: string;
};

// Put options
type PutOptions = {
  mimeType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
  visibility?: "public" | "private";
};

// File info
type StorageFileInfo = {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  lastModified?: Date;
  mimeType?: string;
  etag?: string;
  storageClass?: string;
};
```
