# Development Server v2 - Quick Reference

## File Structure

```
core/dev2-server/
├── start.ts                      # Entry point
├── start-development-serve.ts    # Server initialization
├── development-server.ts         # Main coordinator
├── files-orchestrator.ts         # File system management
├── file-manager.ts               # Individual file state
├── file-operations.ts            # File CRUD operations
├── file-event-handler.ts         # Event batching & debouncing
├── files-watcher.ts              # Chokidar wrapper
├── dependency-graph.ts           # Bidirectional graph
├── manifest-manager.ts           # Persistent caching
├── layer-executor.ts             # HMR/FSR orchestration
├── special-files-collector.ts    # File categorization
├── config-loader.ts              # Dynamic config loading
├── config-handlers.ts            # Special config logic
├── module-loader.ts              # Dynamic imports
├── runtime-import-helper.ts      # HMR cache busting
├── import-transformer.ts         # Static → dynamic imports
├── parse-imports.ts              # Import resolution
├── transpile-file.ts             # esbuild wrapper
├── tsconfig-manager.ts           # Path alias resolution
├── path.ts                       # Path utilities
├── utils.ts                      # Helper functions
├── types.ts                      # TypeScript types
├── flags.ts                      # Configuration flags
├── events.ts                     # Event constants
├── dev-logger.ts                 # Logging utilities
├── health-checker.ts             # (TBD)
├── package-json-manager.ts       # Package.json utilities
├── connectors/
│   ├── types.ts                  # Connector interface
│   ├── base-connector.ts         # Base class
│   ├── database-connector.ts     # Database service
│   ├── cache-connector.ts        # Cache service
│   ├── http-connector.ts         # HTTP server
│   └── index.ts                  # Exports
└── docs/
    ├── DEV_SERVER_OVERVIEW.md    # Complete documentation
    ├── IMPORT_RESOLUTION.md      # Import system details
    └── QUICK_REFERENCE.md        # This file
```

---

## Key Classes & Their Responsibilities

| Class | File | Responsibility |
|-------|------|----------------|
| **DevelopmentServer** | `development-server.ts` | Main coordinator, orchestrates all subsystems |
| **FilesOrchestrator** | `files-orchestrator.ts` | File system management, discovery, reconciliation |
| **FileManager** | `file-manager.ts` | Individual file state, processing, transpilation |
| **FileOperations** | `file-operations.ts` | File CRUD operations, graph updates |
| **FileEventHandler** | `file-event-handler.ts` | Event batching, debouncing, delegation |
| **ManifestManager** | `manifest-manager.ts` | Persistent cache management |
| **DependencyGraph** | `dependency-graph.ts` | Bidirectional dependency tracking |
| **LayerExecutor** | `layer-executor.ts` | HMR/FSR decision and execution |
| **SpecialFilesCollector** | `special-files-collector.ts` | File categorization (main, config, routes, etc.) |
| **ConfigLoader** | `config-loader.ts` | Dynamic config loading and registration |
| **ModuleLoader** | `module-loader.ts` | Dynamic imports, cache management |

---

## Important Constants

```typescript
// Batch size for parallel file processing
FILE_PROCESSING_BATCH_SIZE = 10

// Debounce delay for file events (ms)
DEBOUNCE_DELAY = 100

// Manifest save debounce (ms)
MANIFEST_SAVE_DEBOUNCE = 500

// Route loading delay (ms)
ROUTE_LOADING_DELAY = 5000
```

---

## File Types & Layers

| Type | Pattern | Layer | Auto-Reload |
|------|---------|-------|-------------|
| config | `src/config/*.ts` | FSR | ✅ Restart connectors |
| main | `**/main.ts` | HMR | ✅ Re-execute |
| route | `**/routes.ts` | FSR | ✅ Restart HTTP |
| event | `**/events/**/*.ts` | HMR | ✅ Re-register |
| locale | `**/utils/locales.ts` | HMR | ✅ Reload |
| controller | `**/*controller*.ts` | HMR | ⏭️ On next import |
| service | `**/*service*.ts` | HMR | ⏭️ On next import |
| model | `**/*model*.ts` | HMR | ⏭️ On next import |
| other | Everything else | HMR | ⏭️ On next import |

