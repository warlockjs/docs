import type { GenericObject } from "@mongez/reinforcements";
import { get } from "@mongez/reinforcements";
import type {
  CacheData,
  CacheDriver,
  MemoryExtendedCacheOptions,
} from "../types";
import { MemoryCacheDriver } from "./memory-cache-driver";

export class MemoryExtendedCacheDriver
  extends MemoryCacheDriver
  implements CacheDriver<MemoryExtendedCacheDriver, MemoryExtendedCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "memoryExtended";

  /**
   * {@inheritdoc}
   */
  public async get(key: string | GenericObject) {
    const parsedKey = await this.parseKey(key);

    this.log("fetching", parsedKey);

    const value: CacheData = get(this.data, parsedKey);

    if (!value) {
      this.log("notFound", parsedKey);
      return null;
    }

    const ttl = value.ttl || this.options.ttl;

    if (ttl) {
      // reset the expiration time
      this.setTemporaryData(key, parsedKey, ttl);
      value.expiresAt = this.getExpiresAt(ttl);
    }

    return this.parseCachedData(parsedKey, value);
  }
}
