/**
 * Import Deduplicator
 *
 * A pure function module for deduplicating and transforming ES6 imports.
 * This module is framework-agnostic and can be tested in isolation.
 *
 * The transformer:
 * 1. Groups imports by resolved module path
 * 2. Consolidates bindings for duplicate imports
 * 3. Creates alias assignments for duplicate bindings
 * 4. Generates optimized __import() calls
 */

// ============================================================================
// Types
// ============================================================================

export type ImportBinding = {
  originalName: string;
  localName: string;
};

export type ImportGroup = {
  cachePath: string;
  bindings: ImportBinding[];
  namespaceImport?: string; // * as Foo
  defaultImport?: string; // import Foo from
  matches: { fullImport: string; index: number }[];
};

export type PathResolver = (importPath: string) => string | null;

export type ImportTransformResult = {
  code: string;
  unresolvedImports: string[];
  groups: Map<string, ImportGroup>;
  aliasAssignments: string[];
};

export type TransformOptions = {
  /**
   * Function to check if an import path is a tsconfig alias
   */
  isAlias?: (path: string) => boolean;
};

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Pattern to match ES6 import statements
 * Handles:
 *   - import { a, b } from "module" (named imports, can span multiple lines)
 *   - import * as Foo from "module" (namespace imports)
 *   - import Foo from "module" (default imports)
 *   - import Foo, { a, b } from "module" (mixed imports)
 */
const IMPORT_REGEX =
  /import\s+(\{[\s\S]*?\}|\*\s+as\s+\w+|\w+(?:\s*,\s*\{[\s\S]*?\})?)\s+from\s+["']([^"']+)["'];?/gm;

/**
 * Pattern to match side-effect imports: import "module";
 */
const SIDE_EFFECT_IMPORT_REGEX = /import\s+["']([^"']+)["'];?/g;

// ============================================================================
// Pure Functions
// ============================================================================

/**
 * Check if an import path is a relative or absolute path
 */
export function isLocalImport(importPath: string): boolean {
  return importPath.startsWith(".") || importPath.startsWith("/");
}

/**
 * Parse import specifier into bindings
 *
 * @param specifier The import specifier string (e.g., "{ a, b as c }", "* as Foo", "Default")
 * @returns Parsed binding information
 */
export function parseImportSpecifier(specifier: string): {
  bindings: ImportBinding[];
  namespaceImport?: string;
  defaultImport?: string;
} {
  const trimmed = specifier.trim();
  const result: {
    bindings: ImportBinding[];
    namespaceImport?: string;
    defaultImport?: string;
  } = { bindings: [] };

  if (trimmed.startsWith("* as ")) {
    // Namespace import: import * as Foo
    result.namespaceImport = trimmed.replace("* as ", "").trim();
  } else if (trimmed.startsWith("{")) {
    // Named imports: import { a, b as c }
    const content = trimmed.match(/\{([\s\S]*?)\}/)?.[1] || "";
    result.bindings = parseNamedImports(content);
  } else if (trimmed.match(/^(\w+)\s*,\s*\{/)) {
    // Mixed import: import Foo, { a, b }
    const mixedMatch = trimmed.match(/^(\w+)\s*,\s*\{([\s\S]*?)\}/);
    if (mixedMatch) {
      result.defaultImport = mixedMatch[1];
      result.bindings = parseNamedImports(mixedMatch[2]);
    }
  } else {
    // Default import: import Foo
    result.defaultImport = trimmed;
  }

  return result;
}

/**
 * Parse named imports content (the part inside braces)
 */
function parseNamedImports(content: string): ImportBinding[] {
  const bindings: ImportBinding[] = [];
  const parts = content
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const asMatch = part.match(/^(\w+)\s+as\s+(\w+)$/);
    if (asMatch) {
      bindings.push({ originalName: asMatch[1], localName: asMatch[2] });
    } else {
      bindings.push({ originalName: part, localName: part });
    }
  }

  return bindings;
}

/**
 * Merge bindings from a new import into an existing group
 * Returns aliases that need to be created for duplicate bindings
 */
export function mergeBindings(group: ImportGroup, newBindings: ImportBinding[]): string[] {
  const aliases: string[] = [];

  for (const binding of newBindings) {
    const existing = group.bindings.find((b) => b.originalName === binding.originalName);
    if (existing) {
      // Same original name - check if local names differ
      if (existing.localName !== binding.localName) {
        // Need to create an alias: const newLocal = existingLocal;
        aliases.push(`const ${binding.localName} = ${existing.localName};`);
      }
      // If local names are the same, no action needed (deduplicated)
    } else {
      // New binding
      group.bindings.push(binding);
    }
  }

  return aliases;
}

/**
 * Build an __import statement for a group of imports
 */
export function buildGroupImportStatement(group: ImportGroup): string {
  const { cachePath, bindings, namespaceImport, defaultImport } = group;

  if (namespaceImport) {
    return `const ${namespaceImport} = await __import("./${cachePath}")`;
  }

  if (defaultImport && bindings.length > 0) {
    const moduleVar = generateModuleVar();
    const namedDestructure = formatBindings(bindings);
    return `const ${moduleVar} = await __import("./${cachePath}");
const ${defaultImport} = ${moduleVar}?.default ?? ${moduleVar};
const { ${namedDestructure} } = ${moduleVar};`;
  }

  if (defaultImport) {
    const moduleVar = generateModuleVar();
    return `const ${moduleVar} = await __import("./${cachePath}");
const ${defaultImport} = ${moduleVar}?.default ?? ${moduleVar};`;
  }

  if (bindings.length > 0) {
    const namedDestructure = formatBindings(bindings);
    return `const { ${namedDestructure} } = await __import("./${cachePath}")`;
  }

  return `await __import("./${cachePath}")`;
}

