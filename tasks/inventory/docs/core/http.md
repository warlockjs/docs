# @warlock.js/core Audit — HTTP

**Status:** 🟡 Significant Gaps

**Source scanned:** `warlock.js/core/src/http/`

---

## Coverage Map

| Feature | Source Export | Doc Coverage | Gap |
|---------|--------------|-------------|-----|
| HTTP introduction | (conceptual) | `http/introduction.mdx` | 🟢 OK |
| Routing basics | `router` (from router module) | `http/routing-basics.mdx` | 🟢 OK |
| Route groups | `router.group()`, `router.prefix()`, `router.version()` | `http/route-groups.mdx`, `http/api-versioning.mdx` | 🟢 OK |
| Route builder | `router.route()` fluent API | `http/route-builder.mdx` | 🟢 OK |
| `Request` class | `Request` | `http/request.mdx` | 🟡 Incomplete |
| `Response` class | `Response` | `http/response.mdx` | 🟡 Incomplete |
| `UploadedFile` class | `UploadedFile` | `http/file-uploads.mdx` | 🟡 Incomplete |
| Middleware | (function-based) | `http/middleware.mdx` | 🟡 Incomplete |
| Error classes | `HttpError`, `ResourceNotFoundError`, `UnAuthorizedError`, `ForbiddenError`, `BadRequestError`, `ServerError`, `ConflictError`, `NotAcceptableError`, `NotAllowedError` | `http/error-handling.mdx` | 🟡 Incomplete |
| CORS config | `HttpConfigurations.cors` | `http/cors.mdx` | 🟢 OK |
| Rate limiting config | `HttpConfigurations.rateLimit` | `http/rate-limiting.mdx` | 🟢 OK |
| RESTful controllers | `Restful` class | `http/restful/overview.mdx`, `http/restful/controllers.mdx`, `http/restful/lifecycle-hooks.mdx`, `http/restful/validation.mdx` | 🟢 OK |
| Request context | `RequestContext`, `requestContext`, `useRequestStore`, `useRequest`, `useCurrentUser`, `RequestContextStore` | — | 🔴 Missing |
| Cache response middleware | `cacheMiddleware`, `CacheMiddlewareOptions` | — | 🔴 Missing |
| `t()` helper | `t` (from `inject-request-context`) | — | 🔴 Missing |
| `fromRequest()` helper | `fromRequest` | — | 🔴 Missing |
| `createHttpApplication` / `stopHttpApplication` | `createHttpApplication`, `stopHttpApplication` | — | 🔴 Missing |
| Server functions | `startServer`, `getServer` | — | 🔴 Missing |
| HTTP config API | `httpConfig`, `defaultHttpConfigurations` | partial in `http/cors.mdx`, `http/rate-limiting.mdx` | 🟡 Incomplete |
| Upload config API | `uploadsConfig`, `UPLOADS_DEFAULTS` | — | 🔴 Missing |
| Upload types | `SaveOptions`, `SaveAsOptions`, `PrefixConfig`, `FileNamingStrategy`, `ImageTransformConfig`, `UploadsConfigurations`, `UploadedFileImageOptions` | `http/file-uploads.mdx` (partial, no type reference) | 🟡 Incomplete |
| Response events API | `Response.on()` (static) | `http/response.mdx` (mentioned), `http/error-handling.mdx` (mentioned) | 🟡 Incomplete |
| SSE (`response.sse()`) | `ResponseSSEController` | — | 🔴 Missing |
| Streaming (`response.stream()`) | `ResponseStreamController` | `http/response.mdx` (covered) | 🟢 OK |
| Response cookies | `response.cookie()`, `response.clearCookie()` | — | 🔴 Missing |
| Request cookies | `request.cookies`, `request.cookie()`, `request.hasCookie()` | — | 🔴 Missing |
| `request.set()` / `request.get()` / `request.unset()` | `Request` | — | 🔴 Missing |
| `request.heavy()` / `request.heavyExceptParams()` | `Request` | mentioned in restful docs only | 🟡 Incomplete |
| `request.email()` | `Request` | — | 🔴 Missing |
| `request.pluck()` | `Request` | — | 🔴 Missing |
| `request.allExceptParams()` | `Request` | — | 🔴 Missing |
| `request.setDefault()` | `Request` | — | 🔴 Missing |
| `response.sendBuffer()` | `Response`, `SendBufferOptions` | — | 🔴 Missing |
| `response.sendImage()` | `Response` | — | 🔴 Missing |
| `response.download()` / `response.downloadFile()` | `Response` | — | 🔴 Missing |
| `response.accepted()` | `Response` | — | 🔴 Missing |
| `response.noContent()` | `Response` | — | 🔴 Missing |
| `response.serviceUnavailable()` | `Response` | — | 🔴 Missing |
| `response.unprocessableEntity()` | `Response` | — | 🔴 Missing |
| `response.conflict()` | `Response` | mentioned in error-handling table only | 🟡 Incomplete |
| `response.render()` | `Response` | `http/response.mdx` (covered) | 🟢 OK |
| `request.on()` / `request.trigger()` | `Request` (events) | — | 🔴 Missing |
| `RequestController` abstract class | `RequestController` | — | 🔴 Missing |
| `RequestLog` model | `RequestLog` | — | 🔴 Missing |
| `logResponse` / `wrapResponseInDataKey` | `logResponse`, `wrapResponseInDataKey` | — | 🔴 Missing (internal) |
| `NotAcceptableError` | `NotAcceptableError` | not in error-handling table | 🔴 Missing |
| `NotAllowedError` | `NotAllowedError` | not in error-handling table | 🟡 Incomplete |

