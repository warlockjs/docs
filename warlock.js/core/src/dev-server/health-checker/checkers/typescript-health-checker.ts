import { colors } from "@mongez/copper";
import ts from "typescript";
import { FileManager } from "../../file-manager";
import { tsconfigManager } from "../../tsconfig-manager";
import { FileHealthCheckerContract } from "../file-health-checker.contract";
import { FileHealthResult } from "../file-health-result";
import { BaseHealthChecker } from "./base-health-checker";

export class TypescriptHealthChecker
  extends BaseHealthChecker
  implements FileHealthCheckerContract
{
  /**
   * Cached TypeScript program instance
   */
  private program: ts.Program | null = null;

  /**
   * Cached parsed TypeScript configuration
   */
  private parsedConfig: ts.ParsedCommandLine | null = null;

  /**
   * Health checker name
   */
  public name: string = "TypeScript";

  /**
   * Path to dedicated worker file for TypeScript checking
   * Runs in a separate thread to avoid blocking the main dev server
   */
  public workerPath: string = "./workers/ts-health.worker";

  /**
   * Whether checker is initialized
   */
  private initialized: boolean = false;

  /**
   * Check if file is a TypeScript file
   */
  private isTypeScriptFile(filePath: string): boolean {
    const ext = filePath.toLowerCase();
    return ext.endsWith(".ts") || ext.endsWith(".tsx");
  }

  /**
   * Extract line and column from diagnostic location
   */
  private getDiagnosticLocation(diagnostic: ts.Diagnostic): {
    lineNumber: number;
    columnNumber: number;
  } {
    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return {
        lineNumber: line + 1, // TypeScript uses 0-based, we use 1-based
        columnNumber: character + 1,
      };
    }
    return {
      lineNumber: 1,
      columnNumber: 1,
    };
  }

  /**
   * Format diagnostic message
   */
  private formatDiagnosticMessage(diagnostic: ts.Diagnostic): string {
    if (diagnostic.file && diagnostic.start !== undefined) {
      return ts.formatDiagnostic(diagnostic, {
        getCurrentDirectory: () => process.cwd(),
        getCanonicalFileName: (fileName) => fileName,
        getNewLine: () => "\n",
      });
    }
    return diagnostic.messageText.toString();
  }

  /**
   * Display health check results in a pretty format
   */
  private displayResults(file: FileManager, result: FileHealthResult): void {
    const stats = result.getStats();

    // Only display if there are errors or warnings
    if (stats.errors === 0 && stats.warnings === 0) {
      return;
    }

    const fileName = file.relativePath.replace(/\\/g, "/");
    const errorCount = stats.errors;
    const warningCount = stats.warnings;
    const sourceLines = file.source ? file.source.split("\n") : [];

    // Display header
    // console.log(
    //   `\n${colors.dim("╭─")} ${colors.bold(colors.cyanBright("TypeScript Health"))} ${colors.dim("→")} ${colors.cyan(fileName)}`,
    // );

    // Display errors
    if (errorCount > 0) {
      const errorMessages = result.messages.filter((m) => m.type === "error");
      for (const error of errorMessages) {
        const icon = colors.redBright("✖");
        const level = colors.redBright(colors.bold("ERROR"));
        console.log(
          `\n${icon} ${level} ${colors.dim("in")} ${colors.cyanBright(fileName)}${colors.dim(`(${error.lineNumber},${error.columnNumber})`)}`,
        );
        // Extract just the message text (remove file path prefix if present)
        const messageLines = error.message.split("\n");
        const cleanMessage = messageLines
          .map((line) => line.replace(/^[^:]+:\d+:\d+ - /, "").trim())
          .filter((line) => line.length > 0)
          .join("\n");
        console.log(`  ${colors.dim("→")} ${colors.red(cleanMessage)}`);

        // Display code line with underline indicator
        if (
          sourceLines.length > 0 &&
          error.lineNumber > 0 &&
          error.lineNumber <= sourceLines.length
        ) {
          const lineIndex = error.lineNumber - 1; // Convert to 0-based index
          const lineContent = sourceLines[lineIndex];
          const lineNum = error.lineNumber.toString().padStart(4, " ");
          const errorLength = error.length || 1;
          const columnIndex = error.columnNumber - 1; // Convert to 0-based index

          // Display the line with normal color (not all red)
          console.log(`  ${colors.dim(lineNum)} ${colors.dim("│")} ${lineContent || ""}`);

          // Display underline indicator
          // Padding accounts for: lineNum.length + 1 space + 1 (│) + 1 space = lineNum.length + 3
          // (The initial 2 spaces indent is already in the console.log)
          const prefixPadding = lineNum.length + 3;
          const columnPadding = " ".repeat(columnIndex);
          const underline = colors.redBright("~".repeat(Math.max(1, errorLength)));
          console.log(`  ${colors.dim(" ".repeat(prefixPadding))}${columnPadding}${underline}`);
        }
      }
    }

    // Display warnings
    if (warningCount > 0) {
      const warningMessages = result.messages.filter((m) => m.type === "warning");
      for (const warning of warningMessages) {
        const icon = colors.yellowBright("⚠");
        const level = colors.yellowBright(colors.bold("WARNING"));
        console.log(
          `\n${icon} ${level} ${colors.dim("in")} ${colors.cyanBright(fileName)}${colors.dim(`(${warning.lineNumber},${warning.columnNumber})`)}`,
        );
        // Extract just the message text (remove file path prefix if present)
        const messageLines = warning.message.split("\n");
        const cleanMessage = messageLines
          .map((line) => line.replace(/^[^:]+:\d+:\d+ - /, "").trim())
          .filter((line) => line.length > 0)
          .join("\n");
        console.log(`  ${colors.dim("→")} ${colors.yellow(cleanMessage)}`);

        // Display code line with underline indicator
        if (
          sourceLines.length > 0 &&
          warning.lineNumber > 0 &&
          warning.lineNumber <= sourceLines.length
        ) {
          const lineIndex = warning.lineNumber - 1; // Convert to 0-based index
          const lineContent = sourceLines[lineIndex];
          const lineNum = warning.lineNumber.toString().padStart(4, " ");
          const warningLength = warning.length || 1;
          const columnIndex = warning.columnNumber - 1; // Convert to 0-based index

          // Display the line with normal color (not all yellow)
          console.log(`  ${colors.dim(lineNum)} ${colors.dim("│")} ${lineContent || ""}`);

          // Display underline indicator
          // Padding accounts for: lineNum.length + 1 space + 1 (│) + 1 space = lineNum.length + 3
          // (The initial 2 spaces indent is already in the console.log)
          const prefixPadding = lineNum.length + 3;
          const columnPadding = " ".repeat(columnIndex);
          const underline = colors.yellowBright("~".repeat(Math.max(1, warningLength)));
          console.log(`  ${colors.dim(" ".repeat(prefixPadding))}${columnPadding}${underline}`);
        }
      }
    }

    // Display summary
    const summary = [];
    if (errorCount > 0) {
      summary.push(colors.red(`${errorCount} error${errorCount > 1 ? "s" : ""}`));
    }
    if (warningCount > 0) {
      summary.push(colors.yellow(`${warningCount} warning${warningCount > 1 ? "s" : ""}`));
    }

    // console.log(
    //   `\n${colors.dim("╰─")} ${colors.bold("TypeScript")} ${colors.dim("→")} ${summary.join(colors.dim(" and "))}`,
    // );
  }

  /**
   * Detect when files are changed
   */
  public async onFileChanges(files: FileManager[]): Promise<void> {
    // recreate an incremental program
    if (!this.parsedConfig) {
      return;
    }

    this.program = ts.createProgram(
      files.map((file) => file.absolutePath),
      {
        ...this.parsedConfig.options,
        incremental: true,
      },
      undefined,
      this.program!,
    );
  }

  /**
   * Initialize the health checker
   */
  public initialize(): TypescriptHealthChecker {
    try {
      // Verify tsconfigManager is initialized and has config
      if (!tsconfigManager.tsconfig || Object.keys(tsconfigManager.tsconfig).length === 0) {
        this.initialized = true;
        return this;
      }

      // Parse the config using tsconfigManager's cached config
      this.parsedConfig = ts.parseJsonConfigFileContent(
        tsconfigManager.tsconfig,
        ts.sys,
        process.cwd(),
      );

      // Check for config errors
      if (this.parsedConfig.errors.length > 0) {
        // Log config errors but continue (will skip validation)
        console.warn(
          "TypeScript Health Checker: tsconfig.json has errors:",
          this.parsedConfig.errors.map((e) => ts.formatDiagnostic(e, ts.createCompilerHost({}))),
        );
      }

      this.program = ts.createProgram(this.parsedConfig.fileNames, this.parsedConfig.options);

      this.initialized = true;
    } catch (error) {
      // Handle any errors during initialization gracefully
      console.warn("TypeScript Health Checker: Failed to initialize:", error);
      this.initialized = true; // Mark as initialized to prevent retries
    }

    return this;
  }

  /**
   * Validate the health of the file
   */
  public async validate(file: FileManager, result: FileHealthResult): Promise<FileHealthResult> {
    // Early exit: skip non-TypeScript files
    if (!this.isTypeScriptFile(file.absolutePath)) {
      result.markAsHealthy();
      return result;
    }

    // Early exit: check if parsed config is available
    if (!this.parsedConfig) {
      result.markAsHealthy();
      return result;
    }

    try {
      // Lazy-load program on first validation if not already created
      if (!this.program) {
        // Create program with all project files from parsed config (for proper type checking)
        this.program = ts.createProgram(this.parsedConfig.fileNames, this.parsedConfig.options);
      }

      // Get source file from program
      const sourceFile = this.program.getSourceFile(file.absolutePath);

      // If file is not in the program, return healthy (might be excluded)
      if (!sourceFile) {
        result.markAsHealthy();
        return result;
      }

      // Get diagnostics for the specific file only
      const syntacticDiagnostics = this.program.getSyntacticDiagnostics(sourceFile);
      const semanticDiagnostics = this.program.getSemanticDiagnostics(sourceFile);

      // Combine all diagnostics
      const allDiagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];

      // Convert TypeScript diagnostics to FileHealthResult format
      const errors: Array<{
        message: string;
        type: "error";
        lineNumber: number;
        columnNumber: number;
        length: number;
      }> = [];
      const warnings: Array<{
        message: string;
        type: "warning";
        lineNumber: number;
        columnNumber: number;
        length: number;
      }> = [];

      for (const diagnostic of allDiagnostics) {
        const location = this.getDiagnosticLocation(diagnostic);
        const message = this.formatDiagnosticMessage(diagnostic);
        const errorLength = diagnostic.length || 1;

        if (diagnostic.category === ts.DiagnosticCategory.Error) {
          errors.push({
            message,
            type: "error",
            lineNumber: location.lineNumber,
            columnNumber: location.columnNumber,
            length: errorLength,
          });
        } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
          warnings.push({
            message,
            type: "warning",
            lineNumber: location.lineNumber,
            columnNumber: location.columnNumber,
            length: errorLength,
          });
        }
      }

      // Add errors and warnings to result
      if (errors.length > 0) {
        result.addErrors(errors);
      }
      if (warnings.length > 0) {
        result.addWarnings(warnings);
      }

      // If no errors or warnings, mark as healthy
      if (errors.length === 0 && warnings.length === 0) {
        result.markAsHealthy();
      } else {
        // Display results if there are errors or warnings
        this.displayResults(file, result);
      }
    } catch (error) {
      // Handle any errors during validation gracefully
      console.warn(`TypeScript Health Checker: Error validating file ${file.relativePath}:`, error);
      result.markAsHealthy(); // Return healthy on error to avoid blocking
    }

    return result;
  }
}
