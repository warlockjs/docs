# Services Inventory

*Core framework services including storage, mail, resource transformation, image processing, and business logic execution.*

## Storage
`src/storage/`

### ScopedStorage
*Base class for scoped storage operations returning StorageFile instances.*

- `public constructor(driver: StorageDriverContract)`
- `public get name(): StorageDriverType`
- `public get defaultDriver(): StorageDriverContract`
- `public get activeDriver(): StorageDriverContract`
- `public async put(file: UploadedFile | Buffer | string | Readable, location: string, options?: PutOptions): Promise<StorageFile>`
- `public async putStream(stream: Readable, location: string, options?: PutOptions): Promise<StorageFile>`
- `public async putFromUrl(url: string, location: string, options?: PutOptions): Promise<StorageFile>`
- `public async putFromBase64(dataUrl: string, location: string, options?: PutOptions): Promise<StorageFile>`
- `public async get(location: string): Promise<Buffer>`
- `public async getStream(location: string): Promise<Readable>`
- `public async delete(location: string | StorageFile): Promise<boolean>`
- `public async deleteMany(locations: string[]): Promise<DeleteManyResult[]>`
- `public async deleteDirectory(directoryPath: string): Promise<boolean>`
- `public async exists(location: string): Promise<boolean>`
- `public async copy(from: string | StorageFile, to: string): Promise<StorageFile>`
- `public async move(from: string | StorageFile, to: string): Promise<StorageFile>`
- `public async copyDirectory(from: string, to: string, options?: { concurrency?: number }): Promise<number>`
- `public async moveDirectory(from: string, to: string, options?: { concurrency?: number }): Promise<number>`
- `public async putDirectory(localDirPath: string, destination: string, options?: PutDirectoryOptions): Promise<PutDirectoryResult>`
- `public async emptyDirectory(path: string): Promise<number>`
- `public async list(directory?: string, options?: ListOptions): Promise<StorageFileInfo[]>`
- `public url(location: string): string`
- `public async temporaryUrl(location: string, expiresIn?: number): Promise<string>`
- `public async metadata(location: string): Promise<StorageFileInfo>`
- `public async size(location: string): Promise<number>`
- `public async file(location: string): Promise<StorageFile>`
- `public prepend(prefix: string, location: string): string`
- `public append(location: string, suffix: string): string`
- `protected _driver: StorageDriverContract`
- `protected async toBuffer(file: UploadedFile | Buffer | string | Readable): Promise<Buffer>`
- `protected isReadable(value: unknown): value is Readable`
- `protected async streamToBuffer(stream: Readable): Promise<Buffer>`

### Storage (extends ScopedStorage)
*Singleton storage manager overseeing driver lifecycles and event emission.*

