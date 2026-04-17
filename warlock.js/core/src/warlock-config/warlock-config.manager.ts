import { fileExistsAsync, getFileAsync, putFileAsync } from "@mongez/fs";
import { get } from "@mongez/reinforcements";
import { pathToFileURL } from "url";
import { devLogWarn } from "../dev-server/dev-logger";
import { rootPath, warlockPath } from "../utils";
import { transpile } from "./../dev-server/transpile-file";
import { WarlockConfig } from "./types";

/**
 * Warlock Config Manager
 *
 * Manages lazy loading of the pre-compiled warlock.config.js file
 * from the .warlock/cache directory.
 */
export class WarlockConfigManager {
  /**
   * Cached config instance
   */
  private config?: WarlockConfig;

  /**
   * Loading promise to prevent duplicate loads
   */
  private loading?: Promise<WarlockConfig | undefined>;

  /**
   * Load warlock.config.js (cached after first load)
   *
   * @returns The resolved Warlock configuration
   */
  public async load(): Promise<WarlockConfig | undefined> {
    // Already loaded
    if (this.config) {
      return this.config;
    }

    // Currently loading (prevent duplicate loads)
    if (this.loading) {
      return this.loading;
    }

    // Start loading
    this.loading = this.doLoad();
    this.config = await this.loading;
    this.loading = undefined;

    return this.config;
  }

  /**
   * Internal load implementation
   */
  private async doLoad(): Promise<WarlockConfig | undefined> {
    const configPath = warlockPath("cache/warlock-config.js");

    // if (!(await fileExistsAsync(configPath))) {
    const result = await this.compile();

    if (!result) {
      devLogWarn(
        "warlock.config.ts is missing, it's highly recommended to create it, run warlock init to create it",
      );
      return;
    }
    // }

    const fileUrl = pathToFileURL(configPath).href;
    try {
      const configModule = await import(fileUrl);

      return configModule.default;
    } catch (error) {
      throw new Error(
        `Failed to load warlock.config.js from ${fileUrl}. ` +
          `Make sure the config has been compiled. Error: ${error}`,
      );
    }
  }

  /**
   * Compile warlock.config.ts file
   */
  protected async compile() {
    const configPath = rootPath("warlock.config.ts");
    if (!(await fileExistsAsync(configPath))) {
      return false;
    }

    const content = await getFileAsync(configPath);
    const compiledContent = await transpile(content, configPath);
    await putFileAsync(warlockPath("cache/warlock-config.js"), compiledContent);
    return true;
  }

  /**
   * Get config value by key (dot notation supported)
   *
   * @example
   * config.get("server.port") // Returns 3000
   * config.get("cli.commands") // Returns array of commands
   *
   * @param key - Config key (supports dot notation), autocompletes for first level only
   * @returns The config value
   * @throws Error if config is not loaded
   */
  public get<Key extends keyof WarlockConfig>(
    key: Key,
    defaultValue?: WarlockConfig[Key],
  ): WarlockConfig[Key] {
    if (!this.config) {
      throw new Error("WarlockConfig not loaded. Call load() first or use lazyGet().");
    }

    return get(this.config, key as string, defaultValue);
  }

  /**
   * Lazy get - loads config if not already loaded
   *
   * @example
   * const port = await config.lazyGet("server");
   *
   * @param key - Config key (supports dot notation), autocompletes for first level only
   * @param defaultValue - Default value if config key is undefined
   * @returns The config value
   */
  async lazyGet<Key extends keyof WarlockConfig>(
    key: Key,
    defaultValue?: WarlockConfig[Key],
  ): Promise<WarlockConfig[Key]> {
    await this.load();
    return this.get(key, defaultValue);
  }

  /**
   * Check if config is loaded
   */
  public get isLoaded(): boolean {
    return this.config !== undefined;
  }

  /**
   * Get the entire config object
   *
   * @throws Error if config is not loaded
   */
  public getAll(): WarlockConfig {
    if (!this.config) {
      throw new Error("WarlockConfig not loaded. Call load() first or use lazyGet().");
    }

    return this.config;
  }

  /**
   * Reload config (useful for HMR/development)
   */
  public async reload(): Promise<void> {
    this.config = undefined;
    this.loading = undefined;
    await this.load();
  }
}

/**
 * Exported singleton instance
 *
 * @example
 * import { warlockConfig } from "@warlock.js/core";
 *
 * // Lazy load and get value
 * const port = await warlockConfig.lazyGet("server.port");
 *
 * // Or load first, then get
 * await warlockConfig.load();
 * const commands = warlockConfig.get("cli.commands");
 */
export const warlockConfigManager = new WarlockConfigManager();
