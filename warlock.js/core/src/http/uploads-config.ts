import { config } from "../config";
import type { UploadsConfigurations } from "./uploads-types";

/**
 * Default uploads configuration values
 *
 * These defaults are used when no configuration is provided
 * or when specific keys are missing from the app config.
 */
export const UPLOADS_DEFAULTS: UploadsConfigurations = {
  name: "random",
  randomLength: 32,
  prefix: {
    as: "directory",
    format: "DD-MM-YYYY",
  },
  // defaultPrefixFormat: "DD-MM-YYYY-HH-II-SS",
};

/**
 * Get uploads configuration value
 *
 * Retrieves a configuration value from the `uploads` section of app config,
 * falling back to the provided default or the built-in default.
 *
 * @param key - Configuration key to retrieve
 * @param defaultValue - Optional default value if not found
 * @returns The configuration value
 *
 * @example
 * ```typescript
 * const naming = uploadsConfig("name"); // "random" or "original"
 * const length = uploadsConfig("randomLength", 32);
 * ```
 */
export function uploadsConfig<K extends keyof UploadsConfigurations>(
  key: K,
  defaultValue?: UploadsConfigurations[K],
): UploadsConfigurations[K] {
  const fallback = defaultValue ?? UPLOADS_DEFAULTS[key];
  return config.key(`uploads.${key}`, fallback);
}
