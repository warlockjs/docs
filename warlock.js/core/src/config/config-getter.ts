import baseConfig from "@mongez/config";
import type { ConfigKey, ConfigRegistry } from "./types";

/**
 * Config accessor interface with typed overloads
 */
interface ConfigAccessor {
  /**
   * Get a config value by dot-notation key path.
   */
  key<T = any>(key: ConfigKey | (string & {}), defaultValue?: T): T;

  /**
   * Get an entire config group by name with type inference.
   * Returns the typed config object for known config names.
   */
  get<K extends keyof ConfigRegistry>(name: K, defaultValue?: ConfigRegistry[K]): ConfigRegistry[K];

  /**
   * Get an entire config group by name (dynamic string).
   */
  get<T = any>(name: string, defaultValue?: T): T;
}

/**
 * Config accessor with typed autocomplete and return type inference.
 *
 * @example
 * ```typescript
 * // Get entire config group - returns the actual config type
 * const db = config.get("database"); // → DatabaseConfigurations
 *
 * // Get specific key with dot notation
 * const host = config.key("database.host");
 * const port = config.key<number>("database.port", 27017);
 * ```
 */
export const config: ConfigAccessor = {
  key(key: ConfigKey | (string & {}), defaultValue?: any): any {
    return baseConfig.get(key, defaultValue);
  },

  get(name: string, defaultValue?: any): any {
    return baseConfig.get(name, defaultValue);
  },
};