- `public constructor()`
- `public async init(): Promise<void>`
- `public reset(): void`
- `public override get activeDriver(): StorageDriverContract`
- `public use(name: StorageDriverName): ScopedStorage`
- `public getDriver(name: StorageDriverName): StorageDriverContract`
- `public root(apepndedPath?: string): string`
- `public useCloud(name: StorageDriverName): CloudStorageDriverContract`
- `public register(name: StorageDriverName, config: StorageDriverConfig): this`
- `public setDefault(name: StorageDriverName): this`
- `public async isCloud(): Promise<boolean>`
- `public on<T extends StorageEventPayload = StorageEventPayload>(event: StorageEventType, handler: StorageEventHandler<T>): EventSubscription`
- `public off(event: StorageEventType): this`
- `public override async put(file: UploadedFile | Buffer | string | Readable, location: string, options?: PutOptions): Promise<StorageFile>`
- `public override async putStream(stream: Readable | string, location: string, options?: PutOptions): Promise<StorageFile>`
- `public async putFromUrl(url: string, location: string, options?: PutOptions): Promise<StorageFile>`
- `public async putFromBase64(base64: string, location: string, options?: PutOptions): Promise<StorageFile>`
- `public override async get(location: string): Promise<Buffer>`
- `public async getJson(location: string): Promise<any>`
- `public override async getStream(location: string): Promise<Readable>`
- `public override async delete(location: string | StorageFile): Promise<boolean>`
- `public override async deleteMany(locations: string[]): Promise<DeleteManyResult[]>`
- `public override async exists(location: string): Promise<boolean>`
- `public override async copy(from: string | StorageFile, to: string): Promise<StorageFile>`
- `public override async move(from: string | StorageFile, to: string): Promise<StorageFile>`
- `public override async list(directory?: string, options?: ListOptions): Promise<StorageFileInfo[]>`
- `public override async metadata(location: string): Promise<StorageFileInfo>`
- `public override async size(location: string): Promise<number>`
- `public override async file(location: string): Promise<StorageFile>`
- `public async path(location: string): Promise<string>`
- `public async getPresignedUrl(location: string, options?: PresignedOptions): Promise<string>`
- `public async getPresignedUploadUrl(location: string, options?: PresignedUploadOptions): Promise<string>`
- `public async getBucket(): Promise<string>`
- `public async getRegion(): Promise<string>`
- `public async setStorageClass(location: string, storageClass: string): Promise<void>`
- `public async setVisibility(location: string, visibility: FileVisibility): Promise<void>`
- `public async getVisibility(location: string): Promise<FileVisibility>`
- `public override async temporaryUrl(location: string, expiresIn?: number): Promise<string>`
- `public async validateTemporaryToken(token: string): Promise<TemporaryTokenValidation>`
- `protected drivers: Map<string, StorageDriverContract>`
- `protected configs: Map<string, StorageDriverConfig>`
- `protected defaultDriverName: StorageDriverName`
- `protected isCloudDriver(driver: StorageDriverContract): driver is CloudStorageDriverContract`
- `protected async emit<T extends StorageEventPayload>(event: StorageEventType, payload: T): Promise<void>`
- `protected parseOptions(config: StorageDriverConfig): LocalStorageDriverOptions | CloudStorageDriverOptions | R2StorageDriverOptions`
- `protected validateCloudConfig(config: StorageDriverConfig, driverName: string): void`
- `protected resolveDriver(name: string): StorageDriverContract`
- `protected async resolveDefaultDriver(): Promise<StorageDriverName>`

### StorageFile
*Object-oriented wrapper for individual file operations and metadata.*

- `public constructor(path: string, driver: StorageDriverContract, data?: StorageFileData)`
- `public get path(): string`
- `public get name(): string`
- `public get extension(): string`
- `public get directory(): string`
- `public get driver(): string`
- `public get isDeleted(): boolean`
- `public get url(): string`
- `public get absolutePath(): string | undefined`
- `public get hash(): string | undefined`
- `public async data(): Promise<StorageFileData>`
- `public async size(): Promise<number>`
- `public async mimeType(): Promise<string>`
- `public async lastModified(): Promise<Date | undefined>`
- `public async etag(): Promise<string | undefined>`
- `public async contents(): Promise<Buffer>`
- `public async stream(): Promise<Readable>`
- `public async text(): Promise<string>`
- `public async base64(): Promise<string>`
- `public async dataUrl(): Promise<string>`
- `public async temporaryUrl(expiresIn?: number): Promise<string>`
- `public async exists(): Promise<boolean>`
- `public async copy(destination: string): Promise<StorageFile>`
- `public async move(destination: string): Promise<this>`
- `public async rename(newName: string): Promise<this>`
- `public async delete(): Promise<boolean>`
- `public async setVisibility(visibility: FileVisibility): Promise<this>`
- `public async getVisibility(): Promise<FileVisibility>`
- `public async setStorageClass(storageClass: string): Promise<this>`
- `public async metadata(): Promise<StorageFileInfo>`
- `public toJSON(): object`
- `public toString(): string`
- `public static fromData(data: StorageFileData | CloudStorageFileData, driver: StorageDriverContract): StorageFile`
- `protected _path: string`
- `protected _driver: StorageDriverContract`
- `protected _data?: StorageFileData`
- `protected _deleted: boolean`
- `protected ensureNotDeleted(): void`

### Exports
- `storage: Storage`

## Mail
`src/mail/`

### Mail
*Chainable builder for constructing and sending emails.*

