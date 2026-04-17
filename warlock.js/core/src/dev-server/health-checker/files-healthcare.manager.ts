import { colors } from "@mongez/copper";
import type { Worker } from "worker_threads";
import { createWorker } from "../create-worker";
import { devLogInfo } from "../dev-logger";
import type { FileManager } from "../file-manager";
import type {
  FileHealthCheckerContract,
  HealthCheckerFilesStats,
} from "./file-health-checker.contract";

/**
 * Serialized file data to send to workers
 */
type SerializedFile = {
  path: string;
  content: string;
  relativePath: string;
};

/**
 * Diagnostic message from worker
 */
type DiagnosticMessage = {
  type: "error" | "warning";
  message: string;
  lineNumber: number;
  columnNumber: number;
  length: number;
  filePath: string;
  relativePath: string;
  ruleId?: string;
};

/**
 * File check result from worker
 */
type FileCheckResult = {
  path: string;
  relativePath: string;
  healthy: boolean;
  errors: DiagnosticMessage[];
  warnings: DiagnosticMessage[];
};

/**
 * Worker response type
 */
type WorkerResponse =
  | { type: "initialized"; success: boolean; hasConfig?: boolean; error?: string }
  | { type: "results"; results: FileCheckResult[] }
  | { type: "error"; message: string };

/**
 * Files Healthcare Manager
 *
 * Manages health checkers for file validation during development.
 * Supports both main-thread and worker-based checkers.
 *
 * Checkers with `workerPath` run in dedicated worker threads for performance.
 * Checkers without `workerPath` run in the main thread.
 *
 * @example
 * ```typescript
 * const manager = new FilesHealthcareManager(files);
 *
 * manager.setHealthCheckers([
 *   new TypescriptHealthChecker(),  // Has workerPath → runs in worker
 *   new CustomChecker(),             // No workerPath → runs in main thread
 * ]);
 *
 * await manager.initialize();
 * await manager.validateAllFiles();
 * ```
 */
export class FilesHealthcareManager {
  /**
   * Registered health checkers
   */
  private healthCheckers: FileHealthCheckerContract[] = [];

  /**
   * Active worker instances (checkerName → Worker)
   */
  private workers = new Map<string, Worker>();

  /**
   * Worker initialization promises (for ensuring workers are ready)
   */
  private workerInitPromises = new Map<string, Promise<boolean>>();

  /**
   * Aggregated stats for each checker
   */
  private checkerStats = new Map<
    string,
    {
      totalFiles: number;
      healthyFiles: number;
      defectiveFiles: number;
      totalErrors: number;
      totalWarnings: number;
      filesWithErrors: number;
      filesWithWarnings: number;
    }
  >();

  /**
   * Constructor
   * @param files - Map of tracked files
   */
  public constructor(private readonly files: Map<string, FileManager>) {}

  /**
   * Add health checkers to the manager
   * @param checkers - Checkers to add
   */
  public addHealthCheckers(...checkers: FileHealthCheckerContract[]): FilesHealthcareManager {
    this.healthCheckers.push(...checkers);
    return this;
  }

  /**
   * Set (replace) all health checkers
   * @param checkers - New set of checkers
   */
  public setHealthCheckers(checkers: FileHealthCheckerContract[]): FilesHealthcareManager {
    this.healthCheckers = checkers;
    return this;
  }

  /**
   * Initialize all health checkers
   *
   * For checkers with `workerPath`, spawns dedicated worker threads.
   * For other checkers, calls their `initialize()` method directly.
   */
  public async initialize(): Promise<void> {
    const initPromises = this.healthCheckers.map(async (checker) => {
      // Initialize stats for this checker
      this.checkerStats.set(checker.name, {
        totalFiles: 0,
        healthyFiles: 0,
        defectiveFiles: 0,
        totalErrors: 0,
        totalWarnings: 0,
        filesWithErrors: 0,
        filesWithWarnings: 0,
      });

      if (checker.workerPath) {
        // Spawn dedicated worker for this checker
        await this.spawnWorker(checker);
      } else {
        // Initialize checker on main thread
        checker.initialize();
      }
    });

    await Promise.all(initPromises);
  }

  /**
   * Spawn a worker for a checker
   */
  private async spawnWorker(checker: FileHealthCheckerContract): Promise<void> {
    if (!checker.workerPath) return;

    const worker = createWorker(checker.workerPath, import.meta.url, {
      workerData: { cwd: process.cwd() },
    });

    this.workers.set(checker.name, worker);

    // Create init promise
    const initPromise = new Promise<boolean>((resolve) => {
      const handler = (response: WorkerResponse) => {
        if (response.type === "initialized") {
          worker.off("message", handler);
          resolve(response.success);
        }
      };

      worker.on("message", handler);

      // Handle worker errors
      worker.on("error", (error) => {
        console.error(`Health Checker Worker Error (${checker.name}):`, error);
        resolve(false);
      });

      // Send init message
      worker.postMessage({ type: "init", config: { cwd: process.cwd() } });
    });

    this.workerInitPromises.set(checker.name, initPromise);

    // Wait for initialization
    await initPromise;
  }

