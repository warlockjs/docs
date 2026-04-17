/**
 * TypeScript Health Check Worker
 *
 * This worker runs in a dedicated thread to perform TypeScript type checking
 * without blocking the main dev server thread. It maintains a persistent
 * ts.Program instance for fast incremental type checking.
 *
 * Communication:
 * - Receives: { type: 'init' | 'check' | 'fileChanges' | 'shutdown', ... }
 * - Sends: { type: 'results' | 'initialized' | 'error', ... }
 */
import ts from "typescript";
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
 * Diagnostic message sent back to main thread
 */
type DiagnosticMessage = {
  type: "error" | "warning";
  message: string;
  lineNumber: number;
  columnNumber: number;
  length: number;
  filePath: string;
  relativePath: string;
};

/**
 * Health check result for a single file
 */
type FileCheckResult = {
  path: string;
  relativePath: string;
  healthy: boolean;
  errors: DiagnosticMessage[];
  warnings: DiagnosticMessage[];
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
  | { type: "init"; config: { cwd: string; tsconfigPath?: string } }
  | { type: "check"; files: SerializedFile[] }
  | { type: "fileChanges"; files: SerializedFile[] }
  | { type: "filesDeleted"; files: DeletedFile[] }
  | { type: "shutdown" };

/**
 * Messages sent to main thread
 */
type WorkerResponse =
  | { type: "initialized"; success: boolean; error?: string }
  | { type: "results"; results: FileCheckResult[] }
  | { type: "error"; message: string };

/**
 * TypeScript Health Worker class
 * Maintains persistent ts.Program for incremental type checking
 */
class TypeScriptHealthWorker {
  /**
   * Cached TypeScript program instance
   */
  private program: ts.Program | null = null;

  /**
   * Parsed TypeScript configuration
   */
  private parsedConfig: ts.ParsedCommandLine | null = null;

  /**
   * In-memory file contents cache
   */
  private fileContents = new Map<string, string>();

  /**
   * Whether the worker is initialized
   */
  private initialized = false;

  /**
   * Current working directory
   */
  private cwd: string = process.cwd();

  /**
   * Initialize the worker with TypeScript configuration
   */
  public initialize(config: { cwd: string; tsconfigPath?: string }): boolean {
    try {
      this.cwd = config.cwd || process.cwd();

      // Try to load tsconfig.json
      const tsconfigPath = config.tsconfigPath || ts.findConfigFile(this.cwd, ts.sys.fileExists);

      if (!tsconfigPath) {
        this.initialized = true;
        return true; // No tsconfig, will skip type checking
      }

      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

      if (configFile.error) {
        console.warn("TypeScript Worker: Error reading tsconfig:", configFile.error);
        this.initialized = true;
        return true;
      }

      this.parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, this.cwd);

      if (this.parsedConfig.errors.length > 0) {
        console.warn("TypeScript Worker: tsconfig has errors:", this.parsedConfig.errors);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("TypeScript Worker: Failed to initialize:", error);
      this.initialized = true;
      return false;
    }
  }

  /**
   * Check files for TypeScript errors
   */
  public checkFiles(files: SerializedFile[]): FileCheckResult[] {
    if (!this.parsedConfig) {
      // No config, return all files as healthy
      return files.map((file) => ({
        path: file.path,
        relativePath: file.relativePath,
        healthy: true,
        errors: [],
        warnings: [],
      }));
    }

    // Update in-memory file cache
    for (const file of files) {
      this.fileContents.set(file.path, file.content);
    }

    // Create or update the program (incremental)
    this.program = ts.createProgram(
      Array.from(this.fileContents.keys()),
      this.parsedConfig.options,
      this.createCompilerHost(),
      this.program || undefined, // Pass old program for incremental compilation
    );

    // Check each file
    const results: FileCheckResult[] = [];

    for (const file of files) {
      const result = this.checkSingleFile(file);
      results.push(result);
    }

    return results;
  }

  /**
   * Handle file changes (update program incrementally)
   */
  public handleFileChanges(files: SerializedFile[]): void {
    for (const file of files) {
      this.fileContents.set(file.path, file.content);
    }

    // Recreate program with new file contents
    if (this.parsedConfig && this.program) {
      this.program = ts.createProgram(
        Array.from(this.fileContents.keys()),
        this.parsedConfig.options,
        this.createCompilerHost(),
        this.program || undefined,
      );
    }
  }

  /**
   * Handle deleted files (remove from cache)
   */
  public handleFilesDeleted(files: DeletedFile[]): void {
    let hasChanges = false;

    for (const file of files) {
      if (this.fileContents.has(file.path)) {
        this.fileContents.delete(file.path);
        hasChanges = true;
      }
    }

    // Recreate program without deleted files
    if (hasChanges && this.parsedConfig) {
      this.program = ts.createProgram(
        Array.from(this.fileContents.keys()),
        this.parsedConfig.options,
        this.createCompilerHost(),
        this.program || undefined,
      );
    }
  }

  /**
   * Check a single file for diagnostics
   */
  private checkSingleFile(file: SerializedFile): FileCheckResult {
    if (!this.program) {
      return {
        path: file.path,
        relativePath: file.relativePath,
        healthy: true,
        errors: [],
        warnings: [],
      };
    }

    const sourceFile = this.program.getSourceFile(file.path);

    if (!sourceFile) {
      return {
        path: file.path,
        relativePath: file.relativePath,
        healthy: true,
        errors: [],
        warnings: [],
      };
    }

    const syntacticDiagnostics = this.program.getSyntacticDiagnostics(sourceFile);
    const semanticDiagnostics = this.program.getSemanticDiagnostics(sourceFile);
    const allDiagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];

    const errors: DiagnosticMessage[] = [];
    const warnings: DiagnosticMessage[] = [];

    for (const diagnostic of allDiagnostics) {
      const message = this.formatDiagnostic(diagnostic, file);

      if (diagnostic.category === ts.DiagnosticCategory.Error) {
        errors.push(message);
      } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
        warnings.push(message);
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
   * Format a TypeScript diagnostic into our message format
   */
  private formatDiagnostic(diagnostic: ts.Diagnostic, file: SerializedFile): DiagnosticMessage {
    let lineNumber = 1;
    let columnNumber = 1;
    let length = 1;

    if (diagnostic.file && diagnostic.start !== undefined) {
      const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      lineNumber = pos.line + 1;
      columnNumber = pos.character + 1;
      length = diagnostic.length || 1;
    }

    const messageText =
      typeof diagnostic.messageText === "string"
        ? diagnostic.messageText
        : diagnostic.messageText.messageText;

    return {
      type: diagnostic.category === ts.DiagnosticCategory.Error ? "error" : "warning",
      message: messageText,
      lineNumber,
      columnNumber,
      length,
      filePath: file.path,
      relativePath: file.relativePath,
    };
  }

  /**
   * Create a custom compiler host that reads from in-memory cache
   */
  private createCompilerHost(): ts.CompilerHost {
    const defaultHost = ts.createCompilerHost(this.parsedConfig?.options || {});

    return {
      ...defaultHost,
      readFile: (fileName: string) => {
        // Check in-memory cache first
        if (this.fileContents.has(fileName)) {
          return this.fileContents.get(fileName);
        }
        // Fall back to disk
        return defaultHost.readFile(fileName);
      },
      fileExists: (fileName: string) => {
        if (this.fileContents.has(fileName)) {
          return true;
        }
        return defaultHost.fileExists(fileName);
      },
    };
  }
}

// Create worker instance
const worker = new TypeScriptHealthWorker();

// Handle messages from main thread
parentPort?.on("message", (message: WorkerMessage) => {
  try {
    switch (message.type) {
      case "init": {
        const success = worker.initialize(message.config);
        const response: WorkerResponse = { type: "initialized", success };
        parentPort?.postMessage(response);
        break;
      }

      case "check": {
        const results = worker.checkFiles(message.files);
        const response: WorkerResponse = { type: "results", results };
        parentPort?.postMessage(response);
        break;
      }

      case "fileChanges": {
        worker.handleFileChanges(message.files);
        break;
      }

      case "filesDeleted": {
        worker.handleFilesDeleted(message.files);
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
