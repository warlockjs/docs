import type { CacheDriver, CacheKey, LRUMemoryCacheOptions } from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

class CacheNode {
  public next: CacheNode | null = null;
  public prev: CacheNode | null = null;
  public expiresAt?: number;
  public constructor(
    public key: string,
    public value: any,
    ttl?: number,
  ) {
    if (ttl && ttl !== Infinity) {
      this.expiresAt = Date.now() + ttl * 1000;
    }
  }

  public get isExpired(): boolean {
    return this.expiresAt !== undefined && this.expiresAt < Date.now();
  }
}

/**
 * LRU Memory Cache Driver
 * The concept of LRU is to remove the least recently used data
 * whenever the cache is full
 * The question that resides here is how to tell the cache is full?
 */
export class LRUMemoryCacheDriver
  extends BaseCacheDriver<LRUMemoryCacheDriver, LRUMemoryCacheOptions>
  implements CacheDriver<LRUMemoryCacheDriver, LRUMemoryCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "lru";

  /**
   * Cache map
   */
  protected cache: Map<string, CacheNode> = new Map();

  /**
   * Head of the cache
   */
  protected head: CacheNode = new CacheNode("", null);

  /**
   * Tail of the cache
   */
  protected tail: CacheNode = new CacheNode("", null);

  /**
   * Cleanup interval reference
   */
  protected cleanupInterval?: NodeJS.Timeout;

  /**
   * {@inheritdoc}
   */
  public constructor() {
    super();

    this.init();
    this.startCleanup();
  }

  /**
   * Initialize the cache
   */
  public init() {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Start the cleanup process for expired items
   */
  public startCleanup() {
    // Clear existing interval if any
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, node] of this.cache) {
        if (node.expiresAt && node.expiresAt <= now) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        const node = this.cache.get(key);
        if (node) {
          this.removeNode(node);
          this.cache.delete(key);
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
  public async removeNamespace(_namespace: string) {
    throw new Error("Namespace is not supported in LRU cache driver.");
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: CacheKey, value: any, ttl?: number) {
    key = this.parseKey(key);

    this.log("caching", key);

    if (ttl === undefined) {
      ttl = this.ttl;
    }

    const existingNode = this.cache.get(key);
    if (existingNode) {
      existingNode.value = value;
      // Update TTL
      if (ttl && ttl !== Infinity) {
        existingNode.expiresAt = Date.now() + ttl * 1000;
      } else {
        existingNode.expiresAt = undefined;
      }

      this.moveHead(existingNode);
    } else {
      const newNode = new CacheNode(key, value, ttl);

      this.cache.set(key, newNode);

      this.addNode(newNode);
      if (this.cache.size > this.capacity) {
        this.removeTail();
      }
    }

    this.log("cached", key);

    // Emit set event
    await this.emit("set", { key, value, ttl });

    return this;
  }

  /**
   * Move the node to the head
   */
  protected moveHead(node: CacheNode) {
    this.removeNode(node);
    this.addNode(node);
  }

  /**
   * Remove the node from the cache
   */
  protected removeNode(node: CacheNode) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  /**
   * Add the node to the head
   */
  protected addNode(node: CacheNode) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  /**
   * Remove the tail node
   */
  protected removeTail() {
    const node = this.tail.prev!;

    this.removeNode(node);

    this.cache.delete(node.key);
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: CacheKey) {
    const parsedKey = this.parseKey(key);

    this.log("fetching", parsedKey);

    const node = this.cache.get(parsedKey);

    if (!node) {
      this.log("notFound", parsedKey);
      // Emit miss event
      await this.emit("miss", { key: parsedKey });
      return null;
    }

    // Check if expired
    if (node.isExpired) {
      this.removeNode(node);
      this.cache.delete(parsedKey);
      this.log("expired", parsedKey);
      // Emit expired event
      await this.emit("expired", { key: parsedKey });
      // Also emit miss since we're returning null
      await this.emit("miss", { key: parsedKey });
      return null;
    }

    this.moveHead(node);

    this.log("fetched", parsedKey);

    const value = node.value;

    // Apply cloning for immutability protection
    if (value === null || value === undefined) {
      return value;
    }

    const type = typeof value;
    if (type === "string" || type === "number" || type === "boolean") {
      // Emit hit event
      await this.emit("hit", { key: parsedKey, value });
      return value;
    }

    try {
      const clonedValue = structuredClone(value);
      // Emit hit event
      await this.emit("hit", { key: parsedKey, value: clonedValue });
      return clonedValue;
    } catch (error) {
      this.logError(`Failed to clone cached value for ${parsedKey}`, error);
      throw error;
    }
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: CacheKey) {
    const parsedKey = this.parseKey(key);

    this.log("removing", parsedKey);

    const node = this.cache.get(parsedKey);

    if (node) {
      this.removeNode(node);
      this.cache.delete(parsedKey);
    }

    this.log("removed", parsedKey);

    // Emit removed event
    await this.emit("removed", { key: parsedKey });
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.log("flushing");

    this.cache.clear();

    this.init();

    this.log("flushed");

    // Emit flushed event
    await this.emit("flushed");
  }

  /**
   * Get lru capacity
   */
  public get capacity() {
    return this.options.capacity || 1000;
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
