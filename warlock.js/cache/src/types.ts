import type { GenericObject } from "@mongez/reinforcements";
import type { RedisClientOptions } from "redis";
import type {
  BaseCacheDriver,
  FileCacheDriver,
  LRUMemoryCacheDriver,
  MemoryCacheDriver,
  MemoryExtendedCacheDriver,
  NullCacheDriver,
  RedisCacheDriver,
} from "./drivers";

/**
 * Base error class for cache-related errors
 */
export class CacheError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CacheError";
  }
}

/**
 * Error thrown when cache connection fails
 */
export class CacheConnectionError extends CacheError {
  public constructor(message: string) {
    super(message);
    this.name = "CacheConnectionError";
  }
}

/**
 * Error thrown when cache driver configuration is invalid
 */
export class CacheConfigurationError extends CacheError {
  public constructor(message: string) {
    super(message);
    this.name = "CacheConfigurationError";
  }
}

/**
 * Error thrown when cache driver is not initialized
 */
export class CacheDriverNotInitializedError extends CacheError {
  public constructor(
    message: string = "No cache driver initialized. Call cache.init() or cache.use() first.",
  ) {
    super(message);
    this.name = "CacheDriverNotInitializedError";
  }
}

/**
 * Cache key type - can be a string or an object
 */
export type CacheKey = string | GenericObject;

export type CacheOperationType =
  | "fetching"
  | "fetched"
  | "caching"
  | "cached"
  | "flushing"
  | "flushed"
  | "removing"
  | "removed"
  | "clearing"
  | "cleared"
  | "expired"
  | "notFound"
  | "connecting"
  | "error"
  | "connected"
  | "disconnecting"
  | "disconnected";

/**
 * Cache event types for observability
 */
export type CacheEventType =
  | "hit"
  | "miss"
  | "set"
  | "removed"
  | "flushed"
  | "expired"
  | "connected"
  | "disconnected"
  | "error";

/**
 * Cache event data structure
 */
export type CacheEventData = {
  /**
   * The cache key involved in the event
   */
  key?: string;
  /**
   * The value (for set/hit events)
   */
  value?: any;
  /**
   * TTL in seconds (for set events)
   */
  ttl?: number;
  /**
   * Driver name that emitted the event
   */
  driver: string;
  /**
   * Error object (for error events)
   */
  error?: any;
  /**
   * Namespace (for namespace operations)
   */
  namespace?: string;
};

/**
 * Event handler function type
 */
export type CacheEventHandler = (eventData: CacheEventData) => void | Promise<void>;

/**
 * Tagged cache interface for working with cache tags
 */
export interface TaggedCacheDriver {
  /**
   * Set a value in cache with tags
   */
  set(key: CacheKey, value: any, ttl?: number): Promise<any>;
  /**
   * Get a value from cache (checks tags)
   */
  get(key: CacheKey): Promise<any | null>;
  /**
   * Remove a specific key
   */
  remove(key: CacheKey): Promise<void>;
  /**
   * Invalidate (clear) all keys associated with the current tags
   */
  invalidate(): Promise<void>;
  /**
   * Flush all keys associated with the current tags
   * @deprecated Use invalidate() instead
   */
  flush(): Promise<void>;
  /**
   * Check if a key exists
   */
  has(key: CacheKey): Promise<boolean>;
  /**
   * Remember pattern with tags
   */
  remember(key: CacheKey, ttl: number, callback: () => Promise<any>): Promise<any>;
  /**
   * Pull value with tags
   */
  pull(key: CacheKey): Promise<any | null>;
  /**
   * Forever with tags
   */
  forever(key: CacheKey, value: any): Promise<any>;
  /**
   * Increment with tags
   */
  increment(key: CacheKey, value?: number): Promise<number>;
  /**
   * Decrement with tags
   */
  decrement(key: CacheKey, value?: number): Promise<number>;
}

export type MemoryCacheOptions = {
  /**
   * The global prefix for the cache key
   */
  globalPrefix?: string | (() => string);
  /**
   * The default TTL for the cache in seconds
   *
   * @default Infinity
   */
  ttl?: number;
  /**
   * Maximum number of items in cache
   * When exceeded, least recently used items will be evicted
   *
   * @default undefined (no limit)
   */
  maxSize?: number;
};

export type MemoryExtendedCacheOptions = MemoryCacheOptions;

export type LRUMemoryCacheOptions = {
  /**
   * The maximum number of items in the cache
   *
   * @default 1000
   */
  capacity?: number;
};

export type FileCacheOptions = {
  /**
   * The global prefix for the cache key
   */
  globalPrefix?: string | (() => string);
  /**
   * The default TTL for the cache in seconds
   *
   * @default 0
   */
  ttl?: number;
  /**
   * Storage cache directory
   *
   * @default storagePath("cache")
   */
  directory: string | (() => string);
  /**
   * File name
   *
   * @default cache.json
   */
  fileName?: string | (() => string);
};

export type RedisOptions = {
  /**
   * Redis Port
   *
   * @default 6379
   */
  port?: number;
  /**
   * Redis Host
   */
  host?: string;
  /**
   * Redis Username
   */
  username?: string;
  /**
   * Redis Password
   */
  password?: string;
  /**
   * Redis URL
   *
   * If used, it will override the host and port options
   */
  url?: string;
  /**
   * Global prefix for the cache key
   */
  globalPrefix?: string | (() => string);
  /**
   * Time to live in seconds
   *
   * @default Infinity
   */
  ttl?: number;
  /**
   * Redis client options
   */
  clientOptions?: RedisClientOptions;
};

