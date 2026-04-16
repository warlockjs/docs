# @warlock.js/core — HTTP Inventory

### src/http/request.ts
*Wrapper for FastifyRequest providing enhanced payload parsing, validation, and locale handling.*

- **Class** `Request<RequestValidation = any>`
  - `public baseRequest: FastifyRequest`
  - `public response: Response`
  - `public route: Route`
  - `protected payload: any`
  - `public decodedAccessToken?: any`
  - `public static current: Request`
  - `public trans: ReturnType<typeof trans>`
  - `public t: ReturnType<typeof trans>`
  - `protected _locale: string`
  - `protected validatedData?: RequestValidation`
  - `public id: string`
  - `public startTime: number`
  - `public endTime?: number`
  - `public setRequest(request: FastifyRequest): this`
  - `public transFrom(localeCode: string, keyword: string, placeholders?: any): string`
  - `public get locale(): string`
  - `public set locale(localeCode: string)`
  - `public get localized(): string`
  - `public setLocaleCode(localeCode: string): this`
  - `public getLocaleCode(defaultLocaleCode?: string): string`
  - `public get protocol(): string`
  - `public async validate(validation: BaseValidator, selectedInputs?: string[]): Promise<any>`
  - `public clearCurrentUser(): void`
  - `public header<TCustomHeader extends string = HeaderKeys>(name: TCustomHeader | HeaderKeys, defaultValue?: any): any`
  - `public get cookies(): Record<string, string | undefined>`
  - `public cookie(name: string, defaultValue?: any): any`
  - `public hasCookie(name: string): boolean`
  - `public get domain(): string`
  - `public get hostname(): string`
  - `public get origin(): string`
  - `public get originDomain(): string | null`
  - `public get authorizationValue(): string`
  - `public get accessToken(): string | undefined`
  - `public get authorization(): string | undefined`
  - `public get method(): string`
  - `protected parsePayload(): void`
  - `protected parseBody(data: any): any`
  - `protected parseValue(data: any): any`
  - `public setRoute(route: Route): this`
  - `public trigger(eventName: RequestEvent, ...args: any[]): any`
  - `public on(eventName: RequestEvent, callback: any): any`
  - `public log(message: any, level?: LogLevel): void`
  - `public get path(): string`
  - `public get url(): string`
  - `public get fullUrl(): string`
  - `public async runMiddleware(): Promise<any>`
  - `public getHandler(): RequestHandler`
  - `public validated<Output = RequestValidation>(inputs?: (keyof Output | (string & {}))[]): Output`
  - `public validatedExcept(...inputs: string[]): RequestValidation`
  - `public setValidatedData(data: RequestValidation): void`
  - `public async execute(): Promise<any>`
  - `protected async executeMiddleware(): Promise<any>`
  - `protected collectMiddlewares(): Middleware[]`
  - `public input(key: string, defaultValue?: any): any`
  - `public email(key?: string, defaultValue?: string): string`
  - `public get(key: string, defaultValue?: any): any`
  - `public has(key: string): boolean`
  - `public set(key: string, value: any): this`
  - `public setDefault(key: string, value: any): this`
  - `public unset(...keys: string[]): this`
  - `public get body(): any`
  - `public setBody(key: string, value: any): this`
  - `public get bodyInputs(): any`
  - `public file(key: string): UploadedFile | undefined`
  - `public files(name: string): UploadedFile[]`
  - `public get params(): any`
  - `public setParam(key: string, value: any): this`
  - `public get query(): any`
  - `public setQuery(key: string, value: any): this`
  - `public all(): any`
  - `public allExceptParams(): any`
  - `public heavyExceptParams(): any`
  - `public heavy(): any`
  - `public only(keys: string[]): any`
  - `public pluck(keys: string[]): any`
  - `public except(keys: string[]): any`
  - `public bool(key: string, defaultValue?: boolean): boolean`
  - `public int(key: string, defaultValue?: number): number`
  - `public get idParam(): number`
  - `public string(key: string, defaultValue?: string): string`
  - `public float(key: string, defaultValue?: number): number`
  - `public number(key: string, defaultValue?: number): number`
  - `public get ip(): string`
  - `public detectIp(): string`
  - `public get realIp(): string`
  - `public get ips(): string[]`
  - `public get referer(): string | undefined`
  - `public get userAgent(): string | undefined`
  - `public get headers(): any`
  - `public setHeader(key: HeaderKeys, value: string): this`

### src/http/response.ts
*Wrapper for FastifyReply providing fluent methods for common HTTP responses, file downloads, and streaming.*

