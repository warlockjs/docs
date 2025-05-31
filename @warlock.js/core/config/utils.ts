import baseConfig from "@mongez/config";

/**
 * Get a config value
 * @param key - The config key, it supports dot notation syntax
 * @param defaultValue - The default value
 * @returns The config value
 */
export function config<T = any>(key: string, defaultValue?: T): T {
  return baseConfig.get(key, defaultValue);
}
