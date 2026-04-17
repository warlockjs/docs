import type { FileManager } from "./file-manager";

/**
 * Dependency Graph
 * Tracks bidirectional relationships between files:
 * - dependencies: files that this file imports
 * - dependents: files that import this file
 */
export class DependencyGraph {
  /**
   * Map of file -> files it depends on (imports)
   * Key: relative file path
   * Value: Set of relative file paths this file imports
   */
  private dependencies = new Map<string, Set<string>>();

  /**
   * Map of file -> files that depend on it (importers)
   * Key: relative file path
   * Value: Set of relative file paths that import this file
   */
  private dependents = new Map<string, Set<string>>();

  /**
   * Reference to the files map for accessing FileManager instances
   * Used to check isTypeOnlyFile flag during cycle detection
   */
  private files: Map<string, FileManager> | null = null;

  /**
   * Build dependency graph from FileManager map
   */
  public build(files: Map<string, FileManager>) {
    // Store reference to files map for type-only detection
    this.files = files;

    // Clear existing graph
    this.dependencies.clear();
    this.dependents.clear();

    // Build graph from all files
    for (const [relativePath, fileManager] of files) {
      // Initialize empty sets ONLY if not already present
      // (addDependency may have already created entries for this file)
      if (!this.dependencies.has(relativePath)) {
        this.dependencies.set(relativePath, new Set());
      }

      if (!this.dependents.has(relativePath)) {
        this.dependents.set(relativePath, new Set());
      }

      // Add dependencies
      for (const dependency of fileManager.dependencies) {
        this.addDependency(relativePath, dependency);
      }
    }

    // Detect circular dependencies
    const cycles = this.detectCircularDependencies();
    if (cycles.length > 0) {
      this.displayCircularDependencyWarnings(cycles);
    }
  }