/**
 * Format bindings for destructuring
 */
function formatBindings(bindings: ImportBinding[]): string {
  return bindings
    .map((b) =>
      b.originalName === b.localName ? b.localName : `${b.originalName}: ${b.localName}`,
    )
    .join(", ");
}

/**
 * Generate a unique module variable name
 */
function generateModuleVar(): string {
  return `__module_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Main Transform Function
// ============================================================================

/**
 * Transform and deduplicate imports in code
 *
 * This is the main pure function that can be tested independently.
 *
 * @param code The transpiled JavaScript code containing ES6 imports
 * @param resolveCachePath Function to resolve an import path to a cache path
 * @param options Additional transform options
 * @returns Transform result with deduplicated code
 */
export function deduplicateImports(
  code: string,
  resolveCachePath: PathResolver,
  options: TransformOptions = {},
): ImportTransformResult {
  const { isAlias = () => false } = options;

  let transformedCode = code;
  const unresolvedImports: string[] = [];
  const importGroups = new Map<string, ImportGroup>();
  const allAliasAssignments: string[] = [];

  // -------------------------------------------------------------------------
  // Phase 1: Collect and group all imports by cache path
  // -------------------------------------------------------------------------

  const importMatches = Array.from(code.matchAll(IMPORT_REGEX));

  for (const match of importMatches) {
    const fullImport = match[0];
    const importSpecifier = match[1];
    const importPath = match[2];

    // Only transform local imports and alias imports
    if (!isLocalImport(importPath) && !isAlias(importPath)) {
      continue;
    }

    const cachePath = resolveCachePath(importPath);

    if (!cachePath) {
      unresolvedImports.push(importPath);
      continue;
    }

    // Get or create the import group for this cache path
    if (!importGroups.has(cachePath)) {
      importGroups.set(cachePath, {
        cachePath,
        bindings: [],
        matches: [],
      });
    }

    const group = importGroups.get(cachePath)!;
    group.matches.push({ fullImport, index: match.index! });

    // Parse and merge bindings
    const parsed = parseImportSpecifier(importSpecifier);

    if (parsed.namespaceImport && !group.namespaceImport) {
      group.namespaceImport = parsed.namespaceImport;
    }

    if (parsed.defaultImport && !group.defaultImport) {
      group.defaultImport = parsed.defaultImport;
    }

    // Merge bindings and collect aliases
    const aliases = mergeBindings(group, parsed.bindings);
    allAliasAssignments.push(...aliases);
  }

  // -------------------------------------------------------------------------
  // Phase 2: Generate deduplicated imports
  // -------------------------------------------------------------------------

  const replacements: { index: number; length: number; replacement: string }[] = [];

  for (const [, group] of importGroups) {
    const sortedMatches = [...group.matches].sort((a, b) => a.index - b.index);
    const primaryMatch = sortedMatches[0];

    // Build consolidated import statement
    const importStatement = buildGroupImportStatement(group);

    // Add the primary replacement
    replacements.push({
      index: primaryMatch.index,
      length: primaryMatch.fullImport.length,
      replacement: importStatement,
    });

    // Remove all duplicate imports
    for (let i = 1; i < sortedMatches.length; i++) {
      const duplicateMatch = sortedMatches[i];
      replacements.push({
        index: duplicateMatch.index,
        length: duplicateMatch.fullImport.length,
        replacement: "",
      });
    }
  }

  // Sort replacements by index descending (to avoid index shifts)
  replacements.sort((a, b) => b.index - a.index);

  // Apply replacements
  for (const r of replacements) {
    transformedCode =
      transformedCode.slice(0, r.index) + r.replacement + transformedCode.slice(r.index + r.length);
  }

  // -------------------------------------------------------------------------
  // Phase 3: Insert alias assignments
  // -------------------------------------------------------------------------

  if (allAliasAssignments.length > 0) {
    // Find the last __import call and insert aliases after it
    const lastImportMatch = transformedCode.match(/.*await __import\([^)]+\)[^\n]*/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = transformedCode.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      transformedCode =
        transformedCode.slice(0, insertPosition) +
        "\n" +
        allAliasAssignments.join("\n") +
        transformedCode.slice(insertPosition);
    }
  }

  // -------------------------------------------------------------------------
  // Phase 4: Transform side-effect imports
  // -------------------------------------------------------------------------

  const sideEffectMatches = Array.from(transformedCode.matchAll(SIDE_EFFECT_IMPORT_REGEX));

  for (let i = sideEffectMatches.length - 1; i >= 0; i--) {
    const match = sideEffectMatches[i];
    const fullImport = match[0];
    const importPath = match[1];

    if (!isLocalImport(importPath) && !isAlias(importPath)) {
      continue;
    }

    const cachePath = resolveCachePath(importPath);

    if (!cachePath) {
      unresolvedImports.push(importPath);
      continue;
    }

    const newImport = `await __import("./${cachePath}")`;

    const startIndex = match.index!;
    const endIndex = startIndex + fullImport.length;
    transformedCode =
      transformedCode.slice(0, startIndex) + newImport + transformedCode.slice(endIndex);
  }

  return {
    code: transformedCode,
    unresolvedImports,
    groups: importGroups,
    aliasAssignments: allAliasAssignments,
  };
}
