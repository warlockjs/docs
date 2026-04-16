# Dev Server & Build Inventory

*Development server, HMR engine, production builder, and project generation tools.*

## Development Server Core
`src/dev-server/`

### DevelopmentServer
*Main coordinator for the development environment, managing startup, shutdown, and HMR orchestration.*

- `public constructor()`
- `public async start(): Promise<void>`
- `public async shutdown(): Promise<void>`
- `public isRunning(): boolean`
- `public getModuleLoader(): ModuleLoader | undefined`
- `private async autoDiscoverFiles(): Promise<void>`
- `private setupEventListeners(): void`
- `private async handleBatchComplete(batch: { added: string[]; changed: string[]; deleted: string[] }): Promise<void>`

### FilesOrchestrator
*Central registry and manager for all project files, tracking state and coordinating sub-systems.*

- `public constructor()`
- `public async init(): Promise<void>`
- `public async initiaizeAll(): Promise<void>`
- `public async add(relativePath: string): Promise<FileManager>`
- `public async load<T>(relativePath: string, type?: string): Promise<T>`
- `public getDependencyGraph(): DependencyGraph`
- `public getInvalidationChain(file: string): string[]`
- `public getFiles(): Map<string, FileManager>`
- `public async watchFiles(): Promise<void>`
- `public async checkHealth(files: { added: string[]; changed: string[]; deleted: string[] }): Promise<void>`
- `public async startCheckingHealth(healthCheckers?: FileHealthCheckerContract[]): Promise<void>`
- `public async getAllFilesFromFilesystem(): Promise<string[]>`
- `public async processAllFilesFresh(filePaths: string[]): Promise<void>`

### FileManager
*Represents a single file in the project, managing its source, hash, transpilation, and HMR cleanup.*

- `public constructor(absolutePath: string, files: Map<string, FileManager>, fileOperations: FileOperations)`
- `public async init(fileManifest?: Partial<FileManifest>): Promise<void>`
- `public async process(options?: ProcessOptions): Promise<boolean>`
- `public async parse(): Promise<void>`
- `public async complete(): Promise<void>`
- `public async update(): Promise<boolean>`
- `public async forceReprocess(): Promise<void>`
- `public addCleanup(cleanup: CleanupFunction | CleanupFunction[]): void`
- `public resetCleanup(): void`
- `public toManifest(): FileManifest`
- `protected async initFromManifest(fileManifest: Partial<FileManifest>): Promise<void>`
- `protected detectFileTypeAndLayer(): void`
- `public get cachePathUrl(): string`

### FilesWatcher
*Wrapper around chokidar for monitoring filesystem events.*

- `public async watch(config?: WatchConfig): Promise<void>`
- `public onFileChange(callback: FileChangeCallback): () => void`
- `public onFileDelete(callback: FileDeleteCallback): () => void`
- `public onFileAdd(callback: FileAddCallback): () => void`
- `public onFileError(callback: FileErrorCallback): () => void`
- `public onDirectoryAdd(callback: FileAddDirCallback): () => void`
- `public onDirectoryRemove(callback: FileUnlinkDirCallback): () => void`

## Static Analysis & Transformation
`src/dev-server/`

### DependencyGraph
*Tracks bidirectional dependencies and detects circular references.*

- `public build(files: Map<string, FileManager>): void`
- `public addDependency(file: string, dependency: string): void`
- `public removeDependency(file: string, dependency: string): void`
- `public removeFile(file: string): void`
- `public updateFile(file: string, newDependencies: Set<string>): void`
- `public getDependencies(file: string): Set<string>`
- `public getDependents(file: string): Set<string>`
- `public getInvalidationChain(file: string): string[]`
- `public detectCircularDependencies(): string[][]`
- `public getStats(): object`

### Functions & Utilities
- `export function transformImports(fileManager: FileManager): string`
- `export async function parseImports(source: string, filePath: string): Promise<Map<string, string>>`
- `export function isTypeOnlyFile(source: string): boolean`
- `export function onCleanup(callback: () => any): void`

## Automation & Generation
`src/dev-server/`, `src/generations/`

### TypeGenerator
*Analyzes configuration files to generate module augmentation types for IDE support.*

- `public async generateAll(): Promise<void>`
- `public async generateStorageTypes(configPath: string): Promise<void>`
- `public async generateConfigTypes(): Promise<void>`
- `public async handleFileChange(changedPath: string): Promise<void>`
- `public shouldRegenerateTypes(changedPath: string): boolean`
- `public async executeGenerateAllCommand(): Promise<void>`

### CLI Actions
- `export async function addCommandAction(options: CommandActionData): Promise<void>`

## Production Build
`src/production/`

### ProductionBuilder
*Bundles the application using esbuild for production deployment.*

- `public async build(): Promise<void>`
- `private async initializeOptions(): Promise<void>`
- `private async generateCombinedFiles(): Promise<void>`
- `private async generateEntryPoint(): Promise<void>`
- `private async bundle(): Promise<void>`

## Testing
`src/tests/`

### Test Helpers
- `export function getTestServerUrl(): string`
- `export async function testRequest(path: string, options?: RequestInit): Promise<Response>`
- `export async function testGet(path: string, options?: RequestInit): Promise<Response>`
- `export async function testPost(path: string, body?: unknown, options?: RequestInit): Promise<Response>`
- `export async function testPut(path: string, body?: unknown, options?: RequestInit): Promise<Response>`
- `export async function testDelete(path: string, options?: RequestInit): Promise<Response>`
- `export async function testPatch(path: string, body?: unknown, options?: RequestInit): Promise<Response>`
- `export async function expectJson<T>(response: Response, expectedStatus?: number): Promise<T>`
- `export async function parseJsonResponse<T>(response: Response): Promise<T>`
