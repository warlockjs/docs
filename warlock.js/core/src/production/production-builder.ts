import { colors } from "@mongez/copper";
import {
  ensureDirectoryAsync,
  fileExistsAsync,
  putFileAsync,
  removeDirectoryAsync,
} from "@mongez/fs";
import esbuild from "esbuild";
import glob from "fast-glob";
import path from "path";
import { appPath, warlockPath } from "../utils";
import { WarlockConfig } from "../warlock-config/types";
import { warlockConfigManager } from "../warlock-config/warlock-config.manager";
import { nativeNodeModulesPlugin } from "./esbuild-plugins";

/**
 * Production Builder
 * Generates production-ready files and bundles them for deployment
 * Build options are loaded from warlock.config.ts
 */
export class ProductionBuilder {
  private options!: Required<WarlockConfig["build"]>;
  private readonly productionDir = warlockPath("production");

  /**
   * Main build entry point
   */
  public async build(): Promise<void> {
    console.log(colors.cyan("🚀 Building for production...\n"));

    // Step 1: Initialize options from config
    await this.initializeOptions();

    // Step 2: Generate combined files
    await this.generateCombinedFiles();

    // Step 3: Generate entry point
    await this.generateEntryPoint();

    // Step 4: Bundle with esbuild
    await this.bundle();

    // Step 5: Remove production folder
    await removeDirectoryAsync(this.productionDir);

    console.log(colors.green("\n✅ Build complete!"));
    console.log(`Start production server by running ${colors.cyan("warlock start")}`);
  }

  /**
   * Initialize options from warlock.config.ts
   */
  private async initializeOptions(): Promise<void> {
    this.options = warlockConfigManager.get("build") as Required<WarlockConfig["build"]>;

    // Ensure production directory exists
    await ensureDirectoryAsync(this.productionDir);
  }

  /**
   * Track which special files were generated
   */
  private generatedFiles = {
    locales: false,
    events: false,
    main: false,
    routes: false,
  };

  /**
   * Generate all combined files
   */
  private async generateCombinedFiles(): Promise<void> {
    console.log(colors.yellow("   Generating production files..."));

    // Generate bootstrap.ts file
    await this.generateBootstrap();

    // Generate config loader
    await this.generateConfigLoader();

    // Generate special files and track which ones have content
    const [locales, events, main, routes] = await Promise.all([
      this.generateLocales(),
      this.generateEvents(),
      this.generateMain(),
      this.generateRoutes(),
    ]);

    this.generatedFiles = { locales, events, main, routes };
  }

  /**
   * Generate bootstrap.ts - ensures bootstrap() runs first and sets production environment
   */
  private async generateBootstrap(): Promise<void> {
    let content = `import { bootstrap, Application } from "@warlock.js/core";

// Set production environment
Application.setRuntimeStrategy("production");
Application.setEnvironment("production");

// Bootstrap the application
bootstrap();
`;
    if (await fileExistsAsync(appPath("bootstrap.ts"))) {
      content += "import './../../src/app/bootstrap';\n";
    }

    await putFileAsync(path.join(this.productionDir, "bootstrap.ts"), content);
  }

  /**
   * Glob for module files matching a pattern
   * Returns relative paths from .warlock/production/ to src/app/
   */
  private async globModule(fileName: string): Promise<string[]> {
    const pattern = `**/${fileName}.{ts,tsx}`;
    const appDirectory = appPath();

    const files = await glob(pattern, {
      cwd: appDirectory,
      absolute: false,
    });

    // Convert to relative paths from .warlock/production/ to src/app/
    // e.g., "users/main" -> "../../src/app/users/main"
    return files.map((file) => "../../src/app/" + file.replace(/\.(ts|tsx)$/, ""));
  }

  /**
   * Glob for files in a specific directory pattern
   * Returns relative paths from .warlock/production/ to src/app/
   */
  private async globModuleDirectory(directory: string): Promise<string[]> {
    const pattern = `**/${directory}/*.{ts,tsx}`;
    const appDirectory = appPath();

    const files = await glob(pattern, {
      cwd: appDirectory,
      absolute: false,
    });

    return files.map((file) => "../../src/app/" + file.replace(/\.(ts|tsx)$/, ""));
  }

