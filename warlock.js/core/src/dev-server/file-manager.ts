import events from "@mongez/events";
import { getFileAsync, lastModifiedAsync, putFileAsync } from "@mongez/fs";
import crypto from "crypto";
import { pathToFileURL } from "url";
import { DEV_SERVER_EVENTS } from "./events";
import { type FileOperations } from "./file-operations";
import { transformImports } from "./import-transformer";
import { isTypeOnlyFile, parseImports } from "./parse-imports";
import { Path } from "./path";
import { transpileFile } from "./transpile-file";
import type { FileManifest, FileState, FileType, LayerType } from "./types";
import { warlockCachePath } from "./utils";

/**
 * Options for the process() method
 */
export interface ProcessOptions {
  /**
   * Force reprocessing even if file hasn't changed
   * @default false
   */
  force?: boolean;

  /**
   * Whether to transform imports to cache paths
   * Set to false during batch operations where imports are transformed later
   * @default true
   */
  transformImports?: boolean;

  /**
   * Whether to save to cache after processing
   * Set to false if you need to do additional transformations before saving
   * @default true
   */
  saveToCache?: boolean;
}

export type CleanupFunction = () => void;

/**
 * FileManager - Manages the lifecycle of a single source file
 *
 * ## Lifecycle States
 *
 * ```
 * idle → loading → parsed → transpiled → ready
 *   ↑                                      │
 *   └──────────── (file changed) ──────────┘
 * ```
 *
 * ## Processing Pipeline
 *
 * All file processing flows through a unified pipeline:
 * 1. **Load** - Read source from disk
 * 2. **Hash** - Calculate content hash for change detection
 * 3. **Parse** - Discover imports and dependencies
 * 4. **Transpile** - Convert TypeScript to JavaScript
 * 5. **Transform** - Rewrite import paths to cache locations
 * 6. **Save** - Write transformed code to cache (ONCE)
 *
 * ## Usage Examples
 *
 * ```typescript
 * // Standard processing (full pipeline)
 * const file = new FileManager(absolutePath, filesMap, fileOps);
 * await file.process();
 *
 * // Batch processing (parse first, complete later)
 * await file.parse();
 * // ... after dependencies are ready ...
 * await file.complete();
 *
 * // Check for changes and reprocess if needed
 * const changed = await file.process(); // returns false if unchanged
 *
 * // Force reprocessing
 * await file.process({ force: true });
 * ```
 *
 * @class FileManager
 */
export class FileManager {
  /**
   * Relative path from the project root directory
   * Used as the primary identifier for files throughout the system
   * @example "src/app/users/controllers/get-user.controller.ts"
   */
  public relativePath = "";

  /**
   * Unix timestamp of the last modification time
   * Used with hash for change detection
   */
  public lastModified = 0;

  /**
   * SHA-256 hash of the source content
   * Primary mechanism for detecting file changes
   */
  public hash = "";

  /**
   * Original TypeScript/JavaScript source code
   * Loaded from disk during processing
   */
  public source = "";

  /**
   * Transpiled JavaScript code with transformed imports
   * This is the final output that gets saved to cache and loaded at runtime
   */
  public transpiled = "";

  /**
   * Set of relative paths that this file depends on (imports)
   * Used to build the dependency graph for HMR invalidation
   * @example Set(["src/app/users/models/user.model.ts", "src/config/database.ts"])
   */
  public dependencies = new Set<string>();

  /**
   * Map of original import specifiers to resolved absolute paths
   * Key: the exact import string from source (e.g., "./user.model")
   * Value: resolved absolute path (e.g., "D:/project/src/app/users/models/user.model.ts")
   *
   * Used during import transformation to rewrite paths to cache locations
   */
  public importMap = new Map<string, string>();

  /**
   * Set of relative paths that depend on this file
   * Populated from the dependency graph after initial processing
   * Used to determine what needs reloading when this file changes
   */
  public dependents = new Set<string>();

  /**
   * Version number incremented on each change
   * Used for cache busting in dynamic imports
   */
  public version = 0;

