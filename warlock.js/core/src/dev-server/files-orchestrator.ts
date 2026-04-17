import { colors } from "@mongez/copper";
import { unlinkAsync } from "@mongez/fs";
import { init } from "es-module-lexer";
import { warlockConfigManager } from "../warlock-config/warlock-config.manager";
import { DependencyGraph } from "./dependency-graph";
import { devLogDim, devLogSuccess } from "./dev-logger";
import { FileEventHandler } from "./file-event-handler";
import { FileManager } from "./file-manager";
import { FileOperations } from "./file-operations";
import { FilesWatcher } from "./files-watcher";
import { FILE_PROCESSING_BATCH_SIZE } from "./flags";
import { EslintHealthChecker } from "./health-checker/checkers/eslint-health-checker";
import { TypescriptHealthChecker } from "./health-checker/checkers/typescript-health-checker";
import { FileHealthCheckerContract } from "./health-checker/file-health-checker.contract";
import { FilesHealthcareManager } from "./health-checker/files-healthcare.manager";
import { ManifestManager } from "./manifest-manager";
import { ModuleLoader } from "./module-loader";
import { packageJsonManager } from "./package-json-manager";
import { Path } from "./path";
import { initializeRuntimeImportHelper } from "./runtime-import-helper";
import { SpecialFilesCollector } from "./special-files-collector";
import { tsconfigManager } from "./tsconfig-manager";
import { createFreshWarlockDirectory, getFilesFromDirectory, warlockCachePath } from "./utils";

/**
 * Cleeanup function callback when file is deleted or hot module reload
 * @note Works only on development, omit in production
 */
export function onCleanup(callback: () => any) {
  if (globalThis.__currentModuleFile) {
    globalThis.__currentModuleFile.addCleanup(callback);
    return;
  }

  // Create an Error to capture stack trace
  const stack = new Error().stack;

  // Parse the stack to find the caller's file
  // Stack looks like:
  // Error
  //     at onCleanup (files-orchestrator.ts:25)
  //     at <anonymous> (main.ts:86)  ← This is who called us
  //     ...

  const callerLine = stack?.split("\n")[2]; // Third line is the caller
  const match = callerLine?.match(/\((.+?):\d+:\d+\)/) || callerLine?.match(/at (.+?):\d+:\d+/);

  const callerFile = match?.[1];

  if (callerFile) {
    // now get from the orchestrator the file manager instance
    // P.S callerFile is an absolute path, we need to convert it to relative
    const relativePath = Path.toRelative(callerFile);
    const fileManager = filesOrchestrator.files.get(relativePath);
    if (fileManager) {
      fileManager.addCleanup(callback);
    }
  }
}

export class FilesOrchestrator {
  public readonly filesWatcher = new FilesWatcher();
  public readonly files = new Map<string, FileManager>();
  private readonly manifest = new ManifestManager(this.files);
  private readonly dependencyGraph = new DependencyGraph();
  private readonly healthCheckerManager = new FilesHealthcareManager(this.files);
  public readonly fileOperations: FileOperations;
  private readonly eventHandler: FileEventHandler;
  public readonly specialFilesCollector = new SpecialFilesCollector();
  public readonly moduleLoader = new ModuleLoader(this.specialFilesCollector);

  public isInitialized = false;

  /**
   * Creates the FilesOrchestrator instance
   *
   * Initializes all subsystems:
   * - FileOperations for file lifecycle management
   * - FileEventHandler for processing file system events
   */
  public constructor() {
    // Create file operations with all dependencies
    this.fileOperations = new FileOperations(
      this.files,
      this.dependencyGraph,
      this.manifest,
      this.specialFilesCollector,
    );

    // Create event handler with all required dependencies
    this.eventHandler = new FileEventHandler(
      this.fileOperations,
      this.manifest,
      this.dependencyGraph,
      this.files,
    );
  }

  /**
   * Parse and add the given file to files list
   */
  public async add(relativePath: string): Promise<FileManager> {
    return this.fileOperations.addFile(relativePath);
  }

  /**
   * Add then load the file through the modules load
   */
  public async load<T>(relativePath: string, type = "other") {
    const fileManager = await this.add(relativePath);

    return this.moduleLoader.loadModule<T>(fileManager, fileManager.type || type);
  }

  /**
   * Get the dependency graph
   * Provides read-only access to the dependency graph for external use
   */
  public getDependencyGraph(): DependencyGraph {
    return this.dependencyGraph;
  }

  /**
   * Get invalidation chain for a file
   * Returns all files that need to be reloaded when the given file changes
   */
  public getInvalidationChain(file: string): string[] {
    return this.dependencyGraph.getInvalidationChain(file);
  }

  /**
   * Get all tracked files
   */
  public getFiles(): Map<string, FileManager> {
    return this.files;
  }

