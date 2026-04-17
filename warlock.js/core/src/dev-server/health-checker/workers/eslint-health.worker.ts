/**
 * ESLint Health Check Worker
 *
 * This worker runs in a dedicated thread to perform ESLint linting
 * without blocking the main dev server thread. It maintains a persistent
 * ESLint instance for efficient linting.
 *
 * Communication:
 * - Receives: { type: 'init' | 'check' | 'shutdown', ... }
 * - Sends: { type: 'results' | 'initialized' | 'error', ... }
 */
import { ESLint } from "eslint";
import fs from "fs";
import path from "path";
import { parentPort, workerData } from "worker_threads";

/**
 * Serialized file data received from main thread
 */
type SerializedFile = {
  /** Absolute file path */
  path: string;
  /** File content (source code) */
  content: string;
  /** Relative path for display */
  relativePath: string;
};

/**
 * Lint message sent back to main thread
 */
type LintMessage = {
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
 * Health check result for a single file
 */
type FileCheckResult = {
  path: string;
  relativePath: string;
  healthy: boolean;
  errors: LintMessage[];
  warnings: LintMessage[];
};

/**
 * Messages received from main thread
 */
/**
 * Deleted file info
 */
type DeletedFile = {
  path: string;
  relativePath: string;
};

/**
 * Messages received from main thread
 */
type WorkerMessage =
  | { type: "init"; config: { cwd: string } }
  | { type: "check"; files: SerializedFile[] }
  | { type: "filesDeleted"; files: DeletedFile[] }
  | { type: "shutdown" };

/**
 * Messages sent to main thread
 */
type WorkerResponse =
  | { type: "initialized"; success: boolean; hasConfig: boolean; error?: string }
  | { type: "results"; results: FileCheckResult[] }
  | { type: "error"; message: string };

/**
 * ESLint Health Worker class
 * Maintains persistent ESLint instance for efficient linting
 */
class ESLintHealthWorker {
  /**
   * ESLint instance
   */
  private eslint: ESLint | null = null;

  /**
   * Whether the worker is initialized
   */
  private initialized = false;

  /**
   * Whether ESLint config was found
   */
  private hasConfig = false;

  /**
   * Current working directory
   */
  private cwd: string = process.cwd();

  /**
   * Initialize the worker with ESLint configuration
   */
  public initialize(config: { cwd: string }): { success: boolean; hasConfig: boolean } {
    try {
      this.cwd = config.cwd || process.cwd();

      // Check if ESLint flat config exists
      const flatConfigPath = path.join(this.cwd, "eslint.config.js");
      const flatConfigMjsPath = path.join(this.cwd, "eslint.config.mjs");
      const flatConfigCjsPath = path.join(this.cwd, "eslint.config.cjs");

      this.hasConfig =
        fs.existsSync(flatConfigPath) ||
        fs.existsSync(flatConfigMjsPath) ||
        fs.existsSync(flatConfigCjsPath);

      if (!this.hasConfig) {
        this.initialized = true;
        return { success: true, hasConfig: false };
      }

      // Create ESLint instance with flat config
      this.eslint = new ESLint({
        cwd: this.cwd,
      });

      this.initialized = true;
      return { success: true, hasConfig: true };
    } catch (error) {
      console.error("ESLint Worker: Failed to initialize:", error);
      this.initialized = true;
      return { success: false, hasConfig: false };
    }
  }

  /**
   * Check files for ESLint errors
   */
  public async checkFiles(files: SerializedFile[]): Promise<FileCheckResult[]> {
    if (!this.eslint || !this.hasConfig) {
      // No ESLint config, return all files as healthy
      return files.map((file) => ({
        path: file.path,
        relativePath: file.relativePath,
        healthy: true,
        errors: [],
        warnings: [],
      }));
    }

    const results: FileCheckResult[] = [];

    for (const file of files) {
      // Only lint lintable files
      if (!this.isLintableFile(file.path)) {
        results.push({
          path: file.path,
          relativePath: file.relativePath,
          healthy: true,
          errors: [],
          warnings: [],
        });
        continue;
      }

      try {
        const result = await this.checkSingleFile(file);
        results.push(result);
      } catch (error) {
        // On error, mark as healthy to avoid blocking
        results.push({
          path: file.path,
          relativePath: file.relativePath,
          healthy: true,
          errors: [],
          warnings: [],
        });
      }
    }

    return results;
  }

  /**
   * Check a single file for lint issues
   */
  private async checkSingleFile(file: SerializedFile): Promise<FileCheckResult> {
    if (!this.eslint) {
      return {
        path: file.path,
        relativePath: file.relativePath,
        healthy: true,
        errors: [],
        warnings: [],
      };
    }

    // Use lintText to lint from memory (not disk)
    const lintResults = await this.eslint.lintText(file.content, {
      filePath: file.path,
    });

    if (lintResults.length === 0) {
      return {
        path: file.path,
        relativePath: file.relativePath,
        healthy: true,
        errors: [],
        warnings: [],
      };
    }

    const lintResult = lintResults[0];
    const errors: LintMessage[] = [];
    const warnings: LintMessage[] = [];

    for (const message of lintResult.messages) {
      const lintMessage: LintMessage = {
        type: message.severity === 2 ? "error" : "warning",
        message: message.message,
        lineNumber: message.line || 1,
        columnNumber: message.column || 1,
        length: message.endColumn && message.column ? message.endColumn - message.column : 1,
        filePath: file.path,
        relativePath: file.relativePath,
        ruleId: message.ruleId || undefined,
      };

      if (message.severity === 2) {
        errors.push(lintMessage);
      } else if (message.severity === 1) {
        warnings.push(lintMessage);
      }
    }

    return {
      path: file.path,
      relativePath: file.relativePath,
      healthy: errors.length === 0 && warnings.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if file is a lintable file
   */
  private isLintableFile(filePath: string): boolean {
    const ext = filePath.toLowerCase();
    return (
      ext.endsWith(".ts") || ext.endsWith(".tsx") || ext.endsWith(".js") || ext.endsWith(".jsx")
    );
  }
}

// Create worker instance
const worker = new ESLintHealthWorker();

// Handle messages from main thread
parentPort?.on("message", async (message: WorkerMessage) => {
  try {
    switch (message.type) {
      case "init": {
        const initResult = worker.initialize(message.config);
        const response: WorkerResponse = {
          type: "initialized",
          success: initResult.success,
          hasConfig: initResult.hasConfig,
        };
        parentPort?.postMessage(response);
        break;
      }

      case "check": {
        const results = await worker.checkFiles(message.files);
        const response: WorkerResponse = { type: "results", results };
        parentPort?.postMessage(response);
        break;
      }

      case "filesDeleted": {
        // ESLint doesn't maintain internal file cache (lints from memory)
        // No cleanup needed, just acknowledge
        break;
      }

      case "shutdown": {
        process.exit(0);
      }
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    };
    parentPort?.postMessage(response);
  }
});

// Handle initialization from workerData if provided
if (workerData?.autoInit) {
  worker.initialize({ cwd: workerData.cwd || process.cwd() });
}