  /**
   * Add a dependency relationship
   * @param file The file that has the dependency
   * @param dependency The file being depended upon
   */
  public addDependency(file: string, dependency: string) {
    // Ensure both files exist in the graph
    if (!this.dependencies.has(file)) {
      this.dependencies.set(file, new Set());
    }
    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set());
    }

    // Add bidirectional relationship
    this.dependencies.get(file)!.add(dependency);
    this.dependents.get(dependency)!.add(file);
  }

  /**
   * Remove a dependency relationship
   * @param file The file that has the dependency
   * @param dependency The file being depended upon
   */
  public removeDependency(file: string, dependency: string) {
    this.dependencies.get(file)?.delete(dependency);
    this.dependents.get(dependency)?.delete(file);
  }

  /**
   * Remove all relationships for a file
   * @param file The file to remove
   */
  public removeFile(file: string) {
    // Remove as dependent from all its dependencies
    const deps = this.dependencies.get(file);
    if (deps) {
      for (const dependency of deps) {
        this.dependents.get(dependency)?.delete(file);
      }
    }

    // Remove as dependency from all its dependents
    const dependents = this.dependents.get(file);
    if (dependents) {
      for (const dependent of dependents) {
        this.dependencies.get(dependent)?.delete(file);
      }
    }

    // Remove from maps
    this.dependencies.delete(file);
    this.dependents.delete(file);
  }

  /**
   * Update dependencies for a file
   * @param file The file to update
   * @param newDependencies New set of dependencies
   */
  public updateFile(file: string, newDependencies: Set<string>) {
    // Get old dependencies
    const oldDependencies = this.dependencies.get(file) || new Set();

    // Find removed dependencies
    for (const oldDep of oldDependencies) {
      if (!newDependencies.has(oldDep)) {
        this.removeDependency(file, oldDep);
      }
    }

    // Find added dependencies
    for (const newDep of newDependencies) {
      if (!oldDependencies.has(newDep)) {
        this.addDependency(file, newDep);
      }
    }
  }

  /**
   * Get files that this file depends on (imports)
   * @param file The file to check
   * @returns Set of files this file imports
   */
  public getDependencies(file: string): Set<string> {
    return this.dependencies.get(file) || new Set();
  }

  /**
   * Get files that depend on this file (importers)
   * @param file The file to check
   * @returns Set of files that import this file
   */
  public getDependents(file: string): Set<string> {
    return this.dependents.get(file) || new Set();
  }

  /**
   * Get invalidation chain for a file
   * Returns all files that need to be reloaded when this file changes
   * Includes the file itself and all transitive dependents
   * @param file The file that changed
   * @returns Array of files to invalidate (in order)
   */
  public getInvalidationChain(file: string): string[] {
    const chain: string[] = [file];
    const visited = new Set([file]);

    const traverse = (current: string) => {
      const deps = this.getDependents(current);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          visited.add(dep);
          chain.push(dep);
          traverse(dep); // Recursive traversal
        }
      }
    };

    traverse(file);
    return chain;
  }

  /**
   * Detect circular dependencies in the dependency graph
   * Uses depth-first search to find cycles
   *
   * Filtering:
   * - Type-only imports are excluded at the parsing level (parse-imports.ts)
   * - Cycles where ALL files are type-only are filtered out (no runtime impact)
   *
   * @returns Array of circular dependency chains (each chain is an array of file paths)
   */
  public detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (file: string, path: string[]): void => {
      visited.add(file);
      recursionStack.add(file);
      path.push(file);

      const deps = this.getDependencies(file);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep);
          const cycle = [...path.slice(cycleStart), dep];
          cycles.push(cycle);
        }
      }

      recursionStack.delete(file);
    };

    for (const file of this.dependencies.keys()) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    // Filter out cycles where ALL files are type-only
    // Type-only circular dependencies have no runtime impact
    return cycles.filter((cycle) => {
      // Exclude the last element (it's a duplicate of the first to show the cycle completes)
      const uniqueFiles = cycle.slice(0, -1);

      // A cycle is safe to ignore if ALL participating files are type-only
      const allTypeOnly = uniqueFiles.every((filePath) => {
        const file = this.files?.get(filePath);
        return file?.isTypeOnlyFile === true;
      });

      // Return true to KEEP the cycle (show warning), false to filter it out
      return !allTypeOnly;
    });
  }

  /**
   * Display circular dependency warnings in a formatted, user-friendly way
   * Shows each cycle with visual tree structure and helpful recommendations
   */
  private displayCircularDependencyWarnings(cycles: string[][]): void {
    const colors = {
      yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
      cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
      dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
      bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
      green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    };

    console.log("");
    console.log(colors.yellow("⚠️  Circular Dependencies Detected"));
    console.log(colors.dim("━".repeat(60)));
    console.log("");
    console.log(
      colors.dim(
        `Found ${colors.bold(cycles.length.toString())} circular dependency chain${cycles.length > 1 ? "s" : ""}`,
      ),
    );
    console.log("");

    cycles.forEach((cycle, index) => {
      console.log(colors.cyan(`  ${index + 1}. Cycle with ${cycle.length - 1} files:`));
      console.log("");

      // Display the cycle chain
      cycle.forEach((file, fileIndex) => {
        const isLast = fileIndex === cycle.length - 1;
        const arrow = isLast ? colors.dim("   └─→ ") : colors.dim("   ├─→ ");
        const fileName = file.split("/").pop() || file;
        const filePath = colors.dim(file.replace(fileName, ""));

        if (isLast) {
          // Last item is the same as first (completes the cycle)
          console.log(
            arrow + colors.yellow(`${filePath}${colors.bold(fileName)} (cycle completes)`),
          );
        } else {
          console.log(arrow + filePath + colors.bold(fileName));
        }
      });

      console.log("");
    });

    console.log(colors.dim("━".repeat(60)));
    console.log(colors.yellow("💡 How to Fix:"));
    console.log("");

    // Get first cycle for examples
    const exampleCycle = cycles[0];
    const fileA = exampleCycle[0]?.split("/").pop() || "fileA.ts";
    const fileB = exampleCycle[1]?.split("/").pop() || "fileB.ts";

    console.log(colors.green("  Option 1: Use lazy/dynamic import"));
    console.log(colors.dim(`   In ${fileB}, change:`));
    console.log(colors.dim(`     import { SomeClass } from "./${fileA.replace(".ts", "")}";`));
    console.log(colors.dim(`   To:`));
    console.log(
      colors.dim(`     const { SomeClass } = await import("./${fileA.replace(".ts", "")}");`),
    );
    console.log("");

    console.log(colors.green("  Option 2: Extract shared code"));
    console.log(colors.dim("   Move the shared logic into a third file that both can import."));
    console.log(colors.dim(`   Example: Create a shared.ts file and import from there.`));
    console.log("");

    console.log(colors.green("  Option 3: Dependency injection"));
    console.log(colors.dim("   Pass dependencies as constructor/function parameters instead"));
    console.log(colors.dim("   of importing them directly."));
    console.log("");

    console.log(colors.dim("━".repeat(60)));
    console.log(colors.dim("   Circular dependencies can cause HMR issues and hard-to-debug"));
    console.log(colors.dim("   initialization order problems. Consider refactoring."));
    console.log("");
  }

  /**
   * Get statistics about the dependency graph
   */
  public getStats() {
    let totalDependencies = 0;
    let maxDependencies = 0;
    let maxDependents = 0;
    let mostDependedFile = "";
    let mostDependingFile = "";

    for (const [file, deps] of this.dependencies) {
      totalDependencies += deps.size;
      if (deps.size > maxDependencies) {
        maxDependencies = deps.size;
        mostDependingFile = file;
      }
    }

    for (const [file, deps] of this.dependents) {
      if (deps.size > maxDependents) {
        maxDependents = deps.size;
        mostDependedFile = file;
      }
    }

    return {
      totalFiles: this.dependencies.size,
      totalDependencies,
      avgDependenciesPerFile: totalDependencies / this.dependencies.size || 0,
      maxDependencies,
      maxDependents,
      mostDependingFile,
      mostDependedFile,
    };
  }
}
