import { colors } from "@mongez/copper";
import { ESLint } from "eslint";
import fs from "fs";
import path from "path";
import { FileManager } from "../../file-manager";
import { FileHealthCheckerContract } from "../file-health-checker.contract";
import { FileHealthResult } from "../file-health-result";
import { BaseHealthChecker } from "./base-health-checker";

export class EslintHealthChecker extends BaseHealthChecker implements FileHealthCheckerContract {
  /**
   * ESLint instance (using new ESLint v9 API with flat config)
   */
  private eslint: ESLint | null = null;

  /**
   * Health checker name
   */
  public name: string = "ESLint";

  /**
   * Path to dedicated worker file for ESLint checking
   * Runs in a separate thread to avoid blocking the main dev server
   */
  public workerPath: string = "./workers/eslint-health.worker";

  /**
   * Whether checker is initialized
   */
  private initialized: boolean = false;

  /**
   * Check if file is a lintable file
   */
  private isLintableFile(filePath: string): boolean {
    const ext = filePath.toLowerCase();
    return (
      ext.endsWith(".ts") || ext.endsWith(".tsx") || ext.endsWith(".js") || ext.endsWith(".jsx")
    );
  }

  /**
   * Initialize the health checker
   */
  public initialize(): EslintHealthChecker {
    try {
      // Check if eslint.config.js exists (new flat config format)
      const flatConfigPath = path.join(process.cwd(), "eslint.config.js");
      const flatConfigMjsPath = path.join(process.cwd(), "eslint.config.mjs");
      const flatConfigCjsPath = path.join(process.cwd(), "eslint.config.cjs");

      const hasFlatConfig =
        fs.existsSync(flatConfigPath) ||
        fs.existsSync(flatConfigMjsPath) ||
        fs.existsSync(flatConfigCjsPath);

      if (!hasFlatConfig) {
        // No flat config found, skip initialization
        this.initialized = true;
        return this;
      }

      // Use new ESLint v9 API with flat config
      // ESLint will automatically find eslint.config.js in the project root
      this.eslint = new ESLint({
        cwd: process.cwd(),
      });

      this.initialized = true;
    } catch (error) {
      // Handle any errors during initialization gracefully
      console.warn("ESLint Health Checker: Failed to initialize:", error);
      this.initialized = true; // Mark as initialized to prevent retries
    }

    return this;
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

    // Display errors
    if (errorCount > 0) {
      const errorMessages = result.messages.filter((m) => m.type === "error");
      for (const error of errorMessages) {
        const icon = colors.redBright("✖");
        const level = colors.redBright(colors.bold("ERROR"));
        console.log(
          `\n${icon} ${level} ${colors.dim("in")} ${colors.cyanBright(fileName)}${colors.dim(`(${error.lineNumber},${error.columnNumber})`)}`,
        );
        // Get rule ID from the error if available
        const ruleId = error.ruleId || "eslint";
        console.log(
          `  ${colors.magentaBright(ruleId)} ${colors.dim("→")} ${colors.red(error.message)}`,
        );

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
        // Get rule ID from the warning if available
        const ruleId = warning.ruleId || "eslint";
        console.log(
          `  ${colors.magentaBright(ruleId)} ${colors.dim("→")} ${colors.yellow(warning.message)}`,
        );

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
  }

  /**
   * Validate the health of the file
   */
  public async validate(file: FileManager, result: FileHealthResult): Promise<FileHealthResult> {
    // Early exit: skip non-lintable files
    if (!this.isLintableFile(file.absolutePath)) {
      result.markAsHealthy();
      return result;
    }

    // Early exit: check if ESLint is available
    if (!this.eslint) {
      result.markAsHealthy();
      return result;
    }

    try {
      // Use lintText to lint the source code directly from FileManager
      // This ensures we always use the latest content
      const lintResults = await this.eslint.lintText(file.source, {
        filePath: file.absolutePath,
      });

      if (lintResults.length === 0) {
        console.log("No lint results", file.relativePath);
        result.markAsHealthy();
        return result;
      }

      const lintResult = lintResults[0];

      // Convert ESLint messages to FileHealthResult format
      const errors: Array<{
        message: string;
        type: "error";
        lineNumber: number;
        columnNumber: number;
        length: number;
        ruleId?: string;
      }> = [];
      const warnings: Array<{
        message: string;
        type: "warning";
        lineNumber: number;
        columnNumber: number;
        length: number;
        ruleId?: string;
      }> = [];

      for (const message of lintResult.messages) {
        const isError = message.severity === 2;
        const isWarning = message.severity === 1;

        if (isError) {
          errors.push({
            message: message.message,
            type: "error",
            lineNumber: message.line || 1,
            columnNumber: message.column || 1,
            length: message.endColumn && message.column ? message.endColumn - message.column : 1,
            ruleId: message.ruleId || undefined,
          });
        } else if (isWarning) {
          warnings.push({
            message: message.message,
            type: "warning",
            lineNumber: message.line || 1,
            columnNumber: message.column || 1,
            length: message.endColumn && message.column ? message.endColumn - message.column : 1,
            ruleId: message.ruleId || undefined,
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
      console.log("ESlint Error:", error);
      result.markAsHealthy(); // Return healthy on error to avoid blocking
    }

    return result;
  }
}
