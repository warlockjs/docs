# @warlock.js/core — Structured Inventory Plan

> **For AI agents resuming this task:**
> The `@warlock.js/core` package is too large for a single inventory file.
> This document defines the split strategy, the target files, and tracks completion status.
> Each sub-file must follow the **exact same signature-only format** as `tasks/inventory/seal.md`.
> That means: one-line descriptions per file, full `public` and `protected` method signatures with parameter types and return types, NO implementation logic.

---

## Format Reference

See → `tasks/inventory/seal.md`

Rules:
- Every class must list all `public` and `protected` method signatures.
- Every exported function must include parameter types and return type.
- One-line description per file (in *italics*).
- No implementation logic — signatures only.

---

## Target Output Files

All files live in `tasks/inventory/core/`:

| File | Status | Covers |
|------|--------|--------|
| `foundation.md` | `[x]` | `application/`, `bootstrap/`, `bootstrap.ts`, `manifest/`, `warlock-config/` |
| `routing.md` | `[x]` | `router/` (router.ts, route-builder.ts, route.ts, route-registry.ts, types.ts) |
| `http.md` | `[x]` | `http/` (request, response, uploaded-file, middleware/, context/, errors/, database/, events, plugins, types, uploads-types, config) |
| `data.md` | `[x]` | `repositories/` (repository.manager, adapters/cascade, contracts/), `restful/`, `database/` (actions, seeds, models) |
| `validation.md` | `[x]` | `validation/` (validateAll, init, types, database/, file/, plugins/, validators/) |
| `infrastructure.md` | `[x]` | `connectors/` (all), `cli/` (cli-command, cli-commands.manager, types, parse-cli-args, commands/), `config/`, `manifest/`, `warlock-config/` |
| `services.md` | `[x]` | `storage/` (all), `mail/` (all), `resource/` (all), `cache/`, `image/`, `encryption/`, `retry/`, `use-cases/`, `react/` |
| `utils.md` | `[x]` | `utils/` (all 18 files), `benchmark/` (all) |
| `dev-server.md` | `[x]` | `dev-server/` (all 34+ files), `production/`, `generations/`, `tests/` |

---

## Complete Folder → File Assignment

Below is every folder in `src/` mapped to its target inventory file. No folder should be missed.

### `foundation.md`
```
src/application/
  application.ts                  → Application class
  application-config-types.ts     → ApplicationConfig type
  index.ts                        → re-exports

src/bootstrap/
  setup.ts                        → setup() function

src/bootstrap.ts                  → bootstrap() function

src/manifest/
  manifest-manager.ts             → ManifestManager class + manifestManager constant
```

### `routing.md`
```
src/router/
  router.ts                       → Router class + router constant
  route-builder.ts                → RouteBuilder class
  route.ts                        → Route class
  route-registry.ts               → RouteRegistry class
  types.ts                        → all exported types/interfaces
```

### `http.md`
```
src/http/
  request.ts                      → Request class (full public/protected API)
  response.ts                     → Response class (full public/protected API)
  uploaded-file.ts                → UploadedFile class (full public/protected API)
  config.ts                       → http config types
  events.ts                       → http event types
  plugins.ts                      → http plugin registration
  request-controller.ts           → RequestController
  server.ts                       → server setup
  types.ts                        → ReturnedResponse, HttpMethod, etc.
  uploads-config.ts               → upload config defaults
  uploads-types.ts                → UploadedFileOptions, etc.
  createHttpApplication.ts        → createHttpApplication()

  context/
    request-context.ts            → RequestContext class, useRequest(), useCurrentUser(), useRequestStore()

  database/
    RequestLog.ts                 → RequestLog model

  errors/
    errors.ts                     → HttpError, ResourceNotFoundError, UnAuthorizedError, ForbiddenError,
                                     BadRequestError, ServerError, ConflictError, NotAcceptableError, NotAllowedError

  middleware/
    cache-response-middleware.ts  → cacheMiddleware(), CacheMiddlewareOptions type
    inject-request-context.ts     → createRequestStore(), t(), fromRequest()
```

