import { log } from "@warlock.js/logger";
import { TaggedCache } from "../tagged-cache";
import type {
  CacheData,
  CacheDriver,
  CacheEventData,
  CacheEventHandler,
  CacheEventType,
  CacheKey,
  CacheOperationType,
} from "../types";
import { parseCacheKey } from "../utils";

const messages = {
  clearing: "Clearing namespace",
  cleared: "Namespace cleared",
  fetching: "Fetching key",
  fetched: "Key fetched",
  caching: "Caching key",
  cached: "Key cached",
  flushing: "Flushing cache",
  flushed: "Cache flushed",
  removing: "Removing key",
  removed: "Key removed",
  expired: "Key expired",
  notFound: "Key not found",
  connecting: "Connecting to the cache engine.",
  connected: "Connected to the cache engine.",
  disconnecting: "Disconnecting from the cache engine.",
  disconnected: "Disconnected from the cache engine.",
  error: "Error occurred",
};

export abstract class BaseCacheDriver<
  ClientType,
  Options extends Record<string, any>,
> implements CacheDriver<ClientType, Options> {
  /**
   * CLient driver
   */
  protected clientDriver!: ClientType;

  /**
   * Determine whether to log or not
   */
  protected shouldLog: boolean = true;

  /**
   * {@inheritdoc}
   */
  public get client() {
    return (this.clientDriver || this) as unknown as ClientType;
  }

  /**
   * Set logging state
   */
  public setLoggingState(shouldLog: boolean) {
    this.shouldLog = shouldLog;

    return this;
  }

  /**
   * Set client driver
   */
  public set client(client: ClientType) {
    this.clientDriver = client;
  }

  /**
   * Get the cache driver name
   */
  public abstract name: string;

  /**
   * Options list
   */
  public options!: Options;

  /**
   * Event listeners storage
   */
  protected eventListeners: Map<CacheEventType, Set<CacheEventHandler>> = new Map();

  /**
   * {@inheritdoc}
   */
  public parseKey(key: CacheKey) {
    return parseCacheKey(key, this.options);
  }

  /**
   * {@inheritdoc}
   */
  public setOptions(options: Options) {
    this.options = options || {};
    return this;
  }

  /**
   * Register an event listener
   */
  public on(event: CacheEventType, handler: CacheEventHandler): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return this;
  }

  /**
   * Remove an event listener
   */
  public off(event: CacheEventType, handler: CacheEventHandler): this {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
    return this;
  }

  /**
   * Register a one-time event listener
   */
  public once(event: CacheEventType, handler: CacheEventHandler): this {
    const onceHandler: CacheEventHandler = async (data) => {
      await handler(data);
      this.off(event, onceHandler);
    };
    return this.on(event, onceHandler);
  }

  /**
   * Emit an event to all registered listeners
   */
  protected async emit(event: CacheEventType, data: Partial<CacheEventData> = {}): Promise<void> {
    const handlers = this.eventListeners.get(event);
    if (!handlers || handlers.size === 0) return;

    const eventData: CacheEventData = {
      driver: this.name,
      ...data,
    };

    // Execute all handlers
    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      try {
        const result = handler(eventData);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        this.logError(`Error in event handler for '${event}'`, error);
      }
    }

    // Wait for all async handlers
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * {@inheritdoc}
   */
  public abstract removeNamespace(namespace: string): Promise<any>;

  /**
   * {@inheritdoc}
   */
  public abstract set(key: CacheKey, value: any, ttl?: number): Promise<any>;

  /**
   * {@inheritdoc}
   */
  public abstract get(key: CacheKey): Promise<any>;

  /**
   * {@inheritdoc}
   */
  public abstract remove(key: CacheKey): Promise<void>;

  /**
   * {@inheritdoc}
   */
  public abstract flush(): Promise<void>;

  /**
   * {@inheritdoc}
   */
  public async has(key: CacheKey): Promise<boolean> {
    const value = await this.get(key);
    // Event is emitted by get() method
    return value !== null;
  }

  /**
   * Lock storage for preventing cache stampede
   */
  protected locks: Map<string, Promise<any>> = new Map();

  /**
   * {@inheritdoc}
   */
  public async remember(key: CacheKey, ttl: number, callback: () => Promise<any>): Promise<any> {
    const parsedKey = this.parseKey(key);

    // Check cache first
    const cachedValue = await this.get(key);
    if (cachedValue) {
      return cachedValue;
    }

    // Check if another request is already computing this value
    const existingLock = this.locks.get(parsedKey);
    if (existingLock) {
      return existingLock;
    }

    // Create lock and compute value
    const promise = callback()
      .then(async (result) => {
        await this.set(key, result, ttl);
        this.locks.delete(parsedKey);
        return result;
      })
      .catch((err) => {
        this.locks.delete(parsedKey);
        throw err;
      });

    this.locks.set(parsedKey, promise);
    return promise;
  }

  /**
   * {@inheritdoc}
   */
  public async pull(key: CacheKey): Promise<any | null> {
    const value = await this.get(key);
    if (value !== null) {
      await this.remove(key);
    }
    // Events are emitted by get() and remove() methods
    return value;
  }

  /**
   * {@inheritdoc}
   */
  public async forever(key: CacheKey, value: any): Promise<any> {
    // Event is emitted by set() method
    return this.set(key, value, Infinity);
  }

  /**
   * {@inheritdoc}
   */
  public async increment(key: CacheKey, value: number = 1): Promise<number> {
    const current = (await this.get(key)) || 0;

    if (typeof current !== "number") {
      throw new Error(`Cannot increment non-numeric value for key: ${this.parseKey(key)}`);
    }

    const newValue = current + value;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * {@inheritdoc}
   */
  public async decrement(key: CacheKey, value: number = 1): Promise<number> {
    return this.increment(key, -value);
  }

  /**
   * {@inheritdoc}
   */
  public async many(keys: CacheKey[]): Promise<any[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  /**
   * {@inheritdoc}
   */
  public async setMany(items: Record<string, any>, ttl?: number): Promise<void> {
    await Promise.all(Object.entries(items).map(([key, value]) => this.set(key, value, ttl)));
  }

  /**
   * Log the operation
   */
  protected log(operation: CacheOperationType, key?: string) {
    if (!this.shouldLog) return;

    if (key) {
      // this will be likely used with file cache driver as it will convert the dot to slash
      // to make it consistent and not to confuse developers we will output the key by making sure it's a dot
      key = key.replaceAll("/", ".");
    }

    if (operation == "notFound" || operation == "expired") {
      return log.warn(
        "cache." + this.name,
        operation,
        (key ? key + " " : "") + messages[operation],
      );
    }

    if (operation.endsWith("ed")) {
      return log.success(
        "cache." + this.name,
        operation,
        (key ? key + " " : "") + messages[operation],
      );
    }

    log.info("cache." + this.name, operation, (key ? key + " " : "") + messages[operation]);
  }

  /**
   * Log error message
   */
  protected logError(message: string, error?: any) {
    log.error("cache." + this.name, "error", message);
    if (error) {
      console.log(error);
    }
  }

  /**
   * Get time to live value
   */
  public get ttl() {
    return this.options.ttl !== undefined ? this.options.ttl : Infinity;
  }

  /**
   * Get time to live value in milliseconds
   */
  public getExpiresAt(ttl: number = this.ttl) {
    if (ttl) {
      return new Date().getTime() + ttl * 1000;
    }
  }

  /**
   * Prepare data for storage
   */
  protected prepareDataForStorage(data: any, ttl?: number) {
    const preparedData: CacheData = {
      data,
    };

    if (ttl) {
      preparedData.ttl = ttl;
      preparedData.expiresAt = this.getExpiresAt(ttl);
    }

    return preparedData;
  }

  /**
   * Parse fetched data from cache
   */
  protected async parseCachedData(key: string, data: CacheData) {
    this.log("fetched", key);

    if (data.expiresAt && data.expiresAt < Date.now()) {
      this.remove(key);
      return null;
    }

    const value = data.data;

    // Skip cloning for primitives (immutable types)
    if (value === null || value === undefined) {
      return value;
    }

    const type = typeof value;
    if (type === "string" || type === "number" || type === "boolean") {
      return value;
    }

    // Deep clone objects/arrays to prevent cache mutation
    try {
      return structuredClone(value);
    } catch (error) {
      console.log(value);

      this.logError(
        `Failed to clone cached value for ${key}, typeof value: ${typeof value}`,
        error,
      );
      throw error;
    }
  }

  /**
   * {@inheritdoc}
   */
  public async connect() {
    this.log("connecting");
    this.log("connected");
    await this.emit("connected");
  }

  /**
   * {@inheritdoc}
   */
  public async disconnect() {
    this.log("disconnected");
    await this.emit("disconnected");
  }

  /**
   * Create a tagged cache instance for the given tags
   */
  public tags(tags: string[]): any {
    return new TaggedCache(tags, this);
  }
}
