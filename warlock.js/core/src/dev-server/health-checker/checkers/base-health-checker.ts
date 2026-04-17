import type { FileManager } from "../../file-manager";
import type {
  FileHealthCheckerContract,
  HealthCheckerFilesStats,
} from "../file-health-checker.contract";
import { FileHealthResult } from "../file-health-result";

type CheckerFile = {
  file: FileManager;
  healthResult: FileHealthResult;
};

export abstract class BaseHealthChecker implements FileHealthCheckerContract {
  /**
   * List of checked files
   */
  protected files: Map<string, CheckerFile> = new Map();

  /**
   * Health checker name (unique identifier)
   */
  public abstract name: string;

  /**
   * Path to worker file (without extension)
   *
   * If provided, the checker runs in a dedicated worker thread.
   * If undefined, the checker runs in the main thread.
   *
   * @see FileHealthCheckerContract.workerPath
   */
  public workerPath?: string;

  /**
   * Initialize the health checker
   */
  public abstract initialize(): void;

  /**
   * Detect when files are changed
   */
  public async onFileChanges(files: FileManager[]): Promise<void> {
    //
  }

  /**
   * Remove the given file from the checker
   */
  public removeFile(file: FileManager): BaseHealthChecker {
    this.files.delete(file.relativePath);
    return this;
  }

  /**
   * Validate the health of the file
   */
  public async check(file: FileManager): Promise<FileHealthResult> {
    const result = new FileHealthResult();

    this.files.set(file.relativePath, {
      file,
      healthResult: result,
    });

    return await this.validate(file, result);
  }

  /**
   * Validate the health of the file
   */
  public abstract validate(file: FileManager, result: FileHealthResult): Promise<FileHealthResult>;

  /**
   * Get the stats of the health checker
   */
  public async stats(): Promise<HealthCheckerFilesStats> {
    const result: HealthCheckerFilesStats = {
      name: this.name,
      files: {
        healthy: 0,
        defective: 0,
      },
      warnings: {
        total: 0,
        totalFiles: 0,
      },
      errors: {
        total: 0,
        totalFiles: 0,
      },
    };

    for (const file of this.files.values()) {
      const healthResult = file.healthResult;
      const stats = healthResult.getStats();
      const isHealthy = stats.state === "healthy";
      result.files.healthy += isHealthy ? 1 : 0;
      result.files.defective += !isHealthy ? 1 : 0;
      result.warnings.total += stats.warnings;
      result.warnings.totalFiles += stats.warnings > 0 ? 1 : 0;
      result.errors.total += stats.errors;
      result.errors.totalFiles += stats.errors > 0 ? 1 : 0;
    }

    return result;
  }
}
