import type { MultipartFile } from "@fastify/multipart";
import { Random } from "@mongez/reinforcements";
import dayjs from "dayjs";
import path from "path";
import { Image, type ImageFormat, type ImageTransformOptions } from "../image";
import { storage, type ScopedStorage, type StorageDriverName, type StorageFile } from "../storage";
import { sanitizePath } from "../utils/paths";
import { uploadsConfig } from "./uploads-config";
import type {
  FileNamingStrategy,
  ImageTransformCallback,
  PrefixConfig,
  SaveAsOptions,
  SaveOptions,
  UploadedFileImageOptions,
} from "./uploads-types";

type UploadedFileMetadata = {
  name: string;
  mimeType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
};

/**
 * Options for validating file before saving
 */
export type FileValidationOptions = {
  /**
   * List of allowed MIME types
   *
   * @example ["image/jpeg", "image/png", "image/webp"]
   */
  allowedMimeTypes?: string[];

  /**
   * List of allowed file extensions (without dot)
   *
   * @example ["jpg", "jpeg", "png", "webp"]
   */
  allowedExtensions?: string[];

  /**
   * Maximum file size in bytes
   *
   * @example 5 * 1024 * 1024 // 5MB
   */
  maxSize?: number;
};

/**
 * UploadedFile - Handles multipart file uploads with storage and image integration
 *
 * Provides a fluent API for validating, transforming, and saving uploaded files
 * to various storage drivers (local, S3, R2, etc.).
 *
 * @example
 * ```typescript
 * // Simple save with random name
 * const file = await uploadedFile.save("avatars");
 *
 * // Original name with date prefix
 * const file = await uploadedFile.save("avatars", {
 *   name: "original",
 *   prefix: { format: "yyyy/mm/dd", as: "directory" }
 * });
 *
 * // With image transformations
 * const file = await uploadedFile
 *   .resize(800, 600)
 *   .quality(85)
 *   .format("webp")
 *   .save("avatars");
 *
 * // Different storage driver
 * const file = await uploadedFile.use("s3").save("avatars");
 * ```
 */
export class UploadedFile {
  /**
   * File buffered content
   * @internal
   */
  protected bufferedFileContent?: Buffer;

  /**
   * Upload file hash (SHA-256)
   *
   * Populated after file is saved.
   */
  public hash = "";

  /**
   * Selected storage driver
   * @internal
   */
  protected _storage: ScopedStorage = storage;

  /**
   * Saved StorageFile reference
   * @internal
   */
  protected _storageFile?: StorageFile;

  /**
   * Queued image options (high-level API)
   * @internal
   */
  protected _imageOptions: UploadedFileImageOptions = {};

  /**
   * Full transform options or callback
   * @internal
   */
  protected _transformConfig?: ImageTransformOptions | ImageTransformCallback;

  /**
   * Create a new UploadedFile instance
   *
   * @param fileData - Multipart file data from Fastify
   * @throws Error if file data is invalid
   */
  public constructor(protected readonly fileData: MultipartFile) {
    if (!fileData?.filename) {
      throw new Error("Invalid file data: filename is required");
    }
  }

  // ============================================================
  // File Properties
  // ============================================================

  /**
   * Get file name (sanitized)
   *
   * Returns the original filename with special characters removed/replaced.
   */
  public get name(): string {
    return sanitizePath(this.fileData.filename);
  }

  /**
   * Get file MIME type
   *
   * @example "image/jpeg", "application/pdf"
   */
  public get mimeType(): string {
    return this.fileData.mimetype;
  }

  /**
   * Get file extension (lowercase, without dot)
   *
   * @example "jpg", "png", "pdf"
   */
  public get extension(): string {
    return path.extname(this.fileData.filename).replace(".", "").toLowerCase();
  }

  /**
   * Get file metadata
   */
  public async metadata(): Promise<UploadedFileMetadata> {
    const data: UploadedFileMetadata = {
      name: this.name,
      mimeType: this.mimeType,
      extension: this.extension,
      size: await this.size(),
    };

    if (this.isImage) {
      const dimensions = await this.dimensions();
      data.width = dimensions.width;
      data.height = dimensions.height;
    }

    return data;
  }

