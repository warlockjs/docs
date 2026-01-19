# Development Server v2 - Complete Flow (HMR-Only)

> **IMPORTANT**: Currently only HMR is implemented. FSR (Full Server Restart) is planned for future versions.

## Entry Point

```typescript
// @warlock.js/core/src/dev2-server/start-development-server.ts
export async function startDevelopmentServer() {
  const devServer = new DevelopmentServer();

  // Graceful shutdown handlers
  process.on("SIGINT", () => devServer.shutdown());
  process.on("SIGTERM", () => devServer.shutdown());

  await devServer.start();
  return devServer;
}
```

---

## Process Architecture

```
Main Process
├── Development Server (HMR management)
├── FilesOrchestrator (File processing)
│
├── Worker Threads
│   ├── TypeScript Health Checker
│   └── ESLint Health Checker
│
└── External Process
    └── Type Generator (tsc command)
```

---

## Hot Module Replacement (HMR) Flow

### File Change Detection

```
1. File saved → Chokidar event
2. FileEventHandler debounce (100ms)
3. FileOperations.updateFile()
4. Invalidation chain built (BFS)
5. Clear module cache
6. Update timestamps
7. Reload affected modules
8. Done! ⚡
```

### Example: Service File Changed

```
Edit: src/app/users/services/user-service.ts

Invalidation Chain:
└─ user-service.ts → users-controller.ts → main.ts

HMR Execution:
1. Clear cache for all 3 files
2. Update __updateModuleVersion() timestamps
3. Reload main.ts
4. Next import gets fresh code ✅
```

---

## Module Loading Order

```typescript
async loadAll() {
  await loadLocaleFiles();  // Parallel
  await loadEventFiles();   // Parallel
  await loadMainFiles();    // Parallel
  await loadRouteFiles();   // Sequential
}
```

> **Note**: Order exists for initialization purposes, but each file type acts as independent entry point.

---

## Circular Dependencies

**Current Handling**: Display in terminal, developer resolves manually.

```
⚠️  Circular dependency detected:
    user-service.ts → user-repository.ts → user-model.ts → user-service.ts

    Please refactor to break the cycle.
```

Automatic resolution too complex for HMR - requires manual fix.

---

## Configuration Options

### warlock.config.ts

```typescript
export default {
  devServer: {
    watch: {
      // File watching config
    },
    batchSize: 10, // File processing batch size
    debounce: 100, // Event debounce (ms)
    healthChecks: {
      enabled: true, // Enable health checks
      typescript: true, // TypeScript checker
      eslint: true, // ESLint checker
    },
  },
};
```

---

## Health Checks (Worker Threads)

```
Main Process
    ↓
Health Check Manager
    ├─→ Worker Thread: TypeScript (tsc --noEmit)
    └─→ Worker Thread: ESLint

Results → Console Display
```

- Runs during development only
- Non-blocking (background)
- Configurable via warlock.config.ts

---

## Type Generation (External Process)

```
Main Process
    ↓
Execute: tsc command (external process)
    ↓
Generate .d.ts files
    ↓
Complete (non-blocking)
```

Runs in separate process to avoid blocking dev server.

---

## Documentation Needs

### User-Facing Documentation

1. **Getting Started**

   - How to start dev server
   - What to expect on first run
   - File processing behavior

2. **HMR Guide**

   - How it works
   - Import transformation
   - Cache busting explained

3. **Configuration**

   - warlock.config.ts options
   - Watch configuration
   - Performance tuning

4. **Troubleshooting**

   - Circular dependencies
   - Import resolution errors
   - Cache issues
   - Health check failures

5. **Performance Tips**
   - Optimal batch sizes
   - Debounce timing
   - Large project considerations

### Technical Documentation

6. **Architecture**

   - FilesOrchestrator
   - DependencyGraph
   - Module loading

7. **Extending**
   - Custom health checkers
   - File type handlers

---

This reflects the **HMR-only** current implementation. FSR will be documented when implemented.
