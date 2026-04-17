import events from "@mongez/events";
import { debounce } from "@mongez/reinforcements";
import type { DependencyGraph } from "./dependency-graph";
import { devLogSuccess } from "./dev-logger";
import type { FileManager } from "./file-manager";
import type { FileOperations } from "./file-operations";
import { FILE_PROCESSING_BATCH_SIZE } from "./flags";
import type { ManifestManager } from "./manifest-manager";
import { clearFileExistsCache } from "./parse-imports";
import { Path } from "./path";

/**
 * FileEventHandler - Handles runtime file system events
 *
 * This class receives file system events (add, change, delete) from the
 * FilesWatcher and processes them in batches for optimal performance.
 *
 * ## Batching Strategy
 *
 * Events are collected and processed after a debounce period (150ms).
 * This batching is crucial when:
 * - Multiple files are created at once (e.g., VSCode extension creating a module)
 * - A file save triggers multiple filesystem events
 * - Large refactoring operations affect many files
 *
 * ## Processing Order
 *
 * 1. **Added files** - Processed first so they're available for imports
 * 2. **Changed files** - Can reference newly added files
 * 3. **Deleted files** - Processed last, dependents are notified
 *
 * ## Batch Add Strategy
 *
 * When multiple files are added (e.g., creating a Warlock module), they're
 * processed using a two-phase approach with topological sorting:
 *
 * 1. **Parse Phase**: All files are parsed to discover dependencies
 * 2. **Sort Phase**: Files are topologically sorted by dependencies
 * 3. **Complete Phase**: Files are finalized in dependency order
 *
 * This ensures that when file A imports file B, file B is processed first.
 *
 * @class FileEventHandler
 */
export class FileEventHandler {
  /**
   * Pending file change events (relative paths)
   */
  private pendingChanges = new Set<string>();

  /**
   * Pending file add events (relative paths)
   */
  private pendingAdds = new Set<string>();

  /**
   * Pending file delete events (relative paths)
   */
  private pendingDeletes = new Set<string>();

  /**
   * Debounced batch processor
   * Waits 150ms after the last event before processing
   */
  private readonly processPendingEvents = debounce(async () => {
    await this.processBatch();
  }, 150);

  /**
   * Creates a new FileEventHandler
   *
   * @param fileOperations - FileOperations instance for file lifecycle management
   * @param manifest - ManifestManager for persisting file metadata
   * @param dependencyGraph - DependencyGraph for tracking dependencies
   * @param files - Map of all tracked FileManager instances
   */
  constructor(
    private readonly fileOperations: FileOperations,
    private readonly manifest: ManifestManager,
    private readonly dependencyGraph: DependencyGraph,
    private readonly files: Map<string, FileManager>,
  ) {}

  /**
   * Handle a file change event from the file watcher
   *
   * The event is queued and will be processed in the next batch.
   *
   * @param absolutePath - Absolute path to the changed file
   */
  public handleFileChange(absolutePath: string): void {
    const relativePath = Path.toRelative(absolutePath);
    this.pendingChanges.add(relativePath);
    this.processPendingEvents();
  }

  /**
   * Handle a file add event from the file watcher
   *
   * The event is queued and will be processed in the next batch.
   *
   * @param absolutePath - Absolute path to the new file
   */
  public handleFileAdd(absolutePath: string): void {
    const relativePath = Path.toRelative(absolutePath);
    this.pendingAdds.add(relativePath);
    this.processPendingEvents();
  }

  /**
   * Handle a file delete event from the file watcher
   *
   * The event is queued and will be processed in the next batch.
   *
   * @param absolutePath - Absolute path to the deleted file
   */
  public handleFileDelete(absolutePath: string): void {
    const relativePath = Path.toRelative(absolutePath);
    this.pendingDeletes.add(relativePath);
    this.processPendingEvents();
  }

  /**
   * Process all pending events in a batch
   *
   * Events are processed in order: adds → changes → deletes
   * After processing, the dependency graph and manifest are updated.
   *
   * @internal
   */
  private async processBatch(): Promise<void> {
    // Snapshot pending events
    const changes = Array.from(this.pendingChanges);
    const adds = Array.from(this.pendingAdds);
    const deletes = Array.from(this.pendingDeletes);

    // Clear pending sets
    this.pendingChanges.clear();
    this.pendingAdds.clear();
    this.pendingDeletes.clear();

    // Skip if nothing to process
    if (changes.length === 0 && adds.length === 0 && deletes.length === 0) {
      return;
    }

    // Separate .env files from code files
    // .env files don't need transpilation but still trigger HMR
    const isEnvFile = (path: string) => {
      const basename = path.split("/").pop() || path;
      return basename === ".env" || basename.startsWith(".env.");
    };

    const codeChanges = changes.filter((p) => !isEnvFile(p));
    const codeAdds = adds.filter((p) => !isEnvFile(p));

    // For batch operations, add extra delay to let filesystem settle
    const totalFiles = codeAdds.length + codeChanges.length;
    if (totalFiles > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      clearFileExistsCache();
    }

    // Process code files only (env files don't need transpilation)
    await this.processBatchAdds(codeAdds);
    await this.processBatchChanges(codeChanges);
    await this.processBatchDeletes(deletes);

    // Update dependency graph and manifest once
    this.fileOperations.updateFileDependents();
    this.fileOperations.syncFilesToManifest();
    await this.manifest.save();

    // Trigger batch completion event (for HMR/reload execution)
    // Include ALL changes (including .env) so config reload is triggered
    events.trigger("dev-server:batch-complete", {
      added: adds,
      changed: changes,
      deleted: deletes,
    });
  }

