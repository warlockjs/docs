import { Context, contextManager } from "@warlock.js/context";
import type { StorageDriverContract } from "../types";

export type StorageDriverContextStore = {
  driver?: StorageDriverContract;
  prefix?: string;
  metadata?: Record<string, any>;
};

/**
 * Storage Driver Context
 *
 * Manages the active storage driver and path prefix using AsyncLocalStorage.
 * Allows multi-tenant applications to switch drivers and isolate storage paths per request context.
 *
 * @example
 * ```typescript
 * // Set driver with tenant-specific prefix
 * storageDriverContext.setDriver(storage.getDriver("s3"), {
 *   prefix: "tenant-123",
 *   metadata: { tenantId: "123" }
 * });
 *
 * // Or just set prefix for same driver
 * storageDriverContext.setPrefix("tenant-456");
 * ```
 */
class StorageDriverContext extends Context<StorageDriverContextStore> {
  /**
   * Get the current storage driver
   */
  public getDriver(): StorageDriverContract | undefined {
    return this.get("driver");
  }

  /**
   * Get the current path prefix (e.g., tenant-specific path)
   */
  public getPrefix(): string | undefined {
    return this.get("prefix");
  }

  /**
   * Get context metadata (e.g., tenantId)
   */
  public getMetadata(): Record<string, any> | undefined {
    return this.get("metadata");
  }

  /**
   * Set the active driver with optional prefix and metadata
   *
   * @param driver - Storage driver to use
   * @param options - Optional prefix and metadata
   */
  public setDriver(
    driver: StorageDriverContract,
    options?: { prefix?: string; metadata?: Record<string, any> },
  ): void {
    this.update({
      driver,
      prefix: options?.prefix,
      metadata: options?.metadata,
    });
  }

  /**
   * Set only the path prefix (keeps current driver)
   *
   * Useful for multi-tenant scenarios where you want to isolate
   * storage paths without changing the driver.
   *
   * @param prefix - Path prefix to prepend to all operations
   */
  public setPrefix(prefix: string): void {
    this.update({ prefix });
  }

  /**
   * Clear the prefix
   */
  public clearPrefix(): void {
    this.update({ prefix: undefined });
  }

  /**
   * Build the initial storage store with defaults
   */
  public buildStore(): StorageDriverContextStore {
    return {
      driver: undefined,
      prefix: undefined,
      metadata: undefined,
    };
  }
}

export const storageDriverContext = new StorageDriverContext();

contextManager.register("storage", storageDriverContext);