  /**
   * Generate config-loader.ts
   */
  private async generateConfigLoader(): Promise<void> {
    const configDirectory = path.join(process.cwd(), "src/config");

    const files = await glob("*.{ts,tsx}", {
      cwd: configDirectory,
      absolute: false,
    });

    const configNames = files.map((f) => f.replace(/\.(ts|tsx)$/, ""));

    const imports: string[] = [
      'import config from "@mongez/config";',
      'import { configSpecialHandlers } from "@warlock.js/core";',
    ];
    const configImports: string[] = [];
    const configSetCalls: string[] = [];
    const executors: string[] = [];

    for (const configName of configNames) {
      const varName = `${configName}Config`;
      configImports.push(`import ${varName} from "../../src/config/${configName}";`);
      configSetCalls.push(`config.set("${configName}", ${varName});`);
      executors.push(`await configSpecialHandlers.execute("${configName}", ${varName});`);
    }

    let content = [
      ...imports,
      "",
      "// Config imports",
      ...configImports,
      "",
      "// Register configs",
      ...configSetCalls,
      "",
      "// Special handlers",
      ...executors,
      "",
    ].join("\n");

    if (await fileExistsAsync(appPath("prestart.ts"))) {
      content += "import './../../src/app/prestart';\n";
    }

    await putFileAsync(path.join(this.productionDir, "config-loader.ts"), content);
  }

  /**
   * Generate locales.ts (only if there are locale files)
   * @returns true if file was generated with content
   */
  private async generateLocales(): Promise<boolean> {
    const files = await this.globModule("utils/locales");
    if (files.length === 0) return false;
    await this.generateImportsFile(files, "locales.ts");
    return true;
  }

  /**
   * Generate events.ts (only if there are event files)
   * @returns true if file was generated with content
   */
  private async generateEvents(): Promise<boolean> {
    const files = await this.globModuleDirectory("events");
    if (files.length === 0) return false;
    await this.generateImportsFile(files, "events.ts");
    return true;
  }

  /**
   * Generate main.ts (only if there are main files)
   * @returns true if file was generated with content
   */
  private async generateMain(): Promise<boolean> {
    const files = await this.globModule("main");
    if (files.length === 0) return false;
    await this.generateImportsFile(files, "main.ts");
    return true;
  }

  /**
   * Generate routes.ts (only if there are route files)
   * @returns true if file was generated with content
   */
  private async generateRoutes(): Promise<boolean> {
    const files = await this.globModule("routes");
    if (files.length === 0) return false;
    await this.generateImportsFile(files, "routes.ts");
    return true;
  }

  /**
   * Generate a file with imports from all given files
   */
  private async generateImportsFile(importPaths: string[], outputFile: string): Promise<void> {
    const imports = importPaths.map((importPath) => `import "${importPath}";`);
    const content = imports.join("\n") + "\n";
    await putFileAsync(path.join(this.productionDir, outputFile), content);
  }

  /**
   * Generate the main entry point (app.ts)
   */
  private async generateEntryPoint(): Promise<void> {
    console.log(colors.yellow("   Generating entry point..."));

    // Build imports based on which files were generated
    const imports: string[] = [
      "// 1. Bootstrap (loads .env, initializes framework)",
      'import "./bootstrap";',
      "",
      "// 2. Load configs",
      'import "./config-loader";',
    ];

    // Add special files in correct order (only if they have content)
    imports.push("", "// 3. Load special files in order");

    if (this.generatedFiles.events) {
      imports.push('import "./events";');
    }
    if (this.generatedFiles.locales) {
      imports.push('import "./locales";');
    }
    if (this.generatedFiles.main) {
      imports.push('import "./main";');
    }
    if (this.generatedFiles.routes) {
      imports.push('import "./routes";');
    }

    // Start connectors at the end
    imports.push(
      "",
      "// 4. Start connectors (database, cache, http)",
      'import { connectorsManager } from "@warlock.js/core";',
      "await connectorsManager.start();",
      `connectorsManager.shutdownOnProcessKill();`,
    );

    const content = imports.join("\n") + "\n";
    await putFileAsync(path.join(this.productionDir, "app.ts"), content);
  }

  /**
   * Bundle with esbuild
   */
  private async bundle(): Promise<void> {
    console.log(colors.magenta("   Bundling with esbuild..."));

    const entryPoint = path.join(this.productionDir, "app.ts");
    const outfile = path.resolve(this.options!.outDirectory!, this.options!.outFile!);

    await ensureDirectoryAsync(this.options!.outDirectory!);

    await esbuild.build({
      platform: "node",
      entryPoints: [entryPoint],
      bundle: true,
      packages: "external",
      minify: this.options!.minify,
      sourcemap: this.options!.sourcemap === true ? "linked" : this.options!.sourcemap,
      format: "esm",
      target: ["esnext"],
      outfile,
      plugins: [nativeNodeModulesPlugin],
    });
  }
}