  /**
   * Get health checker manager
   */
  public getHealthCheckerManager(): FilesHealthcareManager {
    return this.healthCheckerManager;
  }

  /**
   * Initialize the files orchestrator
   */
  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialize es-module-lexer (it's a promise, not a function)
    await init;

    // Initialize configuration managers
    await Promise.all([tsconfigManager.init(), packageJsonManager.init()]);

    // Initialize runtime import helper (for HMR cache busting)
    initializeRuntimeImportHelper();
  }

  /**
   * Initialize all development server features
   *
   * This is the main initialization sequence that:
   * 1. Discovers all TypeScript/JavaScript files in the project
   * 2. Reconciles filesystem state with cached manifest
   * 3. Builds the dependency graph for HMR
   * 4. Persists file metadata to manifest
   *
   * Each file is fully processed (including import transforms) during
   * reconciliation because transforms compute cache paths deterministically
   * and don't depend on other files being processed first.
   *
   * @example
   * ```typescript
   * await filesOrchestrator.init();
   * await filesOrchestrator.initiaizeAll();
   * await filesOrchestrator.watchFiles();
   * ```
   */
  public async initiaizeAll() {
    const [filesInFilesystem, manifestExists] = await Promise.all([
      this.getAllFilesFromFilesystem(),
      this.manifest.init(),
    ]);

    // STEP 1: Reconcile filesystem with manifest
    // Each file is fully processed (transpile + transform + save)
    if (!manifestExists) {
      // No manifest = fresh start, process all files
      await this.processAllFilesFresh(filesInFilesystem);
    } else {
      // Manifest exists = reconcile differences
      await this.reconcileFiles(filesInFilesystem);
    }

    // STEP 2: Build dependency graph from all processed files
    this.dependencyGraph.build(this.files);

    // STEP 3: Update dependents in FileManager instances
    this.updateFileDependents();

    // STEP 4: Sync all files to manifest and save
    this.syncFilesToManifest();
    await this.manifest.save();
  }

  /**
   * Check the health of the given files
   */
  public async checkHealth(files: { added: string[]; changed: string[]; deleted: string[] }) {
    const filesToCheck = files.added
      .concat(files.changed)
      .map((file) => this.files.get(Path.toRelative(file)))
      .filter((file) => !!file);

    const filesToDelete = files.deleted
      .map((file) => this.files.get(Path.toRelative(file)))
      .filter((file) => !!file);

    await this.healthCheckerManager.onFileChanges(filesToCheck);

    this.healthCheckerManager.removeFiles(filesToDelete);

    this.healthCheckerManager.checkFiles(filesToCheck);
  }

  /**
   * Check health state for all files
   */
  public async startCheckingHealth(healthCheckers?: FileHealthCheckerContract[]): Promise<void> {
    devLogDim("Started File Health Checks in the background.");
    if (!healthCheckers) {
      const typescriptHealthChecker = new TypescriptHealthChecker();
      const eslintHealthChecker = new EslintHealthChecker();
      healthCheckers = [typescriptHealthChecker, eslintHealthChecker];
    }

    await this.healthCheckerManager.setHealthCheckers(healthCheckers).initialize(); // Initialize workers

    await this.healthCheckerManager.validateAllFiles();
  }

  /**
   * Get all TypeScript/JavaScript files from the filesystem
   * This always scans the actual filesystem, ignoring any cached data
   * @returns Array of relative file paths
   */
  public async getAllFilesFromFilesystem(): Promise<string[]> {
    const absolutePaths = await getFilesFromDirectory();
    // Convert to relative paths for consistency throughout the system
    return absolutePaths.map((absPath) => Path.toRelative(absPath));
  }

