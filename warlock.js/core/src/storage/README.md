# Storage

File storage abstraction layer. Supports multiple backends (local filesystem, S3, etc.) via pluggable drivers. Provides `Storage` (global), `ScopedStorage` (directory-scoped), and `StorageFile` (single file handle) with a unified API for read, write, copy, move, delete, URL generation, and streaming.

## Key Files

| File                | Purpose                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| `storage.ts`        | `Storage` class — main entry point; disk management, driver registration          |
| `scoped-storage.ts` | `ScopedStorage` — all operations scoped to a base directory                       |
| `storage-file.ts`   | `StorageFile` — single file handle with read/write/metadata operations            |
| `config.ts`         | Storage configuration defaults                                                    |
| `types.ts`          | Extensive type definitions (`StorageDriver`, `StorageConfig`, `DiskConfig`, etc.) |
| `drivers/`          | Driver implementations (local filesystem, S3, etc.)                               |
| `context/`          | Storage context for async-scoped operations                                       |
| `utils/`            | Storage utility functions                                                         |
| `STORAGE.md`        | Detailed design documentation                                                     |
| `index.ts`          | Barrel export                                                                     |

## Key Exports

- `Storage` — main storage class
- `ScopedStorage` — directory-scoped storage
- `StorageFile` — file handle
- Driver classes, config types

## Dependencies

### Internal (within `core/src`)

- `../config` — storage disk configuration
- `../utils` — path utilities

### External

- `@mongez/fs` — low-level file operations (for local driver)
- AWS SDK / S3 client (for S3 driver, if configured)

## Used By

- `http/uploaded-file.ts` — stores uploaded files
- `connectors/storage.connector` — initializes storage on startup
- `image/` — stores processed images
- Application-level file operations
