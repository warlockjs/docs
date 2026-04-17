# Router

HTTP routing system built on Fastify. Provides a `Router` singleton for registering routes (GET, POST, PUT, DELETE, PATCH, etc.), route grouping with shared prefixes/middleware, RESTful resource generation, static file serving, proxy support, and a chainable `RouteBuilder`.

## Key Files

| File                | Purpose                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `router.ts`         | `Router` class — route registration, grouping, RESTful resources, scanning, middleware application      |
| `route-builder.ts`  | `RouteBuilder` — chainable API for building routes on a single path                                     |
| `route-registry.ts` | `RouteRegistry` — stores registered routes for lookup                                                   |
| `route.ts`          | `Route` type/class representing a single route                                                          |
| `types.ts`          | Router types (`Route`, `RouteOptions`, `GroupedRoutesOptions`, `RequestHandler`, `RouteResource`, etc.) |
| `index.ts`          | Barrel export                                                                                           |

## Key Exports

- `router` — singleton `Router` instance (also exported as `Router.getInstance()`)
- `RouteBuilder` — chainable route builder
- Types: `Route`, `RouteOptions`, `GroupedRoutesOptions`, `RequestHandler`, `RouteResource`, `ResourceMethod`

## Dependencies

### Internal (within `core/src`)

- `../http` — `Request`, `Response` types; Fastify server instance
- `../restful` — `Restful` class for RESTful resource routes
- `../validation` — route-level validation schemas

### External

- `fastify` — underlying HTTP framework
- `@fastify/http-proxy` — proxy route support
- `@fastify/static` — static file serving
- `@mongez/concat-route` — route path concatenation

## Used By

- `connectors/http-connector` — scans and registers routes on HTTP start
- Application route files (`src/app/**/routes.ts`)
- `restful/` — RESTful controllers are bound via `router.restfulResource()`
