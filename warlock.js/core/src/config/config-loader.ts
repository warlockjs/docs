import config from "@mongez/config";
import { colors } from "@mongez/copper";
import { pathToFileURL } from "node:url";
import type { FileManager } from "../dev-server/file-manager";
import { warlockCachePath } from "../dev-server/utils";
import { configSpecialHandlers } from "./config-special-handlers";

/**
 * Special Config Handler
 * A function that handles special configuration loading
 */
export type SpecialConfigHandler = (configValue: any) => void | Promise<void>;

/**
 * Config Loader
 * Dynamically loads all configuration files and registers them with @mongez/config
 * Supports special handlers for configs that require additional processing
 */
export class ConfigLoader {
  /**
   * Load all configuration files
   * @param configFiles Array of config FileManager instances
   */
  public async loadAll(configFiles: FileManager[]): Promise<void> {
    if (configFiles.length === 0) {
      return;
    }

    // Load all configs in parallel
    // await Promise.all(
    //   configFiles.map(async file => {
    //     await this.loadConfig(file);
    //   }),
    // );
    for (const file of configFiles) {
      await this.loadConfig(file);
    }
  }

  /**
   * Load a single configuration file
   * @param file FileManager instance for the config file
   * @param bustCache Whether to bust the cache (add timestamp to URL)
   */
  public async loadConfig(file: FileManager, bustCache: boolean = false): Promise<void> {
    const configName = this.getConfigName(file.relativePath);
    // devLogInfo(`Loading configuration file: ${configName}`);

    try {
      // Convert absolute path to file:// URL for cross-platform compatibility
      let fileUrl =
        typeof __import !== "undefined"
          ? file.cachePath
          : pathToFileURL(warlockCachePath(file.cachePath)).href;

      // Add timestamp for cache busting (forces re-import for HMR)
      if (bustCache && typeof __import === "undefined") {
        const timestamp = Date.now();
        fileUrl += `?t=${timestamp}`;
      }

      // Dynamic import the config file

      const configModule =
        typeof __import !== "undefined" ? await __import(fileUrl) : await import(fileUrl);

      // Get the default export (the config value)
      const configValue = configModule.default;

      if (configValue === undefined) {
        console.log(
          colors.red(`config error: `),
          `Config file ${colors.yellow(file.relativePath)} does not have a default export`,
        );
        return;
      }

      // Store in @mongez/config
      // @mongez/config automatically handles nested access (e.g., config.get("database.host"))
      config.set(configName, configValue);

      // devLogInfo(`Configuration file loaded: ${file.relativePath}`);

      // Handle special configs if handler is registered
      await configSpecialHandlers.execute(configName, configValue);
      // devLogInfo(`Special configuration handled: ${configName}`);
    } catch (error) {
      throw error; // Abort on config errors
    }
  }

  /**
   * Reload a configuration file (for HMR)
   * @param file FileManager instance for the config file
   */
  public async reloadConfig(file: FileManager): Promise<void> {
    // Reload the config with cache busting (adds timestamp to URL)
    await this.loadConfig(file, true);
  }

  /**
   * Extract config name from file path
   * Examples:
   *   src/config/database.ts → "database"
   *   src/config/payment/stripe.ts → "payment.stripe"
   */
  private getConfigName(relativePath: string): string {
    // Extract the part after "src/config/"
    const match = relativePath.match(/^src\/config\/(.+)\.(ts|tsx)$/);

    if (!match) {
      throw new Error(`Invalid config file path: ${relativePath}`);
    }

    return match[1];
  }
}
