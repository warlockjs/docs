import events, { type EventSubscription } from "@mongez/events";
import fs from "fs";
import path from "path";
import type { Readable } from "stream";
import type { UploadedFile } from "../http";
import { storageConfig } from "./config";
import { storageDriverContext } from "./context/storage-driver-context";
import { DOSpacesDriver } from "./drivers/do-spaces-driver";
import { LocalDriver } from "./drivers/local-driver";
import { R2Driver } from "./drivers/r2-driver";
import { S3Driver } from "./drivers/s3-driver";
import { ScopedStorage } from "./scoped-storage";
import { StorageFile } from "./storage-file";
import type {
  CloudStorageDriverContract,
  CloudStorageDriverOptions,
  DeleteManyResult,
  FileVisibility,
  ListOptions,
  LocalStorageDriverOptions,
  PresignedOptions,
  PresignedUploadOptions,
  PutOptions,
  R2StorageDriverOptions,
  ScopedStorageContract,
  StorageCopyEventPayload,
  StorageDriverConfig,
  StorageDriverContract,
  StorageDriverName,
  StorageEventHandler,
  StorageEventPayload,
  StorageEventType,
  StorageFileInfo,
  StorageManagerContract,
  StoragePutEventPayload,
  TemporaryTokenValidation,
} from "./types";

/**
 * Storage Manager
 *
 * Provides a unified interface for file storage operations across multiple
 * drivers (local, S3, R2, DigitalOcean Spaces). Extends `ScopedStorage` to
 * inherit all base operations while adding driver management and events.
 *
 * All operations return `StorageFile` instances for a consistent, rich DX.
 *
 * @example
 * ```typescript
 * // Basic usage (uses default driver)
 * const file = await storage.put(buffer, "uploads/image.jpg");
 *
 * // With options
 * const file = await storage.put(buffer, "uploads/image.jpg", {
 *   mimeType: "image/jpeg",
 *   cacheControl: "max-age=31536000"
 * });
 *
 * // Using specific driver (also returns StorageFile)
 * const file = await storage.use("s3").put(buffer, "path/to/file");
 *
 * // Get raw driver for advanced use
 * const driver = storage.driver("s3");
 * const data = await driver.put(buffer, "path/to/file"); // Returns StorageFileData
 *
 * // Stream operations for large files
 * const stream = await storage.getStream("large-file.zip");
 * await storage.putStream(readableStream, "output/file.zip");
 *
 * // Batch operations
 * const results = await storage.deleteMany(["file1.txt", "file2.txt"]);
 *
 * // Event hooks
 * storage.on("afterPut", ({ location, file }) => {
 *   console.log(`Uploaded ${location}`);
 * });
 * ```
 */
export class Storage extends ScopedStorage implements StorageManagerContract {
  /**
   * Registered drivers (cached instances)
   * @internal
   */
  protected drivers = new Map<string, StorageDriverContract>();

  /**
   * Driver configurations
   * @internal
   */
  protected configs = new Map<string, StorageDriverConfig>();

  /**
   * Default driver name
   * @internal
   */
  protected defaultDriverName!: StorageDriverName;

  /**
   * Whether the storage has been initialized
   * @internal
   */
  private initialized = false;

  /**
   * Create a new Storage manager instance
   *
   * Uses lazy initialization - driver is resolved on first access.
   */
  public constructor() {
    // Temp placeholder - will be replaced on first access
    super(null as unknown as StorageDriverContract);
  }

  /**
   * Ensure storage is initialized (lazy initialization)
   *
   * Called automatically on first driver access.
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    // Mark as initialized FIRST to prevent infinite recursion
    this.initialized = true;

    // Get default driver name from config

    const defaultName = storageConfig("default", "local");

    this.defaultDriverName = defaultName as StorageDriverName;
    this.loadDriversFromConfig();

    // Now set the actual driver
    this._driver = this.resolveDriver(this.defaultDriverName);
  }

  /**
   * Reset storage defaults
   */
  public reset(): void {
    this.initialized = false;
    this.drivers.clear();
    this.configs.clear();
    this.defaultDriverName = null as unknown as StorageDriverName;
    this._driver = null as unknown as StorageDriverContract;
  }