### `data.md`
```
src/repositories/
  repository.manager.ts           → RepositoryManager class (full API: find, list, all, create, update, delete, cache variants, etc.)

  contracts/
    query-builder.contract.ts     → QueryBuilderContract interface (full method list)
    repository-adapter.contract.ts → RepositoryAdapterContract interface
    types.ts                      → RepositoryOptions, PaginationResult, FilterRules, etc.

  adapters/cascade/
    cascade-adapter.ts            → CascadeAdapter class
    cascade-query-builder.ts      → CascadeQueryBuilder class
    filter-applicator.ts          → FilterApplicator class

src/restful/
  restful.ts                      → Restful<T> abstract class (full public + protected lifecycle hooks)

src/database/
  migrate-action.ts               → MigrateAction + helper functions
  create-database-action.ts       → createDatabaseAction()
  drop-tables-action.ts           → dropTablesAction()
  seed-command-action.ts          → seedCommandAction()
  utils.ts                        → database utility functions

  seeds/
    seeder.ts                     → Seeder abstract class
    seeders.manager.ts            → SeedersManager class
    seeds-table-migration.ts      → seeds migration helper
    types.ts                      → Seeder types

  models/database-log/
    database-log.ts               → DatabaseLog model
```

### `validation.md`
```
src/validation/
  validateAll.ts                  → validateAll()
  init.ts                         → validation init (Seal plugin registration)
  types.ts                        → ValidationConfiguration, type augmentations for Seal validators

  database/
    unique.ts                     → unique rule
    unique-except-current-id.ts   → uniqueExceptCurrentId rule
    unique-except-current-user.ts → uniqueExceptCurrentUser rule
    exists.ts                     → exists rule
    exists-except-current-id.ts   → existsExceptCurrentId rule
    exists-except-current-user.ts → existsExceptCurrentUser rule
    types.ts                      → UniqueRuleOptions, ExistsRuleOptions, etc.

  file/
    file.ts                       → file validation helper

  plugins/
    database-plugin.ts            → database Seal plugin (installs unique/exists rules)
    file-plugin.ts                → file Seal plugin
    localized-plugin.ts           → localized Seal plugin

  validators/
    file-validator.ts             → FileValidator class (full public API)
```

### `infrastructure.md`
```
src/connectors/
  connectors-manager.ts           → ConnectorsManager class + connectorsManager constant
  base-connector.ts               → BaseConnector abstract class
  cache-connector.ts              → CacheConnector class
  communicator-connector.ts       → CommunicatorConnector class
  database-connector.ts           → DatabaseConnector class
  http-connector.ts               → HttpConnector class
  logger-connector.ts             → LoggerConnector class
  mail-connector.ts               → MailerConnector class
  storage.connector.ts            → StorageConnector class
  types.ts                        → Connector interface, ConnectorName type, ConnectorPriority enum

src/config/
  config-getter.ts                → config constant, ConfigAccessor interface
  config-loader.ts                → ConfigLoader class
  config-handlers.ts              → config handler registration
  config-manager.ts               → ConfigManager
  config-special-handlers.ts      → configSpecialHandlers
  load-config-files.ts            → loadConfigFiles()
  types.ts                        → ConfigRegistry, ConfigKey

src/warlock-config/
  warlock-config.manager.ts       → WarlockConfigManager class + warlockConfigManager constant
  define-config.ts                → defineConfig() helper
  types.ts                        → WarlockConfig interface

src/cli/
  cli-command.ts                  → CLICommand class + command() factory
  cli-commands.manager.ts         → CLICommandsManager class
  cli-commands.utils.ts           → display helpers (displayHelp, etc.)
  parse-cli-args.ts               → parseCliArgs()
  commands-loader.ts              → cliCommandsLoader
  framework-cli-commands.ts       → built-in framework command registrations
  string-similarity.ts            → findSimilar()
  types.ts                        → CLICommandAction, CLICommandOption, etc.

  commands/
    migrate.command.ts            → migrate command
    seed.command.ts               → seed command
    dev-server.command.ts         → dev-server command
    build.command.ts              → build command
    add.command.ts                → add command
    create-database.command.ts    → create-database command
    drop-tables.command.ts        → drop-tables command
    start-production.command.ts   → start-production command
    storage-put.command.ts        → storage-put command
    storage-put.action.ts         → storage put action logic
    typings-generator.command.ts  → typings-generator command
```

