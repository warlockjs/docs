import type { CacheDriver, CacheKey, TaggedCacheDriver } from "./types";

/**
 * Tagged Cache Wrapper
 * Wraps a cache driver to automatically manage tag relationships
 */
export class TaggedCache implements TaggedCacheDriver {
  /**
   * The tags associated with this tagged cache instance
   */
  protected cacheTags: string[];

  /**
   * The underlying cache driver
   */
  protected driver: CacheDriver<any, any>;

  /**
   * Constructor
   */
  public constructor(tags: string[], driver: CacheDriver<any, any>) {
    this.cacheTags = tags;
    this.driver = driver;
  }

  /**
   * Get the tag key prefix for storing tag-key relationships
   */
  protected tagKey(tag: string): string {
    return `cache:tags:${tag}`;
  }

  /**
   * Store tag-key relationship
   */
  protected async storeTaggedKey(key: string): Promise<void> {
    for (const tag of this.cacheTags) {
      const tagKey = this.tagKey(tag);
      const keys = (await this.driver.get(tagKey)) || [];

      if (!keys.includes(key)) {
        keys.push(key);
        // Store tag relationships permanently
        await this.driver.set(tagKey, keys, Infinity);
      }
    }
  }

  /**
   * Get all keys associated with tags
   */
  protected async getTaggedKeys(): Promise<Set<string>> {
    const allKeys = new Set<string>();

    for (const tag of this.cacheTags) {
      const tagKey = this.tagKey(tag);
      const keys = (await this.driver.get(tagKey)) || [];

      for (const key of keys) {
        allKeys.add(key);
      }
    }

    return allKeys;
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: CacheKey, value: any, ttl?: number): Promise<any> {
    const parsedKey = this.driver.parseKey(key);

    // Store the value
    await this.driver.set(key, value, ttl);

    // Store tag-key relationship
    await this.storeTaggedKey(parsedKey);

    return value;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: CacheKey): Promise<any | null> {
    return this.driver.get(key);
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: CacheKey): Promise<void> {
    const parsedKey = this.driver.parseKey(key);

    // Remove the value
    await this.driver.remove(key);

    // Remove from all tag relationships
    for (const tag of this.cacheTags) {
      const tagKey = this.tagKey(tag);
      const keys = (await this.driver.get(tagKey)) || [];
      const updatedKeys = keys.filter((k: string) => k !== parsedKey);
      await this.driver.set(tagKey, updatedKeys, Infinity);
    }
  }

  /**
   * Invalidate (clear) all keys associated with the current tags
   */
  public async invalidate(): Promise<void> {
    const keysToRemove = await this.getTaggedKeys();

    // Remove all tagged keys
    for (const key of keysToRemove) {
      await this.driver.remove(key);
    }

    // Clear tag relationship keys
    for (const tag of this.cacheTags) {
      await this.driver.remove(this.tagKey(tag));
    }
  }

  /**
   * Flush all keys associated with the current tags
   * @deprecated Use invalidate() instead for better semantics
   */
  public async flush(): Promise<void> {
    return this.invalidate();
  }

  /**
   * {@inheritdoc}
   */
  public async has(key: CacheKey): Promise<boolean> {
    return this.driver.has(key);
  }

  /**
   * {@inheritdoc}
   */
  public async remember(
    key: CacheKey,
    ttl: number,
    callback: () => Promise<any>,
  ): Promise<any> {
    const value = await this.get(key);

    if (value !== null) {
      return value;
    }

    const result = await callback();
    await this.set(key, result, ttl);

    return result;
  }

  /**
   * {@inheritdoc}
   */
  public async pull(key: CacheKey): Promise<any | null> {
    const value = await this.get(key);

    if (value !== null) {
      await this.remove(key);
    }

    return value;
  }

  /**
   * {@inheritdoc}
   */
  public async forever(key: CacheKey, value: any): Promise<any> {
    return this.set(key, value, Infinity);
  }

  /**
   * {@inheritdoc}
   */
  public async increment(key: CacheKey, value: number = 1): Promise<number> {
    const current = (await this.get(key)) || 0;

    if (typeof current !== "number") {
      throw new Error(
        `Cannot increment non-numeric value for key: ${this.driver.parseKey(key)}`,
      );
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
}