---

## Events

```typescript
// File ready for reload
DEV_SERVER_EVENTS.FILE_READY = "dev-server:file-ready"
```

---

## Common Workflows

### Adding a New Connector

1. Create `connectors/my-connector.ts`
2. Extend `BaseConnector`
3. Implement required methods
4. Set priority and watched files
5. Export from `connectors/index.ts`
6. Add to `DevelopmentServer` connectors array

```typescript
export class MyConnector extends BaseConnector {
  public readonly name = "My Service";
  public readonly priority = ConnectorPriority.CUSTOM;
  protected readonly watchedFiles = [".env", "src/config/my-service.ts"];

  public async init(): Promise<void> {
    // Initialize service
    this.active = true;
  }

  public async shutdown(): Promise<void> {
    // Cleanup
    this.active = false;
  }
}
```

### Adding a New Special File Type

1. Update `FileManager.detectTypeAndLayer()`
2. Add to `SpecialFilesCollector` categories
3. Update `ModuleLoader` if needs active reloading
4. Update `LayerExecutor` if needs special handling

### Debugging File Processing

```typescript
// Enable verbose logging
console.log(`Processing: ${fileManager.relativePath}`);
console.log(`Dependencies:`, Array.from(fileManager.dependencies));
console.log(`Dependents:`, dependencyGraph.getDependents(relativePath));
console.log(`Invalidation chain:`, invalidationChain);
```

---

## API Quick Reference

### FileManager

```typescript
// Initialize file
await fileManager.init()

// Update file (reload source, retranspile)
const changed = await fileManager.update()

// Force reprocess (even if source unchanged)
await fileManager.forceReprocess()

// Get manifest data
const manifest = fileManager.toManifest()
```

### DependencyGraph

```typescript
// Add relationship
dependencyGraph.addDependency(file, dependency)

// Update file's dependencies
dependencyGraph.updateFile(file, newDependencies)

// Remove file
dependencyGraph.removeFile(file)

// Get files that import this file
const dependents = dependencyGraph.getDependents(file)

// Get invalidation chain (all affected files)
const chain = dependencyGraph.getInvalidationChain(file)
```

### ManifestManager

```typescript
// Initialize (load from disk)
const exists = await manifest.init()

// Save (debounced)
await manifest.save()

// CRUD operations
manifest.setFile(relativePath, fileManifest)
const fileManifest = manifest.getFile(relativePath)
manifest.removeFile(relativePath)
```

### FileOperations

```typescript
// Add new file
await fileOperations.addFile(relativePath)

// Update existing file
const changed = await fileOperations.updateFile(relativePath)

// Delete file
await fileOperations.deleteFile(relativePath)
```

### LayerExecutor

```typescript
// Execute reload for changed file
await layerExecutor.executeReload(fileManager, filesMap)
```

### ModuleLoader

```typescript
// Load all modules
await moduleLoader.loadModules()

// Reload single module
await moduleLoader.reloadModule(fileManager)

// Clear module cache
moduleLoader.clearModuleCache(absolutePath)
```

### ConfigLoader

```typescript
// Load all configs
await configLoader.loadConfigs()

// Reload single config
await configLoader.reloadConfig(fileManager)
```

---

## Troubleshooting

### File not reloading

**Check**:
1. Is file being watched? (Check `FilesWatcher.shouldWatch()`)
2. Is event being triggered? (Add log in `FileEventHandler`)
3. Is file in `files` map? (Check `FilesOrchestrator.files`)
4. Is import transformation succeeding? (Check for errors)
5. Is module cache being cleared? (Check `LayerExecutor`)

### Import resolution failing