  /**
   * Semantic type of the file based on its path/content
   * Used to determine reload behavior and special handling
   */
  public type: FileType | undefined;

  /**
   * Reload layer: HMR (hot module replacement) or FSR (full server restart)
   * Determines how changes to this file are applied at runtime
   */
  public layer: LayerType | undefined;

  /**
   * Path to the cached transpiled file (relative to .warlock/cache/)
   * @example "src-app-users-controllers-get-user.controller.js"
   */
  public cachePath = "";

  /**
   * Cleanup function called before the file is unloaded
   * Set by module loader for files that export cleanup handlers
   */
  public cleanup: CleanupFunction[] = [];

  /**
   * Whether imports have been transformed to cache paths
   * Prevents double transformation and tracks processing state
   */
  public importsTransformed = false;

  /**
   * Whether this file contains only type definitions (no runtime code)
   * Type-only files are excluded from circular dependency detection
   */
  public isTypeOnlyFile = false;

  /**
   * Current processing state of the file
   *
   * - `idle`: Initial state, no processing started
   * - `loading`: Reading source from disk
   * - `parsed`: Source loaded and imports discovered
   * - `transpiled`: TypeScript compiled to JavaScript
   * - `ready`: Fully processed and available for use
   * - `updating`: Being reprocessed after a change
   * - `deleted`: File has been removed from disk
   */
  public state: FileState = "idle";

  /**
   * Creates a new FileManager instance
   *
   * @param absolutePath - Full filesystem path to the source file
   * @param files - Map of all tracked files (for import resolution)
   * @param fileOperations - FileOperations instance (for adding missing dependencies)
   *
   * @example
   * ```typescript
   * const fileManager = new FileManager(
   *   "D:/project/src/app/users/controllers/get-user.controller.ts",
   *   filesMap,
   *   fileOperations
   * );
   * ```
   */
  public constructor(
    public readonly absolutePath: string,
    public files: Map<string, FileManager>,
    public fileOperations: FileOperations,
  ) {}

  /**
   * set the given cleanup method(s)
   */
  public addCleanup(cleanup: CleanupFunction | CleanupFunction[]) {
    if (Array.isArray(cleanup)) {
      this.cleanup.push(...cleanup);
    } else {
      this.cleanup.push(cleanup);
    }

    // now make sure cleanup has single callback (unique callbacks only)
    this.cleanup = [...new Set(this.cleanup)];
  }

  /**
   * reset the cleanup methods
   */
  public resetCleanup() {
    this.cleanup = [];
  }