  /**
   * Process a batch of changed files
   *
   * Each file is updated (reprocessed if content changed).
   * Processing is done in parallel batches for performance.
   *
   * @param relativePaths - Array of relative paths to changed files
   * @internal
   */
  private async processBatchChanges(relativePaths: string[]): Promise<void> {
    if (relativePaths.length === 0) return;

    const BATCH_SIZE = FILE_PROCESSING_BATCH_SIZE;

    for (let i = 0; i < relativePaths.length; i += BATCH_SIZE) {
      const batch = relativePaths.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (relativePath) => {
          await this.fileOperations.updateFile(relativePath);
        }),
      );
    }
  }

  /**
   * Process a batch of added files using topological sort
   *
   * This method uses a two-phase approach:
   * 1. Parse all files to discover dependencies
   * 2. Complete files in topological order (dependencies first)
   *
   * This ensures that when file A imports file B (both in the batch),
   * file B is fully processed before file A tries to resolve the import.
   *
   * @param relativePaths - Array of relative paths to new files
   * @internal
   */
  private async processBatchAdds(relativePaths: string[]): Promise<void> {
    if (relativePaths.length === 0) return;

    const batchSet = new Set(relativePaths);

    // PHASE 1: Parse all files in parallel to discover dependencies
    const parsedFiles = await Promise.all(
      relativePaths.map(async (relativePath) => {
        try {
          return await this.fileOperations.parseNewFile(relativePath);
        } catch (error) {
          return null;
        }
      }),
    );

    // Filter out nulls (files that couldn't be parsed)
    const validFiles = parsedFiles.filter((f): f is FileManager => f !== null);

    // PHASE 2: Topological sort for proper dependency order
    const orderedFiles = this.topologicalSort(validFiles, batchSet);

    // PHASE 3: Complete processing in dependency order
    for (const file of orderedFiles) {
      try {
        await this.fileOperations.finalizeNewFile(file);
        devLogSuccess(`Added file: ${file.relativePath}`);
      } catch (error) {
        // File may have issues, but we continue with others
        console.error(`Failed to add file ${file.relativePath}:`, error);
      }
    }
  }

  /**
   * Topologically sort files by their dependencies
   *
   * Uses Kahn's algorithm to produce an ordering where files with
   * no batch dependencies come first, and files that depend on other
   * batch files come after their dependencies.
   *
   * @param files - Array of FileManager instances to sort
   * @param batchSet - Set of relative paths in this batch (for filtering deps)
   * @returns Files in topological order (dependencies first)
   *
   * @example
   * ```typescript
   * // If A imports B, and B imports C, result will be: [C, B, A]
   * const ordered = this.topologicalSort([fileA, fileB, fileC], batchSet);
   * ```
   *
   * @internal
   */
  private topologicalSort(files: FileManager[], batchSet: Set<string>): FileManager[] {
    const fileMap = new Map<string, FileManager>();
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Initialize data structures
    for (const file of files) {
      fileMap.set(file.relativePath, file);
      inDegree.set(file.relativePath, 0);
      graph.set(file.relativePath, []);
    }

    // Build graph: for each file, record which files depend on it
    for (const file of files) {
      for (const dep of file.dependencies) {
        // Only consider dependencies that are in this batch
        if (batchSet.has(dep) && fileMap.has(dep)) {
          // dep → file (file depends on dep)
          graph.get(dep)!.push(file.relativePath);
          inDegree.set(file.relativePath, (inDegree.get(file.relativePath) || 0) + 1);
        }
      }
    }

    // Kahn's algorithm: start with files that have no batch dependencies
    const queue: FileManager[] = [];
    for (const file of files) {
      if (inDegree.get(file.relativePath) === 0) {
        queue.push(file);
      }
    }

    const result: FileManager[] = [];
    while (queue.length > 0) {
      const file = queue.shift()!;
      result.push(file);

      // For each file that depends on this one, reduce its in-degree
      for (const dependentPath of graph.get(file.relativePath) || []) {
        const newDegree = (inDegree.get(dependentPath) || 0) - 1;
        inDegree.set(dependentPath, newDegree);

        if (newDegree === 0) {
          const dependentFile = fileMap.get(dependentPath);
          if (dependentFile) {
            queue.push(dependentFile);
          }
        }
      }
    }

    // Handle any remaining files (cycles or isolated)
    // These are added at the end to ensure all files are processed
    for (const file of files) {
      if (!result.includes(file)) {
        result.push(file);
      }
    }

    return result;
  }

  /**
   * Process a batch of deleted files
   *
   * Each file is removed from the system and its dependents are notified.
   *
   * @param relativePaths - Array of relative paths to deleted files
   * @internal
   */
  private async processBatchDeletes(relativePaths: string[]): Promise<void> {
    if (relativePaths.length === 0) return;

    for (const relativePath of relativePaths) {
      await this.fileOperations.deleteFile(relativePath);
      devLogSuccess(`Deleted file: ${relativePath}`);
    }
  }
}
