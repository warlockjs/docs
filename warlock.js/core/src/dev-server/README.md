# Dev Server

The development server — the largest and most complex module in `core/src`. Handles TypeScript transpilation, file watching, import transformation, hot module reloading (HMR), dependency graph tracking, type generation, and the development build pipeline.

## Key Files

| File                          | Purpose                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `development-server.ts`       | Main `DevelopmentServer` class — orchestrates the dev workflow  |
| `start-development-server.ts` | Entry point that creates and starts the dev server              |
| `files-orchestrator.ts`       | Coordinates file operations, routing output to `.warlock/`      |
| `file-manager.ts`             | Manages individual file state, transforms, and caching          |
| `file-event-handler.ts`       | Handles file system events (create, change, delete)             |
| `files-watcher.ts`            | Watches `src/` for changes via chokidar                         |
| `layer-executor.ts`           | Executes the build pipeline in ordered layers                   |
| `parse-imports.ts`            | Parses TypeScript `import` statements for dependency resolution |
| `import-transformer.ts`       | Transforms import paths for the dev runtime                     |
| `import-deduplicator.ts`      | Deduplicates and consolidates import statements                 |
| `dependency-graph.ts`         | Tracks module dependencies for incremental rebuilds             |
| `transpile-file.ts`           | esbuild-based TypeScript → JavaScript transpilation             |
| `module-loader.ts`            | Dynamic module loading with cache busting                       |
| `type-generator.ts`           | Generates TypeScript declaration files                          |
| `special-files-collector.ts`  | Discovers and collects special files (e.g., routes, config)     |
| `tsconfig-manager.ts`         | Reads and manages `tsconfig.json`                               |
| `dev-logger.ts`               | Colored dev-mode logging                                        |
| `manifest-manager.ts`         | Dev-specific manifest tracking                                  |
| `runtime-import-helper.ts`    | Helper for runtime dynamic imports                              |
| `export-analyzer.ts`          | Analyzes file exports for barrel optimization                   |
| `health-checker/`             | HTTP health check endpoint for dev server                       |
| `flags.ts`                    | Dev server feature flags                                        |
| `path.ts`                     | Dev-specific path utilities                                     |
| `events.ts`                   | Dev server event constants                                      |
| `types.ts`                    | TypeScript type definitions                                     |
| `utils.ts`                    | Shared dev utilities                                            |

## Key Exports

- `startDevelopmentServer()` — boots the dev server
- `FilesOrchestrator` — file pipeline coordinator
- Health checker exports

## Dependencies

### Internal (within `core/src`)

- `../config` — reads dev server configuration
- `../utils` — paths, environment
- `../connectors` — starts subsystems in dev mode
- `../bootstrap` — runs bootstrap before dev start
- `../warlock-config` — loads `warlock.config.ts`

### External

- `esbuild` — TypeScript transpilation
- `chokidar` — file system watching
- `@mongez/copper` — terminal colors

## Used By

- `cli/commands/` — `start` / `dev` command invokes this
- `warlock-config/` — reloads config on HMR
- The entire development workflow depends on this module
