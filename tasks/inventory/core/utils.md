# Utils Inventory

*General purpose utilities, path managers, benchmarking tools, and framework-level helpers.*

## Benchmark
`src/benchmark/`

### Functions
- `async measure<T>(name: string, fn: () => T | Promise<T>, options?: BenchmarkOptions<T>): Promise<BenchmarkSuccessResult<T> | BenchmarkErrorResult>`

### BenchmarkProfiler
*Aggregates measurement results into performance statistics (p50, p95, avg, etc.) with ring buffer support.*

- `public constructor(options?: BenchmarkProfilerOptions)`
- `public record(result: BenchmarkSuccessResult<unknown> | BenchmarkErrorResult): void`
- `public stats(name: string): BenchmarkStats | undefined`
- `public allStats(): Record<string, BenchmarkStats>`
- `public async flush(): Promise<void>`
- `public reset(name?: string): void`
- `public dispose(): void`

### BenchmarkSnapshots
*Captures and stores a limited window of raw benchmark results (specifically for errors or values).*

- `public constructor(options?: BenchmarkSnapshotsOptions)`
- `public record(result: BenchmarkSuccessResult<unknown> | BenchmarkErrorResult): void`
- `public getSnapshots(name: string): (BenchmarkSuccessResult<unknown> | BenchmarkErrorResult)[]`
- `public allSnapshots(): Record<string, (BenchmarkSuccessResult<unknown> | BenchmarkErrorResult)[]>`
- `public reset(name?: string): void`

## Paths
`src/utils/paths.ts`, `src/utils/internal.ts`

### Path Helpers
- `rootPath(...paths: string[]): string`
- `srcPath(...paths: string[]): string`
- `storagePath(relativePath?: string): string`
- `uploadsPath(relativePath?: string): string`
- `publicPath(relativePath?: string): string`
- `cachePath(relativePath?: string): string`
- `appPath(relativePath?: string): string`
- `consolePath(relativePath?: string): string`
- `tempPath(relativePath?: string): string`
- `sanitizePath(filePath: string): string`
- `warlockPath(...path: string[]): string`
- `configPath(...path: string[]): string`
- `internalWarlockPath(relativePath?: string): string`
- `internalWarlockConfigPath(): string`
- `warlockCorePackagePath(additionalPath?: string): string`

## URLs
`src/utils/urls.ts`

### URL Helpers
- `setBaseUrl(url: string): void`
- `url(path?: string): string`
- `uploadsUrl(path?: string): string`
- `publicUrl(path?: string): string`
- `assetsUrl(path?: string): string`

## Localization
`src/utils/get-localized.ts`

### Functions
- `getLocalized(values: LocalizedObject[], localeCode?: string, key?: string): any`

## Data & Object Tools
`src/utils/to-json.ts`, `src/utils/promise-all-object.ts`, `src/utils/sluggable.ts`

### Functions
- `async toJson(value: any): Promise<any>`
- `async promiseAllObject<T extends Record<string, Promise<any>>>(promises: T): Promise<{ [K in keyof T]: T[K] extends Promise<infer U> ? U : never }>`
- `sluggable(generateFrom: string, slugLocaleCode?: string): (model: Model) => string`

## Execution & Flow
`src/utils/queue.ts`, `src/utils/sleep.ts`

### Queue<T>
*Batch processing queue with parallel/sequential execution and timeout intervals.*

- `public constructor(executeFn: (items: T[]) => Promise<void>, executeInParallel?: boolean, executeEvery?: number, batchSize: number, maxSize?: number)`
- `public enqueue(item: T): void`
- `private startTimer(): void`
- `private async execute(): Promise<void>`

### Functions
- `sleep(ms: number): Promise<void>`

## Logging
`src/utils/app-log.ts`, `src/utils/database-log.ts`

### DatabaseLog (extends LogChannel)
*Log channel implementation for persisting logs to a database via Cascade.*

- `public name: string`
- `public get model(): ChildModel<Model>`
- `public async log(log: LoggingData): Promise<void>`

### App Log Object
- `appLog.info(module: string, message: string): void`
- `appLog.error(module: string, message: string): void`
- `appLog.warn(module: string, message: string): void`
- `appLog.debug(module: string, message: string): void`
- `appLog.success(module: string, message: string): void`

## File & Maintenance
`src/utils/download-file.ts`, `src/utils/cleanup-temp-files.ts`

### Functions
- `async downloadFileFromUrl(fileUrl: string, outputLocationPath: string, fileName?: string): Promise<AxiosResponse>`
- `async cleanupTempFiles(maxAgeMinutes?: number): Promise<void>`

## Environment & Version
`src/utils/environment.ts`, `src/utils/framework-vesion.ts`

### Functions
- `environment(): Environment`
- `setEnvironment(env: Environment): void`
- `async getWarlockVersion(): Promise<string>`
- `getFrameworkVersion(): string | null`
