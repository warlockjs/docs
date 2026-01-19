# Warlock.js Core Package Deep-Dive (v4)

## Overview

`@warlock.js/core` is the main framework package with **23 modules** that integrate all standalone packages and provide the foundation for building applications.

---

## 1. Router System

### Router Class (802 lines, 41 methods)

**Location**: [router.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/router/router.ts)

#### Core HTTP Methods

- `get()` - GET requests
- `post()` - POST requests
- `put()` - PUT requests
- `delete()` - DELETE requests
- `patch()` - PATCH requests
- `head()` - HEAD requests
- `options()` - OPTIONS requests
- `any()` - All HTTP methods

#### Advanced Routing

- `route(path)` - Returns RouteBuilder for fluent chaining
- `group(options, callback)` - Group routes with shared options
- `prefix(prefix, callback)` - Add prefix to routes
- `restfulResource(resource, options)` - Generate full RESTful routes

#### Static Files & Proxying

- `directory(options)` - Serve static directory
- `file(path, location, cacheTime?)` - Serve single file
- `cachedFile(path, location, cacheTime?)` - Cached file (1 year default)
- `files(files, cacheTime?)` - Serve multiple files
- `cachedFiles(files, cacheTime?)` - Serve multiple cached files
- `proxy(path, baseUrl, options?)` - HTTP proxy using @fastify/http-proxy

#### Redirects

- `redirect(from, to, mode?)` - Redirect (temporary/permanent)

#### Lifecycle Hooks

- `beforeScanning(callback)` - Before routes scan
- `afterScanning(callback)` - After routes scan

#### Route Management

- `list()` - Get all registered routes

### RouteBuilder Class (234 lines, 21 methods)

**Location**: [route-builder.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/router/route-builder.ts)

Fluent API for building routes:

#### HTTP Methods

- `get(handler, options?)` - GET
- `post(handler, options?)` - POST
- `put(handler, options?)` - PUT
- `delete(handler, options?)` - DELETE
- `patch(handler, options?)` - PATCH

#### Resource Methods (with /:id)

- `getOne(handler, options?)` - GET /:id
- `postOne(handler, options?)` - POST /:id
- `updateOne(handler, options?)` - PUT /:id
- `deleteOne(handler, options?)` - DELETE /:id
- `patchOne(handler, options?)` - PATCH /:id

#### RESTful Semantic Aliases

- `list()` - Alias for GET (collection)
- `create()` - Alias for POST
- `show()` - Alias for GET /:id
- `update()` - Alias for PUT /:id
- `destroy()` - Alias for DELETE /:id

#### Advanced Features

- `nest(path, options?)` - Create nested routes
  ```typescript
  router
    .route("/posts/:id")
    .getOne(showPost)
    .nest("/comments")
    .list(listComments) // GET /posts/:id/comments
    .create(createComment); // POST /posts/:id/comments
  ```
- `crud(handlers, options?)` - Set up all CRUD routes at once
  ```typescript
  router.route("/posts").crud({
    list: listPosts, // GET /posts
    create: createPost, // POST /posts
    show: showPost, // GET /posts/:id
    update: updatePost, // PUT /posts/:id
    destroy: deletePost, // DELETE /posts/:id
    patch: patchPost, // PATCH /posts/:id
  });
  ```

---

## 2. HTTP Layer

### Request Class (956 lines, 77 methods)

**Location**: [request.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/http/request.ts)

#### Input Handling

- `input(key, defaultValue?)` - Get input value
- `only(keys)` - Get only specified inputs
- `except(keys)` - Get all except specified inputs
- `all()` - Get all inputs
- `int(key, defaultValue?)` - Get integer input
- `float(key, defaultValue?)` - Get float input
- `number(key, defaultValue?)` - Get number input
- `bool(key, defaultValue?)` - Get boolean input
- `string(key, defaultValue?)` - Get string input
- `validated(inputs?)` - Get validated inputs only

#### File Uploads

- `file(key)` - Get uploaded file
- `files(key?)` - Get uploaded files
- `hasFile(key)` - Check if file exists

#### HTTP Metadata

