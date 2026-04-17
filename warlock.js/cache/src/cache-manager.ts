import type {
  CacheConfigurations,
  CacheDriver,
  CacheEventHandler,
  CacheEventType,
  CacheKey,
  DriverClass,
  TaggedCacheDriver,
} from "./types";
import { CacheConfigurationError, CacheDriverNotInitializedError } from "./types";

export class CacheManager implements CacheDriver<any, any> {
  /**
   * Cache Driver
   */
  public currentDriver?: CacheDriver<any, any>;

  /**
   * Loaded drivers
   */
  public loadedDrivers: Record<string, CacheDriver<any, any>> = {};

  /**
   * Configurations list
   */
  protected configurations: CacheConfigurations = {
    drivers: {},
    options: {},
  };

  /**
   * Global event listeners
   */
  protected globalEventListeners: Map<CacheEventType, Set<CacheEventHandler>> = new Map();

  /**
   * {@inheritdoc}
   */
  public name = "cacheManager";

  /**
   * {@inheritdoc}
   */
  public get client() {
    return this.currentDriver?.client;
  }

  /**
   * Set the cache configurations
   */
  public setCacheConfigurations(configurations: CacheConfigurations) {
    this.configurations.default = configurations.default;
    this.configurations.drivers = configurations.drivers;
    this.configurations.options = configurations.options;
    this.configurations.logging = configurations.logging;
  }

  /**
   * Set logging state
   */
  public setLoggingState(loggingState: boolean) {
    this.ensureDriverInitialized();

    this.currentDriver!.setLoggingState(loggingState);
  }

  /**
   * Use the given driver
   */
  public async use(driver: string | CacheDriver<any, any>) {
    if (typeof driver === "string") {
      const driverInstance = await this.load(driver);

      if (!driverInstance) {
        throw new CacheConfigurationError(
          `Cache driver ${driver} is not found, please declare it in the cache drivers in the configurations list.`,
        );
      }

      driver = driverInstance;
    }

    // Attach global listeners to the new driver
    this.attachGlobalListeners(driver);

    if (this.configurations.logging !== undefined) {
      driver.setLoggingState(this.configurations.logging);
    }

    this.currentDriver = driver;
    return this;
  }

  /**
   * Ensure driver is initialized before operations
   */
  protected ensureDriverInitialized(): void {
    if (!this.currentDriver) {
      throw new CacheDriverNotInitializedError();
    }
  }

  /**
   * {@inheritdoc}
   */
  public async get<T = any>(key: CacheKey): Promise<T | null> {
    this.ensureDriverInitialized();
    return this.currentDriver!.get(key);
  }

  /**
   * Set a value in the cache
   *
   * @param key The cache key, could be an object or string
   * @param value The value to be stored in the cache
   * @param ttl The time to live in seconds
   */
  public async set(key: CacheKey, value: any, ttl?: number) {
    this.ensureDriverInitialized();
    return this.currentDriver!.set(key, value, ttl);
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: CacheKey) {
    this.ensureDriverInitialized();
    return this.currentDriver!.remove(key);
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    this.ensureDriverInitialized();
    return this.currentDriver!.removeNamespace(namespace);
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.ensureDriverInitialized();
    return this.currentDriver!.flush();
  }

  /**
   * {@inheritdoc}
   */
  public async connect() {
    this.ensureDriverInitialized();
    return this.currentDriver!.connect();
  }

  /**
   * {@inheritdoc}
   */
  public parseKey(key: CacheKey) {
    this.ensureDriverInitialized();
    return this.currentDriver!.parseKey(key);
  }

  /**
   * {@inheritdoc}
   */
  public get options() {
    this.ensureDriverInitialized();
    return this.currentDriver!.options;
  }

  /**
   * {@inheritdoc}
   */
  public setOptions(options: Record<string, any>) {
    this.ensureDriverInitialized();
    return this.currentDriver!.setOptions(options || {});
  }

  /**
   * Get an instance of the cache driver
   */
  public async driver(driverName: string) {
    return this.loadedDrivers[driverName] || (await this.load(driverName));
  }

  /**
   * Initialize the cache manager and pick the default driver
   */
  public async init() {
    const defaultCacheDriverName = this.configurations.default;

    if (!defaultCacheDriverName) {
      return;
    }

    const driver = await this.driver(defaultCacheDriverName);

    await this.use(driver);
  }

  /**
   * Load the given cache driver name
   */
  public async load(driver: string) {
    if (this.loadedDrivers[driver]) return this.loadedDrivers[driver];

    const Driver = this.configurations.drivers[
      driver as keyof typeof this.configurations.drivers
    ] as DriverClass | undefined;

    if (!Driver) {
      throw new CacheConfigurationError(
        `Cache driver ${driver} is not found, please declare it in the cache drivers in the configurations list.`,
      );
    }

    const driverInstance = new Driver();

    driverInstance.setOptions(
      this.configurations.options[driver as keyof typeof this.configurations.options] || {},
    );

    await driverInstance.connect();

    // Attach global listeners to newly loaded driver
    this.attachGlobalListeners(driverInstance);

    this.loadedDrivers[driver] = driverInstance;

    return driverInstance as CacheDriver<any, any>;
  }

