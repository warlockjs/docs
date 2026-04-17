import { log } from "@warlock.js/logger";
import type { createClient } from "redis";
import type { CacheDriver, CacheKey, RedisOptions } from "../types";
import { CacheConfigurationError } from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

// ============================================================
// Lazy-loaded Redis SDK Types
// ============================================================

/**
 * Cached Redis module (loaded once, reused)
 */
let RedisClient: typeof import("redis");

let isModuleExists: boolean | null = null;

/**
 * Installation instructions for Redis package
 */
const REDIS_INSTALL_INSTRUCTIONS = `
Redis cache driver requires the redis package.
Install it with:

  npm install redis

Or with your preferred package manager:

  pnpm add redis
  yarn add redis
`.trim();

/**
 * Load Redis module
 */
async function loadRedis() {
  try {
    RedisClient = await import("redis");
    isModuleExists = true;
  } catch {
    isModuleExists = false;
  }
}

loadRedis();

// ============================================================
// RedisCacheDriver Class
// ============================================================

export class RedisCacheDriver
  extends BaseCacheDriver<ReturnType<typeof createClient>, RedisOptions>
  implements CacheDriver<ReturnType<typeof createClient>, RedisOptions>
{
  /**
   * Cache driver name
   */
  public name = "redis";

  /**
   * {@inheritdoc}
   */
  public setOptions(options: RedisOptions) {
    if (!options.url && !options.host) {
      throw new CacheConfigurationError(
        "Redis driver requires either 'url' or 'host' option to be configured.",
      );
    }

    return super.setOptions(options);
  }

  /**
   * {@inheritDoc}
   */
  public async removeNamespace(namespace: string) {
    namespace = this.parseKey(namespace);

    this.log("clearing", namespace);

    const keys = await this.client?.keys(`${namespace}*`);

    if (!keys || keys.length === 0) {
      this.log("notFound", namespace);
      return;
    }

    await this.client?.del(keys);

    this.log("cleared", namespace);

    return keys;
  }

  /**
   * {@inheritDoc}
   */
  public async set(key: CacheKey, value: any, ttl?: number) {
    key = this.parseKey(key);

    this.log("caching", key);

    if (ttl === undefined) {
      ttl = this.ttl;
    }

    // Use Redis native expiration instead of manual checking
    if (ttl && ttl !== Infinity) {
      await this.client?.set(key, JSON.stringify(value), { EX: ttl });
    } else {
      await this.client?.set(key, JSON.stringify(value));
    }

    this.log("cached", key);

    // Emit set event
    await this.emit("set", { key, value, ttl });

    return value;
  }

  /**
   * {@inheritDoc}
   */
  public async get(key: CacheKey) {
    key = this.parseKey(key);

    this.log("fetching", key);

    const value = await this.client?.get(key);

    if (!value) {
      this.log("notFound", key);
      // Emit miss event
      await this.emit("miss", { key });
      return null;
    }

    this.log("fetched", key);

    // Parse and return the value directly (Redis handles expiration natively)
    const parsedValue = JSON.parse(value);

    // Apply cloning for immutability protection
    if (parsedValue === null || parsedValue === undefined) {
      // Emit hit event
      await this.emit("hit", { key, value: parsedValue });
      return parsedValue;
    }

    const type = typeof parsedValue;
    if (type === "string" || type === "number" || type === "boolean") {
      // Emit hit event
      await this.emit("hit", { key, value: parsedValue });
      return parsedValue;
    }

    try {
      const clonedValue = structuredClone(parsedValue);
      // Emit hit event
      await this.emit("hit", { key, value: clonedValue });
      return clonedValue;
    } catch (error) {
      this.logError(`Failed to clone cached value for ${key}`, error);
      throw error;
    }
  }

  /**
   * {@inheritDoc}
   */
  public async remove(key: CacheKey) {
    key = this.parseKey(key);

    this.log("removing", key);

    await this.client?.del(key);

    this.log("removed", key);

    // Emit removed event
    await this.emit("removed", { key });
  }

  /**
   * {@inheritDoc}
   */
  public async flush() {
    this.log("flushing");

    if (this.options.globalPrefix) {
      await this.removeNamespace("");
    } else {
      await this.client?.flushAll();
    }

    this.log("flushed");

    // Emit flushed event
    await this.emit("flushed");
  }

  /**
   * {@inheritDoc}
   */
  public async connect() {
    if (this.clientDriver) return;

    if (!isModuleExists) {
      throw new Error(REDIS_INSTALL_INSTRUCTIONS);
    }

    const options = this.options;

    if (options && !options.url && options.host) {
      const auth =
        options.password || options.username ? `${options.username}:${options.password}@` : "";

      if (!options.url) {
        const host = options.host || "localhost";
        const port = options.port || 6379;
        options.url = `redis://${auth}${host}:${port}`;
      }
    }

    const clientOptions = {
      ...options,
      ...(this.options.clientOptions || {}),
    };

    this.log("connecting");
    const { createClient } = RedisClient;

    this.client = createClient(clientOptions);

    this.client.on("error", (error: Error) => {
      this.log("error", error.message);
    });
    try {
      await this.client.connect();

      this.log("connected");
      await this.emit("connected");
    } catch (error) {
      log.error("cache", "redis", error);
      await this.emit("error", { error });
    }
  }

  /**
   * {@inheritDoc}
   */
  public async disconnect() {
    if (!this.client) return;

    this.log("disconnecting");

    await this.client.quit();

    this.log("disconnected");
    await this.emit("disconnected");
  }

  /**
   * Atomic increment using Redis native INCRBY command
   * {@inheritdoc}
   */
  public async increment(key: CacheKey, value: number = 1): Promise<number> {
    const parsedKey = this.parseKey(key);

    this.log("caching", parsedKey);

    const result = await this.client?.incrBy(parsedKey, value);

    this.log("cached", parsedKey);

    // Emit set event
    await this.emit("set", { key: parsedKey, value: result, ttl: undefined });

    return result || 0;
  }

  /**
   * Atomic decrement using Redis native DECRBY command
   * {@inheritdoc}
   */
  public async decrement(key: CacheKey, value: number = 1): Promise<number> {
    const parsedKey = this.parseKey(key);

    this.log("caching", parsedKey);

    const result = await this.client?.decrBy(parsedKey, value);

    this.log("cached", parsedKey);

    // Emit set event
    await this.emit("set", { key: parsedKey, value: result, ttl: undefined });

    return result || 0;
  }

  /**
   * Set if not exists (atomic operation)
   * Returns true if key was set, false if key already existed
   */
  public async setNX(key: CacheKey, value: any, ttl?: number): Promise<boolean> {
    const parsedKey = this.parseKey(key);

    this.log("caching", parsedKey);

    if (ttl === undefined) {
      ttl = this.ttl;
    }

    let result: string | null;

    // Use Redis native SET with NX option
    if (ttl && ttl !== Infinity) {
      result = await this.client?.set(parsedKey, JSON.stringify(value), {
        NX: true,
        EX: ttl,
      });
    } else {
      result = await this.client?.set(parsedKey, JSON.stringify(value), {
        NX: true,
      });
    }

    const wasSet = result === "OK";

    if (wasSet) {
      this.log("cached", parsedKey);
      // Emit set event
      await this.emit("set", { key: parsedKey, value, ttl });
    } else {
      this.log("notFound", parsedKey);
    }

    return wasSet;
  }
}