- `method()` - Get HTTP method
- `path()` / `url()` - Get current path
- `fullUrl()` - Get full URL
- `protocol()` - Get protocol (http/https)
- `domain()` - Get domain
- `hostname()` - Get hostname
- `origin()` - Get origin
- `originDomain()` - Get origin domain

#### Headers

- `header(name, defaultValue?)` - Get header value
- `authorization()` - Get Authorization header
- `authorizationValue()` - Get authorization value
- `accessToken()` - Extract Bearer token

#### Authentication

- `user` - Current user property
- `decodedAccessToken` - Decoded JWT token
- `clearCurrentUser()` - Clear user

#### Localization

- `locale()` / `locale(code)` - Get/set locale code
- `localized()` - Get effective locale code
- `setLocaleCode(code)` - Set locale
- `getLocaleCode(defaultCode?)` - Get locale with fallback
- `trans(key, placeholders?)` - Translate
- `transFrom(locale, key, placeholders?)` - Translate from locale

#### Validation

- `validate(validation, selectedInputs?)` - Validate request

#### Route Info

- `route` - Current route
- `setRoute(route)` - Set route

#### Middleware

- `runMiddleware()` - Execute middleware

#### Events

- `trigger(eventName, ...args)` - Trigger event
- `on(eventName, callback)` - Listen to event

#### Logging

- `log(message, level?)` - Log message

#### Static Access

- `Request.current` - Access current request globally
- `Request.setRequest(request)` - Set current request

### Response Class (1139 lines, 69 methods)

**Location**: [response.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/http/response.ts)

#### Content Sending

- `send(data?, statusCode?, triggerEvents?)` - Send response
- `html(data, statusCode?)` - Send HTML
- `xml(data, statusCode?)` - Send XML
- `text(data, statusCode?)` - Send plain text
- `json(data, statusCode?)` - Send JSON (implicit)

#### React Integration

- `render(element, status?)` - Render React component

#### File Handling

- `sendFile(path, options?)` - Send file
- `sendBuffer(buffer, options?)` - Send buffer
- `download(path, filename?)` - Download file

#### Streaming 🆕

- `stream(contentType?)` - Create streaming response
  - Returns controller with:
    - `send(data)` - Send chunk
    - `render(element)` - Render React chunk
    - `end()` - End stream

#### Status Codes

- `status(code)` - Set status code
- `statusCode()` - Get status code
- `isOk()` - Check if 2xx

#### Standard Responses

- `success(data, statusCode?)` - Success response
- `badRequest(data)` - 400 error
- `unauthorized(data)` - 401 error
- `forbidden(data)` - 403 error
- `notFound(data)` - 404 error
- `serverError(data)` - 500 error
- `methodNotAllowed(data)` - 405 error
- `conflict(data)` - 409 error
- `tooManyRequests(data)` - 429 error
- `serviceUnavailable(data)` - 503 error

#### Headers

- `header(key, value)` / `setHeader()` - Set header
- `headers(headers)` - Set multiple headers
- `contentType()` / `setContentType(type)` - Content type

#### Redirects

- `redirect(url, statusCode?)` - Redirect to URL

#### Body Management

- `body()` / `body(data)` - Get/set response body

#### Lifecycle

- `onSending(callback)` - Before sending
- `onSent(callback)` - After sent
- `sent()` - Check if sent
- `trigger(event, ...args)` - Trigger event
- `on(event, listener)` - Listen to event

#### Logging

- `log(message, level?)` - Log message

#### Parsing

- `parse(value)` - Parse output value
- `parseBody()` - Parse response body

### UploadedFile Class (23KB)

**Location**: [uploaded-file.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/http/uploaded-file.ts)

Full-featured file upload handling with validation, transformations, and storage.

---

## 3. RESTful Controllers

### Restful Class (438 lines, 22 methods)

**Location**: [restful.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/restful/restful.ts)

Abstract base for RESTful controllers with:

#### CRUD Operations

- `list(request, response)` - List all records
- `get(request, response)` - Get single record
- `create(request, response)` - Create record
- `update(request, response)` - Update record
- `patch(request, response)` - Patch record
- `delete(request, response)` - Delete record
- `bulkDelete(request, response)` - Delete multiple

#### Lifecycle Hooks

**Create Lifecycle**:

