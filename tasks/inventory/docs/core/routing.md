# @warlock.js/core Audit — Routing

**Status:** 🟡 Significant Gaps

**Source scanned:** `warlock.js/core/src/router/` (router.ts, route-builder.ts, route.ts, route-registry.ts, types.ts, index.ts)

---

## Coverage Map

| Feature | Source Export | Doc Coverage | Gap |
|---------|--------------|-------------|-----|
| Basic HTTP methods (`get`, `post`, `put`, `patch`, `delete`) | `router.get/post/put/patch/delete()` | 100% | 🟢 |
| HEAD / OPTIONS methods | `router.head()`, `router.options()` | Mentioned in table only | 🟡 |
| Catch-all method | `router.any()` | Mentioned in table only | 🟡 |
| Low-level add | `router.add()` | 0% — never shown in docs | 🔴 |
| Multiple paths, same handler | `router.post(["/a", "/b"], handler)` | 100% | 🟢 |
| Route options (`name`, `middleware`, `description`, `label`, `serverOptions`, `restful`, `isPage`, `middlewarePrecedence`, `rateLimit`) | `RouteOptions` interface | Partial — only `name` and `middleware` covered in routing-basics; `rateLimit` in rate-limiting.mdx; rest undocumented | 🟡 |
| `middlewarePrecedence` option | `RouteOptions.middlewarePrecedence` | 0% | 🔴 |
| `serverOptions` pass-through | `RouteOptions.serverOptions` | 0% | 🔴 |
| `isPage` flag | `RouteOptions.isPage` | 0% | 🔴 |
| Named routes | `router.get(path, h, { name })` + `router.getRoute()` | Partially — named routes defined correctly, but `router.getRoute()` replaced by fictitious `route()` helper in docs | 🔴 |
| Route groups (`group`, `prefix`, `version`) | `router.group()`, `router.prefix()`, `router.version()` | 100% — all three covered well | 🟢 |
| Group `name` stack | `GroupedRoutesOptions.name` | Partially — mentioned in option table but no example showing name prefix stacking | 🟡 |
| Static files (`file`, `cachedFile`, `files`, `cachedFiles`, `directory`) | `router.file/cachedFile/files/cachedFiles/directory()` | `file`, `cachedFile`, `directory` covered; `files()` and `cachedFiles()` (bulk) missing | 🟡 |
| Redirects | `router.redirect()` | 100% | 🟢 |
| HTTP proxy | `router.proxy()` | 0% — no docs at all | 🔴 |
| Lifecycle hooks | `router.beforeScanning()`, `router.afterScanning()` | 0% | 🔴 |
| Route listing | `router.list()` | 100% | 🟢 |
| Restful resource | `router.restfulResource()` | 100% (covered in restful/ section) | 🟢 |
| RouteBuilder — HTTP methods | `.get()`, `.post()`, `.put()`, `.delete()`, `.patch()`, `.head()`, `.options()` | `.head()` and `.options()` not shown in examples | 🟡 |
| RouteBuilder — "One" variants | `.getOne()`, `.postOne()`, `.updateOne()`, `.patchOne()`, `.deleteOne()` | 100% | 🟢 |
| RouteBuilder — RESTful aliases | `.list()`, `.create()`, `.show()`, `.update()`, `.destroy()` | 100% | 🟢 |
| RouteBuilder — nesting | `.nest()` | 100% | 🟢 |
| RouteBuilder — `.crud()` | `.crud({ list, create, show, update, destroy, patch })` | 100% | 🟢 |
| RouteBuilder — duplicate method guard | Throws if same method added twice | 0% — no docs | 🟡 |
| Controller array shorthand | `router.get(path, [controller, "action"])` | 0% — source supports `[object, methodName]` handler form, docs never show it | 🔴 |
| Handler `.validation` property | `RequestHandler.validation` | 100% (routing-basics + restful/validation) | 🟢 |
| Handler `.responseSchema` property | `RequestHandler.responseSchema` | 0% — exists in source for OpenAPI generation, never documented | 🔴 |
| Validation `validating` array | `RequestHandlerValidation.validating` | 100% (restful/validation.mdx) | 🟢 |
| `RequestControllerContract` interface | `RequestControllerContract` | 0% — undocumented contract for class-based controllers | 🔴 |
| `Route` data class | `Route` class (chainable data holder) | 0% — internal class, correctly unexported from index; no user need | 🟢 |
| `RouteRegistry` class | `RouteRegistry` — HMR dev-server | 0% — internal HMR implementation detail; not a public user API | 🟢 |
| HMR route tracking (`withSourceFile`, `removeRoutesBySourceFile`) | `router.withSourceFile()`, `router.removeRoutesBySourceFile()` | 0% — advanced HMR API, only relevant to framework integrators | 🟡 |
| `scanDevServer` method | `router.scanDevServer()` | 0% — internal dev-server API | 🟡 |
| Middleware type | `Middleware<TRequest>` | Partially — used in examples but type signature/generic not explained | 🟡 |
| `MiddlewareResponse` type | `MiddlewareResponse` | 0% | 🟡 |
| `RequestHandlerType` union | `RequestHandlerType` (function or `[object, action]` tuple) | 0% — tuple form entirely undocumented | 🔴 |

