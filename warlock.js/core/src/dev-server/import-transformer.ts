import { devLogError } from "./dev-logger";
import { exportAnalyzer } from "./export-analyzer";
import type { FileManager } from "./file-manager";
import { FilesOrchestrator } from "./files-orchestrator";
import { deduplicateImports } from "./import-deduplicator";
import { Path } from "./path";
import { tsconfigManager } from "./tsconfig-manager";

let filesOrchestrator: FilesOrchestrator;

loadFilesOrchestrator();

async function loadFilesOrchestrator() {
  try {
    const output = await import("./files-orchestrator");
    filesOrchestrator = output.filesOrchestrator;
  } catch (error) {}
}

/**
 * Transform imports in transpiled code to use cache paths
 *
 * This can be called immediately after transpilation - no need to wait for
 * other files to be processed because cache paths are computed deterministically.
 *
 * Strategy:
 * - All cached files are in the same directory (.warlock/cache/)
 * - So all imports become: "./${cachePath}"
 * - Cache path is computed from the resolved import path
 *
 * @param fileManager FileManager with transpiled code and importMap
 * @returns Transformed code with cache-relative imports
 */
export function transformImports(fileManager: FileManager): string {
  const code = fileManager.transpiled;

  // Create a path resolver that uses the fileManager's importMap
  const resolveCachePath = (importPath: string): string | null => {
    if (!fileManager.importMap.has(importPath)) {
      return null;
    }
    return findCachePathForImport(importPath, fileManager);
  };

  // Use the pure deduplicator for import transformation
  const result = deduplicateImports(code, resolveCachePath, {
    isAlias: (path) => tsconfigManager.isAlias(path),
  });

  let transformedCode = result.code;
  const unresolvedImports = [...result.unresolvedImports];

  // Pattern to match ES6 export statements
  // Matches: export * from "..." and export { ... } from "..."
  const exportRegex = /export\s+((?:\*|\{[^}]*\}))\s+from\s+["']([^"']+)["'];?/g;

  // Process exports (need to re-process after imports to get updated string positions)
  const exportMatches = Array.from(transformedCode.matchAll(exportRegex));
  for (let i = exportMatches.length - 1; i >= 0; i--) {
    const match = exportMatches[i];
    const fullExport = match[0];
    const exportSpecifier = match[1]; // "*" or "{ foo, bar }"
    const importPath = match[2]; // The module path

    // Only transform relative imports and alias imports
    // Skip external packages (node_modules, node built-ins)
    const isRelativeImport = importPath.startsWith(".") || importPath.startsWith("/");
    const isAliasImport = tsconfigManager.isAlias(importPath);

    if (!isRelativeImport && !isAliasImport) {
      // This is an external package - keep as-is
      continue;
    }

    // Find the cache path for this import
    let cachePath = findCachePathForImport(importPath, fileManager);

    // If not in importMap but is a relative import, compute the cache path directly
    if (!cachePath && isRelativeImport) {
      // Resolve the relative import path from the current file's directory
      const currentDir = Path.dirname(fileManager.relativePath);
      let resolvedPath = Path.join(currentDir, importPath);

      // Normalize the path and ensure it has the correct extension
      if (!resolvedPath.endsWith(".ts") && !resolvedPath.endsWith(".tsx")) {
        resolvedPath += ".ts";
      }

      // Compute cache path using the same formula as FileManager.cachePath
      cachePath = resolvedPath.replace(/\//g, "-").replace(/\.(ts|tsx)$/, ".js");
    }

    if (!cachePath) {
      // Could not resolve - track it (this is a local file that should exist but doesn't)
      unresolvedImports.push(importPath);
      continue;
    }

    // Transform export to use cache path
    // Note: export * from requires a static string literal in ES modules
    // So we can't use __import with timestamps. We rely on module loader cache clearing.
    // For export { ... }, we can use __import and individual exports

    if (exportSpecifier === "*") {
      // export * from "./module"
      // Transform to dynamic re-export for HMR cache busting

      // Get the resolved absolute path for the import
      const resolvedAbsPath = fileManager.importMap.get(importPath);

      if (!resolvedAbsPath) {
        unresolvedImports.push(importPath);
        continue;
      }

      // Get the FileManager for the target file to reuse its source
      const relativePath = Path.toRelative(resolvedAbsPath);
      const targetFileManager = filesOrchestrator.files.get(relativePath);

      if (!targetFileManager) {
        // Target file not in files map - fall back to static export
        const newExport = `export * from "./${cachePath}"`;
        const startIndex = match.index!;
        const endIndex = startIndex + fullExport.length;
        transformedCode =
          transformedCode.slice(0, startIndex) + newExport + transformedCode.slice(endIndex);
        continue;
      }

      // Analyze the target file to get export information
      const exportInfo = exportAnalyzer.analyzeExports(targetFileManager);

      // If we have exports to re-export, generate dynamic re-export code
      if (exportInfo.namedExports.length > 0 || exportInfo.hasDefaultExport) {
        const moduleVar = `__reexport_${i}`;
        const statements: string[] = [];

        // Import the module dynamically
        statements.push(`const ${moduleVar} = await __import("./${cachePath}");`);

        // Re-export named exports
        for (const exportName of exportInfo.namedExports) {
          statements.push(`export const ${exportName} = ${moduleVar}.${exportName};`);
        }

        // Re-export default if exists
        if (exportInfo.hasDefaultExport) {
          statements.push(`export default ${moduleVar}.default;`);
        }

        const newExport = statements.join("\n");

        // Replace in code
        const startIndex = match.index!;
        const endIndex = startIndex + fullExport.length;
        transformedCode =
          transformedCode.slice(0, startIndex) + newExport + transformedCode.slice(endIndex);
      } else {
        // Fallback to static export if no exports found (shouldn't happen normally)
        // This handles edge cases where analysis might fail
        const newExport = `export * from "./${cachePath}"`;

        // Replace in code
        const startIndex = match.index!;
        const endIndex = startIndex + fullExport.length;
        transformedCode =
          transformedCode.slice(0, startIndex) + newExport + transformedCode.slice(endIndex);
      }
    } else {
      // export { foo, bar } from "./module"
      // Transform to individual exports using __import
      const moduleVar = `__module_${i}`;
      const namedExports = exportSpecifier; // e.g., "{ foo, bar }"
      // Extract export names from the specifier
      const exportNames =
        namedExports
          .match(/\{([^}]+)\}/)?.[1]
          ?.split(",")
          .map((s) => s.trim()) || [];
      const exportStatements = exportNames
        .map((name) => `export const ${name} = ${moduleVar}.${name};`)
        .join("\n");
      const newExport = `const ${moduleVar} = await __import("./${cachePath}");\n${exportStatements}`;

      // Replace in code
      const startIndex = match.index!;
      const endIndex = startIndex + fullExport.length;
      transformedCode =
        transformedCode.slice(0, startIndex) + newExport + transformedCode.slice(endIndex);
    }
  }

  // Transform dynamic imports: import("./path") → __import("cache-path")
  // This handles dynamic imports in function bodies that weren't caught by static import transformation
  const dynamicImportRegex = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  const dynamicMatches = Array.from(transformedCode.matchAll(dynamicImportRegex));
  for (let i = dynamicMatches.length - 1; i >= 0; i--) {
    const match = dynamicMatches[i];
    const fullImport = match[0];
    const importPath = match[1];

    // Only transform relative imports and alias imports
    const isRelativeImport = importPath.startsWith(".") || importPath.startsWith("/");
    const isAliasImport = tsconfigManager.isAlias(importPath);

    if (!isRelativeImport && !isAliasImport) {
      // External package - keep as-is
      continue;
    }

    // Check if this import was resolved by parseImports
    if (!fileManager.importMap.has(importPath)) {
      // Not in importMap = external package or untracked, skip
      continue;
    }

    // Find the cache path for this import
    const cachePath = findCachePathForImport(importPath, fileManager);

    if (!cachePath) {
      unresolvedImports.push(importPath);
      continue;
    }

    // Transform to __import with cache path
    const newImport = `__import("./${cachePath}")`;

    // Replace in code (reverse order so indices stay valid)
    const startIndex = match.index!;
    const endIndex = startIndex + fullImport.length;
    transformedCode =
      transformedCode.slice(0, startIndex) + newImport + transformedCode.slice(endIndex);
  }

  // If there are unresolved imports, throw an error
  if (unresolvedImports.length > 0) {
    devLogError(
      `Failed to transform imports in ${fileManager.relativePath}:\n` +
        `Unresolved imports: ${unresolvedImports.join(", ")}\n` +
        `These files may not exist or are not being tracked.`,
    );
    return "";
  }

  return transformedCode;
}