  /**
   * Get the currently active driver (context-aware in future)
   *
   * Currently returns the default driver.
   * Will be enhanced to check AsyncLocalStorage context for multi-tenant support.
   *
   * @returns The active storage driver
   */
  public override get activeDriver(): StorageDriverContract {
    // Check context for tenant-specific driver
    const contextDriver = storageDriverContext.getDriver();

    if (contextDriver) return contextDriver;

    return this._driver;
  }

  // ============================================================
  // Driver Management
  // ============================================================

  /**
   * Load drivers from configuration
   * @internal
   */
  protected loadDriversFromConfig(): void {
    const drivers = storageConfig<Record<string, StorageDriverConfig>>("drivers", {});

    for (const [name, config] of Object.entries(drivers)) {
      this.configs.set(name, config);
    }
  }

  /**
   * Get a scoped storage for a specific driver
   *
   * Returns a `ScopedStorage` instance that wraps the specified driver.
   * Operations on the returned instance also return `StorageFile` objects.
   *
   * @param name - Driver name as defined in configuration
   * @returns ScopedStorage instance for the specified driver
   *
   * @example
   * ```typescript
   * // Upload to S3
   * const s3File = await storage.use("s3").put(buffer, "images/photo.jpg");
   *
   * // Upload to local
   * const localFile = await storage.use("local").put(buffer, "temp/file.txt");
   *
   * // Both return StorageFile with identical API
   * console.log(s3File.url);
   * console.log(localFile.url);
   * ```
   */
  public use(name: StorageDriverName): ScopedStorageContract {
    return new ScopedStorage(this.getDriver(name));
  }

  /**
   * Get a raw driver instance
   *
   * Returns the underlying driver directly for advanced use cases.
   * Unlike `use()`, calling methods on the raw driver returns
   * `StorageFileData` instead of `StorageFile`.
   *
   * @param name - Driver name as defined in configuration
   * @returns Raw driver instance implementing StorageDriverContract
   *
   * @example
   * ```typescript
   * const driver = storage.getDriver("s3");
   * const data = await driver.put(buffer, "path/to/file");
   * // data is StorageFileData, not StorageFile
   * ```
   */
  public getDriver(name: StorageDriverName): StorageDriverContract {
    return this.resolveDriver(name);
  }

  /**
   * Get root directory of current driver
   */
  public root(apepndedPath?: string): string {
    const rootPath = this.activeDriver.options?.root || "";

    return path.join(rootPath, apepndedPath || "");
  }

  /**
   * Use a cloud storage driver with extended cloud capabilities
   *
   * @param name - Cloud driver name (s3, r2, spaces)
   * @returns Driver instance implementing CloudStorageDriverContract
   * @throws Error if driver doesn't support cloud operations
   *
   * @example
   * ```typescript
   * const cloudDriver = storage.useCloud("s3");
   * const presignedUrl = await cloudDriver.getPresignedUrl("private/doc.pdf");
   * ```
   */
  public useCloud(name: StorageDriverName): CloudStorageDriverContract {
    const instance = this.getDriver(name);

    if (!this.isCloudDriver(instance)) {
      throw new Error(`Driver "${name}" does not support cloud operations`);
    }

    return instance as CloudStorageDriverContract;
  }

  /**
   * Register a new driver configuration at runtime
   *
   * Allows dynamic driver registration for multi-tenancy or
   * runtime configuration scenarios.
   *
   * @param name - Unique driver name
   * @param config - Driver configuration
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * storage.register("tenant-s3", {
   *   driver: "s3",
   *   bucket: "tenant-bucket",
   *   region: "us-east-1",
   *   accessKeyId: process.env.TENANT_AWS_KEY,
   *   secretAccessKey: process.env.TENANT_AWS_SECRET
   * });
   *
   * await storage.use("tenant-s3").put(buffer, "file.txt");
   * ```
   */
  public register(name: StorageDriverName, config: StorageDriverConfig): this {
    this.configs.set(name, config);
    this.drivers.delete(name); // Clear cached instance
    return this;
  }

