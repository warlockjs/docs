import { FileManager } from "../dev-server/file-manager";
import { ConfigLoader } from "./config-loader";

export class ConfigManager {
  /**
   * Config loader instance
   */
  public loader = new ConfigLoader();

  /**
   * Constructor
   */
  public constructor() {
    //
  }

  /**
   * Load all config files
   */
  public async loadAll(files: FileManager[]) {
    return this.loader.loadAll(files);
  }

  /**
   * Reload a config file
   */
  public async reload(file: FileManager) {
    return this.loader.reloadConfig(file);
  }
}

export const configManager = new ConfigManager();