---

## Technical Findings

### 1. Request Context system is entirely undocumented

The `requestContext` module (`src/http/context/request-context.ts`) exports a critical set of helpers that developers need to access the current request and user outside of a controller function — for example, inside services, repositories, or event listeners. The public surface includes:

- `useRequest<UserType>()` — returns the current `Request` from AsyncLocalStorage
- `useCurrentUser<UserType>()` — returns the currently authenticated user
- `useRequestStore<UserType>()` — returns the full `{ request, response }` store
- `requestContext` — the singleton `RequestContext` instance

None of these are mentioned anywhere in `docs/warlock/http/`. This pattern is heavily used in real applications and warrants its own page or a dedicated section in `request.mdx`.

### 2. `cacheMiddleware` is undocumented

`src/http/middleware/cache-response-middleware.ts` exports `cacheMiddleware` and `CacheMiddlewareOptions`. This is a first-class middleware that caches entire response payloads to a cache driver, with locale awareness and field omission. It accepts either a string cache key or a full options object (`cacheKey`, `withLocale`, `omit`, `ttl`, `driver`). There is no reference to it in any docs page — not in `middleware.mdx`, `rate-limiting.mdx`, or anywhere else. It should be documented in `docs/warlock/http/middleware.mdx` or a new `docs/warlock/http/cache-middleware.mdx`.

### 3. Utility helpers `t()` and `fromRequest()` are undocumented

`src/http/middleware/inject-request-context.ts` exports two utility functions:

- `t(keyword, placeholders?)` — a context-aware translation helper that uses the current request's locale automatically; falls back to the global `trans()`. Developers writing locale-sensitive services need this.
- `fromRequest<T>(key, callback)` — a request-scoped memoization utility. If a value has been computed and stored on the request, it returns it; otherwise it runs the callback and caches the result on the request object. Useful for expensive per-request lookups (e.g., loading the current user once).

Neither appears in any documentation file.

### 4. `createHttpApplication` and `stopHttpApplication` are undocumented

`src/http/createHttpApplication.ts` is the standard entry point for bootstrapping the HTTP server. Developers starting a new project call `createHttpApplication()` and `stopHttpApplication()`. There is no page covering the application lifecycle or server startup. This should appear in either a new `server-lifecycle.mdx` or in the `introduction.mdx`.

### 5. Cookie API (both `Request` and `Response`) is undocumented

`Request` exposes `cookies` (getter returning all cookies), `cookie(name, default?)`, and `hasCookie(name)`. `Response` exposes `cookie(name, value, options?)` and `clearCookie(name, options?)`. The full Fastify cookie integration is completely absent from `request.mdx` and `response.mdx`.

### 6. Several `Request` input methods are missing from docs

`request.mdx` covers `input()`, type helpers, `all()`, `only()`, `except()`, `has()`, and file accessors. The following public methods are not documented:

- `request.set(key, value)` / `request.get(key, default?)` / `request.unset(...keys)` — setting and removing arbitrary data on the request object (used extensively in middleware to pass data to controllers)
- `request.setDefault(key, value)` — set a value only if the key is not already present
- `request.email(key, default?)` — email-specific input accessor
- `request.pluck(keys)` — returns a flat array of values (unlike `only()` which returns an object keyed by name)
- `request.allExceptParams()` — merged body+query without route params
- `request.heavy()` / `request.heavyExceptParams()` — filter-safe accessors that skip empty/null values; only mentioned in RESTful controller docs but not in `request.mdx`

### 7. Several `Response` methods are undocumented

`response.mdx` covers the most common response methods. Missing completely:

- `response.accepted()` — 202 Accepted
- `response.noContent()` — 204 No Content
- `response.conflict()` — 409 Conflict (only in error-handling table, no code example in `response.mdx`)
- `response.unprocessableEntity()` — 422
- `response.serviceUnavailable()` — 503
- `response.sendBuffer(buffer, options?)` — send a raw `Buffer` with optional content type, caching headers, and filename
- `response.sendImage(image, options?)` — optimized image sender (content type auto-detected)
- `response.download(path, filename?)` / `response.downloadFile(filePath, filename?)` — force-download with `Content-Disposition: attachment`

### 8. `response.sse()` (Server-Sent Events) is undocumented

`Response` exposes `sse(): ResponseSSEController`. The streaming docs in `response.mdx` cover `response.stream()` well but `sse()` is entirely absent. SSE is a distinct protocol from chunked streaming and has different developer use cases (push notifications, live feeds that need browser `EventSource` compatibility).

