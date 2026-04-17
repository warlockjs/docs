import events from "@mongez/events";
import { unlinkAsync } from "@mongez/fs";
import type { DependencyGraph } from "./dependency-graph";
import { DEV_SERVER_EVENTS } from "./events";
import { FileManager } from "./file-manager";
import type { ManifestManager } from "./manifest-manager";
import { parseImports } from "./parse-imports";
import { Path } from "./path";
import type { SpecialFilesCollector } from "./special-files-collector";
import { areSetsEqual, warlockCachePath } from "./utils";

/**
 * FileOperations - Handles file lifecycle operations
 *
 * This class is responsible for managing the lifecycle of files:
 * - **Add**: Register and process new files
 * - **Update**: Reprocess changed files
 * - **Delete**: Remove files and clean up resources
 *
 * It coordinates between:
 * - FileManager instances (individual file processing)
 * - DependencyGraph (tracking imports/dependents)
 * - ManifestManager (caching file metadata)
 * - SpecialFilesCollector (categorizing files by type)
 *
 * ## Usage
 *
 * ```typescript
 * const fileOps = new FileOperations(files, graph, manifest, collector);
 *
 * // Add a new file
 * const file = await fileOps.addFile("src/app/users/user.controller.ts");
 *
 * // Update an existing file
 * const changed = await fileOps.updateFile("src/app/users/user.controller.ts");
 *
 * // Delete a file
 * await fileOps.deleteFile("src/app/users/user.controller.ts");
 * ```
 *
 * @class FileOperations
 */
export class FileOperations {
  /**
   * Creates a new FileOperations instance
   *
   * @param files - Map of all tracked FileManager instances (key: relative path)
   * @param dependencyGraph - Graph tracking file dependencies
   * @param manifest - Manager for persisting file metadata
   * @param specialFilesCollector - Collector for categorizing special files
   */
  public constructor(
    private readonly files: Map<string, FileManager>,
    private readonly dependencyGraph: DependencyGraph,
    private readonly manifest: ManifestManager,
    private readonly specialFilesCollector: SpecialFilesCollector,
  ) {}

  /**
   * Add a new file to the system
   *
   * This method uses a two-phase approach to ensure dependencies are processed:
   * 1. Parse the file to discover dependencies
   * 2. Recursively add all dependencies (so their cache files exist)
   * 3. Complete processing (transpile + transform + save)
   *
   * This ensures that when imports are transformed to cache paths,
   * the dependency cache files actually exist.
   *
   * If the file is already tracked, returns the existing FileManager.
   *
   * @param relativePath - Relative path from project root
   * @returns The FileManager instance for the file
   *
   * @example
   * ```typescript
   * const file = await fileOps.addFile("src/config/auth.ts");
   * // Dependencies like "app/users/models/user" are also processed
   * console.log(file.state); // "ready"
   * ```
   */
  public async addFile(relativePath: string): Promise<FileManager> {
    // Return existing if already tracked (idempotent)
    if (this.files.has(relativePath)) {
      return this.files.get(relativePath)!;
    }

    const absolutePath = Path.toAbsolute(relativePath);
    const fileManager = new FileManager(absolutePath, this.files, this);

    // Add to tracking FIRST so other files can find it during recursion
    this.files.set(relativePath, fileManager);

    // Phase 1: Parse to discover dependencies (no transpile yet)
    await fileManager.parse();

    // Phase 2: Recursively add all dependencies
    // This ensures their cache files exist before we transform our imports
    for (const depPath of fileManager.dependencies) {
      if (!this.files.has(depPath)) {
        try {
          await this.addFile(depPath); // Recursive
        } catch (error) {
          // Dependency might be external or not exist, continue
        }
      }
    }

    // Phase 3: Complete processing (transpile + transform + save)
    // Now all dependencies have cache files, so transforms will work
    await fileManager.complete();

    // Register dependencies in graph
    for (const dependency of fileManager.dependencies) {
      this.dependencyGraph.addDependency(relativePath, dependency);
    }

    // Add to special files collector
    this.specialFilesCollector.addFile(fileManager);

    // Reload any files that were waiting for this dependency
    await this.reloadFilesWaitingForDependency(relativePath);

    return fileManager;
  }