- `beforeCreate(request, response, record)` - Before save
- `onCreate(request, response, record)` - After save

**Update Lifecycle**:

- `beforeUpdate(request, response, record, oldRecord)` - Before update
- `onUpdate(request, response, record, oldRecord)` - After update

**Patch Lifecycle**:

- `beforePatch(request, response, record, oldRecord)` - Before patch
- `onPatch(request, response, record, oldRecord)` - After patch

**Delete Lifecycle**:

- `beforeDelete(request, response, record)` - Before delete
- `onDelete(request, response, record)` - After delete

**Save Lifecycle (Create/Update)**:

- `beforeSave(request, response, record, oldRecord?)` - Before any save
- `onSave(request, response, record, oldRecord?)` - After any save

#### Middleware

- `middleware` - Define per-method middleware
- `callMiddleware(method, request, response, record?)` - Execute middleware

#### Utilities

- `find(id)` - Find record by ID
- `recordName` - Singular name for output
- `recordsListName` - Plural name for output
- `repository` - Abstract repository property

---

## 4. Repository Pattern

### RepositoryManager Class (1308 lines, 90 methods, 35KB)

**Location**: [repository.manager.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/repositories/repository.manager.ts)

Massive ORM-agnostic data access layer.

#### Finding Records

- `find(id)` - Find by ID
- `findBy(column, value)` - Find by column
- `findActive(id)` - Find active by ID
- `findByActive(column, value)` - Find active by column
- `first(options?)` - Get first record
- `firstCached(options?)` - Get first cached
- `firstActive(options?)` - Get first active
- `firstActiveCached(options?)` - Get first active cached
- `last(options?)` - Get last
- `lastCached(options?)` - Get last cached
- `lastActive(options?)` - Get last active
- `lastActiveCached(options?)` - Get last active cached

#### Listing & Pagination

- `list(options?)` - List with pagination
  - Supports page-based pagination
  - Supports cursor-based pagination
- `listCached(options?)` - List with caching
- `listActive(options?)` - List active records
- `listActiveCached(options?)` - List active cached
- `all(options?)` - Get all records (no pagination)
- `allActive(options?)` - Get all active

#### Aggregation

- `count(options?)` - Count records
- `countActive(options?)` - Count active
- `sum(column, options?)` - Sum column
- `avg(column, options?)` - Average
- `min(column, options?)` - Minimum
- `max(column, options?)` - Maximum

#### Chunking

- `chunk(size, callback, options?)` - Process in chunks
- `chunkActive(size, callback, options?)` - Chunk active records

#### Filtering 🆕

- `filterBy` - Define filter rules
  - `"="` - Exact match
  - `"in"` - IN clause
  - `"scope"` 🆕 - Apply query scope
  - `"where"` - Custom where
  - `"between"` - Range filter

Example:

```typescript
  protected filterBy = {
    email: "=",
    role: "in",
    active: "scope", // 🆕 Calls query.scope("active")
  };
```

#### CRUD Operations

- `create(data)` - Create record
- `update(id, data)` - Update by ID
- `patch(id, data)` - Patch record
- `updateBy(column, value, data)` - Update by column
- `patchBy(column, value, data)` - Patch by column
- `deleteColumn(id)` - Delete by ID
- `destroy(id)` - Hard delete
- `bulkDelete(ids)` - Delete multiple

#### Caching

- `cache()` - Get cache driver
- `flushCache()` - Clear all cache
- `flushCacheFor(record)` - Clear cache for record

#### Events

- `registerEvents()` - Register model events
- `cleanupEvents()` - Unregister events

#### Query Building

- `newQuery()` - Create query builder
- `adapter()` - Get adapter (Cascade, Prisma, etc.)

#### Model Creation

- `newModel(data?)` - Create model instance
- `getName()` - Get repository name

---

## 5. Validation Module

### Integration with Seal

**Location**: [validation](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/validation)

#### Structure

- `init.ts` - Initialize Seal with Warlock config
- `validateAll.ts` - Validate all inputs
- `database/` - Database validation rules (unique, exists)
- `file/` - File upload validation
- `plugins/` - Validation plugins
- `validators/` - Custom validators