**Check**:
1. Is tsconfig loaded? (`tsconfigManager.init()`)
2. Is path alias configured correctly?
3. Does file exist with correct extension?
4. Is import in `FileManager.importMap`?

### HMR not working

**Check**:
1. Is `__import` helper initialized? (Check `initializeRuntimeImportHelper()`)
2. Is module version being updated? (Check `__updateModuleVersion()`)
3. Is special file being actively reloaded? (Check `LayerExecutor.reloadAffectedModules()`)
4. Are dependencies correct? (Check `DependencyGraph`)

### Slow performance

**Check**:
1. Batch size too small? (Increase `FILE_PROCESSING_BATCH_SIZE`)
2. Too many files? (Add `.gitignore` patterns)
3. Manifest not saving? (Check debounce)
4. Memory leak? (Check module cache clearing)

---

## Testing Scenarios

### Scenario 1: Change a utility file
```
1. Edit src/app/users/shared/utils.ts
2. Expected: main.ts reloads, prints new output
3. Check: Invalidation chain includes main.ts
```

### Scenario 2: Add a new file
```
1. Create src/app/users/shared/helpers.ts
2. Import in main.ts
3. Expected: main.ts retranspiles, imports resolve
4. Check: helpers.ts in files map, dependencies updated
```

### Scenario 3: Delete a file
```
1. Delete src/app/users/shared/utils.ts
2. Expected: main.ts fails with MODULE_NOT_FOUND
3. Check: Cache file deleted, dependents notified
```

### Scenario 4: Rename a file
```
1. Rename utils.ts to utils-2.ts (while running)
2. Expected: main.ts fails (missing utils.ts)
3. Rename back to utils.ts
4. Expected: main.ts reloads successfully
5. Check: forceReprocess() called, imports resolved
```

### Scenario 5: Change config
```
1. Edit src/config/database.ts
2. Expected: FSR, database connector restarts
3. Check: All connectors restarted in order
```

### Scenario 6: Bulk change (git pull)
```
1. Change 50 files at once
2. Expected: Batched processing, single manifest save
3. Check: Debounce working, parallel processing
```

---

## Performance Benchmarks

### Target Metrics (150 files)

| Operation | Target | Actual |
|-----------|--------|--------|
| Cold Start | < 3s | ~2.5s |
| Warm Start | < 1s | ~500ms |
| Single File HMR | < 300ms | ~150ms |
| Config Change (FSR) | < 2s | ~1.5s |
| Bulk Change (10 files) | < 1s | ~800ms |

### Optimization Tips

1. **Increase batch size** for large projects (1000+ files)
2. **Reduce debounce** for faster feedback (50ms min)
3. **Disable source maps** in production mode
4. **Use SSD** for faster file I/O
5. **Increase Node.js memory** for large projects (`--max-old-space-size=4096`)

---

## Common Errors

### `ERR_MODULE_NOT_FOUND`
**Cause**: Import can't be resolved  
**Fix**: Check file exists, import path correct, tsconfig aliases

### `Failed to transform imports`
**Cause**: Unresolved imports during transformation  
**Fix**: Ensure all imported files are tracked, check `filesMap`

### `File already exists`
**Cause**: Trying to add file that's already tracked  
**Fix**: Use `updateFile()` instead of `addFile()`

### `Circular dependency detected`
**Cause**: File A imports B, B imports A  
**Fix**: Refactor to break circular dependency

---

## Useful Commands

```bash
# Start dev server
npm run dev

# Build dev server
npm run build

# Clean cache
rm -rf .warlock

# Watch logs
npm run dev | grep "🔄"

# Debug specific file
DEBUG=file-manager npm run dev
```

---

## Resources

- [Complete Overview](./DEV_SERVER_OVERVIEW.md)
- [Import Resolution Details](./IMPORT_RESOLUTION.md)
- [Warlock.js Documentation](https://warlockjs.com)

---

**Quick Help**: For detailed explanations, see `DEV_SERVER_OVERVIEW.md`

