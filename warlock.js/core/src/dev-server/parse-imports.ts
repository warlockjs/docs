import { fileExistsAsync, isDirectoryAsync } from "@mongez/fs";
import { ImportSpecifier, parse } from "es-module-lexer";
import path from "node:path";
import { Path } from "./path";
import { tsconfigManager } from "./tsconfig-manager";

/**
 * Detect if a file contains only type definitions (no runtime code)
 *
 * A file is considered type-only if ALL its exports are:
 * - interface declarations
 * - type alias declarations
 * - export type { ... } statements
 * - export type { ... } from "..." statements
 *
 * Files with any of these are NOT type-only:
 * - export const/let/var
 * - export function
 * - export class
 * - export default (non-type)
 * - export { ... } (without type keyword)
 * - export * from (without type keyword)
 *
 * @param source - The source code to analyze
 * @returns true if the file exports only types
 */
export function isTypeOnlyFile(source: string): boolean {
  // Remove comments to avoid false positives
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/\/\/.*$/gm, ""); // line comments

  // Remove string literals to avoid false positives
  const withoutStrings = withoutComments
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");

  // Patterns for type-only exports (these are safe)
  const typeOnlyPatterns = [
    /export\s+type\s+\{[^}]*\}/g, // export type { Foo, Bar }
    /export\s+type\s+\{[^}]*\}\s+from\s+['"]/g, // export type { Foo } from "..."
    /export\s+interface\s+\w+/g, // export interface Foo
    /export\s+type\s+\w+\s*=/g, // export type Foo =
  ];

  // Remove all type-only exports from consideration
  let remaining = withoutStrings;
  for (const pattern of typeOnlyPatterns) {
    remaining = remaining.replace(pattern, "");
  }

  // Patterns for runtime exports (these make the file NOT type-only)
  const runtimeExportPatterns = [
    /export\s+(?:const|let|var)\s+\w+/g, // export const/let/var foo
    /export\s+function\s+\w+/g, // export function foo
    /export\s+async\s+function\s+\w+/g, // export async function foo
    /export\s+class\s+\w+/g, // export class Foo
    /export\s+enum\s+\w+/g, // export enum Foo (enums have runtime value)
    /export\s+default\s+(?!type\s)/g, // export default (not type)
    /export\s+\{[^}]*\}(?!\s+from)/g, // export { foo } (local re-export without type)
    /export\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]/g, // export { foo } from (without type)
    /export\s+\*\s+from\s+['"][^'"]+['"]/g, // export * from (re-exports everything)
    /export\s+\*\s+as\s+\w+/g, // export * as namespace
  ];

  for (const pattern of runtimeExportPatterns) {
    if (pattern.test(remaining)) {
      // Reset regex lastIndex for subsequent tests
      pattern.lastIndex = 0;

      // Special case: check if export { } contains only type exports
      if (pattern.source.includes("export\\s+\\{")) {
        const matches = remaining.match(/export\s+\{([^}]*)\}(?:\s+from\s+['"][^'"]+['"])?/g);
        if (matches) {
          for (const match of matches) {
            // Skip if it's already a type export
            if (/^export\s+type\s+/.test(match)) continue;

            // Extract the specifiers
            const specifiersMatch = match.match(/export\s+\{([^}]*)\}/);
            if (specifiersMatch) {
              const specifiers = specifiersMatch[1];
              const items = specifiers
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

              // If any specifier is NOT prefixed with "type ", this is a runtime export
              const hasRuntimeSpecifier = items.some((item) => !item.startsWith("type "));
              if (hasRuntimeSpecifier) {
                return false;
              }
            }
          }
        }
        continue;
      }

      return false;
    }
  }

  // If we get here, no runtime exports were found
  // But we should also verify the file has at least some type exports
  // (an empty file or file with only imports is not really "type-only")
  const hasTypeExports = typeOnlyPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(withoutStrings);
  });

  return hasTypeExports;
}

/**
 * Extract import paths using regex (more reliable for TypeScript)
 * This is a fallback when es-module-lexer fails
 */
