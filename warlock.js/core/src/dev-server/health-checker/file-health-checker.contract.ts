import { type FileManager } from "../file-manager";
import { type FileHealthResult } from "./file-health-result";

export type HealthCheckerFilesStats = {
  name: string;
  files: {
    healthy: number;
    defective: number;
  };
  warnings: {
    total: number;
    totalFiles: number;
  };
  errors: {
    total: number;
    totalFiles: number;
  };
};

export interface FileHealthCheckerContract {
  /**
   * Health checker name (unique identifier)
   */
  name: string;

  /**
   * Path to worker file (without extension)
   *
   * If provided, the checker runs in a dedicated worker thread.
   * If undefined, the checker runs in the main thread.
   *
   * The path should be relative to the checker's location, without file extension.
   * The system automatically handles:
   * - `.ts` extension in development (with tsx loader)
   * - `.js` extension in production (compiled)
   *
   * @example "./workers/ts-health.worker"
   */
  workerPath?: string;

  /**
   * Initialize the health checker
   * Called once on startup (before any checks run)
   */
  initialize(): void;

  /**
   * Detect when files are changed
   */
  onFileChanges(files: FileManager[]): Promise<void>;

  /**
   * Remove the given file from the checker
   */
  removeFile(file: FileManager): void;

  /**
   * Validate the health of the file
   */
  check(file: FileManager): Promise<FileHealthResult>;

  /**
   * @TODO: update it to display the entire health stats of the checker
   */
  stats(): Promise<HealthCheckerFilesStats>;
}