### 9. `RequestController` abstract class is undocumented

`src/http/request-controller.ts` exports the abstract `RequestController` class — the class-based controller base that is not tied to the RESTful system. Developers building class controllers without full RESTful scaffolding extend this. `introduction.mdx` mentions class controllers conceptually but never shows `RequestController` or how to extend it.

### 10. Error table in `error-handling.mdx` is incomplete and has a fabricated method

- `NotAcceptableError` (406) is exported from source but entirely absent from the error class table.
- `NotAllowedError` (405) is listed in the table description but without the class name.
- `response.tooManyRequests()` is listed in the manual error methods table in `error-handling.mdx` and in `response.mdx`'s status table, but this method does **not exist** in `src/http/response.ts`. The `ResponseStatus` enum has `TOO_MANY_REQUESTS = 429` but there is no corresponding `tooManyRequests()` method on the class. This is a documentation fabrication that will cause runtime errors if developers follow it.

### 11. Upload configuration (`uploadsConfig`) is undocumented

`src/http/uploads-config.ts` exports `uploadsConfig<K>()` and `UPLOADS_DEFAULTS`. These let developers read or override upload-related settings (default storage driver, directory paths, max sizes) programmatically. `file-uploads.mdx` covers the `UploadedFile` API thoroughly but never mentions the configuration system or what defaults can be changed.

### 12. `RequestLog` and event utilities are internal

`src/http/database/RequestLog.ts` and `src/http/events.ts` (`logResponse`, `wrapResponseInDataKey`) are exported but are framework internals with no developer-facing API. They do not need dedicated documentation, but a brief mention in the introduction that automatic request logging exists would improve discoverability.

---

## Incorrect Inventory Entries

- The inventory describes `RequestContextStore<User>` as containing `user` directly. The actual source type is `{ request: Request<User>; response: Response }` — the user is accessed via `request.user`, not as a top-level store key. The inventory description is misleading but the exported type names are correct.
- `response.tooManyRequests()` is referenced in `error-handling.mdx` and `response.mdx` as a real method. It does not exist in `src/http/response.ts`. This is a live documentation bug (not an inventory error), but worth tracking here.
- The inventory lists `logResponse` and `wrapResponseInDataKey` as documentation targets. These are internal framework utilities with no public contract; they should not be included in the developer-facing gap analysis as documentation priorities.

---

## Action Plan

- [ ] Create `docs/warlock/http/request-context.mdx` — covers `useRequest()`, `useCurrentUser()`, `useRequestStore()`, `requestContext`, and `fromRequest()`; explain AsyncLocalStorage scoping and why these helpers are needed in services/events outside controller scope
- [ ] Create `docs/warlock/http/server-lifecycle.mdx` — covers `createHttpApplication()`, `stopHttpApplication()`, `startServer()`, `getServer()`; include bootstrap example and graceful shutdown pattern
- [ ] Create `docs/warlock/http/cache-middleware.mdx` — covers `cacheMiddleware()` and `CacheMiddlewareOptions` (`cacheKey`, `withLocale`, `omit`, `ttl`, `driver`); show string shorthand and full options object usage; note locale-aware caching behavior
- [ ] Create `docs/warlock/http/sse.mdx` — covers `response.sse()` and `ResponseSSEController`; distinguish from `response.stream()`; include browser `EventSource` compatibility note and push-notification example
- [ ] Create `docs/warlock/http/request-controller.mdx` — covers the `RequestController` abstract class; show how to extend it for class-based handlers without the full RESTful system; contrast with function-based controllers
- [ ] Update `docs/warlock/http/request.mdx` — add sections for: `request.set()`, `request.get()`, `request.unset()`, `request.setDefault()`; `request.email()`; `request.pluck()`; `request.allExceptParams()`; `request.heavy()` and `request.heavyExceptParams()`; full cookies section (`request.cookies`, `request.cookie()`, `request.hasCookie()`)
- [ ] Update `docs/warlock/http/response.mdx` — add sections for: `response.accepted()`, `response.noContent()`, `response.conflict()`, `response.unprocessableEntity()`, `response.serviceUnavailable()`; `response.sendBuffer()`, `response.sendImage()`, `response.download()` / `response.downloadFile()`; cookies section (`response.cookie()`, `response.clearCookie()`); remove the fabricated `response.tooManyRequests()` reference
- [ ] Update `docs/warlock/http/error-handling.mdx` — add `NotAcceptableError` (406) to the error class table; add class name for `NotAllowedError` (405); remove `response.tooManyRequests()` from the manual error methods table (method does not exist in source)
- [ ] Update `docs/warlock/http/middleware.mdx` — add section for `t()` context-aware translation helper; cross-reference the new `cache-middleware.mdx`; add note on `PartialMiddleware` interface
- [ ] Update `docs/warlock/http/file-uploads.mdx` — add section covering `uploadsConfig()` and `UPLOADS_DEFAULTS`; add type reference table for `SaveOptions`, `SaveAsOptions`, `PrefixConfig`, and `FileNamingStrategy`