### `services.md`
```
src/storage/
  storage.ts                      → Storage class + storage constant
  scoped-storage.ts               → ScopedStorage class
  storage-file.ts                 → StorageFile class
  config.ts                       → StorageConfigurations type
  types.ts                        → StorageDriver, StorageOptions, etc.

  drivers/
    local-driver.ts               → LocalDriver class
    cloud-driver.ts               → CloudDriver abstract class (S3/R2/DO base)
    s3-driver.ts                  → S3Driver class
    r2-driver.ts                  → R2Driver class
    do-spaces-driver.ts           → DOSpacesDriver class

  context/
    storage-driver-context.ts     → storage AsyncLocalStorage context

  utils/
    mime.ts                       → mime type helpers

src/mail/
  mail.ts                         → Mail class
  send-mail.ts                    → SendMail class + sendMail()
  mailer-pool.ts                  → MailerPool class
  test-mailbox.ts                 → TestMailbox class
  react-mail.ts                   → React mail component rendering
  events.ts                       → mail event types
  config.ts                       → MailConfigurations type
  types.ts                        → MailDriver, MailOptions, etc.

src/resource/
  resource.ts                     → Resource abstract class
  resource-field-builder.ts       → ResourceFieldBuilder class
  define-resource.ts              → defineResource()
  register-resource.ts            → registerResource()
  types.ts                        → ResourceSchema, etc.

src/cache/
  database-cache-driver.ts        → DatabaseCacheDriver class

src/image/
  image.ts                        → Image class (full public/protected API)

src/encryption/
  encrypt.ts                      → encrypt(), decrypt()
  hash.ts                         → hmacHash()
  password.ts                     → hashPassword(), verifyPassword()
  types.ts                        → EncryptionConfigurations

src/retry/
  retry.ts                        → retry<T>()
  types.ts                        → RetryOptions

src/use-cases/
  use-case.ts                     → useCase<Output, Input>()
  use-cases-registry.ts           → registry functions
  use-case-events.ts              → lifecycle event helpers
  use-case-pipeline.ts            → runPipeline()
  use-case.errors.ts              → UseCaseError class
  types.ts                        → UseCase, UseCaseResult, etc.

src/react/
  index.ts                        → React rendering utilities (renderToString etc.)

src/logger/
  logger.ts                       → setLogConfigurations()
  types.ts                        → LogConfigurations
```

### `utils.md`
```
src/utils/
  paths.ts                        → rootPath(), srcPath(), storagePath(), uploadsPath(),
                                     publicPath(), appPath(), consolePath(), tempPath(),
                                     sanitizePath(), warlockPath(), configPath()
  urls.ts                         → setBaseUrl(), url(), uploadsUrl(), publicUrl(), assetsUrl()
  environment.ts                  → environment(), setEnvironment(), Environment type
  queue.ts                        → Queue<T> class
  app-log.ts                      → app logging helpers
  database-log.ts                 → database logging helpers
  download-file.ts                → downloadFile()
  cleanup-temp-files.ts           → cleanupTempFiles()
  framework-vesion.ts             → getFrameworkVersion()
  get-localized.ts                → getLocalized()
  internal.ts                     → internal utilities
  promise-all-object.ts           → promiseAllObject()
  sleep.ts                        → sleep()
  sluggable.ts                    → toSlug()
  to-json.ts                      → toJson()
  types.ts                        → shared utility types

src/benchmark/
  benchmark.ts                    → measure() function
  profiler.ts                     → Profiler class
  benchmark-snapshots.ts          → BenchmarkSnapshots class
  types.ts                        → BenchmarkOptions, BenchmarkResult, etc.

  channels/
    console.channel.ts            → ConsoleBenchmarkChannel
    noop.channel.ts               → NoopBenchmarkChannel
```

