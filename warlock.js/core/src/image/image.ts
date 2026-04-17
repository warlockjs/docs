import axios from "axios";
import type sharp from "sharp";
import type { FormatEnum } from "sharp";

// ============================================================
// Eager-loaded Sharp Module
// ============================================================

/**
 * Installation instructions for sharp
 */
const SHARP_INSTALL_INSTRUCTIONS = `
Image processing requires the sharp package.
Install it with:

  warlock add image

Or manually:

  npm install sharp
  pnpm add sharp
  yarn add sharp
`.trim();

/**
 * Module availability flag
 */
let moduleExists: boolean | null = null;

/**
 * Cached sharp function (loaded at import time)
 */
let sharpFn: typeof sharp;

/**
 * Eagerly load sharp module at import time
 */
async function loadSharpModule() {
  try {
    const module = await import("sharp");
    sharpFn = module.default;
    moduleExists = true;
  } catch {
    moduleExists = false;
  }
}

// Kick off eager loading immediately
loadSharpModule();

// ============================================================
// Types
// ============================================================

export type ImageFormat = keyof FormatEnum;

export type ImageInput = string | Buffer | Uint8Array | ArrayBuffer;

/**
 * Watermark configuration for deferred execution
 */
export type WatermarkConfig = {
  image: ImageInput | Image;
  options: sharp.OverlayOptions;
};

/**
 * Operation descriptor for deferred pipeline execution.
 * All operations are stored and executed at save/toBuffer time.
 */
type ImageOperation =
  | { type: "resize"; options: sharp.ResizeOptions }
  | { type: "crop"; options: sharp.Region }
  | { type: "rotate"; angle: number }
  | { type: "flip" }
  | { type: "flop" }
  | { type: "blur"; sigma: number }
  | { type: "sharpen"; options?: sharp.SharpenOptions }
  | { type: "blackAndWhite" }
  | { type: "opacity"; value: number }
  | { type: "negate"; options?: sharp.NegateOptions }
  | { type: "tint"; color: sharp.Color }
  | { type: "trim"; options?: sharp.TrimOptions }
  | { type: "watermark"; config: WatermarkConfig }
  | { type: "watermarks"; configs: WatermarkConfig[] };

/**
 * Transformation options that can be applied in batch via `apply()` method.
 *
 * **Execution Order (when using apply()):**
 * 1. resize - Resize first to work with correct dimensions
 * 2. crop - Crop after resize to extract the desired region
 * 3. rotate - Rotation after sizing
 * 4. flip/flop - Mirror operations
 * 5. blackAndWhite/grayscale - Color space conversion
 * 6. blur - Blur effect
 * 7. sharpen - Sharpen effect
 * 8. tint - Color overlay
 * 9. negate - Invert colors
 * 10. opacity - Transparency (applied via composite)
 * 11. format/quality - Applied on save/export
 */
export type ImageTransformOptions = {
  /**
   * Output quality (1-100), applied based on final format
   */
  quality?: number;
  /**
   * Output format (jpeg, png, webp, avif, etc.)
   */
  format?: ImageFormat;
  /**
   * Resize options
   */
  resize?: sharp.ResizeOptions;
  /**
   * Crop/extract region
   */
  crop?: sharp.Region;
  /**
   * Rotation angle in degrees
   */
  rotate?: number;
  /**
   * Flip vertically (top to bottom)
   */
  flip?: boolean;
  /**
   * Flop horizontally (left to right)
   */
  flop?: boolean;
  /**
   * Convert to black and white
   */
  blackAndWhite?: boolean;
  /**
   * Alias for blackAndWhite
   */
  grayscale?: boolean;
  /**
   * Blur sigma (must be >= 0.3)
   */
  blur?: number;
  /**
   * Sharpen options
   */
  sharpen?: sharp.SharpenOptions | boolean;
  /**
   * Tint color
   */
  tint?: sharp.Color;
  /**
   * Negate/invert colors
   */
  negate?: sharp.NegateOptions | boolean;
  /**
   * Opacity (0-100)
   */
  opacity?: number;
  /**
   * Trim options
   */
  trim?: sharp.TrimOptions | boolean;
  /**
   * Single watermark
   */
  watermark?: WatermarkConfig;
  /**
   * Multiple watermarks
   */
  watermarks?: WatermarkConfig[];
};