#### Framework-Specific Features

- `FileValidator` - File upload validation
- `unique()` - Database uniqueness check
- `exists()` - Database existence check
- Integration with localization
- Integration with request validation

---

## 6. CLI System

**Location**: [cli](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/cli)

### Files (13 total)

- `cli-command.ts` (6.5KB) - Base command class
- `cli-commands.manager.ts` (13KB) - Command registry
- `cli-commands.utils.ts` (8KB) - Utilities
- `commands-loader.ts` - Auto-load commands
- `parse-cli-args.ts` - Argument parser
- `string-similarity.ts` - Command suggestions
- `framework-cli-commands.ts` - Built-in commands
- `commands/` - Command implementations

### Features

- Command registration
- Argument parsing
- Command suggestions (fuzzy matching)
- Auto-loading from directories
- Framework built-in commands

---

## 7. Mail System

**Location**: [mail](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/mail)

### Files (9 total)

- `mail.ts` (7.3KB) - Main mail class
- `send-mail.ts` (12KB) - Sending logic
- `mailer-pool.ts` (4.2KB) - Connection pooling
- `react-mail.ts` 🆕 - React email templates
- `test-mailbox.ts` - Testing utilities
- `config.ts` - Mail configuration
- `events.ts` - Mail events
- `types.ts` - Type definitions

### Features

- Multiple mail drivers
- Connection pooling
- React email templates 🆕
- Test mailbox for development
- Event system (onSending, onSent, onFailed)
- Queue integration

---

## 8. Storage System

**Location**: [storage](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/storage)

### Main Files

- `storage.ts` (32KB) - Main storage class
- `scoped-storage.ts` (21KB) - Scoped storage
- `storage-file.ts` (11KB) - File abstraction
- `types.ts` (24KB) - Type definitions
- `drivers/` - Storage drivers (local, S3, etc.)
- `context/` - Storage context
- `utils/` - Utilities

### Features

- Multi-driver support (Local, S3, etc.)
- Scoped storage (per-user, per-tenant)
- File manipulation (move, copy, delete)
- URL generation (public, signed)
- File metadata
- Stream support

---

## 9. Image Processing

**Location**: [image](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/image)

### Files

- `image.ts` (20KB) - Image manipulation

### Features

- Resize, crop, rotate
- Format conversion
- Quality adjustment
- Watermarking
- Thumbnail generation
- Integration with storage system

---

## 10. Database Integration

**Location**: [database](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/database)

Integrates `@warlock.js/cascade`:

- Connection management
- Migration runner
- Seeder support
- Model registry
- Transaction handling

---

## 11. Cache Integration

**Location**: [cache](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/cache)

Integrates `@warlock.js/cache`:

- Cache manager
- Tagged cache
- Driver configuration
- Cache utilities

---

## 12. Logger Integration

**Location**: [logger](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/logger)

Integrates `@warlock.js/logger`:

- Log channels
- Log levels
- Formatters
- File logging
- Console logging

---

## 13. React Integration

**Location**: [react](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/react)

### Features

- Server-side rendering (SSR)
- React component rendering in responses
- React email templates
- Streaming React components 🆕

---

## 14. Bootstrap & Application

**Location**: [bootstrap](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/bootstrap), [application.ts](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/application.ts)

### Features

- Application lifecycle
- Service providers
- Bootstrapping process
- Environment setup
- Configuration loading

---

## 15. Configuration

**Location**: [config](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/config), [warlock-config](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/warlock-config)

### Features

- Environment-based config
- Config merging
- Type-safe config access
- Config validation
- Warlock-specific configs

---

## 16. Dev Server Tools

**Location**: [dev2-server](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/dev2-server)

### Features

- Health check endpoints
- Connectors for external services
- Development utilities
- Hot reload support

---

## 17. Production Tools

**Location**: [production](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/production)

Production deployment utilities

---

## 18. Resource Layer

**Location**: [resource](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/resource)

API resource transformations

---

## 19. Store (State Management)

**Location**: [store](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/store)

Server-side state management

---

## 20. Utilities

**Location**: [utils](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/utils)

Framework utilities and helpers

---

## 21. Manifest Generation

**Location**: [manifest](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/manifest)

