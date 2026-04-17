import { colors } from "@mongez/copper";
import events from "@mongez/events";
import { getFileAsync } from "@mongez/fs";
import { connectorsManager } from "../connectors/connectors-manager";
import { warlockConfigManager } from "../warlock-config";
import { devLogReady, devLogSection, devServeLog } from "./dev-logger";
import { filesOrchestrator } from "./files-orchestrator";
import { LayerExecutor } from "./layer-executor";
import { ModuleLoader } from "./module-loader";
import { typeGenerator } from "./type-generator";

/**
 * Development Server
 * Main coordinator for the dev server
 * Manages file system, connectors, and hot reloading
 */
export class DevelopmentServer {
  /**
   * Module loader - dynamically loads application modules
   */
  private moduleLoader?: ModuleLoader;

  /**
   * Layer executor - handles HMR and FSR execution
   */
  private layerExecutor?: LayerExecutor;

  /**
   * Whether the server is currently running
   */
  private running: boolean = false;

  public constructor() {
    devLogSection("Starting Development Server...");
  }

  /**
   * Initialize and start the development server
   */
  public async start(): Promise<void> {
    try {
      const now = performance.now();

      // STEP 1: Initialize file system (discover and process files)
      await filesOrchestrator.init();
      await filesOrchestrator.initiaizeAll();

      // Start file watcher
      await filesOrchestrator.watchFiles();

      // devLogInfo("Initializing special files...");
      // STEP 3: Collect special files
      filesOrchestrator.specialFilesCollector.collect(filesOrchestrator.getFiles());

      // devLogInfo("Setting up event listeners...");
      // STEP 6: Setup event listeners
      this.setupEventListeners();

      // STEP 7: Auto-discover files (models, etc.) before loading entry points
      // This ensures all models are in the registry before main/route files execute
      await this.autoDiscoverFiles();

      // STEP 8: Load application modules (main, routes, events, locales)
      await filesOrchestrator.moduleLoader.loadAll();

      // STEP 9: Initialize layer executor
      this.layerExecutor = new LayerExecutor(
        filesOrchestrator.getDependencyGraph(),
        filesOrchestrator.specialFilesCollector,
        filesOrchestrator.moduleLoader,
      );

      // Mark as running
      this.running = true;

      const duration = performance.now() - now;

      devLogReady(`Development Server is ready in ${colors.greenBright(parseDuration(duration))}`);

      // Generate type definitions in background (non-blocking)
      // Runs after server ready for fast startup
      // typeGenerator.generateAll();
      const devServerConfig = await warlockConfigManager.get("devServer");
      const generateTypings = devServerConfig?.generateTypings ?? true;
      const healthCheckers = devServerConfig?.healthCheckers ?? true;

      if (generateTypings) {
        typeGenerator.executeGenerateAllCommand();
      }

      // Start health checks (non-blocking)
      if (healthCheckers) {
        filesOrchestrator.startCheckingHealth(healthCheckers === true ? undefined : healthCheckers);
      }
    } catch (error) {
      devServeLog(colors.redBright(`❌ Failed to start Development Server: ${error}`));
      await this.shutdown();
      throw error;
    }
  }

  /**
   * Auto-discover and import files that rely on registry-based resolution.
   *
   * Iterates over all tracked files whose type matches `discoveryTypes`
   * and eagerly imports them so their decorators execute and register
   * themselves in the appropriate global registries.
   */
  private async autoDiscoverFiles(): Promise<void> {
    /**
     * File types that should be auto-discovered (imported) at boot time.
     *
     * Models must be discovered early so that `@RegisterModel()` decorators
     * populate the global model registry before any application code
     * (main files, routes, services) attempts to resolve relations by name.
     *
     * Extend this list if other decorator-based registries are added in the future.
     */
    const discoveryTypes = ["model"];
    for (const [, file] of filesOrchestrator.files.entries()) {
      if (file.type && discoveryTypes.includes(file.type)) {
        await filesOrchestrator.moduleLoader.loadModule(file, file.type);
      }
    }
  }