/**
 * Internal options stored for deferred application
 */
type InternalOptions = {
  quality?: number;
  format?: ImageFormat;
};

/**
 * Image manipulation class with deferred pipeline execution.
 *
 * **Important:** This class requires the `sharp` package to be installed.
 * Install it with: `warlock add image` or `npm install sharp`
 *
 * Sharp is lazy-loaded on the first async operation (save, toBuffer, etc.),
 * so the constructor and all chainable methods remain synchronous.
 *
 * All operations are synchronous and stored as descriptors.
 * The pipeline is executed only when calling output methods:
 * - `save()` - Save to file
 * - `toBuffer()` - Get as buffer
 * - `toBase64()` - Get as base64 string
 * - `toDataUrl()` - Get as data URL
 *
 * @example
 * ```typescript
 * // All chaining is synchronous - single await at the end
 * await new Image("photo.jpg")
 *   .resize({ width: 800 })
 *   .watermark("logo.png", { gravity: "southeast" })
 *   .quality(85)
 *   .save("output.jpg");
 * ```
 */
export class Image {
  /**
   * Image options that will be applied on save/export
   */
  protected options: InternalOptions = {};

  /**
   * Deferred operations pipeline
   */
  protected operations: ImageOperation[] = [];

  /**
   * Cached metadata to avoid repeated async calls
   */
  protected cachedMetadata: sharp.Metadata | null = null;

  /**
   * Whether the pipeline has been executed
   */
  protected pipelineExecuted = false;

  /**
   * Sharp image object
   */
  public readonly image: sharp.Sharp;

  /**
   * Formats that support quality option
   */
  protected static readonly QUALITY_FORMATS = ["jpeg", "jpg", "webp", "avif", "tiff", "heif"];

  /**
   * Constructor
   */
  public constructor(image: ImageInput | sharp.Sharp) {
    if (moduleExists === false) {
      throw new Error(`sharp is not installed.\n\n${SHARP_INSTALL_INSTRUCTIONS}`);
    }

    // Check if it's already a sharp instance
    if (image instanceof Object && "clone" in image && typeof image.clone === "function") {
      this.image = image as sharp.Sharp;
    } else {
      this.image = sharpFn(image as ImageInput);
    }
  }

  /**
   * Create image instance from file path
   */
  public static fromFile(path: string): Image {
    return new Image(path);
  }

  /**
   * Create image instance from buffer
   */
  public static fromBuffer(buffer: Buffer): Image {
    return new Image(buffer);
  }

