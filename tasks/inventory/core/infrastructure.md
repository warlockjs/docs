# @warlock.js/core — Infrastructure Inventory

### src/connectors/base-connector.ts
*Abstract base class for service connectors with lifecycle and file watching capabilities.*

- **Abstract Class** `BaseConnector`
  - `public abstract readonly name: ConnectorName`
  - `public abstract readonly priority: number`
  - `protected abstract readonly watchedFiles: string[]`
  - `protected active: boolean`
  - `public isActive(): boolean`
  - `public abstract start(): Promise<void>`
  - `public async restart(): Promise<void>`
  - `public abstract shutdown(): Promise<void>`
  - `public shouldRestart(changedFiles: string[]): boolean`
  - `protected isWatchedFile(file: string): boolean`

### src/connectors/connectors-manager.ts
*Central manager for registering, ordering, and orchestrating service connector lifecycles.*

- **Class** `ConnectorsManager`
  - `private readonly connectors: Connector[]`
  - `public constructor()`
  - `public register(...connectors: Connector[]): void`
  - `public list(): Connector[]`
  - `public async start(connectorsNames?: ConnectorName[]): Promise<void>`
  - `public async startWithout(excludedConnectors: ConnectorName[]): Promise<void>`
  - `public async shutdown(): Promise<void>`
  - `public shutdownOnProcessKill(): void`
- **Constant** `connectorsManager: ConnectorsManager`

### src/connectors/types.ts
*Interfaces and types for service connectors.*

- **Interface** `Connector`
- **Type** `ConnectorName`
- **Enum** `ConnectorPriority`

### src/cli/cli-command.ts
*Fluent API for defining CLI commands with actions, options, and preloading.*

- **Class** `CLICommand`
  - `public commandSource?: CLICommandSource`
  - `public commandAction?: CLICommandAction`
  - `public commandPreAction?: CLICommandAction`
  - `public commandPreload?: CLICommandPreload`
  - `public commandDescription?: string`
  - `public commandOptions: ResolvedCLICommandOption[]`
  - `public commandRelativePath?: string`
  - `public isPersistent: boolean`
  - `public commandAlias?: string`
  - `public constructor(public name: string, description?: string)`
  - `public source(source: CLICommandSource): this`
  - `public description(description: string): this`
  - `public persistent(isPersistent?: boolean): this`
  - `public alias(alias: string): this`
  - `public action(action: CLICommandAction): this`
  - `public preAction(action: CLICommandAction): this`
  - `public options(options: CLICommandOption[]): this`
  - `public $relativePath(relativePath: string): this`
  - `public option(option: CLICommandOption): this`
  - `public option(name: string, description?: string, options?: Omit<CLICommandOption, "name">): this`
  - `protected parseOption(option: CLICommandOption): ResolvedCLICommandOption`
  - `private extractOptionName(text: string): string`
  - `public preload(options: CLICommandPreload): this`
  - `public async execute(data: CommandActionData): Promise<void>`
- **Function** `command(options: CLICommandOptions): CLICommand`

### src/cli/cli-commands.manager.ts
*Orchestrates CLI command registration, lazy loading, and execution.*

- **Class** `CLICommandsManager`
  - `public commands: CLICommand[]`
  - `public commandsMap: Map<string, CLICommand>`
  - `public aliasMap: Map<string, string>`
  - `public register(...commands: CLICommand[]): this`
  - `public getCommand(name: string): CLICommand | undefined`
  - `public getAllCommandNames(): string[]`
  - `public async start(): Promise<void>`
  - `protected async showGlobalHelp(): Promise<void>`
  - `protected async warmCache(): Promise<void>`
  - `protected async loadPluginsCommands(): Promise<void>`
  - `protected async lazyGetCommand(name: string): Promise<CLICommand | null>`
  - `protected async loadProjectCommands(name: string): Promise<void>`
  - `protected validateOptions(command: CLICommand, options: Record<string, any>): ResolvedCLICommandOption[]`
  - `protected applyDefaultOptions(command: CLICommand, options: Record<string, any>): Record<string, any>`
  - `public async execute(command: CLICommand, data: CommandActionData): Promise<void>`
  - `protected async loadPreloaders(command: CLICommand): Promise<void>`

### src/cli/types.ts
*Type definitions for CLI commands, options, and actions.*

- **Type** `CLICommandSource`
- **Type** `CommandActionData`
- **Type** `CLICommandPreload`
- **Type** `CLICommandOption`
- **Type** `ResolvedCLICommandOption`
- **Type** `CLICommandAction`
- **Type** `CLICommandOptions`

### src/cli/parse-cli-args.ts
*Utility for parsing process.argv into structured command names, arguments, and options.*

- **Type** `ParsedCliArgs`
- **Function** `parseCliArgs(argv: string[]): ParsedCliArgs`

### src/config/config-manager.ts
*Manager for loading and reloading project configuration files.*

- **Class** `ConfigManager`
  - `public loader: ConfigLoader`
  - `public loadAll(files: FileManager[]): Promise<any>`
  - `public async reload(file: FileManager): Promise<any>`
- **Constant** `configManager: ConfigManager`

### src/manifest/manifest-manager.ts
*Handles persistence of command metadata for fast CLI startup.*

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

### src/warlock-config/warlock-config.manager.ts
*Manages warlock.config.ts compilation and loading.*

- **Class** `WarlockConfigManager`
  - `private config?: WarlockConfig`
  - `private loading?: Promise<WarlockConfig | undefined>`
  - `public async load(): Promise<WarlockConfig | undefined>`
  - `private async doLoad(): Promise<WarlockConfig | undefined>`
  - `protected async compile(): Promise<boolean>`
  - `public get<Key extends keyof WarlockConfig>(key: Key, defaultValue?: WarlockConfig[Key]): WarlockConfig[Key]`
  - `public async lazyGet<Key extends keyof WarlockConfig>(key: Key, defaultValue?: WarlockConfig[Key]): Promise<WarlockConfig[Key]>`
  - `public get isLoaded(): boolean`
  - `public getAll(): WarlockConfig`
  - `public async reload(): Promise<void>`
- **Constant** `warlockConfigManager: WarlockConfigManager`

### src/warlock-config/types.ts
*Type definitions for Warlock framework configuration.*

- **Type** `WarlockConfig`