Generate application manifests

---

## 22. Generations (Code Generators)

**Location**: [generations](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/generations)

Code generation utilities for scaffolding

---

## 23. HTTP Middleware & Plugins

**Location**: [http/middleware](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/http/middleware), [http/plugins](file:///d:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/@warlock.js/core/src/http/plugins)

### Middleware

- Request context injection
- CORS
- Authentication
- Rate limiting
- Body parsing

### Plugins

- HTTP plugin system
- Fastify plugin integration

---

## Existing v3 Documentation Structure

Found in `docs/warlock/`:

1. **getting-started/** (8 files)
2. **http/** (11 files) - Request, Response, Routes, RESTful, Middleware, Output, Uploaded Files, Configurations
3. **validation/** (43 files) - Extensive validation docs
4. **repositories/** (5 files)
5. **auth/** (7 files)
6. **database/** (4 files)
7. **upload/** (9 files)
8. **logger/** (3 files)
9. **mail/** (3 files)
10. **cache/**
11. **image/** (2 files)
12. **localization/** (6 files)
13. **utils/** (9 files)
14. **production/** (2 files)
15. **advanced/** (2 files)

---

## Key v4 Enhancements in Core

### 1. Router Enhancements

- ✅ RESTful semantic aliases (`list`, `create`, `show`, `update`, `destroy`)
- ✅ Route nesting via `RouteBuilder.nest()`
- ✅ CRUD builder via `RouteBuilder.crud()`
- ✅ Proxy support via `@fastify/http-proxy`
- ✅ Cached file serving

### 2. Response Enhancements

- ✅ Streaming API with `response.stream()`
- ✅ React component streaming
- ✅ Buffer sending
- ✅ More granular lifecycle hooks

### 3. Repository Enhancements

- ✅ Scope filters (`filterBy: { active: "scope" }`)
- ✅ Adapter pattern (Cascade, Prisma-ready)
- ✅ Cursor-based pagination
- ✅ Enhanced caching
- ✅ Chunking methods

### 4. Validation Enhancements

- ✅ Integration with Seal (18 validators)
- ✅ Plugin system
- ✅ Database validation rules
- ✅ File validation

### 5. Mail Enhancements

- ✅ React email templates
- ✅ Mailer pooling
- ✅ Test mailbox

### 6. Storage System

- ✅ Multi-driver architecture
- ✅ Scoped storage
- ✅ Signed URLs
- ✅ Stream support

### 7. Image Processing

- ✅ Full image manipulation
- ✅ Integration with storage

### 8. CLI System

- ✅ Command fuzzy matching
- ✅ Auto-loading
- ✅ Better argument parsing

---

## Documentation Upgrade Priority for Core

### High Priority (Breaking/Large Changes)

1. **Router** - Document new RouteBuilder API, nesting, CRUD
2. **Repositories** - Document scope filters, adapter pattern
3. **Response** - Document streaming API
4. **Validation** - Document Seal integration
5. **Mail** - Document React templates

### Medium Priority (Enhancements)

6. **Storage** - New system, full docs needed
7. **Image** - Full image processing docs
8. **CLI** - Enhanced CLI features
9. **RESTful** - Document lifecycle hooks clearly

### Low Priority (Minor Changes)

10. **Cache** - Integration updates
11. **Logger** - Integration updates
12. **Config** - Standard updates
13. **Utils** - New utilities

---

## Summary

The Core package is **massive and feature-rich**:

- **HTTP Layer**: 146 methods across Request/Response
- **Router**: 62 methods across Router/RouteBuilder
- **Repository**: 90 methods with adapter pattern
- **RESTful**: Complete CRUD with lifecycle hooks
- **Validation**: Full Seal integration
- **CLI**: Comprehensive command system
- **Mail**: React template support
- **Storage**: Multi-driver file system
- **Image**: Full image manipulation
- **React**: SSR and streaming

Most features existed in v3 but have been **significantly enhanced** in v4, particularly:

- Router (nesting, semantic aliases, CRUD builder)
- Repositories (scopes, adapters, cursor pagination)
- Response (streaming)
- Validation (Seal integration)
- Mail (React templates)
- Storage (new comprehensive system)
