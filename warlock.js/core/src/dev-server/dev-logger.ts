import { colors } from "@mongez/copper";
import dayjs from "dayjs";
import { Path } from "./path";

/**
 * Dev server logger with Vite-like formatting
 */

// Timestamp formatter
function timestamp(): string {
  return colors.dim(`${dayjs().format("HH:mm:ss A")}`);
}

// Main log function
export function devLog(message: string) {
  console.log(`${timestamp()} ${message}`);
}

// Success log (green checkmark)
export function devLogSuccess(message: string) {
  console.log(`${timestamp()} ${colors.green("✓")} ${colors.green(message)}`);
}

// Error log (red X)
export function devLogError(message: string, error?: any) {
  console.log(`${timestamp()} ${colors.red("✗")} ${colors.red(message)}`);
  if (error && error.stack) {
    // Clean up error stack to show relative paths
    const cleanStack = cleanErrorStack(error.stack);
    console.log(colors.dim(cleanStack));
  }
}

// Warning log (yellow)
export function devLogWarn(message: string) {
  console.log(`${timestamp()} ${colors.yellow("⚠")} ${colors.yellow(message)}`);
}

// Info log (cyan)
export function devLogInfo(message: string) {
  console.log(`${timestamp()} ${colors.cyan(message)}`);
}

// Dim log (for less important info)
export function devLogDim(message: string) {
  console.log(`${timestamp()} ${colors.dim(message)}`);
}

// HMR update log (like Vite)
export function devLogHMR(file: string, dependents?: number) {
  const relativePath = Path.toRelative(file);
  const depInfo = dependents
    ? colors.dim(` +${dependents} module${dependents > 1 ? "s" : ""}`)
    : "";
  // console.log(`${timestamp()} ✨ ${colors.green("hmr update")}✨ ${colors.dim(relativePath)}${depInfo}`);
  console.log(
    `${timestamp()} 🔥 ${colors.green("hmr update")} ${colors.dim(relativePath)}${depInfo}`,
  );
}

// FSR log
export function devLogFSR(reason: string) {
  console.log(`${timestamp()} ${colors.yellow("full restart")} ${colors.dim(reason)}`);
}

// Config reload log
export function devLogConfig(file: string, connectors?: string[]) {
  const relativePath = Path.toRelative(file);
  const connectorInfo =
    connectors && connectors.length > 0 ? colors.dim(` → restarting ${connectors.join(", ")}`) : "";
  console.log(
    `${timestamp()} ${colors.cyan("config reload")} ${colors.dim(relativePath)}${connectorInfo}`,
  );
}

// Ready log (like Vite's ready message)
export function devLogReady(message: string) {
  console.log(`\n${timestamp()}  ${colors.green("➜")}  ${colors.bold(message)}`);
}

// Section header
export function devLogSection(title: string) {
  console.log(`\n${timestamp()} ${colors.bold(colors.cyan(title))}`);
}

// Clean error stack to show relative paths instead of absolute cache paths
function cleanErrorStack(stack: string): string {
  const lines = stack.split("\n");
  const cleaned = lines.map((line) => {
    // Replace absolute cache paths with relative source paths
    // Pattern: D:\...\dev-server\.warlock\cache\src-app-users-main.js
    // Replace with: src/app/users/main.ts

    let cleanedLine = line;

    // Remove cache directory references
    cleanedLine = cleanedLine.replace(/\.warlock[\\\/]cache[\\\/]/g, "");

    // Convert cache file names back to source paths
    // src-app-users-main.js → src/app/users/main.ts
    cleanedLine = cleanedLine.replace(/([a-zA-Z0-9_-]+(?:-[a-zA-Z0-9_-]+)+)\.js/g, (match, p1) => {
      const sourcePath = p1.replace(/-/g, "/") + ".ts";
      return sourcePath;
    });

    // Make paths relative
    try {
      const absolutePathMatch = cleanedLine.match(/([A-Z]:\\[^:]+|\/[^:]+)(?=:|\))/);
      if (absolutePathMatch) {
        const absolutePath = absolutePathMatch[1];
        const relativePath = Path.toRelative(absolutePath);
        cleanedLine = cleanedLine.replace(absolutePath, relativePath);
      }
    } catch {
      // If path conversion fails, keep original
    }

    return cleanedLine;
  });

  return cleaned.join("\n");
}

// Format module not found errors with enhanced context
export function formatModuleNotFoundError(error: Error, suggestions?: string[]): string {
  const message = error.message;

  // Extract paths from error message
  // Pattern: Cannot find module 'D:\...\cache\src-app-users-utils.js' imported from 'D:\...\main.js'
  const match = message.match(/Cannot find module '([^']+)' imported from '([^']+)'/);

  if (match) {
    const [, modulePath, importerPath] = match;

    // Convert cache paths to source paths
    const cleanModulePath = modulePath
      .replace(/\.warlock[\\\/]cache[\\\/]/, "")
      .replace(
        /([a-zA-Z0-9_-]+(?:-[a-zA-Z0-9_-]+)+)\.js/,
        (m, p1) => p1.replace(/-/g, "/") + ".ts",
      );

    const cleanImporterPath = importerPath
      .replace(/\.warlock[\\\/]cache[\\\/]/, "")
      .replace(
        /([a-zA-Z0-9_-]+(?:-[a-zA-Z0-9_-]+)+)\.js/,
        (m, p1) => p1.replace(/-/g, "/") + ".ts",
      );

    // Make paths relative
    const relativeModule = Path.toRelative(cleanModulePath);
    const relativeImporter = Path.toRelative(cleanImporterPath);

    // Build formatted message
    const lines: string[] = [
      "",
      `${colors.red("❌ MODULE NOT FOUND")}`,
      "",
      `${colors.dim("Cannot find:")} ${colors.cyan(relativeModule)}`,
      "",
      `${colors.dim("Imported by:")}`,
      `  ${colors.yellow("→")} ${colors.white(relativeImporter)}`,
    ];

    // Add suggestions if provided
    if (suggestions && suggestions.length > 0) {
      lines.push("");
      lines.push(`${colors.dim("Did you mean?")}`);
      suggestions.forEach((s) => {
        lines.push(`  ${colors.cyan("→")} ${colors.green(s)}`);
      });
    }

    lines.push("");

    return lines.join("\n");
  }

  return message;
}

// Legacy function for backward compatibility
export function devServeLog(message: string) {
  devLog(message);
}
