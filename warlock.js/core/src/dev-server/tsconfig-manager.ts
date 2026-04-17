import path from "node:path";
import ts from "typescript";
import { Path } from "./path";

export class TSConfigManager {
  /**
   * Aliases list (from tsconfig paths)
   */
  public aliases: Record<string, string[]> = {};

  /**
   * Base URL for resolving paths
   */
  public baseUrl: string = ".";

  /**
   * TSConfig
   */
  public tsconfig: any;

  public init() {
    if (this.tsconfig) return;

    // use typescript to load the tsconfig.json file
    const output = ts.readConfigFile(Path.toAbsolute("tsconfig.json"), ts.sys.readFile);

    this.tsconfig = output.config!;

    this.aliases = output.config?.compilerOptions?.paths || {};

    this.baseUrl = output.config?.compilerOptions?.baseUrl || ".";
  }

  /**
   * Check if the given path is an alias
   * This checks if it's a REAL path alias (not an external package alias)
   *
   * Real aliases map to local paths (e.g., app/* -> src/app/*, src/* -> src/*)
   * External package aliases map to themselves with @ prefix (e.g., @warlock.js/core -> @warlock.js/core)
   */
  public isAlias(path: string) {
    if (!this.tsconfig) {
      this.init();
    }

    return Object.keys(this.aliases).some((alias) => {
      // Remove /* from alias pattern for matching
      const aliasPattern = alias.replace("/*", "");

      if (!path.startsWith(aliasPattern)) {
        return false;
      }

      // Check if this is a real alias or just an external package mapping
      const aliasTargets = this.aliases[alias];
      if (!Array.isArray(aliasTargets) || aliasTargets.length === 0) {
        return false;
      }

      // If the alias starts with @, it's likely an external package alias
      // Example: "@warlock.js/core" -> "@warlock.js/core" (external package)
      if (aliasPattern.startsWith("@")) {
        return false;
      }

      // Otherwise, it's a real path alias (including self-referencing ones like src/* -> src/*)
      // Example: "app/*" -> "src/app/*" (real alias)
      // Example: "src/*" -> "src/*" (self-referencing alias, still valid)
      return true;
    });
  }

  /**
   * Get the alias key that matches the given import path
   */
  public getMatchingAlias(path: string): string | null {
    const aliasKey = Object.keys(this.aliases).find((alias) => {
      const aliasPattern = alias.replace("/*", "");
      return path.startsWith(aliasPattern);
    });

    return aliasKey || null;
  }

  /**
   * Resolve an alias import path to a relative path based on tsconfig paths
   * Example: "app/users/services/get-users.service" -> "src/app/users/services/get-users.service"
   *
   * @param path - The import path with alias (e.g., "app/users/services/get-users.service")
   * @returns The resolved relative path or null if alias not found
   */
  public resolveAliasPath(checkingPath: string): string | null {
    // Find matching alias from tsconfig paths
    const aliasKey = this.getMatchingAlias(checkingPath);

    if (!aliasKey) return null;

    const aliasTargets = this.aliases[aliasKey];
    if (!Array.isArray(aliasTargets) || aliasTargets.length === 0) {
      return null;
    }

    // Get the first target path (usually there's only one)
    const targetPattern = aliasTargets[0];

    // Replace alias pattern with target pattern
    const aliasPattern = aliasKey.replace("/*", "");
    const targetBase = targetPattern.replace("/*", "");
    // Remove any leading slash so path.join does not drop the base
    const relativePart = checkingPath.substring(aliasPattern.length).replace(/^[/\\]/, "");

    // Join the target base with the relative part
    const resolvedPath = path.join(targetBase, relativePart);

    return Path.normalize(resolvedPath);
  }

  /**
   * Resolve an alias import path to an absolute path
   * Example: "app/users/services/get-users.service" -> "/absolute/path/to/src/app/users/services/get-users.service"
   *
   * @param path - The import path with alias
   * @returns The resolved absolute path or null if alias not found
   */
  public resolveAliasToAbsolute(path: string): string | null {
    const relativePath = this.resolveAliasPath(path);

    if (!relativePath) return null;

    return Path.normalize(Path.toAbsolute(relativePath));
  }
}

export const tsconfigManager = new TSConfigManager();