/**
 * Build a replacement statement for different import syntaxes
 * @param importSpecifier The import specifier (e.g., "Foo", "{ a, b }", "Foo, { a, b }", "* as Bar")
 * @param cachePath The path to the cached file
 */
function buildImportReplacement(importSpecifier: string, cachePath: string): string {
  const trimmed = importSpecifier.trim();

  // Namespace import: import * as Foo from "module";
  if (trimmed.startsWith("* as ")) {
    const identifier = trimmed.replace("* as ", "").trim();
    return `const ${identifier} = await __import("./${cachePath}")`;
  }

  // Mixed import: import Foo, { a, b } from "module";
  // Transform to: const __module = await __import(...); const Foo = __module?.default ?? __module; const { a, b } = __module;
  // Handle multiline: import Foo, {\n  a,\n  b\n} from "module";
  if (trimmed.match(/^(\w+)\s*,\s*\{/)) {
    const match = trimmed.match(/^(\w+)\s*,\s*(\{[\s\S]*?\})/);
    if (match) {
      const defaultImport = match[1];
      let namedImports = match[2];
      const moduleVar = `__module_${Math.random().toString(36).slice(2, 8)}`;

      // Clean up whitespace and normalize
      namedImports = namedImports.replace(/\s+/g, " ").trim();
      // Normalize `{ default as X }` to `{ default: X }` for valid destructuring
      const normalized = namedImports.replace(/default\s+as\s+/g, "default: ");

      // Generate correct syntax with proper separators
      return `const ${moduleVar} = await __import("./${cachePath}");
const ${defaultImport} = ${moduleVar}?.default ?? ${moduleVar};
const ${normalized} = ${moduleVar};`;
    }
  }

  // Destructured / named imports (including default alias): import { a, default as X } from "module";
  if (trimmed.startsWith("{")) {
    // Clean up multiline formatting
    let cleanedImports = trimmed.replace(/\s+/g, " ").trim();
    // Normalize `{ default as X }` to `{ default: X }` for valid destructuring
    const normalized = cleanedImports.replace(/default\s+as\s+/g, "default: ");
    return `const ${normalized} = await __import("./${cachePath}")`;
  }

  // Default import: import Foo from "module";
  // Use default with fallback to module object
  const moduleVar = `__module_${Math.random().toString(36).slice(2, 8)}`;
  return `const ${moduleVar} = await __import("./${cachePath}");\nconst ${trimmed} = ${moduleVar}?.default ?? ${moduleVar};`;
}

/**
 * Find the cache path for an import
 *
 * Uses the fileManager's importMap which maps original imports to resolved paths.
 * The cache path is computed deterministically from the resolved path,
 * so we don't need to look up the dependency in the files map.
 *
 * @param importPath The import path from the import statement
 * @param fileManager The file that contains this import
 * @returns The cache path string, or null if not resolved
 */
function findCachePathForImport(importPath: string, fileManager: FileManager): string | null {
  // Look up the resolved absolute path from the import map
  const resolvedAbsPath = fileManager.importMap.get(importPath);

  if (!resolvedAbsPath) {
    return null;
  }

  // Convert to relative path
  const relativePath = Path.toRelative(resolvedAbsPath);

  // Compute cache path deterministically - no need for filesMap!
  // This is the same formula used in FileManager.cachePath
  return relativePath.replace(/\//g, "-").replace(/\.(ts|tsx)$/, ".js");
}
