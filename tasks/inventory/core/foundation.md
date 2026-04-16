# @warlock.js/core — Foundation Inventory

### src/application/application.ts
*Core application class manageing environment, versioning, and unified project paths.*

- **Class** `Application`
  - `public static readonly startedAt: Date`
  - `public static runtimeStrategy: "production" | "development"`
  - `public static get version(): string`
  - `public static setRuntimeStrategy(strategy: "production" | "development"): void`
  - `public static get uptime(): number`
  - `public static get environment(): Environment`
  - `public static setEnvironment(env: Environment): void`
  - `public static get isProduction(): boolean`
  - `public static get isDevelopment(): boolean`
  - `public static get isTest(): boolean`
  - `public static get rootPath(): string`
  - `public static get srcPath(): string`
  - `public static get appPath(): string`
  - `public static get storagePath(): string`
  - `public static get uploadsPath(): string`
  - `public static get publicPath(): string`

### src/application/application-config-types.ts
*Type definitions for application-level configurations.*

- **Type** `AppConfigurations`
  - `appName?: string`
  - `localeCode?: string`
  - `baseUrl?: string`
  - `timezone?: string`
  - `localeCodes?: string[]`

### src/bootstrap/setup.ts
*Pre-bootstrap logic for environment display and logging.*

- **Function** `displayEnvironmentMode(): void`

### src/bootstrap.ts
*Unified bootstrap entry point for initializing environment and logging.*

- **Function** `bootstrap(): Promise<void>`

### src/manifest/manifest-manager.ts
*Manager for background command metadata and manifest persistence.*

- **Type** `ManifestCommandOption`
  - `name: string`
  - `text: string`
  - `alias?: string`
  - `description?: string`
  - `type?: "string" | "boolean" | "number"`
  - `required?: boolean`
  - `defaultValue?: string | boolean | number`
- **Type** `ManifestCommandData`
  - `relativePath?: string`
  - `source: "framework" | "plugin" | "project"`
  - `description?: string`
  - `alias?: string`
  - `options?: ManifestCommandOption[]`
- **Class** `ManifestManager`
  - `protected _commandsJson?: ManifestCommandsJson`
  - `protected _hasChanges: boolean`
  - `protected _isLoaded: boolean`
  - `public get hasChanges(): boolean`
  - `public get isCommandLoaded(): boolean`
  - `public async loadCommands(): Promise<ManifestCommandsJson | undefined>`
  - `public get commandsJson(): ManifestCommandsJson | undefined`
  - `public async saveCommands(): Promise<void>`
  - `public addCommandToList(name: string, command: ManifestCommandData): void`
  - `public clearCommandsCache(): void`
  - `public async removeCommandsFile(): Promise<void>`
- **Constant** `manifestManager: ManifestManager`
