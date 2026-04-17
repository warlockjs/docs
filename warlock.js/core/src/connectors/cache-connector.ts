import config from "@mongez/config";
import { cache } from "@warlock.js/cache";
import { BaseConnector } from "./base-connector";
import { ConnectorPriority } from "./types";

/**
 * Cache Connector
 * Manages cache engine connection lifecycle
 */
export class CacheConnector extends BaseConnector {
  public readonly name = "cache";
  public readonly priority = ConnectorPriority.CACHE;

  /**
   * Files that trigger cache restart
   */
  protected readonly watchedFiles = ["src/config/cache.ts", "src/config/cache.tsx"];

  /**
   * Initialize cache connection
   */
  public async start(): Promise<void> {
    const cacheConfig = config.get("cache");

    if (!cacheConfig) return;

    cache.setCacheConfigurations(cacheConfig);

    await cache.init();

    this.active = true;
  }

  /**
   * Shutdown cache connection
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    // TODO: Implement actual cache disconnection
    // - Close all active connections
    // - Clean up resources

    this.active = false;
  }
}