---

## Technical Findings

### 1. Fictitious `route()` helper function in routing-basics.mdx

`routing-basics.mdx` (lines 199–215) shows code importing and calling a standalone `route()` function from `@warlock.js/core` to generate URLs from named routes. **This function does not exist in source.** The actual API is `router.getRoute(name, params)` — a method on the `router` singleton. Every example using `route("users.list")` or `route("users.show", { id })` is wrong. This is a critical correctness error that will mislead developers trying to implement named-route URL generation.

Target file: `routing-basics.mdx` — replace the "Named Routes" usage section.

### 2. Controller array shorthand `[controller, "action"]` is undocumented

`router.add()` (and all HTTP method shortcuts) accept `RequestHandlerType`, which is `RequestHandler | [GenericObject, string]`. The tuple form lets you pass a controller instance and a method name as a pair, and Warlock automatically binds and resolves validation schemas (`actionValidationSchema`, `actionValidate`). This pattern is completely absent from all docs. Developers writing class-based controllers (not class-based RESTful resources) have no guidance on this syntax.

Target file: `routing-basics.mdx` — add a "Class-based controller shorthand" section.

### 3. `router.proxy()` has zero documentation

`router.proxy(path, baseUrl, options?)` and its overload `router.proxy(FastifyHttpProxyOptions)` are fully implemented and publicly exported, but have no documentation page. This is a production-relevant feature for BFF and microservice scenarios.

Target file: create `docs/warlock/http/proxy.mdx` or add a section to `routing-basics.mdx`.

### 4. `router.beforeScanning()` / `router.afterScanning()` are undocumented lifecycle hooks

These hooks allow custom server-level setup (e.g., registering Fastify plugins, doing pre-scan validation) and are called with `(router, server)` arguments. Zero documentation exists. They're critical for anyone who needs to run setup code tightly coupled to the routing lifecycle rather than the application bootstrap.

Target file: create a new section in `routing-basics.mdx` or a dedicated `lifecycle.mdx`.

### 5. `middlewarePrecedence` option is undocumented

`RouteOptions.middlewarePrecedence: "before" | "after"` controls whether per-route middleware runs before or after group middleware. The default is `"after"` (group middleware first). This subtlety is never documented anywhere, even though the middleware docs talk about execution order. Developers who need to invert precedence have no guidance.

Target file: `middleware.mdx` — add a "Middleware Precedence" section.

### 6. `RouteOptions.serverOptions` pass-through is undocumented

`serverOptions?: RouteShorthandOptions` lets routes pass raw Fastify route options (schema, config, etc.) directly. This is the escape hatch for Fastify-level features not wrapped by Warlock. Zero docs exist.

Target file: `routing-basics.mdx` — add a brief "Advanced Route Options" reference section.

### 7. `RouteOptions.isPage` flag is undocumented

`isPage?: boolean` marks a route as a React SSR page route. No documentation exists, making SSR routing integration opaque.

Target file: wherever React SSR docs live, or `routing-basics.mdx` as a note.

### 8. `RequestHandler.responseSchema` is undocumented

`RequestHandler.responseSchema?: ResponseSchema` exists for OpenAPI / documentation generation. The type `ResponseSchema` is defined in `src/resource/types`. No documentation or guidance exists on how to attach it or what it generates. Developers building API documentation tooling have no entry point.

Target file: `routing-basics.mdx` — add a "Response Schema" subsection under "Controller Validation".

### 9. `RequestControllerContract` interface is entirely undocumented

This interface describes the shape of a class-based (non-RESTful) controller: `execute()`, `middleware()`, `description`. The RESTful controller docs cover `RouteResource`, but class-based controllers implementing `RequestControllerContract` are invisible in the docs. It is unclear whether this is intentional (internal only) or a gap.

Target file: needs investigation — if public, add to `routing-basics.mdx` or a new `class-controllers.mdx`.

### 10. Middleware docs are dangerously incomplete

`middleware.mdx` covers only the basics (function signature, interruption pattern, execution order). It is missing:
- How to apply global middleware (if supported)
- The `Middleware<TRequest>` generic for typed request objects
- The `MiddlewareResponse` type alias
- The `RestfulMiddleware` type (keyed per-method middleware for resources)
- The `middlewarePrecedence` behavior (see Finding 5)

Target file: `middleware.mdx` — substantial expansion required.

