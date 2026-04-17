import type { GenericObject } from "@mongez/reinforcements";
import { get, set, unset } from "@mongez/reinforcements";
import type {
  CacheData,
  CacheDriver,
  CacheKey,
  MemoryCacheOptions,
} from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

export class MemoryCacheDriver
  extends BaseCacheDriver<MemoryCacheDriver, MemoryCacheOptions>
  implements CacheDriver<MemoryCacheDriver, MemoryCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "memory";

  /**
   * Cached data
   */
  public data: GenericObject = {};

  /**
   * List of data that will be cleared from cache
   */
  protected temporaryData: Record<
    string,
    {
      key: string;
      expiresAt: number;
    }
  > = {};

  /**
   * Cleanup interval reference
   */
  protected cleanupInterval?: NodeJS.Timeout;

  /**
   * Access order tracking for LRU eviction (when maxSize is set)
   */
  protected accessOrder: string[] = [];

  /**
   * {@inheritdoc}
   */
  public constructor() {
    super();

    this.startCleanup();
  }

  /**
   * Start the cleanup process whenever a data that has a cache key is set
   */
  public startCleanup() {
    // Clear existing interval if any
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      const now = Date.now();

      for (const key in this.temporaryData) {
        if (this.temporaryData[key].expiresAt <= now) {
          await this.remove(this.temporaryData[key].key);
          delete this.temporaryData[key];

          this.log("expired", key);
          // Emit expired event
          await this.emit("expired", { key });
        }
      }
    }, 1000);

    // do not block the process from exiting
    this.cleanupInterval.unref();
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    this.log("clearing", namespace);

    namespace = this.parseKey(namespace);

    unset(this.data, [namespace]);

    this.log("cleared", namespace);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: CacheKey, value: any, ttl?: number) {
    const parsedKey = this.parseKey(key);

    this.log("caching", parsedKey);

    if (ttl === undefined) {
      ttl = this.ttl;
    }

    const data = this.prepareDataForStorage(value, ttl);

    if (ttl) {
      // it means we need to check for expiration
      this.setTemporaryData(key, parsedKey, ttl);
    }

    // Check if key already exists
    const existingData = get(this.data, parsedKey);
    const isNewKey = !existingData;

    set(this.data, parsedKey, data);

    // Track access for LRU eviction
    this.trackAccess(parsedKey);

    // Check size limit and evict if necessary
    if (isNewKey && this.options.maxSize) {
      await this.enforceMaxSize();
    }

    this.log("cached", parsedKey);

    // Emit set event
    await this.emit("set", { key: parsedKey, value, ttl });

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: CacheKey) {
    const parsedKey = this.parseKey(key);

    this.log("fetching", parsedKey);

    const value: CacheData = get(this.data, parsedKey);

    if (!value) {
      this.log("notFound", parsedKey);
      // Emit miss event
      await this.emit("miss", { key: parsedKey });
      return null;
    }

    const result = await this.parseCachedData(parsedKey, value);

    if (result === null) {
      // Expired
      await this.emit("miss", { key: parsedKey });
    } else {
      // Track access for LRU
      this.trackAccess(parsedKey);
      // Emit hit event
      await this.emit("hit", { key: parsedKey, value: result });
    }

    return result;
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: CacheKey) {
    const parsedKey = this.parseKey(key);

    this.log("removing", parsedKey);

    unset(this.data, [parsedKey]);

    // Clean up from temporaryData as well
    delete this.temporaryData[parsedKey];

    // Remove from access order
    this.removeFromAccessOrder(parsedKey);

    this.log("removed", parsedKey);

    // Emit removed event
    await this.emit("removed", { key: parsedKey });
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.log("flushing");
    if (this.options.globalPrefix) {
      this.removeNamespace("");
    } else {
      this.data = {};
      this.accessOrder = [];
    }

    this.log("flushed");

    // Emit flushed event
    await this.emit("flushed");
  }

  /**
   * Set the temporary data
   */
  protected setTemporaryData(key: CacheKey, parsedKey: string, ttl: number) {
    this.temporaryData[parsedKey] = {
      key: JSON.stringify(key),
      expiresAt: Date.now() + ttl * 1000,
    };
  }

  /**
   * Track access for LRU eviction
   */
  protected trackAccess(key: string) {
    if (!this.options.maxSize) return;

    // Remove key from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order tracking
   */
  protected removeFromAccessOrder(key: string) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Enforce max size by evicting least recently used items
   */
  protected async enforceMaxSize() {
    if (!this.options.maxSize) return;

    // Count actual cache items (excluding internal metadata)
    const cacheSize = this.getCacheSize();

    while (cacheSize > this.options.maxSize && this.accessOrder.length > 0) {
      // Evict least recently used (first in array)
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.log("removing", lruKey);
        unset(this.data, [lruKey]);
        delete this.temporaryData[lruKey];
        this.log("removed", lruKey);
        // Could emit 'evicted' event if we add that type
      }
    }
  }

  /**
   * Get current cache size (number of cached items)
   */
  protected getCacheSize(): number {
    // Count top-level keys in data object
    return Object.keys(this.data).length;
  }

  /**
   * {@inheritdoc}
   */
  public async disconnect() {
    // Clear the cleanup interval to prevent memory leaks
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    await super.disconnect();
  }
}
