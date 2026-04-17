import { FileManager } from "./file-manager";

/**
 * Special File Types
 */
export type SpecialFileType = "config" | "main" | "route" | "event" | "locale";

/**
 * Special Files Collector
 * Detects and categorizes special files in the project
 * Provides query APIs for accessing special files by type
 */
export class SpecialFilesCollector {
  /**
   * Categorized special files
   */
  private readonly configFiles = new Map<string, FileManager>();
  private readonly mainFiles = new Map<string, FileManager>();
  private readonly routeFiles = new Map<string, FileManager>();
  private readonly eventFiles = new Map<string, FileManager>();
  private readonly localeFiles = new Map<string, FileManager>();

  /**
   * Collect special files from all tracked files
   * @param files Map of all tracked files
   */
  public collect(files: Map<string, FileManager>): void {
    // Clear existing collections
    this.configFiles.clear();
    this.mainFiles.clear();
    this.routeFiles.clear();
    this.eventFiles.clear();
    this.localeFiles.clear();

    // Categorize each file
    for (const [relativePath, fileManager] of files) {
      this.categorizeFile(relativePath, fileManager);
    }
  }

  /**
   * Categorize a single file
   * @param relativePath Relative path of the file
   * @param fileManager FileManager instance
   */
  private categorizeFile(relativePath: string, fileManager: FileManager): void {
    // Config files: src/config/**/*.{ts,tsx}
    if (this.isConfigFile(relativePath)) {
      this.configFiles.set(relativePath, fileManager);
      return;
    }

    // Main files: src/app/**/main.{ts,tsx}
    if (this.isMainFile(relativePath)) {
      this.mainFiles.set(relativePath, fileManager);
      return;
    }

    // Route files: src/app/**/routes.{ts,tsx}
    if (this.isRouteFile(relativePath)) {
      this.routeFiles.set(relativePath, fileManager);
      return;
    }

    // Event files: src/app/**/events/**/*.{ts,tsx}
    if (this.isEventFile(relativePath)) {
      this.eventFiles.set(relativePath, fileManager);
      return;
    }

    // Locale files: src/app/**/utils/locales.{ts,tsx}
    if (this.isLocaleFile(relativePath)) {
      this.localeFiles.set(relativePath, fileManager);
      return;
    }
  }

  /**
   * Check if file is a config file
   * Pattern: src/config/$config.ts
   */
  private isConfigFile(path: string): boolean {
    return /^src\/config\/.*\.(ts|tsx)$/.test(path);
  }

  /**
   * Check if file is a main file
   * Pattern: src/app/$module/main.ts
   */
  private isMainFile(path: string): boolean {
    return (
      /^src\/app\/[^/]+\/main\.(ts|tsx)$/.test(path) ||
      ["src/app/main.ts", "src/app/main.tsx"].includes(path)
    );
  }

  /**
   * Check if file is a route file
   * Pattern: src/app/$module/routes.ts
   */
  private isRouteFile(path: string): boolean {
    return /^src\/app\/[^/]+\/routes\.(ts|tsx)$/.test(path);
  }

  /**
   * Check if file is an event file
   * Pattern: src/app/$module/events/$event.ts
   */
  private isEventFile(path: string): boolean {
    return /^src\/app\/[^/]+\/events\/[^/]+\.(ts|tsx)$/.test(path);
  }

  /**
   * Check if file is a locale file
   * Pattern: src/app/$module/utils/locales.ts
   */
  private isLocaleFile(path: string): boolean {
    return /^src\/app\/[^/]+\/utils\/locales\.(ts|tsx)$/.test(path);
  }

  /**
   * Add a new file to the appropriate collection
   * @param fileManager FileManager instance
   */
  public addFile(fileManager: FileManager): void {
    const relativePath = fileManager.relativePath;
    this.categorizeFile(relativePath, fileManager);
  }

  /**
   * Remove a file from all collections
   * @param relativePath Relative path of the file
   */
  public removeFile(relativePath: string): void {
    this.configFiles.delete(relativePath);
    this.mainFiles.delete(relativePath);
    this.routeFiles.delete(relativePath);
    this.eventFiles.delete(relativePath);
    this.localeFiles.delete(relativePath);
  }

  /**
   * Update a file in the collections
   * @param fileManager FileManager instance
   */
  public updateFile(fileManager: FileManager): void {
    const relativePath = fileManager.relativePath;

    // Remove from all collections first
    this.removeFile(relativePath);

    // Re-categorize
    this.categorizeFile(relativePath, fileManager);
  }

  /**
   * Get all config files
   * @returns Array of FileManager instances
   */
  public getConfigFiles(): FileManager[] {
    return Array.from(this.configFiles.values());
  }

  /**
   * Get all main files
   * Sort order does not matter here
   * @TODO later we can allow export const priority from the main file itself
   * @returns Array of FileManager instances
   */
  public getMainFiles(): FileManager[] {
    return Array.from(this.mainFiles.values());
  }

  /**
   * Get all route files
   * Sorted alphabetically by path
   * @returns Array of FileManager instances
   */
  public getRouteFiles(): FileManager[] {
    const routeFiles = Array.from(this.routeFiles.values());

    return routeFiles.sort((a, b) => {
      const pathA = a.relativePath;
      const pathB = b.relativePath;
      return pathA.localeCompare(pathB);
    });
  }

  /**
   * Get all event files
   * @returns Array of FileManager instances
   */
  public getEventFiles(): FileManager[] {
    return Array.from(this.eventFiles.values());
  }

  /**
   * Get all locale files
   * @returns Array of FileManager instances
   */
  public getLocaleFiles(): FileManager[] {
    return Array.from(this.localeFiles.values());
  }

  /**
   * Get statistics about collected special files
   */
  public getStats(): Record<SpecialFileType, number> {
    return {
      config: this.configFiles.size,
      main: this.mainFiles.size,
      route: this.routeFiles.size,
      event: this.eventFiles.size,
      locale: this.localeFiles.size,
    };
  }

  /**
   * Check if a file is a special file
   * @param relativePath Relative path of the file
   * @returns Special file type or null
   */
  public getFileType(relativePath: string): SpecialFileType | null {
    if (this.configFiles.has(relativePath)) return "config";
    if (this.mainFiles.has(relativePath)) return "main";
    if (this.routeFiles.has(relativePath)) return "route";
    if (this.eventFiles.has(relativePath)) return "event";
    if (this.localeFiles.has(relativePath)) return "locale";

    return null;
  }

  /**
   * Clear all collections
   */
  public clear(): void {
    this.configFiles.clear();
    this.mainFiles.clear();
    this.routeFiles.clear();
    this.eventFiles.clear();
    this.localeFiles.clear();
  }
}