  /**
   * Set the default driver name
   *
   * @param name - Driver name to use as default
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * storage.setDefault("s3");
   * await storage.put(buffer, "file.txt"); // Now uses S3
   * ```
   */
  public setDefault(name: StorageDriverName): this {
    this.defaultDriverName = name;
    this._driver = this.getDriver(name);
    return this;
  }

  /**
   * Check if current driver is a cloud driver
   *
   * @returns Promise resolving to true if the current driver supports cloud operations
   */
  public async isCloud(): Promise<boolean> {
    return this.isCloudDriver(this.activeDriver);
  }

  /**
   * Check if a driver instance supports cloud operations
   * @internal
   */
  protected isCloudDriver(driver: StorageDriverContract): driver is CloudStorageDriverContract {
    return "getPresignedUrl" in driver;
  }

  // ============================================================
  // Event System
  // ============================================================

  /**
   * Register an event handler
   *
   * Subscribe to storage events for logging, analytics, or side effects.
   *
   * @param event - Event type to listen for
   * @param handler - Handler function
   * @returns Event subscription for unsubscribing
   *
   * @example
   * ```typescript
   * // Log all uploads
   * storage.on("afterPut", ({ location, file }) => {
   *   console.log(`Uploaded ${file?.size} bytes to ${location}`);
   * });
   *
   * // Track deletions
   * storage.on("afterDelete", ({ location }) => {
   *   analytics.track("file_deleted", { path: location });
   * });
   * ```
   */
  public on<T extends StorageEventPayload = StorageEventPayload>(
    event: StorageEventType,
    handler: StorageEventHandler<T>,
  ): EventSubscription {
    return events.subscribe(`storage.${event}`, handler);
  }

  /**
   * Remove all handlers for an event type
   *
   * @param event - Event type to remove handlers for
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * storage.off("afterPut"); // Remove all afterPut handlers
   * ```
   */
  public off(event: StorageEventType): this {
    events.off(`storage.${event}`);
    return this;
  }

  /**
   * Emit an event to all registered handlers
   * @internal
   */
  protected async emit<T extends StorageEventPayload>(
    event: StorageEventType,
    payload: T,
  ): Promise<void> {
    await events.triggerAll(`storage.${event}`, payload);
  }

  // ============================================================
  // Overridden Operations with Events
  // ============================================================

  /**
   * Store a file in storage
   *
   * Extends base `put()` with event emission for beforePut/afterPut hooks.
   *
   * @param file - File content as Buffer, string, UploadedFile, or Readable stream
   * @param location - Destination path
   * @param options - Storage options (mimeType, cacheControl, etc.)
   * @returns StorageFile instance with cached metadata
   */
  public override async put(
    file: UploadedFile | Buffer | string | Readable,
    location: string,
    options?: PutOptions,
  ): Promise<StorageFile> {
    const driver = this.activeDriver;
    const buffer = await this.toBuffer(file);

    await this.emit<StoragePutEventPayload>("beforePut", {
      driver: driver.name,
      location,
      timestamp: new Date(),
      size: buffer.length,
    });

    const result = await driver.put(buffer, location, options);

    await this.emit<StoragePutEventPayload>("afterPut", {
      driver: driver.name,
      location,
      timestamp: new Date(),
      file: result,
    });

    if (!result.size) {
      result.size = buffer.length;
    }

    return StorageFile.fromData(result, driver);
  }

  /**
   * Store a file from a readable stream (for large files)
   *
   * Extends base `putStream()` with event emission.
   *
   * @param stream - Readable stream
   * @param location - Destination path
   * @param options - Storage options
   * @returns StorageFile instance with cached metadata
   */
  public override async putStream(
    stream: Readable | string,
    location: string,
    options?: PutOptions,
  ): Promise<StorageFile> {
    const driver = this.activeDriver;

    await this.emit<StoragePutEventPayload>("beforePut", {
      driver: driver.name,
      location,
      timestamp: new Date(),
    });

    if (typeof stream === "string") {
      stream = fs.createReadStream(stream);
    }

    const result = await driver.putStream(stream, location, options);

    await this.emit<StoragePutEventPayload>("afterPut", {
      driver: driver.name,
      location,
      timestamp: new Date(),
      file: result,
    });

    return StorageFile.fromData(result, driver);
  }