export type NullCacheDriverOptions = GenericObject;

export interface CacheDriver<ClientType, Options> {
  /**
   * The cache driver options
   */
  options: Options;
  /**
   * Cache driver name
   */
  name: string;
  /**
   * Set logging state
   */
  setLoggingState(shouldLog: boolean): any;
  /**
   *  Remove all cached items by namespace
   */
  removeNamespace(namespace: string): Promise<any>;
  /**
   * Set the cache driver options
   */
  setOptions(options: Options): any;
  /**
   * Parse the key to be used in the cache
   */
  parseKey(key: CacheKey): string;
  /**
   * Set a value in the cache
   *
   * @param key The cache key, could be an object or string
   * @param value The value to be stored in the cache
   * @param ttl The time to live in seconds
   */
  set(key: CacheKey, value: any, ttl?: number): Promise<any>;
  /**
   * Get a value from the cache
   */
  get<T = any>(key: CacheKey): Promise<T | null>;
  /**
   * Remove a value from the cache
   */
  remove(key: CacheKey): Promise<void>;
  /**
   * Flush the entire cache
   */
  flush(): Promise<void>;
  /**
   * Connect to the cache driver
   */
  connect(): Promise<any>;
  /**
   * The cache client
   */
  client?: ClientType;
  /**
   * Disconnect the cache driver
   */
  disconnect(): Promise<void>;
  /**
   * Check if a key exists in the cache without fetching its value
   */
  has(key: CacheKey): Promise<boolean>;
  /**
   * Get value from cache or execute callback and cache the result
   *
   * @param key The cache key
   * @param ttl Time to live in seconds
   * @param callback Function to execute if cache miss
   */
  remember<T = any>(key: CacheKey, ttl: number, callback: () => Promise<T>): Promise<T>;
  /**
   * Get value and remove it from cache (atomic operation)
   */
  pull<T = any>(key: CacheKey): Promise<T | null>;
  /**
   * Set a value in cache permanently (no expiration)
   */
  forever<T = any>(key: CacheKey, value: T): Promise<T>;
  /**
   * Increment a numeric value in cache
   *
   * @param key The cache key
   * @param value The value to increment by (default 1)
   */
  increment(key: CacheKey, value?: number): Promise<number>;
  /**
   * Decrement a numeric value in cache
   *
   * @param key The cache key
   * @param value The value to decrement by (default 1)
   */
  decrement(key: CacheKey, value?: number): Promise<number>;
  /**
   * Get multiple values from cache at once
   */
  many(keys: CacheKey[]): Promise<any[]>;
  /**
   * Set multiple values in cache at once
   */
  setMany(items: Record<string, any>, ttl?: number): Promise<void>;
  /**
   * Register an event listener
   */
  on(event: CacheEventType, handler: CacheEventHandler): this;
  /**
   * Remove an event listener
   */
  off(event: CacheEventType, handler: CacheEventHandler): this;
  /**
   * Register a one-time event listener
   */
  once(event: CacheEventType, handler: CacheEventHandler): this;
  /**
   * Set if not exists (atomic operation)
   * Returns true if key was set, false if key already existed
   * Note: Not all drivers support this operation
   */
  setNX?(key: CacheKey, value: any, ttl?: number): Promise<boolean>;
  /**
   * Create a tagged cache instance for the given tags
   */
  tags(tags: string[]): TaggedCacheDriver;
}

export type CacheData = {
  /**
   * Value stored in the cache
   */
  data: any;
  /**
   * The expiration date in milliseconds
   */
  expiresAt?: number;
  /**
   * Time to live in seconds
   */
  ttl?: number;
};

export type DriverClass = new () => CacheDriver<any, any>;

type DefaultDrivers = "redis" | "file" | "memory" | "memoryExtended" | "null" | "lru";

type MergeWithDefaultDrivers<T> = T extends undefined ? DefaultDrivers : DefaultDrivers | T;

export type CacheConfigurations<
  T extends string | undefined = undefined,
  DriverName = MergeWithDefaultDrivers<T>,
> = {
  /**
   * The default cache driver name
   */
  default?: DriverName;
  /**
   * Determine whether to log or not
   *
   * @default true
   */
  logging?: boolean;
  /**
   * The cache drivers list
   */
  drivers: {
    redis?: typeof RedisCacheDriver;
    file?: typeof FileCacheDriver;
    null?: typeof NullCacheDriver;
    memory?: typeof MemoryCacheDriver;
    memoryExtended?: typeof MemoryExtendedCacheDriver;
    lru?: typeof LRUMemoryCacheDriver;
  } & {
    [key in Extract<T, string>]?: typeof BaseCacheDriver<any, any> | undefined;
  };
  /**
   * The cache driver options
   */
  options: {
    redis?: RedisOptions;
    file?: FileCacheOptions;
    memory?: MemoryCacheOptions;
    memoryExtended?: MemoryExtendedCacheOptions;
    null?: NullCacheDriverOptions;
    lru?: LRUMemoryCacheOptions;
  } & {
    [key in Extract<T, string>]?: GenericObject;
  };
};
