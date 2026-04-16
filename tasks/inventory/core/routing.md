# @warlock.js/core — Routing Inventory

### src/router/router.ts
*The primary router manager for defining routes, groups, resources, and proxying.*

- **Class** `Router`
  - `private routes: Route[]`
  - `private static instance: Router`
  - `protected staticDirectories: FastifyStaticOptions[]`
  - `protected eventListeners: Record<string, ((router: Router, server: FastifyInstance) => void)[]>`
  - `protected stacks: RouterStacks`
  - `public static getInstance(): Router`
  - `public beforeScanning(callback: (router: Router, server: FastifyInstance) => void): this`
  - `public afterScanning(callback: (router: Router, server: FastifyInstance) => void): this`
  - `public redirect(from: string, to: string, redirectMode?: "temporary" | "permanent"): this`
  - `public directory(options: FastifyStaticOptions): this`
  - `public file(path: string, location: string, cacheTime?: number): this`
  - `public cachedFile(path: string, location: string, cacheTime?: number): this`
  - `public files(files: Record<string, string>, cacheTime?: number): void`
  - `public cachedFiles(files: Record<string, string>, cacheTime?: number): void`
  - `public proxy(path: string, baseUrl: string, options?: Omit<FastifyHttpProxyOptions, "prefix" | "upstream">): this`
  - `public proxy(options: FastifyHttpProxyOptions): this`
  - `public add(method: Route["method"], path: string | string[], handler: RequestHandlerType, options?: RouteOptions): this`
  - `public any(path: string, handler: RequestHandlerType, options?: RouteOptions): this`
  - `public get(path: string, handler: RequestHandlerType, options?: RouteOptions): this`
  - `public post(path: string | string[], handler: RequestHandlerType, options?: RouteOptions): this`
  - `public put(path: string, handler: RequestHandlerType, options?: RouteOptions): this`
  - `public delete(path: string | string[], handler: RequestHandlerType, options?: RouteOptions): this`
  - `public patch(path: string, handler: RequestHandlerType, options?: RouteOptions): this`
  - `public head(path: string, handler: RequestHandlerType, options?: RouteOptions): this`
  - `public options(path: string, handler: RequestHandlerType, options?: RouteOptions): this`
  - `public route(path: string, options?: RouteOptions): RouteBuilder`
  - `public restfulResource(path: string, resource: RouteResource, options?: RouteOptions & { only?: ResourceMethod[]; except?: ResourceMethod[]; replace?: Partial<Record<ResourceMethod, RequestHandler>> & { bulkDelete?: RequestHandler; }; }): this`
  - `public group(options: GroupedRoutesOptions, callback: RouterGroupCallback): this`
  - `public prefix(prefix: string, callback: () => void): this`
  - `public version(version: string | number, callback: () => void): this`
  - `public async withSourceFile<T = any>(sourceFile: string, callback: () => T | Promise<T>): Promise<T | undefined>`
  - `public removeRoutesBySourceFile(sourceFile: string): void`
  - `private manageValidation(resource: RouteResource, method: "create" | "update" | "patch"): RequestHandler`
  - `public list(): Route[]`
  - `public scan(server: FastifyInstance): void`
  - `public scanDevServer(server: FastifyInstance): void`
  - `public getRoute(name: string, params?: any): string`
  - `private handleRoute(route: Route): (fastifyRequest: FastifyRequest, fastifyResponse: FastifyReply) => Promise<{ output: any; response: Response; request: Request; }>`
- **Constant** `router: Router`

### src/router/route-builder.ts
*Fluent API for chainable route definition and nesting.*

- **Class** `RouteBuilder`
  - `protected addedRoutes: { get: boolean; post: boolean; put: boolean; delete: boolean; patch: boolean; options: boolean; head: boolean; }`
  - `public constructor(router: Router, path: string, moreOptions?: RouteOptions)`
  - `public get(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public getOne(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public post(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public postOne(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public put(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public updateOne(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public patch(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public patchOne(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public delete(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public deleteOne(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public list(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public create(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public show(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public update(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public destroy(handler: RequestHandlerType, options?: RouteOptions): this`
  - `public nest(path: string, options?: RouteOptions): RouteBuilder`
  - `public crud(handlers: { list?: RequestHandlerType; create?: RequestHandlerType; show?: RequestHandlerType; update?: RequestHandlerType; destroy?: RequestHandlerType; patch?: RequestHandlerType; }, options?: RouteOptions): this`
  - `protected withOptions(options?: RouteOptions): RouteOptions`

### src/router/route.ts
*Data holder and configuration class for individual routes.*

- **Class** `Route`
  - `public constructor(data: RouteData)`
  - `public name(name: string): this`
  - `public middleware(middleware: RouteData["middleware"]): this`
  - `public description(description: string): this`
  - `public label(label: string): this`
  - `public path(path: string): this`
  - `public method(method: RouteData["method"]): this`
  - `public handler(handler: RouteData["handler"]): this`

### src/router/route-registry.ts
*HMR-friendly route registry using find-my-way for dynamic matching.*

- **Class** `RouteRegistry`
  - `private router: Instance<any>`
  - `public register(routes: Route[]): void`
  - `public registerRoute(route: Route): void`
  - `public find(method: string, url: string): { route: Route; params: Record<string, string>; } | null`
  - `public getRouteCount(): number`

### src/router/types.ts
*Shared types and interfaces for the routing system.*

- **Type** `MiddlewareResponse`
- **Type** `Middleware<MiddlewareRequest extends Request = Request>`
- **Type** `RouterGroupCallback`
- **Type** `RequestHandlerType`
- **Type** `ResourceMethod`
- **Type** `RestfulMiddleware`
- **Type** `RequestHandlerValidation<TRequest extends Request = Request>`
- **Interface** `RequestControllerContract`
  - `request: Request`
  - `response: Response`
  - `execute(): Promise<ReturnedResponse>`
  - `description?: string`
  - `middleware?: () => Promise<MiddlewareResponse> | MiddlewareResponse`
- **Type** `RequestHandler<TRequest extends Request = Request>`
- **Interface** `RouteOptions`
  - `middleware?: Middleware[]`
  - `middlewarePrecedence?: "before" | "after"`
  - `name?: string`
  - `description?: string`
  - `serverOptions?: RouteShorthandOptions`
  - `label?: string`
  - `restful?: boolean`
  - `isPage?: boolean`
  - `rateLimit?: { max: number; timeWindow: number; errorMessage?: string; }`
- **Type** `RequestMethod`
- **Type** `Route`
- **Type** `PartialPick<T, F extends keyof T>`
- **Type** `GroupedRoutesOptions`
- **Type** `RouteResource`
- **Type** `RouterStacks`
