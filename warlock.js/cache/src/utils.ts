import { rtrim } from "@mongez/reinforcements";
import type { CacheKey } from "./types";

/**
 * Make a proper key for the cache
 */
export function parseCacheKey(
  key: CacheKey,
  options: { globalPrefix?: string | (() => string) } = {},
): string {
  if (typeof key === "object") {
    key = JSON.stringify(key);
  }

  // remove any curly braces and double quotes along with []
  key = key.replace(/[{}"[\]]/g, "").replaceAll(/[:,]/g, ".");

  const cachePrefix =
    typeof options.globalPrefix === "function" ? options.globalPrefix() : options.globalPrefix;

  return rtrim(String(cachePrefix ? rtrim(cachePrefix, ".") + "." + key : key), ".");
}

export enum CACHE_FOR {
  /**
   * Cache for 30 Minutes (in seconds)
   */
  HALF_HOUR = 1800,
  /**
   * Cache for 1 Hour (in seconds)
   */
  ONE_HOUR = 3600,
  /**
   * Cache for 12 Hours (in seconds)
   */
  HALF_DAY = 43200,
  /**
   * Cache for 24 Hours (in seconds)
   */
  ONE_DAY = 86400,
  /**
   * Cache for 7 Days (in seconds)
   */
  ONE_WEEK = 604800,
  /**
   * Cache for 15 Days (in seconds)
   */
  HALF_MONTH = 1296000,
  /**
   * Cache for 30 Days (in seconds)
   */
  ONE_MONTH = 2592000,
  /**
   * Cache for 60 Days (in seconds)
   */
  TWO_MONTHS = 5184000,
  /**
   * Cache for 180 Days (in seconds)
   */
  SIX_MONTHS = 15768000,
  /**
   * Cache for 365 Days (in seconds)
   */
  ONE_YEAR = 31536000,
}