### 11. Auth docs show `.middleware()` chained on `router.get()` — this is a phantom API

Multiple pages in `docs/warlock/auth/` (auth/middleware.mdx, auth/route-protection.mdx, auth/introduction.mdx) show patterns like:

```ts
router.get("/profile", profileController).middleware(authMiddleware());
```

`router.get()` returns `this` — the `Router` instance — which has no `.middleware()` method. This pattern will silently fail or throw at runtime. The correct approach is to pass middleware in the options object:

```ts
router.get("/profile", profileController, { middleware: [authMiddleware()] });
```

This is a correctness error replicated across multiple auth doc pages. While outside the strict scope of the routing doc files, it originates from a misunderstanding of the routing API.

Target files: `docs/warlock/auth/middleware.mdx`, `docs/warlock/auth/route-protection.mdx`, `docs/warlock/auth/introduction.mdx`, `docs/warlock/auth/jwt.mdx`, `docs/warlock/auth/access-control.mdx`.

### 12. HMR / dev-server methods need at least an advanced reference

`router.withSourceFile()`, `router.removeRoutesBySourceFile()`, and `router.scanDevServer()` are public methods relevant to framework integrators or anyone building custom HMR tooling. They deserve at minimum a brief mention under an "Advanced / Internals" section or a dedicated dev-server integration guide.

Target file: new `docs/warlock/http/dev-server-integration.mdx` or a callout in `routing-basics.mdx`.

---

## Incorrect Inventory Entries

The inventory file (`tasks/inventory/core/routing.md`) is accurate about exported classes and method signatures. One structural note:

- The inventory places all router files under `src/router/` — **this is correct**. The task brief incorrectly stated the source lives in `src/http/`. The actual router source is `src/router/`, not `src/http/`. The `src/http/` directory contains middleware utilities (`cache-response-middleware.ts`, `inject-request-context.ts`), not the router core.

- The inventory lists `Route` class as a separate `src/router/route.ts` — confirmed correct. However, `Route` is **not exported** from `src/router/index.ts` (which only re-exports from `./router` and `./types`). `RouteBuilder` is also not re-exported from the index — it is exported only from `router.ts` indirectly via the `Router` class usage. Users cannot `import { RouteBuilder } from "@warlock.js/core"` directly. This is worth confirming intentionality.

- The inventory documents `RouteRegistry` as a public class — it is technically exported from its own file but not from `src/router/index.ts`, so it is not a public user API. The inventory should mark it as internal.

---

## Action Plan

- [ ] **`routing-basics.mdx`** — Fix "Named Routes" section: replace fictitious `route()` helper with `router.getRoute(name, params)` method. Add working code examples.
- [ ] **`routing-basics.mdx`** — Add "Class-based controller shorthand" section documenting the `[controller, "methodName"]` handler tuple form.
- [ ] **`routing-basics.mdx`** — Add "Advanced Route Options" reference table covering `description`, `label`, `serverOptions`, `isPage`, `middlewarePrecedence`, and `rateLimit` (with cross-link to rate-limiting.mdx for the last item).
- [ ] **`routing-basics.mdx`** — Add "Response Schema" subsection under "Controller Validation" documenting `RequestHandler.responseSchema`.
- [ ] **`routing-basics.mdx`** or new **`proxy.mdx`** — Document `router.proxy()` with both call signatures and example.
- [ ] **`routing-basics.mdx`** or new **`lifecycle.mdx`** — Document `router.beforeScanning()` and `router.afterScanning()` lifecycle hooks.
- [ ] **`middleware.mdx`** — Add "Middleware Precedence" section explaining `middlewarePrecedence: "before" | "after"` in `RouteOptions`.
- [ ] **`middleware.mdx`** — Add `Middleware<TRequest>` generic usage and `MiddlewareResponse` type alias.
- [ ] **`middleware.mdx`** — Add `RestfulMiddleware` type documentation.
- [ ] **`auth/middleware.mdx`, `auth/route-protection.mdx`, `auth/introduction.mdx`, `auth/jwt.mdx`, `auth/access-control.mdx`** — Fix all instances of the non-existent `.middleware()` chained pattern; replace with the correct `{ middleware: [...] }` options object pattern.
- [ ] **`route-groups.mdx`** — Add an example demonstrating the `name` prefix option in `GroupedRoutesOptions` and how it stacks across nested groups.
- [ ] **`route-builder.mdx`** — Document the duplicate-method guard behavior (throws if `.get()` called twice on same builder).
- [ ] Investigate and confirm whether `RequestControllerContract` is a public or internal API — if public, create documentation for class-based controllers that implement it.
- [ ] Investigate whether `RouteBuilder` and `Route` should be directly importable from `@warlock.js/core`; update inventory accordingly.
- [ ] Mark `RouteRegistry` as internal-only in the inventory.
