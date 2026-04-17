import type { Image, ImageFormat, ImageTransformOptions } from "../image";
import type { StorageDriverName } from "../storage";
import type { FileValidationOptions } from "./uploaded-file";

/**
 * Prefix options for file path generation
 *
 * Controls how prefixes are applied to filenames or directories.
 * Can generate date-based prefixes, random strings, or custom static prefixes.
 *
 * @example
 * ```typescript
 * // Date prefix on filename
 * { format: "dd-mm-yyyy", as: "file" }
 * // → 21-12-2025-image.png
 *
 * // Date as directory
 * { format: "yyyy/mm/dd", as: "directory" }
 * // → 2025/12/21/image.png
 *
 * // Random subdirectory (great for sharding)
 * { randomLength: 4, as: "directory" }
 * // → a7x9/image.png
 * ```
 */
export type PrefixOptions = {
  /**
   * Date format string using tokens:
   * - `dd`: Day (01-31)
   * - `mm`: Month (01-12)
   * - `yyyy`: Full year (2025)
   * - `yy`: Short year (25)
   * - `HH`: Hours 24h (00-23)
   * - `ii`: Minutes (00-59)
   * - `ss`: Seconds (00-59)
   *
   * @example "dd-mm-yyyy" → "21-12-2025"
   * @example "yyyy/mm/dd" → "2025/12/21"
   */
  format?: string;

  /**
   * Random string length to generate
   *
   * Generates an alphanumeric string of the specified length.
   * Useful for sharding large file volumes or ensuring uniqueness.
   *
   * @example 8 → "a7x9m2k1"
   */
  randomLength?: number;

  /**
   * How to apply the prefix
   * - `"file"`: Prepend to filename (default)
   * - `"directory"`: Create as subdirectory
   *
   * @default "file"
   */
  as?: "directory" | "file";
};

/**
 * Prefix configuration for file saving
 *
 * Can be specified as:
 * - `true`: Use default datetime format from config
 * - `string`: Static prefix string (e.g., "avatar-", "user-123-")
 * - `PrefixOptions`: Full control over format, randomness, and output mode
 */
export type PrefixConfig = boolean | string | PrefixOptions;

/**
 * File naming strategy
 *
 * - `"random"`: Generate a random alphanumeric filename
 * - `"original"`: Use the original uploaded filename (sanitized)
 * - `string`: Custom filename (extension auto-appended from original file)
 */
export type FileNamingStrategy = "random" | "original" | (string & {});

/**
 * Options for saving uploaded files
 *
 * @example
 * ```typescript
 * // Random name with date directory
 * await file.save("avatars", {
 *   name: "random",
 *   prefix: { format: "yyyy/mm/dd", as: "directory" }
 * });
 *
 * // Original name with datetime prefix
 * await file.save("avatars", {
 *   name: "original",
 *   prefix: true
 * });
 * ```
 */
export type SaveOptions = {
  /**
   * Filename strategy
   *
   * - `"random"`: Generate random string (uses config randomLength)
   * - `"original"`: Use uploaded filename (sanitized)
   * - `string`: Custom filename (no extension needed, auto-appended)
   *
   * @default Uses config default (typically "random")
   */
  name?: FileNamingStrategy;

  /**
   * Prefix to prepend to filename or use as directory
   *
   * - `true`: Use default datetime format from config
   * - `string`: Static prefix (e.g., "avatar-", "user-123-")
   * - `PrefixOptions`: Full control with format/randomLength/as
   *
   * @default false (no prefix)
   */
  prefix?: PrefixConfig;

  /**
   * Override storage driver for this upload
   *
   * Must match a configured driver name from storage config.
   *
   * @example "s3", "local", "r2"
   */
  driver?: StorageDriverName;

  /**
   * Validation rules to apply before saving
   *
   * If validation fails, an error is thrown.
   */
  validate?: FileValidationOptions;
};

/**
 * Options for saveAs (explicit path)
 *
 * Same as SaveOptions but without name/prefix since the full path is explicit.
 */
export type SaveAsOptions = Omit<SaveOptions, "name" | "prefix">;

/**
 * Image transformation callback function
 *
 * Receives an Image instance and should return the modified Image.
 * Used for advanced transformations that require chained operations.
 *
 * @example
 * ```typescript
 * file.transform(img =>
 *   img.resize({ width: 800, fit: "inside" })
 *      .watermark("logo.png", { gravity: "southeast" })
 *      .sharpen()
 * );
 * ```
 */
export type ImageTransformCallback = (img: Image) => Image;

/**
 * Image transformation configuration
 *
 * Can be either:
 * - An options object with predefined transforms
 * - A callback function for full control
 */
export type ImageTransformConfig = ImageTransformOptions | ImageTransformCallback;

/**
 * Uploads configuration for app config
 *
 * @example
 * ```typescript
 * // In app config
 * uploads: {
 *   name: "random",
 *   randomLength: 64,
 *   prefix: false,
 *   defaultPrefixFormat: "dd-mm-yyyy-HH-ii-ss"
 * }
 * ```
 */
export type UploadsConfigurations = {
  /**
   * Default naming strategy for uploaded files
   *
   * @default "random"
   */
  name?: "random" | "original";

  /**
   * Length of random string when using random naming
   *
   * @default 64
   */
  randomLength?: number;

  /**
   * Default prefix configuration
   *
   * Applied when `save()` is called without prefix option,
   * or when prefix option is `true`.
   *
   * @default false (no prefix)
   */
  prefix?: PrefixConfig;

  /**
   * Default datetime format when prefix is `true`
   *
   * @default "dd-mm-yyyy-HH-ii-ss"
   */
  defaultPrefixFormat?: string;
};

/**
 * High-level image options that can be chained on UploadedFile
 *
 * These are stored internally and applied before saving.
 */
export type UploadedFileImageOptions = {
  /**
   * Resize dimensions
   */
  resize?: { width: number; height?: number };

  /**
   * Output quality (1-100)
   */
  quality?: number;

  /**
   * Output format
   */
  format?: ImageFormat;

  /**
   * Rotation angle in degrees
   */
  rotate?: number;

  /**
   * Blur sigma value
   */
  blur?: number;

  /**
   * Convert to grayscale
   */
  grayscale?: boolean;
};