  /**
   * Process all files fresh (no manifest exists)
   *
   * This happens on first run or when manifest is deleted.
   * Each file is fully processed including import transforms.
   *
   * @param filePaths Array of relative file paths
   */
  public async processAllFilesFresh(filePaths: string[]) {
    devLogDim(`processing ${filePaths.length} files...`);

    // Ensure .warlock directory exists
    await createFreshWarlockDirectory();

    const BATCH_SIZE = FILE_PROCESSING_BATCH_SIZE;

    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
      const batch = filePaths.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (relativePath) => {
          const absolutePath = Path.toAbsolute(relativePath);
          const fileManager = new FileManager(absolutePath, this.files, this.fileOperations);
          this.files.set(relativePath, fileManager);
          // Full processing (transforms work because cache paths are deterministic)
          await fileManager.process();
        }),
      );
    }

    devLogSuccess(`processed ${filePaths.length} files`);
  }

  /**
   * Reconcile filesystem state with manifest data
   * This handles: new files, deleted files, and changed files
   */
  private async reconcileFiles(filesInFilesystem: string[]) {
    const filesInManifest = new Set(this.manifest.getAllFilePaths());
    const filesInFilesystemSet = new Set(filesInFilesystem);

    // Find new files (in filesystem but not in manifest)
    const newFiles = filesInFilesystem.filter((file) => !filesInManifest.has(file));

    // Find deleted files (in manifest but not in filesystem)
    const deletedFiles = Array.from(filesInManifest).filter(
      (file) => !filesInFilesystemSet.has(file),
    );

    // Find existing files (in both)
    const existingFiles = filesInFilesystem.filter((file) => filesInManifest.has(file));

    if (newFiles.length > 0 || deletedFiles.length > 0) {
      const newText = newFiles.length > 0 ? colors.green(newFiles.length) : 0;
      const deletedText = deletedFiles.length > 0 ? colors.red(deletedFiles.length) : 0;
      const existingText = existingFiles.length > 0 ? colors.blue(existingFiles.length) : 0;
      devLogDim(`reconciling: ${newText} new, ${deletedText} deleted, ${existingText} existing`);
    }

    // Process new files
    await this.processNewFiles(newFiles);

    // Remove deleted files
    await this.processDeletedFiles(deletedFiles);

    // Process existing files (check for changes)
    await this.processExistingFiles(existingFiles);
  }

  /**
   * Process newly discovered files (in filesystem but not in manifest)
   *
   * Each file is fully processed including import transforms.
   *
   * @param filePaths Array of relative file paths
   */
  private async processNewFiles(filePaths: string[]) {
    if (filePaths.length === 0) return;

    const BATCH_SIZE = FILE_PROCESSING_BATCH_SIZE;

    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
      const batch = filePaths.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (relativePath) => {
          const absolutePath = Path.toAbsolute(relativePath);
          const fileManager = new FileManager(absolutePath, this.files, this.fileOperations);
          this.files.set(relativePath, fileManager);
          // Full processing
          await fileManager.process();
        }),
      );
    }
  }

  /**
   * Remove deleted files from tracking
   * @param filePaths Array of relative file paths
   */
  private async processDeletedFiles(filePaths: string[]) {
    if (filePaths.length === 0) return;

    for (const relativePath of filePaths) {
      // Get file info from manifest before deletion
      const manifestEntry = this.manifest.getFile(relativePath);

      if (manifestEntry) {
        // Delete cache file
        try {
          await unlinkAsync(warlockCachePath(manifestEntry.cachePath));
        } catch (error) {
          // Cache file might not exist, ignore
        }
      }

      // Remove from manifest
      this.manifest.removeFile(relativePath);

      // Remove from files map
      this.files.delete(relativePath);
    }
  }

  /**
   * Process existing files (check if they changed since last run)
   *
   * For unchanged files, loads from cache.
   * For changed files, reprocesses fully.
   *
   * @param filePaths Array of relative file paths
   */
  private async processExistingFiles(filePaths: string[]) {
    if (filePaths.length === 0) return;

    const BATCH_SIZE = FILE_PROCESSING_BATCH_SIZE;

    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
      const batch = filePaths.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (relativePath) => {
          const manifestData = this.manifest.getFile(relativePath);
          const absolutePath = Path.toAbsolute(relativePath);
          const fileManager = new FileManager(absolutePath, this.files, this.fileOperations);
          this.files.set(relativePath, fileManager);
          // Initialize with manifest (uses cache if unchanged, reprocesses if changed)
          await fileManager.init(manifestData);
        }),
      );
    }
  }

  /**
   * Update dependents in all FileManager instances from dependency graph
   */
  private updateFileDependents() {
    for (const [relativePath, fileManager] of this.files) {
      const dependents = this.dependencyGraph.getDependents(relativePath);
      fileManager.dependents = dependents;
    }
  }

  /**
   * Sync all FileManager instances to manifest
   * Uses relative paths as keys for portability
   */
  private syncFilesToManifest() {
    for (const [relativePath, fileManager] of this.files) {
      this.manifest.setFile(relativePath, fileManager.toManifest());
    }
  }

  /**
   * Start file watcher to detect changes during development
   */
  public async watchFiles() {
    devLogSuccess("watching for file changes");

    // Connect file watcher to event handler
    this.filesWatcher.onFileChange((absolutePath) => {
      this.eventHandler.handleFileChange(absolutePath);
    });

    this.filesWatcher.onFileAdd((absolutePath) => {
      this.eventHandler.handleFileAdd(absolutePath);
    });

    this.filesWatcher.onFileDelete((absolutePath) => {
      this.eventHandler.handleFileDelete(absolutePath);
    });

    // Get watch config from warlock.config.ts (if loaded)
    const watchConfig = warlockConfigManager.get("devServer")?.watch;

    await this.filesWatcher.watch(watchConfig);
  }
}

export const filesOrchestrator = new FilesOrchestrator();
