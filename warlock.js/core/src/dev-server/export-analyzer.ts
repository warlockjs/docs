import ts from "typescript";
import type { FileManager } from "./file-manager";

/**
 * Export information for a file
 */
export interface ExportInfo {
  /** Named exports (e.g., ["User", "userSchema"]) */
  namedExports: string[];
  /** Whether the file has a default export */
  hasDefaultExport: boolean;
  /** Paths of re-exported modules (for recursive analysis) */
  reExports: string[];
}

/**
 * Export Analyzer
 * Analyzes TypeScript files to extract export information
 * Used for transforming re-exports to dynamic imports
 */
export class ExportAnalyzer {
  /**
   * Cache of analyzed exports
   * Maps relative file path to export info (consistent with rest of codebase)
   */
  private cache = new Map<string, ExportInfo>();

  /**
   * Analyze exports from a FileManager
   * Reuses the already-loaded source code instead of reading the file again
   * @param fileManager FileManager instance with source code
   * @returns Export information
   */
  public analyzeExports(fileManager: FileManager): ExportInfo {
    // Use relative path for cache key (consistent with rest of codebase)
    const cacheKey = fileManager.relativePath;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Parse and analyze the file using the already-loaded source
    const info = this.parseExports(fileManager);

    // Cache the result
    this.cache.set(cacheKey, info);

    return info;
  }

  /**
   * Parse exports from a FileManager's source code
   * @param fileManager FileManager instance with source code
   * @returns Export information
   */
  private parseExports(fileManager: FileManager): ExportInfo {
    const info: ExportInfo = {
      namedExports: [],
      hasDefaultExport: false,
      reExports: [],
    };

    try {
      // Use the already-loaded source from FileManager
      const sourceText = fileManager.source;
      if (!sourceText) {
        return info;
      }

      // Create a source file
      const sourceFile = ts.createSourceFile(
        fileManager.absolutePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
      );

      // Visit all nodes to find exports
      const visit = (node: ts.Node) => {
        // Handle export declarations
        if (ts.isExportDeclaration(node)) {
          this.handleExportDeclaration(node, info);
        }
        // Handle export assignments (export = ...)
        else if (ts.isExportAssignment(node)) {
          if (!node.isExportEquals) {
            // export default ...
            info.hasDefaultExport = true;
          }
        }
        // Handle variable statements with export modifier
        else if (ts.isVariableStatement(node)) {
          this.handleVariableStatement(node, info);
        }
        // Handle function declarations with export modifier
        else if (ts.isFunctionDeclaration(node)) {
          this.handleFunctionDeclaration(node, info);
        }
        // Handle class declarations with export modifier
        else if (ts.isClassDeclaration(node)) {
          this.handleClassDeclaration(node, info);
        }
        // Handle enum declarations with export modifier (enums exist at runtime)
        else if (ts.isEnumDeclaration(node)) {
          this.handleEnumDeclaration(node, info);
        }
        // Note: Interfaces and type aliases are intentionally skipped
        // They are type-only and don't exist at runtime

        // Recursively visit child nodes
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    } catch (error) {
      // If parsing fails, return empty info
      console.error(`Failed to parse exports from ${fileManager.relativePath}:`, error);
    }

    return info;
  }

  /**
   * Handle export declarations (export { x }, export * from, etc.)
   */
  private handleExportDeclaration(node: ts.ExportDeclaration, info: ExportInfo): void {
    // export * from "./module" or export { x } from "./module"
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const modulePath = node.moduleSpecifier.text;

      // If it's export *, track it as a re-export
      if (!node.exportClause) {
        // export * from "./module"
        info.reExports.push(modulePath);
      } else if (ts.isNamedExports(node.exportClause)) {
        // export { x, y } from "./module"
        // These are also re-exports, but we can extract the names
        for (const element of node.exportClause.elements) {
          const exportName = element.name.text;
          info.namedExports.push(exportName);
        }
      }
    }
    // export { x, y } (without from)
    else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        const exportName = element.name.text;
        info.namedExports.push(exportName);
      }
    }
  }

  /**
   * Handle variable statements (export const x = ...)
   */
  private handleVariableStatement(node: ts.VariableStatement, info: ExportInfo): void {
    if (this.hasExportModifier(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          info.namedExports.push(declaration.name.text);
        }
      }
    }
  }

  /**
   * Handle function declarations (export function x() {})
   */
  private handleFunctionDeclaration(node: ts.FunctionDeclaration, info: ExportInfo): void {
    if (this.hasExportModifier(node)) {
      if (this.hasDefaultModifier(node)) {
        info.hasDefaultExport = true;
      } else if (node.name) {
        info.namedExports.push(node.name.text);
      }
    }
  }

  /**
   * Handle class declarations (export class X {})
   */
  private handleClassDeclaration(node: ts.ClassDeclaration, info: ExportInfo): void {
    if (this.hasExportModifier(node)) {
      if (this.hasDefaultModifier(node)) {
        info.hasDefaultExport = true;
      } else if (node.name) {
        info.namedExports.push(node.name.text);
      }
    }
  }

  /**
   * Handle enum declarations (export enum X {})
   * Enums exist at runtime, so they should be included
   */
  private handleEnumDeclaration(node: ts.EnumDeclaration, info: ExportInfo): void {
    if (this.hasExportModifier(node)) {
      info.namedExports.push(node.name.text);
    }
  }

  /**
   * Check if a node has an export modifier
   */
  private hasExportModifier(node: ts.Node): boolean {
    return (
      ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword) === true
    );
  }

  /**
   * Check if a node has a default modifier
   */
  private hasDefaultModifier(node: ts.Node): boolean {
    return (
      ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((mod) => mod.kind === ts.SyntaxKind.DefaultKeyword) === true
    );
  }

  /**
   * Clear cache for a specific file
   * @param relativePath Relative path to the file
   */
  public clearCache(relativePath: string): void {
    this.cache.delete(relativePath);
  }

  /**
   * Clear all cached export information
   */
  public clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; files: string[] } {
    return {
      size: this.cache.size,
      files: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const exportAnalyzer = new ExportAnalyzer();
