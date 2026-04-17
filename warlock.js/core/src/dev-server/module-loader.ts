import { router } from "../router/router";
import { devLogError, formatModuleNotFoundError } from "./dev-logger";
import { exportAnalyzer } from "./export-analyzer";
import type { FileManager } from "./file-manager";
import type { SpecialFilesCollector } from "./special-files-collector";

declare global {
  var __currentModuleFile: FileManager | undefined;
}

/**
 * Module Loader
 * Dynamically loads and manages application modules (main, routes, events, locales)
 * Handles module cache invalidation for HMR
 */
export class ModuleLoader {
  /**
   * Loaded modules cache
   * Maps absolute path to loaded module
   */
  private readonly loadedModules = new Map<string, any>();

  /**
   * Constructor
   */
  constructor(private readonly specialFilesCollector: SpecialFilesCollector) {}

  /**
   * Load all special files in correct order
   */
  public async loadAll(): Promise<void> {
    // Load in specific order
    await this.loadLocaleFiles();
    await this.loadEventFiles();
    await this.loadMainFiles();
    await this.loadRouteFiles();
  }

  /**
   * Load all main.ts files
   * Main files are module entry points that run initialization code
   * Loaded in parallel as they should be independent
   */
  public async loadMainFiles(): Promise<void> {
    const mainFiles = this.specialFilesCollector.getMainFiles();

    if (mainFiles.length === 0) {
      return;
    }

    // Load all main files in parallel
    for (const file of mainFiles) {
      await this.loadModule(file, "main");
    }
  }

  /**
   * Load all locale files
   * Locale files register translations
   * Loaded in parallel as they are independent
   */
  public async loadLocaleFiles(): Promise<void> {
    const localeFiles = this.specialFilesCollector.getLocaleFiles();

    if (localeFiles.length === 0) {
      return;
    }

    // Load all locale files in parallel
    for (const file of localeFiles) {
      await this.loadModule(file, "locale");
    }
  }

  /**
   * Load all event files
   * Event files register event handlers
   * Loaded in parallel as they are independent
   */
  public async loadEventFiles(): Promise<void> {
    const eventFiles = this.specialFilesCollector.getEventFiles();

    if (eventFiles.length === 0) {
      return;
    }

    // Load all event files in parallel
    for (const file of eventFiles) {
      await this.loadModule(file, "event");
    }
  }

  /**
   * Load all route files
   * Route files register HTTP routes
   * Loaded sequentially as order might matter
   */
  public async loadRouteFiles(): Promise<void> {
    const routeFiles = this.specialFilesCollector.getRouteFiles();

    if (routeFiles.length === 0) {
      return;
    }

    // Load route files sequentially
    // because we are registering the source file, we must load routes sequentially
    for (const file of routeFiles) {
      await this.loadModule(file, "route");
    }
  }

  /**
   * Load a single module
   * @param file FileManager instance
   * @param type Module type for logging
   * @param bustCache Whether to add timestamp for cache busting (for HMR)
   */
  public async loadModule<T = any>(
    file: FileManager,
    type: string,
    bustCache: boolean = false,
  ): Promise<T | undefined> {
    if (file.relativePath.endsWith(".env")) {
      // do nothing
      return;
    }

    globalThis.__currentModuleFile = file;

    // devLogInfo(`Loading module: ${file.relativePath} (${type})`);

    // Convert to file:// URL for cross-platform compatibility
    try {
      // For route files, wrap the import with source file tracking
      if (type === "route") {
        return await router.withSourceFile(file.relativePath, async () => {
          // Dynamic import the module (routes will be registered with sourceFile)

          const module =
            typeof __import !== "undefined"
              ? await __import(file.cachePath)
              : await import(file.cachePathUrl);

          // Store in cache (use source path as key for consistency)
          this.loadedModules.set(file.absolutePath, module);

          if (module?.cleanup) {
            file.addCleanup(module.cleanup);
          }

          return module;
        });
      } else {
        // Dynamic import the module
        const module =
          typeof __import !== "undefined"
            ? await __import(file.cachePath)
            : await import(file.cachePathUrl);
        // Store in cache (use source path as key for consistency)
        this.loadedModules.set(file.absolutePath, module);

        if (module?.cleanup) {
          file.addCleanup(module.cleanup);
        }

        return module;
      }

      // devLogSuccess(
      //   `Module loaded: ${file.relativePath} (${type}) in ${(performance.now() - now).toFixed(2)}ms`,
      // );
    } catch (error: any) {
      console.log(error);
      // Format error message (especially for MODULE_NOT_FOUND)
      if (error.code === "ERR_MODULE_NOT_FOUND") {
        devLogError(formatModuleNotFoundError(error));
      } else {
        devLogError(`Failed to load ${type}: ${file.relativePath} - ${error?.message || error}`);
      }
    } finally {
      globalThis.__currentModuleFile = undefined;
    }
  }