  /**
   * Register and bind a driver
   */
  public registerDriver(driverName: string, driverClass: DriverClass) {
    (this.configurations.drivers as Record<string, DriverClass>)[driverName] = driverClass;
  }

  /**
   * Disconnect the cache manager
   */
  public async disconnect() {
    if (this.currentDriver) {
      await this.currentDriver.disconnect();
    }
  }

  /**
   * {@inheritdoc}
   */
  public async has(key: CacheKey): Promise<boolean> {
    this.ensureDriverInitialized();
    return this.currentDriver!.has(key);
  }

  /**
   * {@inheritdoc}
   */
  public async remember(key: CacheKey, ttl: number, callback: () => Promise<any>): Promise<any> {
    this.ensureDriverInitialized();
    return this.currentDriver!.remember(key, ttl, callback);
  }

  /**
   * {@inheritdoc}
   */
  public async pull(key: CacheKey): Promise<any | null> {
    this.ensureDriverInitialized();
    return this.currentDriver!.pull(key);
  }

  /**
   * {@inheritdoc}
   */
  public async forever(key: CacheKey, value: any): Promise<any> {
    this.ensureDriverInitialized();
    return this.currentDriver!.forever(key, value);
  }

  /**
   * {@inheritdoc}
   */
  public async increment(key: CacheKey, value?: number): Promise<number> {
    this.ensureDriverInitialized();
    return this.currentDriver!.increment(key, value);
  }

  /**
   * {@inheritdoc}
   */
  public async decrement(key: CacheKey, value?: number): Promise<number> {
    this.ensureDriverInitialized();
    return this.currentDriver!.decrement(key, value);
  }

  /**
   * {@inheritdoc}
   */
  public async many(keys: CacheKey[]): Promise<any[]> {
    this.ensureDriverInitialized();
    return this.currentDriver!.many(keys);
  }

  /**
   * {@inheritdoc}
   */
  public async setMany(items: Record<string, any>, ttl?: number): Promise<void> {
    this.ensureDriverInitialized();
    return this.currentDriver!.setMany(items, ttl);
  }

  /**
   * Register a global event listener (applies to all drivers)
   */
  public on(event: CacheEventType, handler: CacheEventHandler): this {
    if (!this.globalEventListeners.has(event)) {
      this.globalEventListeners.set(event, new Set());
    }
    this.globalEventListeners.get(event)!.add(handler);

    // Also attach to current driver if exists
    if (this.currentDriver) {
      this.currentDriver.on(event, handler);
    }

    // Attach to all loaded drivers
    for (const driver of Object.values(this.loadedDrivers)) {
      driver.on(event, handler);
    }

    return this;
  }

  /**
   * Remove a global event listener
   */
  public off(event: CacheEventType, handler: CacheEventHandler): this {
    const handlers = this.globalEventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }

    // Also remove from current driver
    if (this.currentDriver) {
      this.currentDriver.off(event, handler);
    }

    // Remove from all loaded drivers
    for (const driver of Object.values(this.loadedDrivers)) {
      driver.off(event, handler);
    }

    return this;
  }

  /**
   * Register a one-time global event listener
   */
  public once(event: CacheEventType, handler: CacheEventHandler): this {
    const onceHandler: CacheEventHandler = async (data) => {
      await handler(data);
      this.off(event, onceHandler);
    };
    return this.on(event, onceHandler);
  }

  /**
   * Attach global listeners to a driver
   */
  protected attachGlobalListeners(driver: CacheDriver<any, any>) {
    for (const [event, handlers] of this.globalEventListeners) {
      for (const handler of handlers) {
        driver.on(event, handler);
      }
    }
  }

  /**
   * Set if not exists (atomic operation)
   * Returns true if key was set, false if key already existed
   * Note: Only supported by drivers that implement setNX (e.g., Redis)
   */
  public async setNX(key: CacheKey, value: any, ttl?: number): Promise<boolean> {
    this.ensureDriverInitialized();

    if (!this.currentDriver!.setNX) {
      throw new Error(
        `setNX is not supported by the current cache driver: ${this.currentDriver!.name}`,
      );
    }

    return this.currentDriver!.setNX(key, value, ttl);
  }

  /**
   * Create a tagged cache instance for the given tags
   */
  public tags(tags: string[]): TaggedCacheDriver {
    this.ensureDriverInitialized();
    return this.currentDriver!.tags(tags);
  }
}

export const cache = new CacheManager();
