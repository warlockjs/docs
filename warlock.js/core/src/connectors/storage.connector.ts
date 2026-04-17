import { storage } from "../storage";
import { loadS3 } from "../storage/drivers/cloud-driver";
import { BaseConnector } from "./base-connector";
import { ConnectorPriority } from "./types";

/**
 * Cache Connector
 * Manages cache engine connection lifecycle
 */
export class StorageConnector extends BaseConnector {
  public readonly name = "storage";
  public readonly priority = ConnectorPriority.STORAGE;

  /**
   * Files that trigger cache restart
   */
  protected readonly watchedFiles = ["src/config/storage.ts", "src/config/storage.tsx"];

  /**
   * Initialize cache connection
   */
  public async start(): Promise<void> {
    await loadS3();
    await storage.init();

    this.active = true;
  }

  /**
   * Shutdown cache connection
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    storage.reset();

    this.active = false;
  }
}