  /**
   * Get file size in bytes
   *
   * Buffers the file content if not already buffered.
   */
  public async size(): Promise<number> {
    const file = await this.buffer();
    return file.length;
  }

  /**
   * Get file buffer
   *
   * Caches the buffer after first call for efficiency.
   */
  public async buffer(): Promise<Buffer> {
    if (this.bufferedFileContent) {
      return this.bufferedFileContent;
    }

    this.bufferedFileContent = await this.fileData.toBuffer();
    return this.bufferedFileContent;
  }

  // ============================================================
  // File Type Checks
  // ============================================================

  /**
   * Check if file is an image based on MIME type
   */
  public get isImage(): boolean {
    return this.mimeType.startsWith("image");
  }

  /**
   * Check if file is a video based on MIME type
   */
  public get isVideo(): boolean {
    return this.mimeType.startsWith("video");
  }

  /**
   * Check if file is an audio based on MIME type
   */
  public get isAudio(): boolean {
    return this.mimeType.startsWith("audio");
  }

  // ============================================================
  // Storage Driver Selection
  // ============================================================

  /**
   * Select a specific storage driver for this upload
   *
   * Returns this instance for chaining. The driver is used
   * when `save()` or `saveAs()` is called.
   *
   * @param driver - Driver name from storage configuration
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * await file.use("s3").save("avatars");
   * await file.use("r2").save("cdn/images");
   * ```
   */
  public use(driver: StorageDriverName): this {
    this._storage = storage.use(driver) as ScopedStorage;
    return this;
  }

  // ============================================================
  // High-Level Image Transform API
  // ============================================================

  /**
   * Resize the image before saving
   *
   * Only applies to image files. Non-image files ignore this.
   *
   * @param width - Target width in pixels
   * @param height - Optional target height (maintains aspect ratio if omitted)
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * await file.resize(800).save("thumbnails");
   * await file.resize(400, 400).save("avatars");
   * ```
   */
  public resize(width: number, height?: number): this {
    this._imageOptions.resize = { width, height };
    return this;
  }

  /**
   * Set image output quality
   *
   * Quality affects file size and visual fidelity.
   * Only applies to formats that support quality (JPEG, WebP, AVIF).
   *
   * @param value - Quality value (1-100)
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * await file.quality(85).save("images");
   * ```
   */
  public quality(value: number): this {
    if (value < 1 || value > 100) {
      throw new Error("Quality must be between 1 and 100");
    }
    this._imageOptions.quality = value;
    return this;
  }

  /**
   * Convert image to a specific format
   *
   * Changes the output format and updates the file extension accordingly.
   *
   * @param format - Target image format (jpeg, png, webp, avif, etc.)
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * await file.format("webp").save("images");
   * await file.resize(800).format("avif").quality(80).save("optimized");
   * ```
   */
  public format(format: ImageFormat): this {
    this._imageOptions.format = format;
    return this;
  }

  /**
   * Rotate the image
   *
   * @param degrees - Rotation angle in degrees (positive = clockwise)
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * await file.rotate(90).save("rotated");
   * ```
   */
  public rotate(degrees: number): this {
    this._imageOptions.rotate = degrees;
    return this;
  }

  /**
   * Apply blur effect to the image
   *
   * @param sigma - Blur intensity (default: 3, minimum: 0.3)
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * await file.blur(5).save("blurred");
   * ```
   */
  public blur(sigma = 3): this {
    if (sigma < 0.3) {
      throw new Error("Blur sigma must be at least 0.3");
    }
    this._imageOptions.blur = sigma;
    return this;
  }

  /**
   * Convert image to grayscale (black and white)
   *
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * await file.grayscale().save("bw-images");
   * ```
   */
  public grayscale(): this {
    this._imageOptions.grayscale = true;
    return this;
  }

  // ============================================================
  // Full Transform Control
  // ============================================================

