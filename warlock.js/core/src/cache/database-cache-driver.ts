import {
  BaseCacheDriver,
  type CacheData,
  type CacheDriver,
  type CacheKey,
} from "@warlock.js/cache";
import { Model } from "@warlock.js/cascade";

export type DatabaseCacheOptions = {
  /**
   * Database model class
   */
  model?: typeof CacheModel;
  /**
   * Global prefix for the cache key
   */
  globalPrefix?: string | (() => string);
  /**
   * The default TTL for the cache in seconds
   *
   * @default Infinity
   */
  ttl?: number;
};

export class CacheModel extends Model {
  public static table = "cache";
}

export class DatabaseCacheDriver
  extends BaseCacheDriver<DatabaseCacheDriver, DatabaseCacheOptions>
  implements CacheDriver<DatabaseCacheDriver, DatabaseCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "database";

  /**
   * Database model class
   */
  public model!: typeof CacheModel;

  /**
   * {@inheritdoc}
   */
  public setOptions(options: DatabaseCacheOptions) {
    super.setOptions(options);

    this.model = options.model ?? CacheModel;

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    this.log("clearing", namespace);

    namespace = this.parseKey(namespace);

    await this.model.delete({
      namespace,
    });

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

    // Extract namespace: all parts except the last (e.g., "users.id.1" -> "users.id")
    const keyParts = parsedKey.split(".");
    const namespace = keyParts.slice(0, -1).join(".") || parsedKey;

    // Find existing cache entry or create new one (upsert pattern)
    let cacheEntry = await this.model.first({ key: parsedKey });

    if (cacheEntry) {
      // Update existing entry
      cacheEntry.set("namespace", namespace);
      cacheEntry.set("data", value);
      cacheEntry.set("ttl", ttl);
      cacheEntry.set("expiresAt", this.getExpiresAt(ttl) || null);
      await cacheEntry.save();
    } else {
      // Create new entry
      await this.model.create({
        key: parsedKey,
        namespace,
        data: value,
        ttl,
        expiresAt: this.getExpiresAt(ttl) || null,
      });
    }

    this.log("cached", parsedKey);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: CacheKey) {
    const parsedKey = this.parseKey(key);

    this.log("fetching", parsedKey);

    const model = await this.model.first({
      key: parsedKey,
    });

    if (!model) {
      this.log("notFound", parsedKey);
      return null;
    }

    const data: CacheData = {
      data: model.get("data"),
      expiresAt: model.get("expiresAt") as number | undefined,
      ttl: model.get("ttl") as number | undefined,
    };

    return this.parseCachedData(parsedKey, data);
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: CacheKey) {
    const parsedKey = this.parseKey(key);

    this.log("removing", parsedKey);

    await this.model.delete({
      key: parsedKey,
    });

    this.log("removed", parsedKey);
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.log("flushing");
    if (this.options.globalPrefix) {
      this.removeNamespace("");
    } else {
      await this.model.delete();
    }

    this.log("flushed");
  }
}