  /**
   * Create image instance from url
   */
  public static async fromUrl(url: string): Promise<Image> {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
      });

      if (!response.data) {
        throw new Error("Empty response received");
      }

      const buffer = Buffer.from(response.data, "binary");

      return new Image(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to load image from URL "${url}": ${message}`);
    }
  }

  /**
   * Add an operation to the deferred pipeline
   */
  protected addOperation(operation: ImageOperation): this {
    this.operations.push(operation);

    return this;
  }

  /**
   * Apply multiple transformations at once with a predefined execution order.
   *
   * This method ensures transformations are applied in a logical order:
   * resize → crop → rotate → flip/flop → colorspace → effects → opacity → format
   *
   * For custom ordering, use individual chained methods instead.
   */
  public apply(options: ImageTransformOptions): this {
    // 1. Resize first to work with correct dimensions
    if (options.resize) {
      this.resize(options.resize);
    }

    // 2. Crop after resize
    if (options.crop) {
      this.crop(options.crop);
    }

    // 3. Rotation
    if (options.rotate !== undefined) {
      this.rotate(options.rotate);
    }

    // 4. Mirror operations
    if (options.flip) {
      this.flip();
    }

    if (options.flop) {
      this.flop();
    }

    // 5. Color space conversion
    if (options.blackAndWhite || options.grayscale) {
      this.blackAndWhite();
    }

    // 6. Blur effect
    if (options.blur !== undefined) {
      this.blur(options.blur);
    }

    // 7. Sharpen effect
    if (options.sharpen) {
      const sharpenOptions = typeof options.sharpen === "boolean" ? undefined : options.sharpen;
      this.sharpen(sharpenOptions);
    }

    // 8. Tint color
    if (options.tint) {
      this.tint(options.tint);
    }

    // 9. Negate/invert
    if (options.negate) {
      const negateOptions = typeof options.negate === "boolean" ? undefined : options.negate;
      this.negate(negateOptions);
    }

    // 10. Trim edges
    if (options.trim) {
      const trimOptions = typeof options.trim === "boolean" ? undefined : options.trim;
      this.trim(trimOptions);
    }

    // 11. Watermarks
    if (options.watermark) {
      this.watermark(options.watermark.image, options.watermark.options);
    }

    if (options.watermarks) {
      this.watermarks(options.watermarks);
    }

    // 12. Opacity (applied via composite)
    if (options.opacity !== undefined) {
      this.opacity(options.opacity);
    }

    // 13. Store format/quality for deferred application
    if (options.format) {
      this.format(options.format);
    }

    if (options.quality !== undefined) {
      this.quality(options.quality);
    }

    return this;
  }

  /**
   * Set image opacity (0-100)
   */
  public opacity(value: number): this {
    if (value < 0 || value > 100) {
      throw new Error("Opacity must be between 0 and 100");
    }

    return this.addOperation({ type: "opacity", value });
  }

  /**
   * Convert image to black and white
   */
  public blackAndWhite(): this {
    return this.addOperation({ type: "blackAndWhite" });
  }

  /**
   * Alias for blackAndWhite
   */
  public grayscale(): this {
    return this.blackAndWhite();
  }

  /**
   * Get image dimensions (cached after first call)
   */
  public async dimensions(): Promise<{
    width: number | undefined;
    height: number | undefined;
  }> {
    const metadata = await this.metadata();

    return { width: metadata.width, height: metadata.height };
  }

  /**
   * Get image metadata (cached after first call)
   *
   * The metadata is cached to avoid repeated async operations.
   * Use `refreshMetadata()` to force a fresh fetch.
   */
  public async metadata(): Promise<sharp.Metadata> {
    if (!this.cachedMetadata) {
      this.cachedMetadata = await this.image.metadata();
    }

    return this.cachedMetadata;
  }

  /**
   * Force refresh of cached metadata
   *
   * Call this after transformations if you need updated metadata.
   */
  public async refreshMetadata(): Promise<sharp.Metadata> {
    this.cachedMetadata = await this.image.metadata();

    return this.cachedMetadata;
  }

  /**
   * Clear cached metadata
   */
  public clearMetadataCache(): this {
    this.cachedMetadata = null;

    return this;
  }

  /**
   * Resize image
   */
  public resize(options: sharp.ResizeOptions): this {
    if (typeof options.width !== "undefined" && !options.width) {
      delete options.width;
    }

    if (typeof options.height !== "undefined" && !options.height) {
      delete options.height;
    }

    return this.addOperation({ type: "resize", options });
  }

  /**
   * Crop/extract a region from the image
   */
  public crop(options: sharp.Region): this {
    return this.addOperation({ type: "crop", options });
  }

  /**
   * Set image quality (1-100)
   * Quality is stored and applied when saving/exporting
   * based on the final format.
   */
  public quality(quality: number): this {
    if (quality < 1 || quality > 100) {
      throw new Error("Quality must be between 1 and 100");
    }

    this.options.quality = quality;

    return this;
  }

  /**
   * Execute the deferred pipeline - apply all stored operations
   */
  protected async executePipeline(): Promise<sharp.Sharp> {
    if (this.pipelineExecuted) {
      return this.image;
    }

    for (const operation of this.operations) {
      await this.executeOperation(this.image, operation);
    }

    await this.applyFormatAndQuality(this.image);

    this.pipelineExecuted = true;

    return this.image;
  }

  /**
   * Execute a single operation
   */
  protected async executeOperation(image: sharp.Sharp, operation: ImageOperation): Promise<void> {
    switch (operation.type) {
      case "resize":
        image.resize(operation.options);
        break;

      case "crop":
        image.extract(operation.options);
        break;

      case "rotate":
        image.rotate(operation.angle);
        break;

      case "flip":
        image.flip();
        break;

      case "flop":
        image.flop();
        break;

      case "blur":
        image.blur(operation.sigma);
        break;

      case "sharpen":
        image.sharpen(operation.options);
        break;

      case "blackAndWhite":
        image.toColourspace("b-w");
        break;

      case "opacity": {
        const alpha = Math.round((operation.value / 100) * 255);
        const alphaPixel = Buffer.from([255, 255, 255, alpha]);
        image.composite([
          {
            blend: "dest-in",
            input: alphaPixel,
          },
        ]);
        break;
      }

      case "negate":
        image.negate(operation.options);
        break;

      case "tint":
        image.tint(operation.color);
        break;

      case "trim":
        image.trim(operation.options);
        break;

      case "watermark": {
        const buffer = await this.resolveImageBuffer(operation.config.image);
        image.composite([
          {
            input: buffer,
            ...operation.config.options,
          },
        ]);
        break;
      }

      case "watermarks": {
        const buffers = await Promise.all(
          operation.configs.map((config) => this.resolveImageBuffer(config.image)),
        );
        image.composite(
          operation.configs.map((config, index) => ({
            input: buffers[index],
            ...config.options,
          })),
        );
        break;
      }
    }
  }

  /**
   * Resolve an image input to a buffer
   */
  protected async resolveImageBuffer(input: ImageInput | Image): Promise<Buffer> {
    if (input instanceof Image) {
      // For Image instances, get buffer without applying options (raw buffer)
      return input.image.toBuffer();
    }

    // For other inputs (path, buffer, etc.), create temp sharp instance
    const tempImage = sharpFn(input);

    return tempImage.toBuffer();
  }

  /**
   * Apply format and quality options.
   * If no format is explicitly set, preserves the original format and applies
   * quality appropriately based on the format type.
   */
  protected async applyFormatAndQuality(image: sharp.Sharp): Promise<void> {
    const { quality, format } = this.options;

    if (format) {
      // Explicit format specified
      const formatOptions = quality ? { quality } : undefined;
      image.toFormat(format, formatOptions);
      return;
    }

    if (quality === undefined) {
      // No quality or format set, nothing to apply
      return;
    }

    // Quality is set but no format specified - detect original format
    const metadata = await this.metadata();
    const originalFormat = metadata.format;

    if (!originalFormat) {
      // Cannot detect format, default to webp with quality
      image.webp({ quality });
      return;
    }

    // Apply quality based on original format
    if (Image.QUALITY_FORMATS.includes(originalFormat)) {
      // Format supports quality option
      image.toFormat(originalFormat as ImageFormat, { quality });
    } else if (originalFormat === "png") {
      // PNG uses compressionLevel (0-9) instead of quality
      // Map quality 1-100 to compressionLevel 9-0 (higher quality = lower compression)
      const compressionLevel = Math.round(9 - (quality / 100) * 9);
      image.png({ compressionLevel });
    } else if (originalFormat === "gif") {
      // GIF doesn't support quality, just preserve format
      image.gif();
    }
    // Unknown format: preserve as-is (no quality applied)
  }

  /**
   * Save to file
   */
  public async save(path: string): Promise<sharp.OutputInfo> {
    const image = await this.executePipeline();

    return image.toFile(path);
  }

  /**
   * Convert to webp and save to file
   */
  public async saveAsWebp(path: string): Promise<sharp.OutputInfo> {
    // Override format to webp
    this.options.format = "webp";
    const image = await this.executePipeline();

    return image.toFile(path);
  }

  /**
   * Change the file format
   */
  public format(format: ImageFormat): this {
    this.options.format = format;

    return this;
  }

  /**
   * Add watermark (deferred - executed at save time)
   */
  public watermark(image: ImageInput | Image, options: sharp.OverlayOptions = {}): this {
    return this.addOperation({
      type: "watermark",
      config: { image, options },
    });
  }

  /**
   * Add multiple watermarks (deferred - executed at save time)
   */
  public watermarks(configs: WatermarkConfig[]): this {
    return this.addOperation({
      type: "watermarks",
      configs,
    });
  }

  /**
   * Rotate image
   */
  public rotate(angle: number): this {
    return this.addOperation({ type: "rotate", angle });
  }

  /**
   * Flip image vertically (top to bottom)
   */
  public flip(): this {
    return this.addOperation({ type: "flip" });
  }

  /**
   * Flop image horizontally (left to right)
   */
  public flop(): this {
    return this.addOperation({ type: "flop" });
  }

  /**
   * Blur image
   */
  public blur(sigma: number): this {
    if (sigma < 0.3) {
      throw new Error("Blur sigma must be at least 0.3");
    }

    return this.addOperation({ type: "blur", sigma });
  }

  /**
   * Convert to base64
   */
  public async toBase64(): Promise<string> {
    const image = await this.executePipeline();
    const buffer = await image.toBuffer();

    return buffer.toString("base64");
  }

  /**
   * Convert to data URL (base64 with mime type prefix)
   */
  public async toDataUrl(): Promise<string> {
    const metadata = await this.metadata();
    const format = this.options.format || metadata.format || "png";
    const mimeType = `image/${format === "jpg" ? "jpeg" : format}`;
    const base64 = await this.toBase64();

    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Sharpen image
   */
  public sharpen(options?: sharp.SharpenOptions): this {
    return this.addOperation({ type: "sharpen", options });
  }

  /**
   * Negate/invert image colors
   */
  public negate(options?: sharp.NegateOptions): this {
    return this.addOperation({ type: "negate", options });
  }

  /**
   * Tint image with a color
   */
  public tint(color: sharp.Color): this {
    return this.addOperation({ type: "tint", color });
  }

  /**
   * Trim edges from the image
   */
  public trim(options?: sharp.TrimOptions): this {
    return this.addOperation({ type: "trim", options });
  }

  /**
   * Convert to buffer
   */
  public async toBuffer(): Promise<Buffer> {
    const image = await this.executePipeline();

    return image.toBuffer();
  }

  /**
   * Clone the image for separate transformations
   */
  public clone(): Image {
    const clonedImage = new Image(this.image.clone());
    clonedImage.options = { ...this.options };
    clonedImage.operations = [...this.operations];
    clonedImage.cachedMetadata = this.cachedMetadata ? { ...this.cachedMetadata } : null;

    return clonedImage;
  }

  /**
   * Get the current stored options
   */
  public getOptions(): Readonly<InternalOptions> {
    return { ...this.options };
  }

  /**
   * Get the pending operations count
   */
  public getPendingOperationsCount(): number {
    return this.operations.length;
  }

  /**
   * Reset all stored options
   */
  public resetOptions(): this {
    this.options = {};

    return this;
  }

  /**
   * Clear all pending operations
   */
  public clearOperations(): this {
    this.operations = [];
    this.pipelineExecuted = false;

    return this;
  }

  /**
   * Reset the image to its initial state (clear operations and options)
   */
  public reset(): this {
    this.operations = [];
    this.options = {};
    this.pipelineExecuted = false;
    this.cachedMetadata = null;

    return this;
  }
}