  /**
   * Validate all tracked files
   */
  public async validateAllFiles(): Promise<void> {
    const allFiles = Array.from(this.files.values());
    await this.checkFiles(allFiles);

    // Display stats
    await this.displayStats();
  }

  /**
   * Check the given files with all registered checkers
   *
   * All checkers run in parallel for performance.
   * Worker-based checkers communicate via postMessage.
   * Main-thread checkers are called directly.
   */
  public async checkFiles(files: FileManager[]): Promise<void> {
    const checkPromises = this.healthCheckers.map(async (checker) => {
      if (checker.workerPath) {
        return this.runInWorker(checker.name, files);
      } else {
        return this.runInline(checker, files);
      }
    });

    const results = await Promise.all(checkPromises);

    // Display any errors/warnings
    for (const checkerResults of results) {
      for (const result of checkerResults) {
        if (!result.healthy) {
          this.displayFileResults(result);
        }
      }
    }
  }

  /**
   * Run checker in worker thread
   */
  private async runInWorker(checkerName: string, files: FileManager[]): Promise<FileCheckResult[]> {
    const worker = this.workers.get(checkerName);

    if (!worker) {
      return files.map((f) => ({
        path: f.absolutePath,
        relativePath: f.relativePath,
        healthy: true,
        errors: [],
        warnings: [],
      }));
    }

    // Wait for worker to be initialized
    const initPromise = this.workerInitPromises.get(checkerName);
    if (initPromise) {
      const success = await initPromise;
      if (!success) {
        return files.map((f) => ({
          path: f.absolutePath,
          relativePath: f.relativePath,
          healthy: true,
          errors: [],
          warnings: [],
        }));
      }
    }

    // Serialize files for worker
    const serializedFiles: SerializedFile[] = files.map((f) => ({
      path: f.absolutePath,
      content: f.source,
      relativePath: f.relativePath,
    }));

    return new Promise((resolve) => {
      const handler = (response: WorkerResponse) => {
        if (response.type === "results") {
          worker.off("message", handler);

          // Update stats
          this.updateStats(checkerName, response.results);

          resolve(response.results);
        } else if (response.type === "error") {
          worker.off("message", handler);
          resolve(
            files.map((f) => ({
              path: f.absolutePath,
              relativePath: f.relativePath,
              healthy: true,
              errors: [],
              warnings: [],
            })),
          );
        }
      };

      worker.on("message", handler);
      worker.postMessage({ type: "check", files: serializedFiles });
    });
  }

  /**
   * Run checker inline (main thread)
   */
  private async runInline(
    checker: FileHealthCheckerContract,
    files: FileManager[],
  ): Promise<FileCheckResult[]> {
    const results: FileCheckResult[] = [];

    for (const file of files) {
      const healthResult = await checker.check(file);
      const stats = healthResult.getStats();

      results.push({
        path: file.absolutePath,
        relativePath: file.relativePath,
        healthy: stats.state === "healthy",
        errors: healthResult.messages
          .filter((m) => m.type === "error")
          .map((m) => ({
            type: "error" as const,
            message: m.message,
            lineNumber: m.lineNumber,
            columnNumber: m.columnNumber,
            length: m.length || 1,
            filePath: file.absolutePath,
            relativePath: file.relativePath,
            ruleId: m.ruleId,
          })),
        warnings: healthResult.messages
          .filter((m) => m.type === "warning")
          .map((m) => ({
            type: "warning" as const,
            message: m.message,
            lineNumber: m.lineNumber,
            columnNumber: m.columnNumber,
            length: m.length || 1,
            filePath: file.absolutePath,
            relativePath: file.relativePath,
            ruleId: m.ruleId,
          })),
      });
    }

    // Update stats
    const checkerResults = results;
    this.updateStats(checker.name, checkerResults);

    return results;
  }

  /**
   * Update aggregated stats for a checker
   */
  private updateStats(checkerName: string, results: FileCheckResult[]): void {
    const stats = this.checkerStats.get(checkerName);
    if (!stats) return;

    for (const result of results) {
      stats.totalFiles++;
      if (result.healthy) {
        stats.healthyFiles++;
      } else {
        stats.defectiveFiles++;
      }
      stats.totalErrors += result.errors.length;
      stats.totalWarnings += result.warnings.length;
      if (result.errors.length > 0) stats.filesWithErrors++;
      if (result.warnings.length > 0) stats.filesWithWarnings++;
    }
  }

  /**
   * Detect when files are changed
   */
  public async onFileChanges(files: FileManager[]): Promise<void> {
    // Notify workers of file changes
    const serializedFiles: SerializedFile[] = files.map((f) => ({
      path: f.absolutePath,
      content: f.source,
      relativePath: f.relativePath,
    }));

    for (const [, worker] of this.workers) {
      worker.postMessage({ type: "fileChanges", files: serializedFiles });
    }

    // Notify inline checkers
    await Promise.all(
      this.healthCheckers.filter((c) => !c.workerPath).map((c) => c.onFileChanges(files)),
    );
  }