  /**
   * Perform Clean up the file
   */
  public cleanupFileModule(file: FileManager): void {
    if (!file.cleanup.length) return;

    const cleanupFunction = (cleanupFunction: Function | { unsubscribe: () => void }) => {
      if (!cleanupFunction) return;
      if (typeof cleanupFunction === "function") {
        cleanupFunction();
        return;
      }

      if ((cleanupFunction as { unsubscribe: () => void })?.unsubscribe) {
        (cleanupFunction as { unsubscribe: () => void }).unsubscribe();
      }
    };

    file.cleanup.forEach((fn) => cleanupFunction(fn));

    file.resetCleanup();
  }

  /**
   * Reload a single module (for HMR)
   * @param file FileManager instance
   */
  public async reloadModule(file: FileManager): Promise<void> {
    const moduleType = this.specialFilesCollector.getFileType(file.relativePath);

    this.cleanupFileModule(file);

    if (!moduleType) {
      // Not a special file, no need to reload
      return;
    }

    try {
      // For route files, remove old routes before reloading
      if (moduleType === "route") {
        router.removeRoutesBySourceFile(file.relativePath);
      }

      // Clear module cache
      this.clearModuleCache(file.absolutePath);
      __clearModuleVersion(file.cachePath);
      exportAnalyzer.clearCache(file.relativePath);

      // Reload the module with cache busting
      await this.loadModule(file, moduleType, true);
    } catch (error: any) {
      // Format error message (especially for MODULE_NOT_FOUND)
      if (error.code === "ERR_MODULE_NOT_FOUND") {
        devLogError(formatModuleNotFoundError(error));
      } else {
        devLogError(`Failed to reload module: ${error.message || error}`);
      }
      throw error;
    }
  }

  /**
   * Clear module cache for a specific file
   * This forces Node.js to re-import the module
   * @param absolutePath Absolute path to the module
   */
  public clearModuleCache(absolutePath: string): void {
    // Remove from our cache
    this.loadedModules.delete(absolutePath);
  }

  /**
   * We need a way to cleanup a module execution if it's deleted
   */
  public cleanupDeletedModule(file: FileManager): void {
    this.clearModuleCache(file.absolutePath);
    __clearModuleVersion(file.cachePath);
    exportAnalyzer.clearCache(file.relativePath);

    if (file.type === "route") {
      router.removeRoutesBySourceFile(file.relativePath);
    }

    this.cleanupFileModule(file);
  }

  /**
   * Clear module cache for multiple files
   * @param absolutePaths Array of absolute paths
   */
  public clearModuleCacheMultiple(absolutePaths: string[]): void {
    for (const path of absolutePaths) {
      this.clearModuleCache(path);
    }
  }

  /**
   * Clear all application module cache
   * Used for full server restart
   */
  public clearAllModuleCache(): void {
    // Clear all loaded modules
    for (const absolutePath of this.loadedModules.keys()) {
      this.clearModuleCache(absolutePath);
    }
  }

  /**
   * Get loaded module by path
   * @param absolutePath Absolute path to the module
   */
  public getLoadedModule(absolutePath: string): any | undefined {
    return this.loadedModules.get(absolutePath);
  }

  /**
   * Check if a module is loaded
   * @param absolutePath Absolute path to the module
   */
  public isModuleLoaded(absolutePath: string): boolean {
    return this.loadedModules.has(absolutePath);
  }

  /**
   * Get all loaded module paths
   */
  public getLoadedModulePaths(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Get statistics about loaded modules
   */
  public getStats(): {
    totalLoaded: number;
    mainFiles: number;
    routeFiles: number;
    eventFiles: number;
    localeFiles: number;
  } {
    return {
      totalLoaded: this.loadedModules.size,
      mainFiles: this.specialFilesCollector.getMainFiles().length,
      routeFiles: this.specialFilesCollector.getRouteFiles().length,
      eventFiles: this.specialFilesCollector.getEventFiles().length,
      localeFiles: this.specialFilesCollector.getLocaleFiles().length,
    };
  }
}