  /**
   * Apply full image transformations
   *
   * Provides complete control over image processing. Can be used with:
   * - An options object for predefined transforms
   * - A callback function for chained operations
   *
   * @param config - Transform options or callback function
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * // Using options object
   * await file.transform({
   *   resize: { width: 800, fit: "inside" },
   *   quality: 85
   * }).save("images");
   *
   * // Using callback for full control
   * await file.transform(img =>
   *   img.resize({ width: 800 })
   *      .watermark("logo.png", { gravity: "southeast" })
   *      .sharpen()
   * ).save("products");
   * ```
   */
  public transform(config: ImageTransformOptions | ImageTransformCallback): this {
    this._transformConfig = config;
    return this;
  }

  /**
   * Get an Image instance for advanced manipulation
   *
   * Returns an Image instance from the file buffer for manual processing.
   * Use this when you need operations not covered by the fluent API.
   *
   * @returns Promise resolving to Image instance
   *
   * @example
   * ```typescript
   * const img = await file.toImage();
   * await img
   *   .resize({ width: 800 })
   *   .watermark("logo.png", { gravity: "southeast" })
   *   .save("path/to/output.jpg");
   * ```
   */
  public async toImage(): Promise<Image> {
    return new Image(await this.buffer());
  }

  // ============================================================
  // Image Metadata
  // ============================================================

  /**
   * Get file width and height (only for images)
   *
   * @returns Dimensions object, or empty object if not an image
   */
  public async dimensions(): Promise<{ width?: number; height?: number }> {
    if (!this.isImage) {
      return {};
    }

    return new Image(await this.buffer()).dimensions();
  }

  // ============================================================
  // Validation
  // ============================================================

  /**
   * Validate file against the given options
   *
   * @param options - Validation rules
   * @throws Error if validation fails
   *
   * @example
   * ```typescript
   * await file.validate({
   *   allowedMimeTypes: ["image/jpeg", "image/png"],
   *   maxSize: 5 * 1024 * 1024 // 5MB
   * });
   * ```
   */
  public async validate(options: FileValidationOptions): Promise<void> {
    const { allowedMimeTypes, allowedExtensions, maxSize } = options;

    if (allowedMimeTypes && !allowedMimeTypes.includes(this.mimeType)) {
      throw new Error(
        `Invalid file type: ${this.mimeType}. Allowed types: ${allowedMimeTypes.join(", ")}`,
      );
    }

    if (allowedExtensions && !allowedExtensions.includes(this.extension)) {
      throw new Error(
        `Invalid file extension: ${this.extension}. Allowed extensions: ${allowedExtensions.join(", ")}`,
      );
    }

    if (maxSize) {
      const fileSize = await this.size();
      if (fileSize > maxSize) {
        throw new Error(`File too large: ${fileSize} bytes. Maximum allowed: ${maxSize} bytes`);
      }
    }
  }

  // ============================================================
  // Save Operations
  // ============================================================

  /**
   * Save the file to a directory with automatic naming
   * Keep in mind to use only relative path to the root of storage
   * If you are using local driver
   * Uses the configured naming strategy and prefix options to generate
   * the final path. Returns a StorageFile for accessing file metadata.
   *
   * @param directory - Target directory path
   * @param options - Save options (name, prefix, driver, validate)
   * @returns StorageFile instance with file metadata and operations
   *
   * @example
   * ```typescript
   * // Random name (default)
   * await file.save("avatars");
   * // → avatars/x7k9m2p4.jpg
   *
   * // Original name
   * await file.save("avatars", { name: "original" });
   * // → avatars/photo.jpg
   *
   * // With date directory
   * await file.save("avatars", {
   *   prefix: { format: "yyyy/mm/dd", as: "directory" }
   * });
   * // → avatars/2025/12/21/x7k9m2p4.jpg
   *
   * // Original name with datetime prefix
   * await file.save("avatars", { name: "original", prefix: true });
   * // → avatars/21-12-2025-16-45-30-photo.jpg
   * ```
   */
  public async save(directory: string, options?: SaveOptions): Promise<StorageFile> {
    // Validate if requested
    if (options?.validate) {
      await this.validate(options.validate);
    }

    // Resolve filename and prefix
    const filename = this.resolveFilename(options);
    const prefix = this.resolvePrefix(options?.prefix);
    const location = this.buildLocation(directory, prefix, filename);

    return this.saveToLocation(location, options?.driver);
  }