  /**
   * Setup event listeners for file changes
   */
  private setupEventListeners(): void {
    // Listen to batch completion events from FileEventHandler
    events.on(
      "dev-server:batch-complete",
      (batch: { added: string[]; changed: string[]; deleted: string[] }) => {
        this.handleBatchComplete(batch);
      },
    );
  }

  /**
   * Handle batch completion event
   * Triggered when a batch of files has been processed
   */
  private async handleBatchComplete(batch: {
    added: string[];
    changed: string[];
    deleted: string[];
  }): Promise<void> {
    // Only execute reload if server is running (skip during initial startup)
    if (!this.running || !this.layerExecutor) {
      return;
    }

    if (batch.changed.length > 0) {
      // Helper to check if a path is an env file
      const isEnvFile = (path: string) => {
        const basename = path.split("/").pop() || path;
        return basename === ".env" || basename.startsWith(".env.");
      };

      // if they are the same, then ignore the trigger
      // Note: env files are NOT in filesOrchestrator.files but still need to trigger HMR
      batch.changed = (
        await Promise.all(
          batch.changed.map(async (relativePath) => {
            // Env files always pass through (they trigger config reload)
            if (isEnvFile(relativePath)) {
              return relativePath;
            }

            const file = filesOrchestrator.files.get(relativePath);

            if (!file) return null;

            const content = await getFileAsync(file.absolutePath);
            if (content.trim() === file.source) {
              return null;
            }

            file.source = content;

            return relativePath;
          }),
        )
      ).filter((file) => file !== null);
    }

    // Get all changed files (added + changed + deleted)
    const allChangedPaths = [...batch.added, ...batch.changed, ...batch.deleted];

    if (allChangedPaths.length === 0) {
      return;
    }

    // Filter out .env files for code processing (they don't need transpilation)
    // But they're still in batch.changed which triggers config reload in layer-executor
    const codeFiles = [...batch.added, ...batch.changed].filter((path) => {
      const basename = path.split("/").pop() || path;
      return !(basename === ".env" || basename.startsWith(".env."));
    });

    // Delegate to layer executor for batch reload
    try {
      // Pass code files to layer executor, but include all changed paths (including .env)
      // in the invalidation chain context
      await this.layerExecutor.executeBatchReload(
        codeFiles,
        filesOrchestrator.getFiles(),
        batch.deleted,
        batch.changed, // Pass all changed paths including .env for config reload
      );

      // Regenerate types if config files changed
      typeGenerator.executeTypingsGenerator([...batch.added, ...batch.changed]);

      filesOrchestrator.checkHealth({
        added: batch.added,
        changed: batch.changed,
        deleted: batch.deleted,
      });
    } catch (error) {
      devServeLog(colors.redBright(`❌ Failed to execute batch reload: ${error}`));
    }
  }

  /**
   * Gracefully shutdown the development server
   */
  public async shutdown(): Promise<void> {
    console.log("Shutting down...");

    if (!this.running) {
      return;
    }

    devServeLog(colors.redBright("🛑 Shutting down Development Server..."));

    this.running = false;

    // Shutdown connectors in reverse priority order
    await connectorsManager.shutdown();

    devServeLog(colors.greenBright("✅ Development Server stopped"));
  }

  /**
   * Check if server is running
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Get module loader
   */
  public getModuleLoader(): ModuleLoader | undefined {
    return this.moduleLoader;
  }
}

function parseDuration(diffInMilliseconds: number): string {
  if (diffInMilliseconds < 1000) {
    return `${diffInMilliseconds.toFixed(2)}ms`;
  }

  if (diffInMilliseconds > 60_000) {
    return `${(diffInMilliseconds / 60_000).toFixed(2)}m`;
  }

  return `${(diffInMilliseconds / 1000).toFixed(2)}s`;
}