- **Enum** `ResponseStatus`
- **Type** `SendFileOptions`
- **Type** `SendBufferOptions`
- **Class** `Response`
  - `protected route: Route`
  - `public baseResponse: FastifyReply`
  - `protected currentStatusCode: number`
  - `protected currentBody: any`
  - `protected isSending: boolean`
  - `public request: Request`
  - `protected events: Map<string, any[]>`
  - `public parsedBody: any`
  - `public get raw(): any`
  - `public get body(): any`
  - `public set body(body: any)`
  - `public onSending(callback: any): this`
  - `public onSent(callback: any): this`
  - `public setResponse(response: FastifyReply): this`
  - `public reset(): void`
  - `public setRoute(route: Route): this`
  - `public get contentType(): any`
  - `public setContentType(contentType: string): this`
  - `public get statusCode(): number`
  - `public get isOk(): boolean`
  - `public get sent(): boolean`
  - `public static on(event: ResponseEvent, listener: (response: Response) => void): EventSubscription`
  - `protected static async trigger(event: ResponseEvent, ...args: any[]): Promise<any>`
  - `protected async parseBody(): Promise<any>`
  - `public async parse(value: any): Promise<any>`
  - `public log(message: string, level?: LogLevel): void`
  - `public get isJson(): boolean`
  - `public async send(data?: any, statusCode?: number, triggerEvents?: boolean): Promise<Response>`
  - `public html(data: string, statusCode?: number): Promise<Response>`
  - `public render(element: React.ReactElement | React.ComponentType, status?: number): Promise<Response>`
  - `public xml(data: string, statusCode?: number): Promise<Response>`
  - `public text(data: string, statusCode?: number): Promise<Response>`
  - `public stream(contentType?: string): ResponseStreamController`
  - `public sse(): ResponseSSEController`
  - `public setStatusCode(statusCode: number): this`
  - `public redirect(url: string, statusCode?: number): this`
  - `public permanentRedirect(url: string): this`
  - `public getResponseTime(): number`
  - `public removeHeader(key: string): this`
  - `public getHeader(key: string): any`
  - `public getHeaders(): any`
  - `public headers(headers: Record<string, string>): this`
  - `public header(key: string, value: any): this`
  - `public cookie(name: string, value: CookieValue, options?: CookieSerializeOptions): this`
  - `public clearCookie(name: string, options?: CookieSerializeOptions): this`
  - `public setHeader(key: string, value: any): this`
  - `public serverError(data: any): Promise<Response>`
  - `public forbidden(data?: any): Promise<Response>`
  - `public serviceUnavailable(data: any): Promise<Response>`
  - `public unauthorized(data?: any): Promise<Response>`
  - `public notFound(data?: any): Promise<Response>`
  - `public badRequest(data: any): Promise<Response>`
  - `public successCreate(data: any): Promise<Response>`
  - `public success(data?: any): Promise<Response>`
  - `public noContent(): Promise<any>`
  - `public accepted(data?: any): Promise<Response>`
  - `public conflict(data?: any): Promise<Response>`
  - `public unprocessableEntity(data: any): Promise<Response>`
  - `private applyResponseOptions(options: SendBufferOptions, defaultFilename?: string): boolean`
  - `public async sendFile(filePath: string, options?: number | SendFileOptions): Promise<any>`
  - `public sendBuffer(buffer: Buffer, options?: number | SendBufferOptions): any`
  - `public async sendImage(image: any, options?: number | (Omit<SendBufferOptions, "contentType"> & { contentType?: string })): Promise<any>`
  - `public sendCachedFile(path: string, cacheTime?: number): Promise<any>`
  - `public download(path: string, filename?: string): Promise<any>`
  - `public async downloadFile(filePath: string, filename?: string): Promise<any>`
  - `public getFileContentType(filePath: string): string`
  - `public failedSchema(result: ValidationResult): Promise<Response>`

### src/http/uploaded-file.ts
*Handles multipart file uploads with storage integration and image transformation.*

- **Type** `UploadedFileMetadata`
- **Type** `FileValidationOptions`
- **Class** `UploadedFile`
  - `protected bufferedFileContent?: Buffer`
  - `public hash: string`
  - `protected _storage: ScopedStorage`
  - `protected _storageFile?: StorageFile`
  - `protected _imageOptions: UploadedFileImageOptions`
  - `protected _transformConfig?: ImageTransformOptions | ImageTransformCallback`
  - `public constructor(fileData: MultipartFile)`
  - `public get name(): string`
  - `public get mimeType(): string`
  - `public get extension(): string`
  - `public async metadata(): Promise<UploadedFileMetadata>`
  - `public async size(): Promise<number>`
  - `public async buffer(): Promise<Buffer>`
  - `public get isImage(): boolean`
  - `public get isVideo(): boolean`
  - `public get isAudio(): boolean`
  - `public use(driver: StorageDriverName): this`
  - `public resize(width: number, height?: number): this`
  - `public quality(value: number): this`
  - `public format(format: ImageFormat): this`
  - `public rotate(degrees: number): this`
  - `public blur(sigma?: number): this`
  - `public grayscale(): this`
  - `public transform(config: ImageTransformOptions | ImageTransformCallback): this`
  - `public async toImage(): Promise<Image>`
  - `public async dimensions(): Promise<{ width?: number; height?: number; }>`
  - `public async validate(options: FileValidationOptions): Promise<void>`
  - `public async save(directory: string, options?: SaveOptions): Promise<StorageFile>`
  - `public async saveAs(location: string, options?: SaveAsOptions): Promise<StorageFile>`
  - `public get storageFile(): StorageFile | undefined`
  - `protected async saveToLocation(location: string, driver?: StorageDriverName): Promise<StorageFile>`
  - `protected async getProcessedContent(): Promise<Buffer>`
  - `protected applyImageOptions(img: Image): Image`
  - `protected hasTransforms(): boolean`
  - `protected resolveStorage(driver?: StorageDriverName): ScopedStorage`
  - `protected resolveFilename(options?: SaveOptions): string`
  - `protected resolvePrefix(prefix?: PrefixConfig): string`
  - `protected formatDatePrefix(format: string, as: "file" | "directory"): string`
  - `protected formatDate(format: string): string`
  - `protected buildLocation(directory: string, prefix: string, filename: string): string`
  - `protected getFinalExtension(): string`
  - `protected getFinalMimeType(): string`
  - `protected adjustLocationForFormat(location: string): string`
  - `public async toJSON(): Promise<any>`