  /**
   * Save the file to an explicit path
   *
   * Unlike `save()`, this method uses the exact path you provide.
   * No automatic naming or prefix is applied.
   *
   * @param location - Full file path (directory + filename)
   * @param options - Save options (driver, validate)
   * @returns StorageFile instance with file metadata
   *
   * @example
   * ```typescript
   * await file.saveAs("avatars/profile-123.png");
   * await file.saveAs("products/2025/featured-image.webp");
   * ```
   */
  public async saveAs(location: string, options?: SaveAsOptions): Promise<StorageFile> {
    // Validate if requested
    if (options?.validate) {
      await this.validate(options.validate);
    }

    return this.saveToLocation(location, options?.driver);
  }

  /**
   * Get the StorageFile reference if file has been saved
   *
   * Returns undefined if file hasn't been saved yet.
   */
  public get storageFile(): StorageFile | undefined {
    return this._storageFile;
  }

  // ============================================================
  // Internal Helpers
  // ============================================================

  /**
   * Execute save to the specified location
   * @internal
   */
  protected async saveToLocation(
    location: string,
    driver?: StorageDriverName,
  ): Promise<StorageFile> {
    // Get file content (apply transforms if image)
    const content = await this.getProcessedContent();

    // Select storage
    const storageInstance = this.resolveStorage(driver);

    // Determine final location (adjust extension if format changed)
    const finalLocation = this.adjustLocationForFormat(location);

    // Save to storage
    this._storageFile = await storageInstance.put(content, finalLocation, {
      mimeType: this.getFinalMimeType(),
    });

    // Store hash from StorageFile
    const info = await this._storageFile.data();
    this.hash = info.hash || "";

    return this._storageFile;
  }

  /**
   * Get processed content (with transforms applied if applicable)
   * @internal
   */
  protected async getProcessedContent(): Promise<Buffer> {
    const content = await this.buffer();

    // If not an image or no transforms, return as-is
    if (!this.isImage || !this.hasTransforms()) {
      return content;
    }

    // Create Image and apply transforms
    let img = new Image(content);

    // Apply transform callback or options
    if (typeof this._transformConfig === "function") {
      img = this._transformConfig(img);
    } else if (this._transformConfig) {
      img = img.apply(this._transformConfig);
    }

    // Apply high-level options on top
    img = this.applyImageOptions(img);

    return img.toBuffer();
  }

  /**
   * Apply high-level image options
   * @internal
   */
  protected applyImageOptions(img: Image): Image {
    const opts = this._imageOptions;

    if (opts.resize) {
      img = img.resize({ width: opts.resize.width, height: opts.resize.height });
    }

    if (opts.rotate !== undefined) {
      img = img.rotate(opts.rotate);
    }

    if (opts.blur !== undefined) {
      img = img.blur(opts.blur);
    }

    if (opts.grayscale) {
      img = img.grayscale();
    }

    if (opts.quality !== undefined) {
      img = img.quality(opts.quality);
    }

    if (opts.format) {
      img = img.format(opts.format);
    }

    return img;
  }

  /**
   * Check if any transforms are queued
   * @internal
   */
  protected hasTransforms(): boolean {
    return this._transformConfig !== undefined || Object.keys(this._imageOptions).length > 0;
  }

  /**
   * Resolve storage instance to use
   * @internal
   */
  protected resolveStorage(driver?: StorageDriverName): ScopedStorage | typeof storage {
    if (driver) {
      return storage.use(driver) as ScopedStorage;
    }

    return this._storage || storage;
  }