  /**
   * Parse a new file without completing processing (Phase 1 of batch add)
   *
   * This is used during batch file operations where you need to:
   * 1. Discover all dependencies first
   * 2. Determine processing order (topological sort)
   * 3. Complete processing in dependency order
   *
   * After calling this, call `finalizeNewFile()` to complete processing.
   *
   * @param relativePath - Relative path from project root
   * @returns The FileManager instance (in "parsed" state)
   *
   * @example
   * ```typescript
   * // Phase 1: Parse all files to discover dependencies
   * const files = await Promise.all(
   *   paths.map(path => fileOps.parseNewFile(path))
   * );
   *
   * // Phase 2: Order by dependencies, then finalize
   * for (const file of orderedFiles) {
   *   await fileOps.finalizeNewFile(file);
   * }
   * ```
   */
  public async parseNewFile(relativePath: string): Promise<FileManager> {
    // Return existing if already tracked
    if (this.files.has(relativePath)) {
      return this.files.get(relativePath)!;
    }

    const absolutePath = Path.toAbsolute(relativePath);
    const fileManager = new FileManager(absolutePath, this.files, this);

    // Parse only - discover dependencies without full processing
    await fileManager.parse();

    // Add to files map so other files can find it during import resolution
    this.files.set(relativePath, fileManager);

    return fileManager;
  }

  /**
   * Complete processing for a parsed file (Phase 2 of batch add)
   *
   * This completes the processing pipeline for a file that was
   * previously parsed with `parseNewFile()`.
   *
   * @param fileManager - The FileManager to finalize (must be in "parsed" state)
   *
   * @example
   * ```typescript
   * const file = await fileOps.parseNewFile("src/app/users/user.controller.ts");
   * // ... after dependencies are ready ...
   * await fileOps.finalizeNewFile(file);
   * ```
   */
  public async finalizeNewFile(fileManager: FileManager): Promise<void> {
    // Complete processing (transpile, transform imports, save cache)
    await fileManager.complete();

    // Register dependencies in graph
    for (const dependency of fileManager.dependencies) {
      this.dependencyGraph.addDependency(fileManager.relativePath, dependency);
    }

    // Add to special files collector
    this.specialFilesCollector.addFile(fileManager);

    // Reload any files that were waiting for this dependency
    await this.reloadFilesWaitingForDependency(fileManager.relativePath);
  }

  /**
   * Reload files that might have been waiting for a newly added dependency
   *
   * When a file is added, check if any existing files have imports
   * that could now resolve to this new file. If so, reprocess them.
   *
   * This handles cases where:
   * - A file was created that another file was trying to import
   * - A batch of files is added where some depend on others
   *
   * @param newFilePath - Relative path of the newly added file
   * @internal
   */
  private async reloadFilesWaitingForDependency(newFilePath: string): Promise<void> {
    const potentialDependents: string[] = [];

    // Check all existing files to see if any could now resolve to the new file
    for (const [existingPath, existingFile] of this.files) {
      if (existingPath === newFilePath) continue;
      if (existingFile.state !== "ready") continue;

      try {
        // Re-parse imports to check if any resolve to the new file
        const importMap = await parseImports(existingFile.source, existingFile.absolutePath);

        for (const [_importPath, resolvedPath] of importMap) {
          if (resolvedPath && Path.toRelative(resolvedPath) === newFilePath) {
            potentialDependents.push(existingPath);
            break;
          }
        }
      } catch (error) {
        // Skip files that can't be parsed
        continue;
      }
    }

    // Reprocess dependents
    for (const dependentPath of potentialDependents) {
      const dependentFile = this.files.get(dependentPath);
      if (dependentFile) {
        try {
          await dependentFile.forceReprocess();
          this.dependencyGraph.updateFile(dependentPath, dependentFile.dependencies);
        } catch (error) {
          // Ignore - file might still have issues
        }
      }
    }
  }