### src/http/config.ts
*HTTP configuration initializers.*

- **Constant** `defaultHttpConfigurations: HttpConfigurations`
- **Function** `httpConfig(key: string): any`

### src/http/events.ts
*Request/Response event logging and data wrapping.*

- **Function** `logResponse(response: Response): void`
- **Function** `wrapResponseInDataKey(response: Response): void`

### src/http/plugins.ts
*Registration of internal Fastify plugins.*

- **Function** `registerHttpPlugins(server: FastifyInstance): Promise<void>`

### src/http/request-controller.ts
*Abstract base class for class-based request handlers.*

- **Abstract Class** `RequestController`
  - `public constructor(request: Request, response: Response)`
  - `public abstract execute(): Promise<ReturnedResponse>`

### src/http/server.ts
*Fastify server lifecycle management.*

- **Type** `FastifyInstance`
- **Function** `startServer(): FastifyInstance`
- **Function** `getServer(): FastifyInstance | undefined`

### src/http/types.ts
*HTTP-related shared types and interfaces.*

- **Type** `RequestEvent`
- **Type** `ReturnedResponse`
- **Type** `ResponseEvent`
- **Interface** `PartialMiddleware`
- **Interface** `HttpConfigurations`
- **Type** `ResponseStreamController`
- **Type** `ResponseSSEController`

### src/http/uploads-config.ts
*Upload configuration management.*

- **Constant** `UPLOADS_DEFAULTS: UploadsConfigurations`
- **Function** `uploadsConfig<K extends keyof UploadsConfigurations>(key: K, defaultValue?: UploadsConfigurations[K]): UploadsConfigurations[K]`

### src/http/uploads-types.ts
*File upload related types.*

- **Type** `PrefixOptions`
- **Type** `PrefixConfig`
- **Type** `FileNamingStrategy`
- **Type** `SaveOptions`
- **Type** `SaveAsOptions`
- **Type** `ImageTransformCallback`
- **Type** `ImageTransformConfig`
- **Type** `UploadsConfigurations`
- **Type** `UploadedFileImageOptions`

### src/http/createHttpApplication.ts
*Standard entry point for starting the HTTP server.*

- **Function** `createHttpApplication(): Promise<void>`
- **Function** `stopHttpApplication(): Promise<void>`

### src/http/context/request-context.ts
*Asynchronous context tracking for HTTP requests.*

- **Type** `RequestContextStore<User extends Model = Model>`
- **Class** `RequestContext<User extends Model = Model>`
  - `public getRequest(): Request<User> | undefined`
  - `public getResponse(): Response | undefined`
  - `public getUser(): User | undefined`
  - `public buildStore(payload?: Record<string, any>): RequestContextStore<User>`
- **Constant** `requestContext: RequestContext`
- **Function** `useRequestStore<UserType extends Model = Model>(): RequestContextStore<UserType>`
- **Function** `useRequest<UserType extends Model = Model>(): Request<UserType>`
- **Function** `useCurrentUser<UserType extends Model = Model>(): UserType`

### src/http/database/RequestLog.ts
*Database model for request/response logging.*

- **Class** `RequestLog`
  - `public static table: string`
  - `public static schema: any`

### src/http/errors/errors.ts
*Standardized HTTP exception classes.*

- **Class** `HttpError`
- **Class** `ResourceNotFoundError`
- **Class** `UnAuthorizedError`
- **Class** `ForbiddenError`
- **Class** `BadRequestError`
- **Class** `ServerError`
- **Class** `ConflictError`
- **Class** `NotAcceptableError`
- **Class** `NotAllowedError`

### src/http/middleware/cache-response-middleware.ts
*Implementation of response caching middleware.*

- **Type** `CacheMiddlewareOptions`
- **Function** `cacheMiddleware(responseCacheOptions: CacheMiddlewareOptions | string): (request: Request, response: Response) => Promise<any>`

### src/http/middleware/inject-request-context.ts
*Middleware for establishing request-scoped stores and handling errors.*

- **Function** `createRequestStore(request: Request<any>, response: Response): Promise<ReturnedResponse>`
- **Function** `t(keyword: string, placeholders?: any): string`
- **Function** `fromRequest<T>(key: string, callback: (request?: Request) => Promise<T>): Promise<T>`