  /**
   * Resolve the filename based on options and config
   * @internal
   */
  protected resolveFilename(options?: SaveOptions): string {
    const namingStrategy: FileNamingStrategy = options?.name ?? uploadsConfig("name") ?? "random";
    let baseName: string;

    if (namingStrategy === "original") {
      baseName = path.basename(this.name, path.extname(this.name));
    } else if (namingStrategy === "random") {
      const length = uploadsConfig("randomLength");
      baseName = Random.string(length);
    } else {
      // Custom name - strip extension if provided, we'll add it
      baseName = path.basename(namingStrategy, path.extname(namingStrategy));
    }

    // Get extension (may be changed by format transform)
    const ext = this.getFinalExtension();

    return `${baseName}.${ext}`;
  }

  /**
   * Resolve prefix based on options and config
   * @internal
   */
  protected resolvePrefix(prefix?: PrefixConfig): string {
    // No prefix
    if (prefix === false || prefix === undefined) {
      const configPrefix = uploadsConfig("prefix");
      if (!configPrefix) {
        return "";
      }
      // Use config prefix if no explicit prefix provided
      prefix = configPrefix;
    }

    // Boolean true = use default format
    if (prefix === true) {
      const format = uploadsConfig("defaultPrefixFormat")!;
      return this.formatDatePrefix(format, "file");
    }

    // String = static prefix
    if (typeof prefix === "string") {
      return prefix;
    }

    // PrefixOptions object
    const parts: string[] = [];

    // Add date format if specified
    if (prefix.format) {
      parts.push(this.formatDate(prefix.format));
    }

    // Add random string if specified
    if (prefix.randomLength) {
      parts.push(Random.string(prefix.randomLength));
    }

    const combined = parts.join("-");
    const as = prefix.as ?? "file";

    if (as === "directory") {
      return combined ? `${combined}/` : "";
    }

    return combined ? `${combined}-` : "";
  }

  /**
   * Format a date prefix with the given format
   * @internal
   */
  protected formatDatePrefix(format: string, as: "file" | "directory"): string {
    const formatted = this.formatDate(format);
    return as === "directory" ? `${formatted}/` : `${formatted}-`;
  }

  /**
   * Format current date using token-based format string
   * @internal
   */
  protected formatDate(format: string): string {
    return dayjs().format(format);
  }

  /**
   * Build final location from directory, prefix, and filename
   * @internal
   */
  protected buildLocation(directory: string, prefix: string, filename: string): string {
    // Clean up directory (remove trailing slash)
    const dir = directory.replace(/\/$/, "");

    // If prefix ends with /, it's a directory
    if (prefix.endsWith("/")) {
      return `${dir}/${prefix}${filename}`;
    }

    // Otherwise prefix is part of filename
    return `${dir}/${prefix}${filename}`;
  }

  /**
   * Get final extension (accounting for format changes)
   * @internal
   */
  protected getFinalExtension(): string {
    if (this._imageOptions.format) {
      // Map formats to extensions
      const format = this._imageOptions.format;

      if (format === "jpeg") return "jpg";

      return format;
    }

    return this.extension;
  }

  /**
   * Get final MIME type (accounting for format changes)
   * @internal
   */
  protected getFinalMimeType(): string {
    if (this._imageOptions.format) {
      const format = this._imageOptions.format;

      if (format === "jpeg" || format === "jpg") return "image/jpeg";

      return `image/${format}`;
    }

    return this.mimeType;
  }

  /**
   * Adjust location to use correct extension if format changed
   * @internal
   */
  protected adjustLocationForFormat(location: string): string {
    if (!this._imageOptions.format) {
      return location;
    }

    const ext = this.getFinalExtension();
    const currentExt = path.extname(location);

    if (currentExt) {
      return location.replace(currentExt, `.${ext}`);
    }

    return `${location}.${ext}`;
  }

  // ============================================================
  // Serialization
  // ============================================================

  /**
   * Convert to JSON representation
   *
   * Includes file metadata and base64 content for serialization.
   */
  public async toJSON() {
    return {
      name: this.name,
      mimeType: this.mimeType,
      extension: this.extension,
      size: await this.size(),
      isImage: this.isImage,
      isVideo: this.isVideo,
      isAudio: this.isAudio,
      dimensions: this.isImage ? await this.dimensions() : undefined,
      base64: (await this.buffer()).toString("base64"),
    };
  }
}
