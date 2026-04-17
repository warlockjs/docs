import { env } from "@mongez/dotenv";
import { ensureDirectoryAsync } from "@mongez/fs";
import { spawn } from "child_process";
import { constants } from "fs";
import { access, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import ts from "typescript";
import { warlockPath } from "../utils";
import { devLogError, devLogInfo, devLogSuccess, devServeLog } from "./dev-logger";
import { filesOrchestrator } from "./files-orchestrator";
import { Path } from "./path";

/**
 * Typings manifest structure for tracking file hashes
 */
type TypingsManifest = {
  version: string;
  lastBuildTime: number;
  storage: {
    sourceHash: string;
    drivers: string[];
  } | null;
  config: Record<
    string,
    {
      sourceHash: string;
      typeName: string | null;
      importSource: string | null;
      keys: string[];
    }
  >;
};

/**
 * TypeGenerator - Generates TypeScript type definitions from config files
 *
 * Parses source config files using the TypeScript Compiler API to extract
 * keys and generate module augmentation types for IDE autocomplete.
 *
 * Uses manifest-based reconciliation to only regenerate when source files change.
 */
export class TypeGenerator {
  /**
   * Output directory for generated typings
   */
  private outputDir = warlockPath("typings");

  /**
   * Path to typings manifest file
   */
  private manifestPath = join(this.outputDir, "typings-manifest.json");

  /**
   * Cached manifest data
   */
  private manifest: TypingsManifest | null = null;

  /**
   * Cache for config type info and keys
   */
  private configCache = new Map<
    string,
    {
      sourceHash: string;
      typeName: string | null;
      importSource: string | null;
      keys: string[];
    }
  >();

  /**
   * Generate all framework type definitions
   *
   * Uses manifest-based reconciliation:
   * - If output files don't exist: full regeneration
   * - If files exist: only regenerate changed configs
   */
  public async generateAll(): Promise<void> {
    await this.ensureOutputDir();

    const storageFile = join(this.outputDir, "storage.d.ts");
    const configFile = join(this.outputDir, "config.d.ts");

    const [manifestExists, storageExists, configExists] = await Promise.all([
      this.exists(this.manifestPath),
      this.exists(storageFile),
      this.exists(configFile),
    ]);

    if (!manifestExists || !storageExists || !configExists) {
      // Full regeneration (first run or files deleted)
      await this.fullGeneration();
    } else {
      // Load manifest for hash comparison
      await this.loadManifest();
      // Reconciliation: only regenerate changed files
      await this.reconcile();
    }

    await this.saveManifest();
  }

  /**
   * Full regeneration of all type files
   */
  private async fullGeneration(): Promise<void> {
    // Generate storage types
    const storageConfigPath = await this.findConfigFile("storage");
    if (storageConfigPath) {
      this.generateStorageTypes(storageConfigPath);
    }

    // Generate config types
    await this.generateConfigTypes();
  }

  /**
   * Reconcile: only regenerate changed files
   */
  private async reconcile(): Promise<void> {
    const files = filesOrchestrator.getFiles();
    let storageChanged = false;
    let configChanged = false;
    let unchangedCount = 0;

    // Check storage config
    for (const [path, fileManager] of files) {
      if (path.startsWith("src/config/storage")) {
        const manifestEntry = this.manifest?.storage;
        if (!manifestEntry || manifestEntry.sourceHash !== fileManager.hash) {
          storageChanged = true;
          await this.generateStorageTypes(path);
        }
        break;
      }
    }

    // Check config files
    for (const [path, fileManager] of files) {
      if (!path.startsWith("src/config/")) continue;
      if (path.includes("index")) continue;

      // Extract config name (remove dir prefix and extension)
      const configName = path.replace("src/config/", "").replace(/\.[^.]+$/, "");

      const manifestEntry = this.manifest?.config[configName];

      if (!manifestEntry || manifestEntry.sourceHash !== fileManager.hash) {
        // File changed or new - regenerate
        configChanged = true;
        const info = await this.extractConfigInfo(fileManager.absolutePath, configName);

        this.configCache.set(configName, {
          sourceHash: fileManager.hash,
          typeName: info.typeName,
          importSource: info.importSource,
          keys: info.keys,
        });
      } else {
        // Unchanged - load from manifest
        unchangedCount++;
        this.configCache.set(configName, manifestEntry);
      }
    }

    if (configChanged) {
      await this.writeConfigTypesFromCache();
    } else {
      devLogInfo(`Config types unchanged (${unchangedCount} configs cached)`);
    }
  }

  /**
   * Generate storage driver name types
   */
  public async generateStorageTypes(configPath: string): Promise<void> {
    try {
      const driverKeys = await this.extractStorageDriverKeys(configPath);

      if (driverKeys.length === 0) {
        devServeLog("⚠️ No storage drivers found in config");
        return;
      }

      // Get file hash from filesOrchestrator
      const fileManager = filesOrchestrator.getFiles().get(configPath);
      const sourceHash = fileManager?.hash || "";

      // Update manifest
      if (!this.manifest) {
        this.manifest = this.createEmptyManifest();
      }
      this.manifest.storage = {
        sourceHash,
        drivers: driverKeys,
      };

      const interfaceContent = driverKeys.map((k) => `    ${k}: true;`).join("\n");

      const content = `// Auto-generated by Warlock.js - DO NOT EDIT
// Generated from: ${configPath}
// Regenerates on dev-server start and when storage config changes

import "@warlock.js/core";

declare module "@warlock.js/core" {
  interface StorageDriverRegistry {
${interfaceContent}
  }
}
`;

      const outputPath = join(this.outputDir, "storage.d.ts");
      await writeFile(outputPath, content, "utf-8");

      devLogSuccess(`Generated storage types: ${driverKeys.join(", ")}`);
    } catch (error) {
      devServeLog(`⚠️ Failed to generate storage types: ${error}`);
    }
  }

  /**
   * Check if a file change should trigger type regeneration
   */
  public shouldRegenerateTypes(changedPath: string): boolean {
    return changedPath.includes("src/config/") || changedPath.includes("config/");
  }

  /**
   * Handle file change - uses incremental update via cache
   */
  public async handleFileChange(changedPath: string): Promise<void> {
    if (!this.shouldRegenerateTypes(changedPath)) {
      return;
    }

    // Regenerate storage types if storage config changed
    if (changedPath.includes("config/storage")) {
      await this.generateStorageTypes(changedPath);
      await this.saveManifest();
      return;
    }

    // Extract config name from path
    const match = changedPath.match(/config\/([^/]+)\.[^.]+$/);
    if (!match) {
      return;
    }

    const configName = match[1];
    if (configName === "index") return;

    devLogInfo(`Config changed: ${configName}, updating...`);

    // Get file manager for hash
    const fileManager = filesOrchestrator.getFiles().get(changedPath);
    const sourceHash = fileManager?.hash || Date.now().toString();

    // Update only the changed config in cache (use optimized combined extraction)
    const configDir = join(process.cwd(), "src/config");
    const configPath = join(configDir, `${configName}.ts`);

    const info = await this.extractConfigInfo(configPath, configName);

    this.configCache.set(configName, {
      sourceHash,
      typeName: info.typeName,
      importSource: info.importSource,
      keys: info.keys,
    });

    // Regenerate config.d.ts from cache
    await this.writeConfigTypesFromCache();
    await this.saveManifest();
  }

  /**
   * Generate config types - populates cache and writes file
   */
  public async generateConfigTypes(): Promise<void> {
    try {
      const files = filesOrchestrator.getFiles();

      // Clear and repopulate cache
      this.configCache.clear();

      for (const [path, fileManager] of files) {
        if (!path.startsWith("src/config/")) continue;
        if (path.includes("index")) continue;

        // Extract config name
        const configName = path.replace("src/config/", "").replace(/\.[^.]+$/, "");

        // Use optimized combined extraction (single ts.createProgram call)
        const info = await this.extractConfigInfo(fileManager.absolutePath, configName);

        this.configCache.set(configName, {
          sourceHash: fileManager.hash,
          typeName: info.typeName,
          importSource: info.importSource,
          keys: info.keys,
        });
      }

      await this.writeConfigTypesFromCache();
    } catch (error) {
      devServeLog(`⚠️ Failed to generate config types: ${error}`);
    }
  }

  /**
   * Write config.d.ts from cached data
   */
  private async writeConfigTypesFromCache(): Promise<void> {
    const configTypeInfos: Array<{
      name: string;
      typeName: string | null;
      importSource: string | null;
    }> = [];
    const allKeys: string[] = [];

    // Update manifest config section
    if (!this.manifest) {
      this.manifest = this.createEmptyManifest();
    }
    this.manifest.config = {};

    for (const [name, data] of this.configCache) {
      configTypeInfos.push({
        name,
        typeName: data.typeName,
        importSource: data.importSource,
      });
      allKeys.push(...data.keys);

      // Store in manifest
      this.manifest.config[name] = data;
    }

    // Group imports by source
    const imports = new Map<string, Set<string>>();
    for (const info of configTypeInfos) {
      if (info.typeName && info.importSource) {
        if (!imports.has(info.importSource)) {
          imports.set(info.importSource, new Set());
        }
        imports.get(info.importSource)!.add(info.typeName);
      }
    }

    const importStatements = Array.from(imports.entries())
      .map(([source, types]) => `import type { ${Array.from(types).join(", ")} } from "${source}";`)
      .join("\n");

    const configEntries = configTypeInfos
      .map((info) => `    ${info.name}: ${info.typeName || "unknown"};`)
      .join("\n");

    const keyEntries = allKeys.map((key) => `    "${key}": true;`).join("\n");

    const content = `// Auto-generated by Warlock.js - DO NOT EDIT
// Regenerates on dev-server start and when config files change

${importStatements}
import "@warlock.js/core";

declare module "@warlock.js/core" {
  interface ConfigRegistry {
${configEntries}
  }

  interface ConfigKeyRegistry {
${keyEntries}
  }
}
`;

    const outputPath = join(this.outputDir, "config.d.ts");
    await writeFile(outputPath, content, "utf-8");

    devLogSuccess(
      `Generated config types: ${this.configCache.size} configs, ${allKeys.length} keys`,
    );
  }

  // ============================================================
  // Manifest Management
  // ============================================================

  /**
   * Load manifest from disk
   */
  private async loadManifest(): Promise<boolean> {
    try {
      if (await this.exists(this.manifestPath)) {
        const content = await readFile(this.manifestPath, "utf-8");
        this.manifest = JSON.parse(content);
        return true;
      }
    } catch {
      // Manifest corrupted or missing
    }
    this.manifest = null;
    return false;
  }

  /**
   * Save manifest to disk
   */
  private async saveManifest(): Promise<void> {
    if (!this.manifest) {
      this.manifest = this.createEmptyManifest();
    }
    this.manifest.lastBuildTime = Date.now();

    await writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2), "utf-8");
  }

  /**
   * Create empty manifest structure
   */
  private createEmptyManifest(): TypingsManifest {
    return {
      version: "1.0.0",
      lastBuildTime: Date.now(),
      storage: null,
      config: {},
    };
  }

  // ============================================================
  // Type Extraction Methods
  // ============================================================

  /**
   * Extract BOTH type info AND keys in a single pass
   *
   * This is optimized to create ts.createProgram() only ONCE per file
   * instead of twice (once for type extraction, once for keys).
   * This reduces parsing time by ~50%.
   *
   * @param configPath Absolute path to the config file
   * @param configName Config name (e.g., "auth", "notifications")
   * @returns Combined result with type info and keys
   */
  private async extractConfigInfo(
    configPath: string,
    configName: string,
  ): Promise<{
    typeName: string | null;
    importSource: string | null;
    keys: string[];
  }> {
    if (!(await this.exists(configPath))) {
      return { typeName: null, importSource: null, keys: [] };
    }

    // Create program ONCE (this is the expensive operation)
    const program = ts.createProgram([configPath], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    });

    const sourceFile = program.getSourceFile(configPath);
    if (!sourceFile) {
      return { typeName: null, importSource: null, keys: [] };
    }

    // === Type Info Extraction ===
    const importedTypes = new Map<string, string>();
    const localExportedTypes = new Set<string>();
    let foundTypeName: string | null = null;

    // === Keys Extraction ===
    const keys: string[] = [];

    const visitForTypes = (node: ts.Node): void => {
      // Collect imported types
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const source = moduleSpecifier.text;
          const importClause = node.importClause;
          if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
            for (const element of importClause.namedBindings.elements) {
              importedTypes.set(element.name.text, source);
            }
          }
        }
      }

      // Collect locally exported types
      if (ts.isTypeAliasDeclaration(node)) {
        const modifiers = ts.getModifiers(node);
        if (modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
          localExportedTypes.add(node.name.text);
        }
      }

      // Collect locally exported interfaces
      if (ts.isInterfaceDeclaration(node)) {
        const modifiers = ts.getModifiers(node);
        if (modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
          localExportedTypes.add(node.name.text);
        }
      }

      // Find type used on config variable + extract keys
      if (ts.isVariableDeclaration(node)) {
        // Type info
        if (node.type && ts.isTypeReferenceNode(node.type)) {
          foundTypeName = node.type.typeName.getText(sourceFile);
        }

        // Keys extraction
        if (node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
          const visitKeys = (objNode: ts.ObjectLiteralExpression, prefix: string): void => {
            for (const prop of objNode.properties) {
              if (ts.isPropertyAssignment(prop) && prop.name) {
                const keyName = prop.name.getText(sourceFile);
                const fullKey = prefix ? `${prefix}.${keyName}` : keyName;
                keys.push(fullKey);
                if (ts.isObjectLiteralExpression(prop.initializer)) {
                  visitKeys(prop.initializer, fullKey);
                }
              }
            }
          };
          visitKeys(node.initializer, configName);
        }
      }

      ts.forEachChild(node, visitForTypes);
    };

    ts.forEachChild(sourceFile, visitForTypes);

    // Resolve type info
    let typeName: string | null = null;
    let importSource: string | null = null;

    if (foundTypeName) {
      if (importedTypes.has(foundTypeName)) {
        typeName = foundTypeName;
        importSource = importedTypes.get(foundTypeName)!;
      } else if (localExportedTypes.has(foundTypeName)) {
        typeName = foundTypeName;
        const relativePath = Path.toRelative(configPath).replace(/\.(ts|tsx)$/, "");
        importSource = `../../${relativePath}`;
      }
    }

    return { typeName, importSource, keys };
  }

  /**
   * Extract driver keys from storage config
   */
  private async extractStorageDriverKeys(configPath: string): Promise<string[]> {
    const absolutePath = resolve(configPath);

    if (!(await this.exists(absolutePath))) {
      devServeLog(`⚠️ Storage config not found: ${absolutePath}`);
      return [];
    }

    const program = ts.createProgram([absolutePath], {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    });

    const sourceFile = program.getSourceFile(absolutePath);

    if (!sourceFile) {
      devServeLog(`⚠️ Could not parse storage config: ${absolutePath}`);
      return [];
    }

    const keys: string[] = [];

    const visit = (node: ts.Node): void => {
      if (ts.isPropertyAssignment(node)) {
        const propName = node.name.getText(sourceFile);

        if (propName === "drivers" && ts.isObjectLiteralExpression(node.initializer)) {
          for (const prop of node.initializer.properties) {
            if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
              const keyName = prop.name?.getText(sourceFile);

              if (keyName) {
                keys.push(keyName);
              }
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);

    return keys;
  }

  /**
   * Find a config file by name
   */
  private async findConfigFile(configName: string): Promise<string | undefined> {
    const possiblePaths = [`src/config/${configName}.ts`, `config/${configName}.ts`];

    for (const path of possiblePaths) {
      const fullPath = join(process.cwd(), path);

      if (await this.exists(fullPath)) {
        return path;
      }
    }

    try {
      const files = filesOrchestrator.getFiles();

      for (const [filePath] of files) {
        if (filePath.includes(`config/${configName}`)) {
          return filePath;
        }
      }
    } catch {
      // Files orchestrator not initialized yet
    }

    return undefined;
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDir(): Promise<void> {
    await ensureDirectoryAsync(this.outputDir);
  }

  /**
   * Check if a path exists (async wrapper)
   */
  private async exists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute generateAll command using spawn
   */
  public async executeGenerateAllCommand(): Promise<void> {
    devLogInfo("Checking for types generation");
    const isDevServeCore = env("DEV_SERVER_CORE");
    const childProcess = spawn(
      isDevServeCore ? "yarn" : "npx",
      [isDevServeCore ? "cli" : "warlock", "generate.typings"],
      {
        // const childProcess = spawn("yarn", ["cli", "generate.typings"], {
        stdio: "inherit",
        cwd: process.cwd(),
        shell: true, // Required on Windows to find yarn in PATH
      },
    );

    childProcess.on("exit", (code) => {
      if (code === 0) {
        devLogSuccess("Types generated successfully");
      } else {
        devLogError("Failed to generate types");
      }
    });
  }

  /**
   * Execute a typings generator for the given files
   */
  public async executeTypingsGenerator(upcomingFiles: string[]): Promise<void> {
    const uniqueFiles = Array.from(new Set(upcomingFiles));

    const configFilesOnly = uniqueFiles.filter((file) =>
      Path.normalize(file).includes("src/config/"),
    );

    if (configFilesOnly.length === 0) return;

    const files = configFilesOnly.map((file) => "./" + Path.toRelative(file));

    const isDevServeCore = env("DEV_SERVER_CORE");

    const childProcess = spawn(
      isDevServeCore ? "yarn" : "npx",
      [isDevServeCore ? "cli" : "warlock", "generate.typings"],
      {
        stdio: "inherit",
        cwd: process.cwd(),
        shell: true, // Required on Windows to find yarn in PATH
      },
    );

    childProcess.on("exit", (code) => {
      if (code === 0) {
        devLogSuccess("Types generated successfully");
      } else {
        devLogError("Failed to generate types");
      }
    });
  }
}

/**
 * Singleton instance for use throughout dev-server
 */
export const typeGenerator = new TypeGenerator();
