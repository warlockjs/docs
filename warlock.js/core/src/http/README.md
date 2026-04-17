# HTTP

HTTP layer built on Fastify. Provides the `Request` and `Response` abstractions, file upload handling, middleware system, plugin integration, and the HTTP server instance.

## Key Files

| File                       | Purpose                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `request.ts`               | `Request` class — wraps Fastify request; provides `input()`, `file()`, `header()`, `auth()`, etc.                      |
| `response.ts`              | `Response` class — wraps Fastify reply; provides `success()`, `badRequest()`, `notFound()`, `send()`, `stream()`, etc. |
| `uploaded-file.ts`         | `UploadedFile` class — handles multipart file uploads, validation, storage                                             |
| `server.ts`                | Creates and exports the Fastify server instance                                                                        |
| `createHttpApplication.ts` | Factory for creating the HTTP application with plugins                                                                 |
| `config.ts`                | HTTP-specific config defaults                                                                                          |
| `events.ts`                | HTTP event constants (e.g., `onRequest`, `onResponse`)                                                                 |
| `plugins.ts`               | Fastify plugin registration                                                                                            |
| `request-controller.ts`    | Base request controller                                                                                                |
| `types.ts`                 | HTTP type definitions (`RequestHandler`, `Middleware`, etc.)                                                           |
| `uploads-config.ts`        | Upload configuration (max size, allowed types)                                                                         |
| `uploads-types.ts`         | Upload-related type definitions                                                                                        |
| `context/`                 | HTTP request context (AsyncLocalStorage-based)                                                                         |
| `database/`                | Database-related HTTP utilities                                                                                        |
| `errors/`                  | HTTP error classes                                                                                                     |
| `middleware/`              | Built-in middleware (CORS, body parser, etc.)                                                                          |
| `plugins/`                 | Built-in Fastify plugins                                                                                               |
| `index.ts`                 | Barrel export                                                                                                          |

## Key Exports

- `Request` — HTTP request abstraction
- `Response` — HTTP response abstraction
- `UploadedFile` — file upload handler
- `server` — Fastify instance
- `createHttpApplication()` — factory function
- Middleware and plugin types

## Dependencies

### Internal (within `core/src`)

- `../config` — HTTP config (port, host, CORS settings)
- `../router` — route definitions fed to the server
- `../storage` — file uploads stored via storage drivers
- `../validation` — request input validation
- `../resource` — resource serialization in responses
- `../utils` — paths, environment

### External

- `fastify` — underlying HTTP framework
- `@fastify/multipart` — file upload handling
- `@fastify/cors` — CORS support
- `@warlock.js/logger` — request logging

## Used By

- `connectors/http-connector` — starts the HTTP server
- `router/` — registers routes on the Fastify instance
- `restful/` — uses Request/Response in CRUD handlers
- `use-cases/` — may receive request context
- `@warlock.js/auth` — middleware accesses Request for auth tokens