  /**
   * Initialize the file manager from disk or manifest cache
   *
   * This is the primary entry point for file initialization.
   * If manifest data is provided, it will attempt to use cached data
   * and only reprocess if the file has changed.
   *
   * @param fileManifest - Optional cached manifest data from previous build
   *
   * @example
   * ```typescript
   * // Fresh initialization (no cache)
   * await fileManager.init();
   *
   * // Initialize with cached manifest data
   * await fileManager.init(manifestEntry);
   * ```
   */
  public async init(fileManifest?: Partial<FileManifest>): Promise<void> {
    // Set up basic paths
    this.relativePath = Path.toRelative(this.absolutePath);
    this.cachePath = this.relativePath.replace(/\//g, "-").replace(/\.(ts|tsx)$/, ".js");
    this.detectFileTypeAndLayer();

    if (fileManifest) {
      await this.initFromManifest(fileManifest);
    } else {
      // Fresh file - run full processing pipeline
      await this.process();
    }
  }

  /**
   * Get the cache path as a file:// URL for dynamic import
   * Includes cache busting query parameter based on version
   *
   * @returns File URL ready for dynamic import, or empty string if no cache
   *
   * @example
   * ```typescript
   * const module = await import(fileManager.cachePathUrl);
   * ```
   */
  public get cachePathUrl(): string {
    if (!this.cachePath) return "";
    return pathToFileURL(warlockCachePath(this.cachePath)).href;
  }

  /**
   * Process the file through the unified pipeline
   *
   * This is the core method that handles all file processing.
   * It implements a single-pass pipeline that:
   * 1. Loads source from disk
   * 2. Checks if content changed (skip if unchanged)
   * 3. Parses imports to discover dependencies
   * 4. Ensures all dependencies exist
   * 5. Transpiles TypeScript to JavaScript
   * 6. Transforms imports to cache paths
   * 7. Saves to cache (ONCE - no duplicate writes)
   *
   * @param options - Processing options
   * @param options.force - Force reprocessing even if unchanged
   * @param options.transformImports - Whether to transform import paths (default: true)
   * @param options.saveToCache - Whether to save to cache file (default: true)
   *
   * @returns True if file was processed, false if unchanged and skipped
   *
   * @example
   * ```typescript
   * // Normal processing
   * const changed = await fileManager.process();
   *
   * // Force reprocess
   * await fileManager.process({ force: true });
   *
   * // Batch mode: transform imports later
   * await fileManager.process({ transformImports: false });
   * ```
   */
  public async process(options: ProcessOptions = {}): Promise<boolean> {
    const { force = false, transformImports: shouldTransform = true, saveToCache = true } = options;

    // Ensure paths are initialized (in case process() is called directly)
    if (!this.relativePath) {
      this.relativePath = Path.toRelative(this.absolutePath);
    }
    if (!this.cachePath) {
      this.cachePath = this.relativePath.replace(/\//g, "-").replace(/\.(ts|tsx)$/, ".js");
    }
    if (!this.type) {
      this.detectFileTypeAndLayer();
    }

    this.state = "loading";

    // Step 1: Load source from disk
    let newSource: string;
    try {
      newSource = await getFileAsync(this.absolutePath);
    } catch (error) {
      this.state = "deleted";
      return false;
    }

    // Step 2: Calculate hash and check for changes
    const newHash = crypto.createHash("sha256").update(newSource).digest("hex");

    if (!force && newHash === this.hash && this.transpiled && this.importsTransformed) {
      // File unchanged and already processed
      this.state = "ready";
      return false;
    }

    // Update source and metadata
    this.source = newSource;
    this.hash = newHash;
    this.lastModified = (await lastModifiedAsync(this.absolutePath)).getTime();
    this.version++;

    // Step 3: Parse imports to discover dependencies
    this.state = "parsed";
    this.importMap = await parseImports(this.source, this.absolutePath);
    this.dependencies = new Set(
      Array.from(this.importMap.values()).map((absPath) => Path.toRelative(absPath)),
    );

    // Detect if this file only exports types (no runtime code)
    this.isTypeOnlyFile = isTypeOnlyFile(this.source);

    // Note: Dependency existence is handled at orchestrator level, not here
    // This keeps FM focused on single-file processing

    // Step 4: Transpile TypeScript to JavaScript
    this.state = "transpiled";
    this.transpiled = await transpileFile(this);

    // Step 5: Transform imports to cache paths
    if (shouldTransform && this.dependencies.size > 0) {
      this.transpiled = transformImports(this);
      this.importsTransformed = true;
    } else {
      this.importsTransformed = false;
    }

    // Step 6: Save to cache (ONCE - after all transformations)
    if (saveToCache) {
      await putFileAsync(warlockCachePath(this.cachePath), this.transpiled);
    }

    // Step 7: Mark as ready
    this.state = "ready";
    events.trigger(DEV_SERVER_EVENTS.FILE_READY, this);

    return true;
  }

  /**
   * Parse the file to discover dependencies (Phase 1 of batch processing)
   *
   * This method only performs the first half of processing:
   * - Loads source from disk
   * - Calculates hash
   * - Parses imports to discover dependencies
   * - Sets up file metadata
   *
   * Use this for batch file operations where you need to know
   * dependencies before deciding processing order.
   *
   * **Important**: After calling parse(), you must call complete()
   * to finish processing and make the file usable.
   *
   * @example
   * ```typescript
   * // Batch processing pattern
   * const files = await Promise.all(
   *   paths.map(async (path) => {
   *     const file = new FileManager(path, filesMap, fileOps);
   *     await file.parse();
   *     return file;
   *   })
   * );
   *
   * // Order by dependencies, then complete
   * for (const file of orderedFiles) {
   *   await file.complete();
   * }
   * ```
   */
  public async parse(): Promise<void> {
    this.state = "loading";

    // Load source
    this.source = await getFileAsync(this.absolutePath);
    this.hash = crypto.createHash("sha256").update(this.source).digest("hex");
    this.relativePath = Path.toRelative(this.absolutePath);
    this.lastModified = (await lastModifiedAsync(this.absolutePath)).getTime();
    this.version = 0;

    // Set up cache path
    this.cachePath = this.relativePath.replace(/\//g, "-").replace(/\.(ts|tsx)$/, ".js");

    // Detect type and layer
    this.detectFileTypeAndLayer();

    // Parse imports to discover dependencies
    this.importMap = await parseImports(this.source, this.absolutePath);
    this.dependencies = new Set(
      Array.from(this.importMap.values()).map((absPath) => Path.toRelative(absPath)),
    );

    // Detect if this file only exports types (no runtime code)
    this.isTypeOnlyFile = isTypeOnlyFile(this.source);

    this.state = "parsed";
  }

  /**
   * Complete file processing after parse() (Phase 2 of batch processing)
   *
   * This method completes the processing pipeline:
   * - Ensures dependencies exist
   * - Transpiles TypeScript to JavaScript
   * - Transforms imports to cache paths
   * - Saves to cache
   *
   * **Important**: This must be called after parse() to finish processing.
   * The file is not usable until complete() has been called.
   *
   * @example
   * ```typescript
   * await file.parse();
   * // ... after dependencies are ready ...
   * await file.complete();
   * // File is now ready for use
   * ```
   */
  public async complete(): Promise<void> {
    // Ensure we're in the right state
    if (this.state !== "parsed") {
      throw new Error(`Cannot complete file in state "${this.state}". Call parse() first.`);
    }

    // Note: Dependency existence is handled at orchestrator/batch level
    // by the time complete() is called, dependencies should already exist

    // Transpile
    this.state = "transpiled";
    this.transpiled = await transpileFile(this);

    // Transform imports
    if (this.dependencies.size > 0) {
      this.transpiled = transformImports(this);
    }

    this.importsTransformed = true;

    // Save to cache (ONCE)
    await putFileAsync(warlockCachePath(this.cachePath), this.transpiled);

    // Mark as ready
    this.state = "ready";
    events.trigger(DEV_SERVER_EVENTS.FILE_READY, this);
  }

  /**
   * Update the file after a change during development
   *
   * This is a convenience method that delegates to process().
   * It checks if the file has actually changed and only reprocesses if needed.
   *
   * @returns True if file was reprocessed, false if unchanged
   *
   * @example
   * ```typescript
   * // Called by file watcher
   * const changed = await fileManager.update();
   * if (changed) {
   *   console.log("File was updated");
   * }
   * ```
   */
  public async update(): Promise<boolean> {
    return this.process();
  }

  /**
   * Force reprocess the file regardless of hash match
   *
   * Use this when:
   * - A dependency that was previously missing is now available
   * - Import transformation needs to be redone
   * - Cache is corrupted or missing
   *
   * @example
   * ```typescript
   * // After a missing dependency is added
   * await fileManager.forceReprocess();
   * ```
   */
  public async forceReprocess(): Promise<void> {
    await this.process({ force: true });
  }

  /**
   * Initialize from cached manifest data
   *
   * Attempts to use cached data from a previous build.
   * If the file has changed (hash mismatch) or cache is missing,
   * falls back to full processing.
   *
   * @param fileManifest - Cached manifest entry
   * @internal
   */
  protected async initFromManifest(fileManifest: Partial<FileManifest>): Promise<void> {
    // Apply manifest properties
    this.version = fileManifest.version || 0;
    this.type = fileManifest.type;
    this.layer = fileManifest.layer;
    this.cachePath =
      fileManifest.cachePath || this.relativePath.replace(/\//g, "-").replace(/\.(ts|tsx)$/, ".js");

    // Load source and check for changes
    this.state = "loading";
    try {
      this.source = await getFileAsync(this.absolutePath);
    } catch (error) {
      this.state = "deleted";
      return;
    }

    const currentHash = crypto.createHash("sha256").update(this.source).digest("hex");
    const hasChanged = currentHash !== fileManifest.hash;

    if (hasChanged) {
      // File changed - full reprocess
      this.hash = currentHash;
      this.lastModified = (await lastModifiedAsync(this.absolutePath)).getTime();
      this.version++;
      await this.process({ force: true });
    } else {
      // File unchanged - load from cache
      this.hash = fileManifest.hash!;
      this.lastModified = fileManifest.lastModified!;
      this.dependencies = new Set(fileManifest.dependencies || []);
      this.dependents = new Set(fileManifest.dependents || []);

      try {
        this.transpiled = await getFileAsync(warlockCachePath(this.cachePath));
        this.importsTransformed = true;
        this.state = "ready";
        events.trigger(DEV_SERVER_EVENTS.FILE_READY, this);
      } catch (error) {
        // Cache missing - reprocess
        await this.process({ force: true });
      }
    }
  }

  /**
   * Detect the file type and reload layer based on path patterns
   *
   * File types determine special handling:
   * - `main`: Application entry point
   * - `config`: Configuration files
   * - `route`: Route definitions
   * - `controller`: HTTP controllers
   * - `service`: Business logic services
   * - `model`: Database models
   * - `event`: Event handlers
   * - `other`: Everything else
   *
   * Layers determine reload behavior:
   * - `HMR`: Hot module replacement (instant reload)
   * - `FSR`: Full server restart (required for some changes)
   *
   * @internal
   */
  protected detectFileTypeAndLayer(): void {
    // Main entry files
    if (this.relativePath.includes("main.ts") || this.relativePath.includes("main.tsx")) {
      this.type = "main";
      this.layer = "HMR";
      return;
    }

    // Config files
    if (this.relativePath.startsWith("src/config/")) {
      this.type = "config";
      this.layer = "HMR";
      return;
    }

    // Routes files
    if (this.relativePath.endsWith("routes.ts") || this.relativePath.endsWith("routes.tsx")) {
      this.type = "route";
      this.layer = "HMR";
      return;
    }

    // Event files
    if (this.relativePath.includes("/events/")) {
      this.type = "event";
      this.layer = "HMR";
      return;
    }

    // Controllers
    if (this.relativePath.includes("controller")) {
      this.type = "controller";
      this.layer = "HMR";
      return;
    }

    // Services
    if (this.relativePath.includes("service")) {
      this.type = "service";
      this.layer = "HMR";
      return;
    }

    // Models
    if (this.relativePath.endsWith(".model.ts")) {
      this.type = "model";
      this.layer = "HMR";
      return;
    }

    // Default: other files use HMR
    this.type = "other";
    this.layer = "HMR";
  }

  /**
   * Export file data as a manifest entry for caching
   *
   * The manifest stores metadata about each file to enable:
   * - Fast startup by skipping unchanged files
   * - Dependency tracking across restarts
   * - Cache validation via hash comparison
   *
   * Note: Source code and transpiled output are NOT stored in manifest.
   * - Source is always read from disk
   * - Transpiled code is stored in .warlock/cache/
   *
   * @returns Manifest entry for this file
   *
   * @example
   * ```typescript
   * const entry = fileManager.toManifest();
   * manifest.setFile(fileManager.relativePath, entry);
   * ```
   */
  public toManifest(): FileManifest {
    return {
      absolutePath: this.absolutePath,
      relativePath: this.relativePath,
      lastModified: this.lastModified,
      hash: this.hash,
      dependencies: Array.from(this.dependencies),
      dependents: Array.from(this.dependents),
      version: this.version,
      type: this.type!,
      layer: this.layer!,
      cachePath: this.cachePath,
    };
  }
}