  /**
   * Update an existing file after it has changed
   *
   * This method:
   * 1. Reprocesses the file if content has changed
   * 2. Updates the dependency graph if dependencies changed
   * 3. Updates the special files collector
   * 4. Triggers the FILE_READY event
   *
   * If the file isn't tracked, it's treated as a new file.
   *
   * @param relativePath - Relative path from project root
   * @returns True if file was changed and reprocessed, false if unchanged
   *
   * @example
   * ```typescript
   * const changed = await fileOps.updateFile("src/app/users/user.controller.ts");
   * if (changed) {
   *   console.log("File was updated, triggering HMR...");
   * }
   * ```
   */
  public async updateFile(relativePath: string): Promise<boolean> {
    const fileManager = this.files.get(relativePath);

    if (!fileManager) {
      // File not tracked - treat as new file
      await this.addFile(relativePath);
      return true;
    }

    // Store old dependencies for comparison
    const oldDependencies = new Set(fileManager.dependencies);

    try {
      // Update the file (reprocess if changed)
      const hasChanged = await fileManager.update();

      if (!hasChanged) {
        return false;
      }

      // Update dependency graph if dependencies changed
      if (!areSetsEqual(oldDependencies, fileManager.dependencies)) {
        this.dependencyGraph.updateFile(relativePath, fileManager.dependencies);
      }

      // Update special files collector
      this.specialFilesCollector.updateFile(fileManager);

      return true;
    } catch (error) {
      // Failed to update (likely broken imports)
      return false;
    }
  }

  /**
   * Delete a file from the system
   *
   * This method:
   * 1. Removes the cache file from disk
   * 2. Removes the file from the dependency graph
   * 3. Removes from special files collector
   * 4. Removes from manifest
   * 5. Triggers reload of dependents (so they see broken import errors)
   * 6. Removes from the files map
   *
   * @param relativePath - Relative path from project root
   *
   * @example
   * ```typescript
   * await fileOps.deleteFile("src/app/users/user.controller.ts");
   * // File is now fully removed from the system
   * ```
   */
  public async deleteFile(relativePath: string): Promise<void> {
    const fileManager = this.files.get(relativePath);

    if (!fileManager) {
      return;
    }

    // Get dependents before removal (so we can notify them)
    const dependents = this.dependencyGraph.getDependents(relativePath);

    // Delete cache file
    try {
      const cachePath = warlockCachePath(fileManager.cachePath);
      await unlinkAsync(cachePath);
    } catch (error) {
      // Cache file might not exist - ignore
    }

    // Remove from dependency graph
    this.dependencyGraph.removeFile(relativePath);

    // Remove from special files collector
    this.specialFilesCollector.removeFile(relativePath);

    // Remove from manifest
    this.manifest.removeFile(relativePath);

    // Trigger reload of dependents (they'll see broken import errors)
    for (const dependentPath of dependents) {
      const dependentFile = this.files.get(dependentPath);
      if (dependentFile) {
        events.trigger(DEV_SERVER_EVENTS.FILE_READY, dependentFile);
      }
    }

    // Remove from files map (delayed to allow other operations to complete)
    setTimeout(() => {
      this.files.delete(relativePath);
    }, 300);
  }

  /**
   * Update dependents in all FileManager instances from the dependency graph
   *
   * This synchronizes the `dependents` property of each FileManager
   * with the current state of the dependency graph. Called after
   * initial file processing or batch operations.
   *
   * @example
   * ```typescript
   * // After processing all files
   * fileOps.updateFileDependents();
   * ```
   */
  public updateFileDependents(): void {
    for (const [relativePath, fileManager] of this.files) {
      const dependents = this.dependencyGraph.getDependents(relativePath);
      fileManager.dependents = dependents;
    }
  }

  /**
   * Sync all FileManager instances to the manifest
   *
   * This persists the current state of all files to the manifest
   * for caching across dev server restarts.
   *
   * @example
   * ```typescript
   * // Before saving manifest
   * fileOps.syncFilesToManifest();
   * await manifest.save();
   * ```
   */
  public syncFilesToManifest(): void {
    for (const [relativePath, fileManager] of this.files) {
      this.manifest.setFile(relativePath, fileManager.toManifest());
    }
  }
}