function extractImportPathsWithRegex(
  source: string,
): Array<{ path: string; originalLine: string }> {
  const imports: Array<{ path: string; originalLine: string }> = [];
  const seenPaths = new Set<string>();

  /**
   * Check if an import line is type-only
   * Handles:
   * - import type { Foo } from "module"
   * - import type Foo from "module"
   * - import type * as Foo from "module"
   */
  const isTypeOnlyImport = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith("import type ") || !!trimmed.match(/^import\s+type\s+[\{\*]/);
  };

  /**
   * Check if an import has any runtime (non-type) imports
   * Handles mixed imports: import { type Foo, runtimeBar } from "module"
   * Returns true if there are runtime imports (should be tracked)
   */
  const hasRuntimeImports = (line: string): boolean => {
    const trimmed = line.trim();

    // If it's a pure type-only import, no runtime imports
    if (isTypeOnlyImport(trimmed)) {
      return false;
    }

    // Extract the import specifiers part: import { ... } from "module"
    const specifiersMatch = trimmed.match(/import\s+\{([^}]+)\}/);
    if (!specifiersMatch) {
      // Not a destructured import, or it's a default/namespace import
      // These are runtime imports unless marked with "import type"
      return true;
    }

    const specifiers = specifiersMatch[1];

    // Split by comma and check each specifier
    const items = specifiers.split(",").map((s) => s.trim());

    // Check if ALL items are type-only (prefixed with "type ")
    const allTypeOnly = items.every((item) => {
      // Match: "type Foo" or "type Foo as Bar"
      return /^type\s+\w+/.test(item);
    });

    // If all are type-only, this import has no runtime imports
    // Otherwise, it has at least one runtime import
    return !allTypeOnly;
  };

  // Pattern 1: Standard ES module imports (handles multiline)
  // Matches: import { ... } from "path", import Foo from "path", import Foo, { ... } from "path"
  const importRegex =
    /import\s+(?:type\s+)?(\{[\s\S]*?\}|\*\s+as\s+\w+|\w+(?:\s*,\s*\{[\s\S]*?\})?)\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(source)) !== null) {
    const fullMatch = match[0];
    const importSpecifier = match[1];
    const importPath = match[2];

    // Skip type-only imports
    if (fullMatch.match(/^import\s+type\s+/)) {
      continue;
    }

    // Skip if it's a mixed import with only types
    if (!hasRuntimeImports(fullMatch)) {
      continue;
    }

    if (importPath && !seenPaths.has(importPath)) {
      seenPaths.add(importPath);
      imports.push({
        path: importPath,
        originalLine: fullMatch,
      });
    }
  }

  // Pattern 1b: Side-effect imports - import "path"
  const sideEffectRegex = /import\s+['"]([^'"]+)['"]/g;
  while ((match = sideEffectRegex.exec(source)) !== null) {
    const importPath = match[1];
    if (importPath && !seenPaths.has(importPath)) {
      seenPaths.add(importPath);
      imports.push({
        path: importPath,
        originalLine: match[0],
      });
    }
  }

  // Pattern 2: Dynamic imports - import("path")
  const dynamicImportPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportPattern.exec(source)) !== null) {
    const importPath = match[1];
    if (importPath && !seenPaths.has(importPath)) {
      seenPaths.add(importPath);
      imports.push({
        path: importPath,
        originalLine: match[0],
      });
    }
  }

  // Pattern 3: Export from - export ... from "path"
  // Skip export type statements (e.g., export type { Foo } from "module")
  const exportFromPattern = /export\s+(?:\{[^}]*\}|\*|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = exportFromPattern.exec(source)) !== null) {
    const fullMatch = match[0];

    // Skip type-only exports: export type ... from "module"
    if (/^export\s+type\s+/.test(fullMatch)) {
      continue;
    }

    const importPath = match[1];
    if (importPath && !seenPaths.has(importPath)) {
      seenPaths.add(importPath);
      imports.push({
        path: importPath,
        originalLine: fullMatch,
      });
    }
  }

  return imports;
}

/**
 * This function will transpile the given ts/tsx code to js code
 * // also it will return the dependencies of the file
 *
 * @returns Map of originalImportPath -> resolvedAbsolutePath
 */
export async function parseImports(source: string, filePath: string) {
  try {
    // Skip .d.ts files - they're type declarations, not runtime code
    if (filePath.endsWith(".d.ts")) {
      return new Map<string, string>();
    }

    // Try es-module-lexer first (faster and more accurate for simple cases)
    try {
      const [imports] = await parse(source);
      if (imports && imports.length > 0) {
        return await resolveImports(imports as ImportSpecifier[], filePath);
      }
    } catch (lexerError) {
      // es-module-lexer failed, fall back to regex-based extraction
      // This is common with TypeScript files that have complex syntax
    }

    // Fallback: Use regex-based extraction (more forgiving with TypeScript)
    const regexImports = extractImportPathsWithRegex(source);
    const resolvedImports = new Map<string, string>();

    for (const { path: importPath } of regexImports) {
      // Skip node built-ins and external packages
      if (isNodeBuiltin(importPath)) {
        continue;
      }

      // Skip external node_modules packages (not starting with . or alias)
      if (!importPath.startsWith(".") && !tsconfigManager.isAlias(importPath)) {
        continue;
      }

      let resolvedPath: string | null = null;

      // Handle alias imports
      if (tsconfigManager.isAlias(importPath)) {
        resolvedPath = await resolveAliasImport(importPath);
      } else if (importPath.startsWith(".")) {
        // Handle relative imports
        resolvedPath = await resolveRelativeImport(importPath, filePath);
      }

      if (resolvedPath) {
        resolvedImports.set(importPath, resolvedPath);
      }
    }

    return resolvedImports;
  } catch (error) {
    console.error(`Error parsing imports for ${filePath}:`, error);
    return new Map<string, string>();
  }
}