### `dev-server.md`
```
src/dev-server/
  development-server.ts           → DevelopmentServer class
  files-orchestrator.ts           → FilesOrchestrator class + filesOrchestrator constant
  file-manager.ts                 → FileManager class
  file-operations.ts              → file operation helpers
  file-event-handler.ts           → FileEventHandler class
  files-watcher.ts                → FilesWatcher class
  layer-executor.ts               → LayerExecutor class
  module-loader.ts                → ModuleLoader class
  dependency-graph.ts             → DependencyGraph class
  import-transformer.ts           → ImportTransformer class
  import-deduplicator.ts          → ImportDeduplicator class
  export-analyzer.ts              → ExportAnalyzer class
  parse-imports.ts                → parseImports()
  type-generator.ts               → TypeGenerator class
  special-files-collector.ts      → SpecialFilesCollector class
  runtime-import-helper.ts        → runtime import utilities
  tsconfig-manager.ts             → TsConfigManager class
  package-json-manager.ts         → PackageJsonManager class
  transpile-file.ts               → transpile()
  dev-logger.ts                   → dev logging functions
  create-worker.ts                → createWorker()
  manifest-manager.ts             → (dev-server) ManifestManager
  path.ts                         → Path class
  flags.ts                        → flag constants
  events.ts                       → dev server event types
  utils.ts                        → dev server utilities
  start-development-server.ts     → startDevelopmentServer()
  index.ts                        → re-exports

  health-checker/
    files-healthcare.manager.ts   → FilesHealthcareManager class
    file-health-checker.contract.ts → FileHealthChecker interface
    file-health-result.ts         → FileHealthResult class

    checkers/
      base-health-checker.ts      → BaseHealthChecker abstract class
      eslint-health-checker.ts    → EslintHealthChecker class
      typescript-health-checker.ts → TypeScriptHealthChecker class

src/production/
  production-builder.ts           → ProductionBuilder class
  esbuild-plugins.ts              → esbuild plugin helpers
  build-app-production.ts         → buildAppProduction()

src/generations/
  add-command.action.ts           → addCommandAction() (package add scaffold)
  stubs.ts                        → stub template functions

src/tests/
  test-helpers.ts                 → TestHelpers class + test helper functions
  start-http-development-server.ts → startHttpDevelopmentServer()
  vitest-setup.ts                 → vitest setup helpers
```

---

## Instructions for AI Agents

When picking up this task in a new conversation:

1. **Check what is `[x]` completed** in the table above.
2. **Pick the next `[ ]` item** and create the file in `tasks/inventory/core/`.
3. **Read every .ts file** listed under that section using `view_file`.
4. **Extract all public and protected signatures** — no implementation logic.
5. **Use `seal.md` as the formatting gold standard** (`tasks/inventory/seal.md`).
6. Save your work after each file is done.
7. Mark the file `[x]` in this document.

> [!IMPORTANT]
> Do NOT skip files. Every `.ts` file listed above must be documented.
> If a file is tiny (1-2 exports), still document it — completeness matters.

---

## Master Index (core.md)

Once all sub-files are complete, update `tasks/inventory/core.md` to be a directory index:

```markdown
# @warlock.js/core — Inventory Index

- [Foundation](./core/foundation.md) — Application, Bootstrap, Manifest
- [Routing](./core/routing.md) — Router, RouteBuilder, Route
- [HTTP](./core/http.md) — Request, Response, UploadedFile, Middleware
- [Data](./core/data.md) — Repository, Restful, Database, Seeds
- [Validation](./core/validation.md) — Rules, Validators, Plugins
- [Infrastructure](./core/infrastructure.md) — Connectors, CLI, Config
- [Services](./core/services.md) — Storage, Mail, Resource, Image, Encryption
- [Utils](./core/utils.md) — Path helpers, Queue, Benchmark
- [Dev Server](./core/dev-server.md) — Dev tools, Health checker, Production
```