  /**
   * Remove files from tracking
   * Notifies both inline checkers and worker-based checkers about removed files
   */
  public removeFiles(files: FileManager[]): void {
    // Notify inline checkers
    this.healthCheckers
      .filter((c) => !c.workerPath)
      .forEach((checker) => files.forEach((file) => checker.removeFile(file)));

    // Notify workers about deleted files
    if (files.length > 0) {
      const deletedPaths = files.map((f) => ({
        path: f.absolutePath,
        relativePath: f.relativePath,
      }));

      for (const [, worker] of this.workers) {
        worker.postMessage({ type: "filesDeleted", files: deletedPaths });
      }
    }
  }

  /**
   * Display file results (errors/warnings)
   */
  private displayFileResults(result: FileCheckResult): void {
    const fileName = result.relativePath.replace(/\\/g, "/");

    // Display errors
    for (const error of result.errors) {
      const icon = colors.redBright("✖");
      const level = colors.redBright(colors.bold("ERROR"));
      console.log(
        `\n${icon} ${level} ${colors.dim("in")} ${colors.cyanBright(fileName)}${colors.dim(`(${error.lineNumber},${error.columnNumber})`)}`,
      );
      if (error.ruleId) {
        console.log(
          `  ${colors.magentaBright(error.ruleId)} ${colors.dim("→")} ${colors.red(error.message)}`,
        );
      } else {
        console.log(`  ${colors.dim("→")} ${colors.red(error.message)}`);
      }
    }

    // Display warnings
    for (const warning of result.warnings) {
      const icon = colors.yellowBright("⚠");
      const level = colors.yellowBright(colors.bold("WARNING"));
      console.log(
        `\n${icon} ${level} ${colors.dim("in")} ${colors.cyanBright(fileName)}${colors.dim(`(${warning.lineNumber},${warning.columnNumber})`)}`,
      );
      if (warning.ruleId) {
        console.log(
          `  ${colors.magentaBright(warning.ruleId)} ${colors.dim("→")} ${colors.yellow(warning.message)}`,
        );
      } else {
        console.log(`  ${colors.dim("→")} ${colors.yellow(warning.message)}`);
      }
    }
  }

  /**
   * Display stats for all health checkers
   */
  private async displayStats(): Promise<void> {
    const allStats: HealthCheckerFilesStats[] = [];

    for (const checker of this.healthCheckers) {
      const stats = this.checkerStats.get(checker.name);
      if (stats) {
        allStats.push({
          name: checker.name,
          files: {
            healthy: stats.healthyFiles,
            defective: stats.defectiveFiles,
          },
          warnings: {
            total: stats.totalWarnings,
            totalFiles: stats.filesWithWarnings,
          },
          errors: {
            total: stats.totalErrors,
            totalFiles: stats.filesWithErrors,
          },
        });
      }
    }

    console.log("\n");
    console.log(colors.bold(colors.cyan("━".repeat(80))));
    devLogInfo(colors.bold("  📊 Health Checker Statistics"));
    console.log(colors.bold(colors.cyan("━".repeat(80))));
    console.log("");

    allStats.forEach((stats: HealthCheckerFilesStats, index: number) => {
      const totalFiles = stats.files.healthy + stats.files.defective;
      const hasIssues = stats.files.defective > 0;

      // Checker name with icon
      const statusIcon = hasIssues ? "⚠️" : "✅";
      console.log(colors.bold(`  ${statusIcon}  ${stats.name}`));
      console.log(colors.dim("  " + "─".repeat(76)));

      // Files summary
      const filesLine = `     Files: ${colors.white(totalFiles.toString())} total  │  ${colors.green("✓ " + stats.files.healthy)} healthy  │  ${hasIssues ? colors.red("✗ " + stats.files.defective) : colors.dim("✗ 0")} defective`;
      console.log(filesLine);

      // Issues summary
      const warningsText =
        stats.warnings.total > 0
          ? colors.yellow(`⚠ ${stats.warnings.total} warnings`)
          : colors.dim("⚠ 0 warnings");

      const errorsText =
        stats.errors.total > 0
          ? colors.red(`✗ ${stats.errors.total} errors`)
          : colors.dim("✗ 0 errors");

      console.log(`     Issues: ${warningsText}  │  ${errorsText}`);

      // Add spacing between checkers
      if (index < allStats.length - 1) {
        console.log("");
      }
    });

    console.log("");
    console.log(colors.bold(colors.cyan("━".repeat(80))));
    console.log("");
  }

  /**
   * Shutdown all workers
   */
  public async shutdown(): Promise<void> {
    for (const [name, worker] of this.workers) {
      try {
        worker.postMessage({ type: "shutdown" });
        await worker.terminate();
      } catch {
        // Worker may already be terminated
      }
    }

    this.workers.clear();
    this.workerInitPromises.clear();
    this.checkerStats.clear();
  }
}