async function resolveImports(imports: ImportSpecifier[], filePath: string) {
  const resolvedImports = new Map<string, string>();

  for (const imp of imports) {
    const importPath = imp.n;

    if (!importPath) continue;

    // Skip node built-ins and external packages
    if (isNodeBuiltin(importPath)) {
      continue;
    }

    // console.log(importPath, tsconfigManager.isAlias(importPath));

    // Skip external node_modules packages (not starting with . or alias)
    if (!importPath.startsWith(".") && !tsconfigManager.isAlias(importPath)) {
      continue;
    }

    let resolvedPath: string | null = null;

    // Handle alias imports (e.g., app/users/services/get-users.service)
    if (tsconfigManager.isAlias(importPath)) {
      resolvedPath = await resolveAliasImport(importPath);
    } else if (importPath.startsWith(".")) {
      // Handle relative imports (e.g., ./../services/get-user.service)
      resolvedPath = await resolveRelativeImport(importPath, filePath);
    }

    if (resolvedPath) {
      // Store mapping: original import path -> resolved absolute path
      resolvedImports.set(importPath, resolvedPath);
    }
  }

  return resolvedImports;
}

/**
 * Resolve alias imports to actual file paths with extensions
 * Example: app/users/services/get-users.service -> /absolute/path/to/src/app/users/services/get-users.service.ts
 */
async function resolveAliasImport(importPath: string): Promise<string | null> {
  // Use tsconfig manager to resolve the alias to an absolute path
  const resolvedBase = tsconfigManager.resolveAliasToAbsolute(importPath);

  if (!resolvedBase) return null;

  // Try to resolve with extensions
  const resolvedPath = await tryResolveWithExtensions(resolvedBase);

  return resolvedPath;
}

/**
 * Resolve relative imports to actual file paths
 * Example: ./../services/get-user.service -> /absolute/path/to/services/get-user.service.ts
 */
async function resolveRelativeImport(
  importPath: string,
  currentFilePath: string,
): Promise<string | null> {
  const dir = path.dirname(currentFilePath);
  // Use path.resolve to handle .. and . properly, then normalize to forward slashes
  const resolvedBase = Path.normalize(path.resolve(dir, importPath));

  // Try to resolve with extensions
  const resolvedPath = await tryResolveWithExtensions(resolvedBase);

  return resolvedPath;
}

/**
 * Try to resolve a file path by checking different extensions
 * TypeScript/JavaScript files can be imported without extensions
 *
 * @TODO: For better performance, we need to check the files in files orchestrator
 * instead of using the file system as we will be fetching all project files anyway.
 */
// Cache for file existence checks to avoid redundant filesystem calls
const fileExistsCache = new Map<string, boolean>();

/**
 * Clear the file exists cache
 * Should be called when new files are created to ensure fresh lookups
 */
export function clearFileExistsCache(): void {
  fileExistsCache.clear();
}

async function cachedFileExists(filePath: string): Promise<boolean> {
  if (fileExistsCache.has(filePath)) {
    return fileExistsCache.get(filePath)!;
  }
  const exists = (await fileExistsAsync(filePath)) as boolean;
  fileExistsCache.set(filePath, exists);
  return exists;
}

async function tryResolveWithExtensions(basePath: string): Promise<string | null> {
  // Normalize the base path first (handle Windows paths)
  const normalizedBase = Path.normalize(basePath);

  // List of extensions to try, in order of preference
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
  const validExtensions = new Set(extensions);

  // If the path already has a VALID code file extension, check if it exists
  const ext = path.extname(normalizedBase);
  if (ext && validExtensions.has(ext)) {
    if (await cachedFileExists(normalizedBase)) {
      return normalizedBase;
    }
    // If explicit extension doesn't exist, return null
    return null;
  }

  // Try all extensions in parallel for better performance
  const pathsToCheck = extensions.map((extension) => normalizedBase + extension);
  const results = await Promise.all(
    pathsToCheck.map(async (p) => ({ path: p, exists: await cachedFileExists(p) })),
  );

  // Return the first one that exists (in order of preference)
  for (const result of results) {
    if (result.exists) {
      return result.path;
    }
  }

  // Try index files in directory
  if (await isDirectoryAsync(normalizedBase)) {
    const indexPaths = extensions.map((extension) =>
      Path.join(normalizedBase, `index${extension}`),
    );
    const indexResults = await Promise.all(
      indexPaths.map(async (p) => ({ path: p, exists: await cachedFileExists(p) })),
    );

    for (const result of indexResults) {
      if (result.exists) {
        return result.path;
      }
    }
  }

  return null;
}

/**
 * Check if import is a Node.js built-in module
 */
function isNodeBuiltin(importPath: string): boolean {
  const builtins = [
    "fs",
    "path",
    "http",
    "https",
    "crypto",
    "stream",
    "util",
    "events",
    "buffer",
    "child_process",
    "os",
    "url",
    "querystring",
    "zlib",
    "net",
    "tls",
    "dns",
    "dgram",
    "cluster",
    "worker_threads",
    "perf_hooks",
    "async_hooks",
    "timers",
    "readline",
    "repl",
    "vm",
    "assert",
    "console",
    "process",
    "v8",
  ];

  // Check for node: prefix or direct builtin name
  if (importPath.startsWith("node:")) return true;

  const moduleName = importPath.split("/")[0];
  return builtins.includes(moduleName);
}