- `public static to(recipient: string | string[]): Mail`
- `public static config(config: MailConfigurations): Mail`
- `public static mailer(name: string): Mail`
- `public to(recipient: string | string[]): this`
- `public cc(recipient: string | string[]): this`
- `public bcc(recipient: string | string[]): this`
- `public replyTo(address: string): this`
- `public from(address: MailAddress): this`
- `public subject(subject: string): this`
- `public html(content: string): this`
- `public text(content: string): this`
- `public component(element: React.ReactElement): this`
- `public attach(content: Buffer | string, filename: string, contentType?: string): this`
- `public attachments(attachments: MailAttachment[]): this`
- `public attachFile(path: string, filename?: string, contentType?: string): this`
- `public priority(level: MailPriority): this`
- `public headers(headers: Record<string, string>): this`
- `public header(name: string, value: string): this`
- `public tags(tags: string[]): this`
- `public tag(tag: string): this`
- `public correlationId(id: string): this`
- `public withConfig(config: MailConfigurations): this`
- `public withMailer(name: string): this`
- `public beforeSending(handler: MailEvents["beforeSending"]): this`
- `public onSent(handler: MailEvents["onSent"]): this`
- `public onSuccess(handler: MailEvents["onSuccess"]): this`
- `public onError(handler: MailEvents["onError"]): this`
- `public getOptions(): Partial<MailOptions>`
- `public async send(): Promise<MailResult>`

### Functions
- `async sendMail(options: MailOptions): Promise<MailResult>`

## Resource
`src/resource/`

### Resource
*Core class for transforming models or objects into structured JSON responses.*

- `public constructor(originalData: GenericObject | Resource | Model)`
- `public toJSON(): GenericObject`
- `public transform(value: any, type: ResourceOutputValueCastType, locale?: string): any`
- `public get(key: string, defaultValue?: any): any`
- `public set(key: string, value: any): ResourceContract`
- `public arrayOf(schema: Record<string, ResourceFieldConfig>): ResourceArraySchema`
- `public string(inputKey?: string): ResourceFieldBuilder`
- `public date(inputKey?: string): ResourceFieldBuilder`
- `public localized(inputKey?: string): ResourceFieldBuilder`
- `public url(inputKey?: string): ResourceFieldBuilder`
- `public uploadsUrl(inputKey?: string): ResourceFieldBuilder`
- `public number(inputKey?: string): ResourceFieldBuilder`
- `public boolean(inputKey?: string): ResourceFieldBuilder`
- `public float(inputKey?: string): ResourceFieldBuilder`
- `public int(inputKey?: string): ResourceFieldBuilder`
- `public static normalizeSchema(schema: ResourceSchema): Record<string, ResourceFieldConfig>`
- `public resource: GenericObject`
- `public data: GenericObject`
- `public static schema: ResourceSchema`
- `public static parsedSchema: Record<string, ResourceFieldConfig>`
- `protected _selfSeen?: Set<unknown>`
- `protected boot(): void`
- `protected transformOutput(): void`
- `protected transformValue(value: any, outputSettings: ResourceFieldConfig, locale?: string): any`
- `protected extend(): void`
- `protected transformSelfReference(value: any, isArray: boolean): any`
- `protected resolveSelf(value: any): any`
- `protected transformArrayItem(item: any, schema: Record<string, ResourceFieldConfig>, locale?: string): any`
- `protected fieldBuilder(type: ResourceOutputValueCastType, inputKey?: string): ResourceFieldBuilder`

### ResourceFieldBuilder
*Fluent builder for individual resource fields with casting and conditional logic.*

- `public constructor(type: ResourceOutputValueCastType)`
- `public static fromCastType(castType: string): ResourceFieldBuilder`
- `public setInputKey(key: string): this`
- `public when(condition: () => boolean): this`
- `public nullable(): this`
- `public array(): this`
- `public getInputKey(): string | undefined`
- `public default(value: unknown): this`
- `public format(format: string): this`
- `public dateOptions(options: ResourceFieldBuilderDateOutputOptions): this`
- `public transform(value: any, locale?: string): any`
- `protected transformSingleValue(value: any, locale?: string): any`
- `protected transformDate(value: string | Date, locale?: string): any`
- `protected transformLocalized(value: LocalizedObject[] | string, locale?: string): any`
- `protected fieldValue?: unknown`
- `protected isNullable: boolean`
- `protected isArrayField: boolean`
- `protected defaultValue?: unknown`
- `protected dateFormat: string`
- `protected inputKeyToUse?: string`
- `protected condition?: () => boolean`