  /**
   * Store a file from a URL
   *
   * Downloads content from the URL and stores it at the specified location.
   *
   * @param url - Source URL to download from
   * @param location - Destination path
   * @param options - Storage options
   * @returns StorageFile instance with cached metadata
   *
   * @example
   * ```typescript
   * const file = await storage.putFromUrl(
   *   "https://example.com/image.jpg",
   *   "downloads/image.jpg"
   * );
   * ```
   */
  public async putFromUrl(
    url: string,
    location: string,
    options?: PutOptions,
  ): Promise<StorageFile> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = options?.mimeType || response.headers.get("content-type") || undefined;

    return this.put(buffer, location, { ...options, mimeType });
  }

  /**
   * Store a file from base64 encoded string
   *
   * Decodes base64 content (with optional data URL prefix) and stores it.
   *
   * @param base64 - Base64 encoded file content (or data URL)
   * @param location - Destination path
   * @param options - Storage options
   * @returns StorageFile instance with cached metadata
   *
   * @example
   * ```typescript
   * // From plain base64
   * const file = await storage.putFromBase64(base64String, "images/photo.jpg");
   *
   * // From data URL (auto-extracts MIME type)
   * const file = await storage.putFromBase64(
   *   "data:image/png;base64,iVBORw0KGgo...",
   *   "images/photo.png"
   * );
   * ```
   */
  public async putFromBase64(
    base64: string,
    location: string,
    options?: PutOptions,
  ): Promise<StorageFile> {
    let data = base64;
    let mimeType = options?.mimeType;

    if (base64.startsWith("data:")) {
      const match = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = mimeType || match[1];
        data = match[2];
      }
    }

    const buffer = Buffer.from(data, "base64");
    return this.put(buffer, location, { ...options, mimeType });
  }

  /**
   * Retrieve file contents as Buffer
   *
   * Uses the current driver (with async resolution).
   *
   * @param location - File path
   * @returns Buffer containing file contents
   */
  public override async get(location: string): Promise<Buffer> {
    return this.activeDriver.get(location);
  }

  /**
   * Get JSON content from a file
   *
   * Downloads and parses JSON file content.
   *
   * @param location - File path
   * @returns Parsed JSON content
   *
   * @example
   * ```typescript
   * const config = await storage.getJson("config/settings.json");
   * console.log(config.apiKey);
   * ```
   */
  public async getJson(location: string): Promise<any> {
    const buffer = await this.get(location);
    return JSON.parse(buffer.toString());
  }

  /**
   * Retrieve a file as a readable stream (for large files)
   *
   * @param location - File path
   * @returns Readable stream of file contents
   */
  public override async getStream(location: string): Promise<Readable> {
    return this.activeDriver.getStream(location);
  }

  /**
   * Delete a file
   *
   * Extends base `delete()` with event emission.
   *
   * @param location - File path or StorageFile
   * @returns true if deleted, false if not found
   */
  public override async delete(location: string | StorageFile): Promise<boolean> {
    const driver = this.activeDriver;
    const path = typeof location === "string" ? location : location.path;

    await this.emit<StorageEventPayload>("beforeDelete", {
      driver: driver.name,
      location: path,
      timestamp: new Date(),
    });

    const result = await driver.delete(path);

    await this.emit<StorageEventPayload>("afterDelete", {
      driver: driver.name,
      location: path,
      timestamp: new Date(),
    });

    return result;
  }

  /**
   * Delete multiple files at once
   *
   * @param locations - Array of file paths
   * @returns Array of delete results with status for each file
   */
  public override async deleteMany(locations: string[]): Promise<DeleteManyResult[]> {
    return this.activeDriver.deleteMany(locations);
  }

  /**
   * Check if a file exists
   *
   * @param location - File path
   * @returns true if file exists
   */
  public override async exists(location: string): Promise<boolean> {
    return this.activeDriver.exists(location);
  }

  /**
   * Copy a file to a new location
   *
   * Extends base `copy()` with event emission.
   *
   * @param from - Source path or StorageFile
   * @param to - Destination path
   * @returns StorageFile instance at destination
   */
  public override async copy(from: string | StorageFile, to: string): Promise<StorageFile> {
    const driver = this.activeDriver;
    const fromPath = typeof from === "string" ? from : from.path;

    await this.emit<StorageCopyEventPayload>("beforeCopy", {
      driver: driver.name,
      location: to,
      from: fromPath,
      to,
      timestamp: new Date(),
    });

    const result = await driver.copy(fromPath, to);

    await this.emit<StorageCopyEventPayload>("afterCopy", {
      driver: driver.name,
      location: to,
      from: fromPath,
      to,
      timestamp: new Date(),
      file: result,
    });

    return StorageFile.fromData(result, driver);
  }

  /**
   * Move a file to a new location
   *
   * Extends base `move()` with event emission.
   *
   * @param from - Source path or StorageFile
   * @param to - Destination path
   * @returns StorageFile instance at destination
   */
  public override async move(from: string | StorageFile, to: string): Promise<StorageFile> {
    const driver = this.activeDriver;
    const fromPath = typeof from === "string" ? from : from.path;

    await this.emit<StorageCopyEventPayload>("beforeMove", {
      driver: driver.name,
      location: to,
      from: fromPath,
      to,
      timestamp: new Date(),
    });

    const result = await driver.move(fromPath, to);

    await this.emit<StorageCopyEventPayload>("afterMove", {
      driver: driver.name,
      location: to,
      from: fromPath,
      to,
      timestamp: new Date(),
      file: result,
    });

    return StorageFile.fromData(result, driver);
  }

  /**
   * List files in a directory
   *
   * @param directory - Directory path (defaults to root)
   * @param options - List options (recursive, limit, etc.)
   * @returns Array of file information objects
   */
  public override async list(
    directory?: string,
    options?: ListOptions,
  ): Promise<StorageFileInfo[]> {
    return this.activeDriver.list(directory || "", options);
  }

  // ============================================================
  // Metadata Operations
  // ============================================================

  /**
   * Get file metadata without downloading
   *
   * @param location - File path
   * @returns File information object
   */
  public override async metadata(location: string): Promise<StorageFileInfo> {
    return this.activeDriver.metadata(location);
  }

  /**
   * Get file size in bytes
   *
   * @param location - File path
   * @returns File size in bytes
   */
  public override async size(location: string): Promise<number> {
    return this.activeDriver.size(location);
  }

  // ============================================================
  // Path Operations (Local Driver Only)
  // ============================================================

  /**
   * Get the absolute filesystem path for a location
   *
   * Only available for local driver.
   *
   * @param location - File path
   * @throws Error if current driver is not a local driver
   * @returns Absolute filesystem path
   */
  public async path(location: string): Promise<string> {
    const driver = this.activeDriver;

    if (!("path" in driver) || typeof driver.path !== "function") {
      throw new Error("path() is only available for local storage drivers");
    }

    return driver.path(location);
  }

  // ============================================================
  // Cloud-Specific Operations
  // ============================================================

  /**
   * Get a presigned URL for downloading a file
   *
   * Only available for cloud drivers.
   *
   * @param location - File path
   * @param options - Presigned URL options (expiresIn)
   * @throws Error if current driver is not a cloud driver
   * @returns Presigned download URL
   *
   * @example
   * ```typescript
   * const url = await storage.getPresignedUrl("private/document.pdf", {
   *   expiresIn: 3600 // 1 hour
   * });
   * ```
   */
  public async getPresignedUrl(location: string, options?: PresignedOptions): Promise<string> {
    const driver = this.activeDriver;

    if (!this.isCloudDriver(driver)) {
      throw new Error("Presigned URLs are only available for cloud storage drivers");
    }

    return driver.getPresignedUrl(location, options);
  }

  /**
   * Get a presigned URL for uploading a file directly to cloud storage
   *
   * Only available for cloud drivers.
   *
   * @param location - Destination path
   * @param options - Upload options (expiresIn, contentType, maxSize)
   * @throws Error if current driver is not a cloud driver
   * @returns Presigned upload URL
   *
   * @example
   * ```typescript
   * const uploadUrl = await storage.getPresignedUploadUrl("uploads/file.pdf", {
   *   expiresIn: 3600,
   *   contentType: "application/pdf"
   * });
   *
   * // Client can PUT directly to this URL
   * ```
   */
  public async getPresignedUploadUrl(
    location: string,
    options?: PresignedUploadOptions,
  ): Promise<string> {
    const driver = this.activeDriver;

    if (!this.isCloudDriver(driver)) {
      throw new Error("Presigned upload URLs are only available for cloud storage drivers");
    }

    return driver.getPresignedUploadUrl(location, options);
  }

  /**
   * Get the bucket name for cloud storage
   *
   * Only available for cloud drivers.
   *
   * @throws Error if current driver is not a cloud driver
   * @returns Bucket name
   */
  public async getBucket(): Promise<string> {
    const driver = this.activeDriver;

    if (!this.isCloudDriver(driver)) {
      throw new Error("Bucket information is only available for cloud storage drivers");
    }

    return driver.getBucket();
  }

  /**
   * Get the region for cloud storage
   *
   * Only available for cloud drivers.
   *
   * @throws Error if current driver is not a cloud driver
   * @returns Region name
   */
  public async getRegion(): Promise<string> {
    const driver = this.activeDriver;

    if (!this.isCloudDriver(driver)) {
      throw new Error("Region information is only available for cloud storage drivers");
    }

    return driver.getRegion();
  }

  /**
   * Set storage class for a file (e.g., STANDARD, GLACIER, etc.)
   *
   * Only available for cloud drivers.
   *
   * @param location - File path
   * @param storageClass - Target storage class
   * @throws Error if current driver is not a cloud driver
   */
  public async setStorageClass(location: string, storageClass: string): Promise<void> {
    const driver = this.activeDriver;

    if (!this.isCloudDriver(driver)) {
      throw new Error("Storage class is only available for cloud storage drivers");
    }

    return driver.setStorageClass(location, storageClass);
  }

  /**
   * Set file visibility (public or private)
   *
   * Only available for cloud drivers.
   *
   * @param location - File path
   * @param visibility - "public" or "private"
   * @throws Error if current driver is not a cloud driver
   */
  public async setVisibility(location: string, visibility: FileVisibility): Promise<void> {
    const driver = this.activeDriver;

    if (!this.isCloudDriver(driver)) {
      throw new Error("Visibility is only available for cloud storage drivers");
    }

    return driver.setVisibility(location, visibility);
  }

  /**
   * Get file visibility
   *
   * Only available for cloud drivers.
   *
   * @param location - File path
   * @throws Error if current driver is not a cloud driver
   * @returns Current visibility setting
   */
  public async getVisibility(location: string): Promise<FileVisibility> {
    const driver = this.activeDriver;

    if (!this.isCloudDriver(driver)) {
      throw new Error("Visibility is only available for cloud storage drivers");
    }

    return driver.getVisibility(location);
  }

  /**
   * Get a temporary signed URL
   *
   * Creates a URL that provides temporary access to the file.
   *
   * @param location - File path
   * @param expiresIn - Seconds until expiration (default: 3600)
   * @returns Signed URL string
   */
  public override async temporaryUrl(location: string, expiresIn?: number): Promise<string> {
    return this.activeDriver.temporaryUrl(location, expiresIn);
  }

  /**
   * Validate a temporary URL token
   *
   * For local driver: validates HMAC-signed tokens
   * For cloud drivers: returns invalid (cloud validates via presigned URL)
   *
   * @param token - The token from the temporary URL
   * @returns Validation result with file info and convenience methods
   *
   * @example
   * ```typescript
   * const result = await storage.validateTemporaryToken(token);
   *
   * if (!result.valid) {
   *   return response.status(403).send(result.error);
   * }
   *
   * // For local driver - use sendFile for efficiency
   * if (result.absolutePath) {
   *   return response.sendFile(result.absolutePath);
   * }
   *
   * // For cloud driver - stream the file
   * const stream = await result.getStream!();
   * stream.pipe(response.raw);
   * ```
   */
  public async validateTemporaryToken(token: string): Promise<TemporaryTokenValidation> {
    // Check if driver supports token validation
    if (
      !("validateTemporaryToken" in this.activeDriver) ||
      typeof this.activeDriver.validateTemporaryToken !== "function"
    ) {
      // For cloud drivers, temporary URLs are presigned and validated by the cloud provider
      return {
        valid: false,
        error: "invalid_token",
      };
    }

    return this.activeDriver.validateTemporaryToken(token);
  }

  // ============================================================
  // Configuration Parsing
  // ============================================================

  /**
   * Parse config into driver-specific options
   * @internal
   */
  protected parseOptions(
    config: StorageDriverConfig,
  ): LocalStorageDriverOptions | CloudStorageDriverOptions | R2StorageDriverOptions {
    const { driver, ...options } = config;

    switch (driver) {
      case "local":
        return {
          root: options.root,
          urlPrefix: options.urlPrefix,
          signatureKey: options.signatureKey,
        } satisfies LocalStorageDriverOptions;

      case "s3":
        this.validateCloudConfig(config, "s3");
        return {
          ...options,
          bucket: options.bucket!,
          region: options.region!,
          accessKeyId: options.accessKeyId!,
          secretAccessKey: options.secretAccessKey!,
          endpoint: options.endpoint,
          urlPrefix: options.urlPrefix,
        } satisfies CloudStorageDriverOptions;

      case "r2":
        this.validateCloudConfig(config, "r2");
        if (!options.accountId) {
          throw new Error('R2 driver requires "accountId" configuration');
        }

        return {
          ...options,
          region: options.region || "auto",
          bucket: options.bucket!,
          accessKeyId: options.accessKeyId!,
          secretAccessKey: options.secretAccessKey!,
          endpoint: options.endpoint,
          urlPrefix: options.urlPrefix,
          accountId: options.accountId,
          publicDomain: options.publicDomain,
        } satisfies R2StorageDriverOptions;

      case "spaces":
        this.validateCloudConfig(config, "spaces");
        return {
          ...options,
          bucket: options.bucket!,
          region: options.region!,
          accessKeyId: options.accessKeyId!,
          secretAccessKey: options.secretAccessKey!,
          endpoint: options.endpoint,
          urlPrefix: options.urlPrefix,
        } satisfies CloudStorageDriverOptions;

      default:
        throw new Error(`Unknown driver type: ${driver}`);
    }
  }

  /**
   * Validate cloud driver configuration has required fields
   * @internal
   */
  protected validateCloudConfig(config: StorageDriverConfig, driverName: string): void {
    const required = ["bucket", "accessKeyId", "secretAccessKey"];

    if (driverName !== "r2") {
      required.push("region");
    }

    for (const field of required) {
      if (!config[field as keyof StorageDriverConfig]) {
        throw new Error(`${driverName.toUpperCase()} driver requires "${field}" configuration`);
      }
    }
  }

  /**
   * Get or create driver instance from cache
   * @internal
   */
  protected resolveDriver(name: string): StorageDriverContract {
    // Ensure configs are loaded

    if (this.drivers.has(name)) {
      return this.drivers.get(name)!;
    }

    const config = this.configs.get(name);

    if (!config) {
      throw new Error(`Storage driver "${name}" is not configured`);
    }

    const options = this.parseOptions(config);
    let driver: StorageDriverContract;

    switch (config.driver) {
      case "local":
        driver = new LocalDriver(options as LocalStorageDriverOptions);
        break;
      case "s3":
        driver = new S3Driver(options as CloudStorageDriverOptions);
        break;
      case "r2":
        driver = new R2Driver(options as R2StorageDriverOptions);
        break;
      case "spaces":
        driver = new DOSpacesDriver(options as CloudStorageDriverOptions);
        break;
      default:
        throw new Error(`Unknown storage driver type: ${config.driver}`);
    }

    this.drivers.set(name, driver);
    return driver;
  }

  /**
   * Resolve the default driver name (supports async resolver for multi-tenancy)
   * @internal
   */
  protected async resolveDefaultDriver(): Promise<StorageDriverName> {
    const resolver = storageConfig("resolver");

    if (resolver) {
      const resolved = await resolver();
      return resolved || this.defaultDriverName;
    }

    return this.defaultDriverName;
  }
}

/**
 * Singleton storage instance
 *
 * Pre-configured storage manager ready for use throughout the application.
 *
 * @example
 * ```typescript
 * import { storage } from "@warlock.js/core";
 *
 * const file = await storage.put(buffer, "uploads/file.txt");
 * ```
 */
export const storage = new Storage();