### Functions
- `defineResource(options: DefineResourceOptions): ResourceConstructor`

## Cache
`src/cache/`

### DatabaseCacheDriver (extends BaseCacheDriver)
*Cache driver implementation using Cascade ORM for persistence.*

- `public name: string`
- `public model: typeof CacheModel`
- `public setOptions(options: DatabaseCacheOptions): this`
- `public async removeNamespace(namespace: string): Promise<this>`
- `public async set(key: CacheKey, value: any, ttl?: number): Promise<this>`
- `public async get(key: CacheKey): Promise<any>`
- `public async remove(key: CacheKey): Promise<void>`
- `public async flush(): Promise<void>`

## Image
`src/image/`

### Image
*Deferred image manipulation pipeline powered by Sharp.*

- `public constructor(image: ImageInput | sharp.Sharp)`
- `public readonly image: sharp.Sharp`
- `public static fromFile(path: string): Image`
- `public static fromBuffer(buffer: Buffer): Image`
- `public static async fromUrl(url: string): Promise<Image>`
- `public apply(options: ImageTransformOptions): this`
- `public opacity(value: number): this`
- `public blackAndWhite(): this`
- `public grayscale(): this`
- `public async dimensions(): Promise<{ width: number | undefined; height: number | undefined }>`
- `public async metadata(): Promise<sharp.Metadata>`
- `public async refreshMetadata(): Promise<sharp.Metadata>`
- `public clearMetadataCache(): this`
- `public resize(options: sharp.ResizeOptions): this`
- `public crop(options: sharp.Region): this`
- `public quality(quality: number): this`
- `public async save(path: string): Promise<sharp.OutputInfo>`
- `public async saveAsWebp(path: string): Promise<sharp.OutputInfo>`
- `public format(format: ImageFormat): this`
- `public watermark(image: ImageInput | Image, options?: sharp.OverlayOptions): this`
- `public watermarks(configs: WatermarkConfig[]): this`
- `public rotate(angle: number): this`
- `public flip(): this`
- `public flop(): this`
- `public blur(sigma: number): this`
- `public async toBase64(): Promise<string>`
- `public async toDataUrl(): Promise<string>`
- `public sharpen(options?: sharp.SharpenOptions): this`
- `public negate(options?: sharp.NegateOptions): this`
- `public tint(color: sharp.Color): this`
- `public trim(options?: sharp.TrimOptions): this`
- `public async toBuffer(): Promise<Buffer>`
- `public clone(): Image`
- `public getOptions(): Readonly<InternalOptions>`
- `public getPendingOperationsCount(): number`
- `public resetOptions(): this`
- `public clearOperations(): this`
- `public reset(): this`
- `protected options: InternalOptions`
- `protected operations: ImageOperation[]`
- `protected cachedMetadata: sharp.Metadata | null`
- `protected pipelineExecuted: boolean`
- `protected addOperation(operation: ImageOperation): this`
- `protected async executePipeline(): Promise<sharp.Sharp>`
- `protected async executeOperation(image: sharp.Sharp, operation: ImageOperation): Promise<void>`
- `protected async resolveImageBuffer(input: ImageInput | Image): Promise<Buffer>`
- `protected async applyFormatAndQuality(image: sharp.Sharp): Promise<void>`

## Encryption & Passwords
`src/encryption/`

### Functions (Encryption)
- `encrypt(plainText: string): string`
- `decrypt(cipherText: string): string`

### Functions (Passwords)
- `async hashPassword(password: string): Promise<string>`
- `async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>`

## Business Logic
`src/retry/`, `src/use-cases/`

### Functions (Retry)
- `async retry<T>(fn: () => T | Promise<T>, options?: RetryOptions): Promise<T>`

### Functions (Use Cases)
- `useCase<Output, Input = any>(options: UseCase<Output, Input>): UseCaseExecutor`

## React
`src/react/`

### Functions
- `renderReact(reactElement: ReactElement | ComponentType | ReactNode): string`
