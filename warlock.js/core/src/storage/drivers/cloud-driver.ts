import crypto from "crypto";
import type { Readable } from "stream";
import { storageDriverContext } from "../context/storage-driver-context";
import type {
  CloudStorageDriverContract,
  CloudStorageDriverOptions,
  CloudStorageFileData,
  DeleteManyResult,
  FileVisibility,
  ListOptions,
  PresignedOptions,
  PresignedUploadOptions,
  PutOptions,
  StorageDriverType,
  StorageFileInfo,
} from "../types";
import { getMimeType } from "../utils/mime";

// ============================================================
// Lazy-loaded S3 SDK Types
// ============================================================

/**
 * Cached S3 SDK modules (loaded once, reused)
 */
let S3Client: typeof import("@aws-sdk/client-s3");
let S3Storage: typeof import("@aws-sdk/lib-storage");
let S3Presigner: typeof import("@aws-sdk/s3-request-presigner");

let isModuleExists: boolean | null = null;

/**
 * Installation instructions for S3 SDK packages
 */
const S3_INSTALL_INSTRUCTIONS = `
Cloud storage requires the AWS S3 SDK packages.
Install them with:

  npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner

Or with your preferred package manager:

  pnpm add @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
  yarn add @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
`.trim();

/**
 * Atomic initialization promise to handle concurrent calls to loadS3
 */
let initializationPromise: Promise<void> | null = null;

/**
 * Load S3 modules lazily
 *
 * @example
 * await loadS3();
 * if (isModuleExists) {
 *   // Safe to use S3Client, S3Storage, S3Presigner
 * }
 */
export async function loadS3(): Promise<void> {
  // If already successfully loaded, no need to do anything
  if (isModuleExists === true) return;

  // If currently loading, return the existing promise so the caller waits
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      // Use Promise.all to load modules in parallel for efficiency
      const [client, storage, presigner] = await Promise.all([
        import("@aws-sdk/client-s3"),
        import("@aws-sdk/lib-storage"),
        import("@aws-sdk/s3-request-presigner"),
      ]);

      S3Client = client;
      S3Storage = storage;
      S3Presigner = presigner;

      isModuleExists = true;
    } catch {
      // Mark as failed if any import fails (usually means packages aren't installed)
      isModuleExists = false;
    }
  })();

  return initializationPromise;
}

loadS3();

// ============================================================
// CloudDriver Base Class
// ============================================================

/**
 * Base abstract class for all S3-compatible cloud storage drivers
 *
 * This class contains all shared logic for S3-compatible storage services
 * including AWS S3, Cloudflare R2, DigitalOcean Spaces, and others.
 *
 * **Important:** S3 SDK packages are lazy-loaded on first use.
 * Users must install them separately:
 * ```
 * npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
 * ```
 *
 * Subclasses must implement:
 * - `name`: Driver identifier (e.g., "s3", "r2", "spaces")
 * - `url()`: Returns the public URL for a file (provider-specific format)
 */
export abstract class CloudDriver<
  TOptions extends Partial<CloudStorageDriverOptions> = CloudStorageDriverOptions,
> implements CloudStorageDriverContract {
  /**
   * S3-compatible client (lazy-loaded)
   */
  protected client!: InstanceType<typeof import("@aws-sdk/client-s3").S3Client>;

  /**
   * Retry configuration
   */
  protected retryConfig: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };

  public constructor(public options: TOptions) {
    if (!isModuleExists) {
      throw new Error(S3_INSTALL_INSTRUCTIONS);
    }

    this.client = new S3Client.S3Client({
      region: this.options.region!,
      credentials: {
        accessKeyId: this.options.accessKeyId!,
        secretAccessKey: this.options.secretAccessKey!,
      },
      ...(this.getEndpoint() && { endpoint: this.getEndpoint() }),
    });

    // Initialize retry configuration
    this.retryConfig = {
      maxRetries: this.options.retry?.maxRetries ?? 3,
      initialDelayMs: this.options.retry?.initialDelayMs ?? 1000,
      maxDelayMs: this.options.retry?.maxDelayMs ?? 10000,
      backoffMultiplier: this.options.retry?.backoffMultiplier ?? 2,
    };
  }

  /**
   * Driver name identifier
   */
  public abstract readonly name: StorageDriverType;

  /**
   * Get public URL for file
   * Must be implemented by subclasses with provider-specific format
   */
  public abstract url(location: string): string;

  /**
   * Get endpoint URL
   * Can be overridden by subclasses for provider-specific endpoints
   */
  protected getEndpoint(): string | undefined {
    return this.options.endpoint;
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * Apply prefix to location path
   *
   * Priority: context prefix > driver options prefix > no prefix
   * This allows multi-tenant scenarios where context overrides driver config.
   *
   * @param location - Original location path
   * @returns Location with prefix applied if one exists
   */
  public applyPrefix(location: string): string {
    // Check context prefix first (highest priority)
    const contextPrefix = storageDriverContext.getPrefix();
    const prefix = contextPrefix || this.options.prefix;

    if (!prefix) {
      return location;
    }

    const cleanPrefix = prefix.replace(/\/+$/, "");
    const cleanLocation = location.replace(/^\/+/, "");

    // Avoid double-prefixing
    if (cleanLocation.startsWith(cleanPrefix + "/") || cleanLocation === cleanPrefix) {
      return cleanLocation;
    }

    return `${cleanPrefix}/${cleanLocation}`;
  }

  /**
   * Normalize storage path (remove double slashes, sanitize)
   * @internal
   */
  protected normalizePath(path: string): string {
    return path
      .replace(/\/+/g, "/") // Remove multiple slashes
      .replace(/^\//, "") // Remove leading slash
      .trim();
  }

  /**
   * Execute an operation with retry logic
   *
   * Retries on transient errors with exponential backoff.
   *
   * @param operation - Async operation to execute
   * @param operationName - Name for logging
   * @returns Result of the operation
   * @internal
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = "operation",
  ): Promise<T> {
    const { maxRetries, initialDelayMs, backoffMultiplier, maxDelayMs } = this.retryConfig;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt === maxRetries - 1) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error; // Non-retryable error, fail immediately
        }

        // Calculate delay with exponential backoff
        const delayMs = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt), maxDelayMs);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Check if an error is retryable
   *
   * Retries on:
   * - Network errors
   * - 5xx server errors
   * - Rate limiting (429)
   * - Timeout errors
   *
   * Does NOT retry on:
   * - 4xx client errors (except 429)
   * - Authentication errors
   * - Not found errors
   *
   * @param error - Error to check
   * @returns true if error is retryable
   * @internal
   */
  protected isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
      return true;
    }

    // S3 SDK errors
    if (error.name === "NetworkingError" || error.name === "TimeoutError") {
      return true;
    }

    // HTTP status codes
    const statusCode = error.$metadata?.httpStatusCode || error.statusCode;
    if (statusCode) {
      // 5xx server errors are retryable
      if (statusCode >= 500 && statusCode < 600) {
        return true;
      }

      // 429 Too Many Requests is retryable
      if (statusCode === 429) {
        return true;
      }
    }

    return false;
  }

  // ============================================================
  // Core File Operations
  // ============================================================

  /**
   * Put file to cloud storage
   */
  public async put(
    file: Buffer,
    location: string,
    options?: PutOptions,
  ): Promise<CloudStorageFileData> {
    return this.withRetry(async () => {
      const { PutObjectCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const hash = this.calculateHash(file);
      const mimeType = options?.mimeType || this.guessMimeType(location);

      const command = new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
        Body: file,
        ContentType: mimeType,
        CacheControl: options?.cacheControl,
        ContentDisposition: options?.contentDisposition,
        Metadata: options?.metadata,
        ACL: options?.visibility === "public" ? "public-read" : undefined,
      });

      const result = await this.client.send(command);

      return {
        path: location,
        url: this.url(location),
        size: file.length,
        hash,
        mimeType,
        driver: this.name,
        bucket: this.options.bucket!,
        region: this.options.region!,
        etag: result.ETag,
        versionId: result.VersionId,
      };
    }, "put");
  }

  /**
   * Put file from a readable stream (for large files)
   * Uses S3 multipart upload for efficient streaming
   */
  public async putStream(
    stream: Readable,
    location: string,
    options?: PutOptions,
  ): Promise<CloudStorageFileData> {
    return this.withRetry(async () => {
      const { Upload } = S3Storage;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const mimeType = options?.mimeType || this.guessMimeType(location);

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.options.bucket,
          Key: location,
          Body: stream,
          ContentType: mimeType,
          CacheControl: options?.cacheControl,
          ContentDisposition: options?.contentDisposition,
          Metadata: options?.metadata,
          ACL: options?.visibility === "public" ? "public-read" : undefined,
        },
      });

      const result = await upload.done();

      // Get file info for size and hash
      const info = await this.metadata(location);

      return {
        path: location,
        url: this.url(location),
        size: info.size,
        hash: info.etag?.replace(/"/g, "") || "",
        mimeType,
        driver: this.name,
        bucket: this.options.bucket!,
        region: this.options.region!,
        etag: result.ETag,
        versionId: result.VersionId,
      };
    }, "putStream");
  }

  /**
   * Get file contents as Buffer
   */
  public async get(location: string): Promise<Buffer> {
    return this.withRetry(async () => {
      const { GetObjectCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new GetObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
      });

      const result = await this.client.send(command);

      if (!result.Body) {
        throw new Error(`File not found: ${location}`);
      }

      return Buffer.from(await result.Body.transformToByteArray());
    }, "get");
  }

  /**
   * Get file as a readable stream (for large files)
   */
  public async getStream(location: string): Promise<Readable> {
    return this.withRetry(async () => {
      const { GetObjectCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new GetObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
      });

      const result = await this.client.send(command);

      if (!result.Body) {
        throw new Error(`File not found: ${location}`);
      }

      return result.Body as Readable;
    }, "getStream");
  }

  /**
   * Delete a file
   */
  public async delete(location: string): Promise<boolean> {
    return this.withRetry(async () => {
      const { DeleteObjectCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
      });

      await this.client.send(command);

      return true;
    }, "delete");
  }

  /**
   * Delete multiple files at once (uses batch delete for efficiency)
   */
  public async deleteMany(locations: string[]): Promise<DeleteManyResult[]> {
    if (locations.length === 0) {
      return [];
    }

    return this.withRetry(async () => {
      const { DeleteObjectsCommand } = S3Client;

      // Apply storage prefix to all locations
      const prefixedLocations = locations.map((loc) => this.applyPrefix(loc));

      const command = new DeleteObjectsCommand({
        Bucket: this.options.bucket,
        Delete: {
          Objects: prefixedLocations.map((Key) => ({ Key })),
          Quiet: false,
        },
      });

      const result = await this.client.send(command);
      const results: DeleteManyResult[] = [];

      // Process successful deletes
      for (const deleted of result.Deleted || []) {
        if (deleted.Key) {
          results.push({ location: deleted.Key, deleted: true });
        }
      }

      // Process errors
      for (const error of result.Errors || []) {
        if (error.Key) {
          results.push({
            location: error.Key,
            deleted: false,
            error: error.Message || "Unknown error",
          });
        }
      }

      return results;
    }, "deleteMany");
  }

  /**
   * Delete directory (recursively deletes all objects with matching prefix)
   *
   * S3/R2 doesn't have true directories - only key prefixes.
   * This method lists all objects with the prefix and deletes them in batches.
   *
   * @param directoryPath - Directory prefix to delete
   * @returns true when all objects are deleted
   */
  public async deleteDirectory(directoryPath: string): Promise<boolean> {
    // Apply storage prefix
    directoryPath = this.applyPrefix(directoryPath);

    // Ensure directory path ends with / for proper prefix matching
    const prefix = directoryPath.endsWith("/") ? directoryPath : `${directoryPath}/`;

    let hasMore = true;

    while (hasMore) {
      // List up to 1000 objects (S3/R2 max per request)
      const objects = await this.list(prefix, {
        limit: 1000,
        recursive: true,
      });

      if (objects.length === 0) {
        break;
      }

      // Filter out directories (we only delete files)
      const filePaths = objects.filter((obj) => !obj.isDirectory).map((obj) => obj.path);

      if (filePaths.length === 0) {
        break;
      }

      // Delete batch (deleteMany already has prefix applied, so paths already have it)
      // Note: We pass the paths as-is since they already include the prefix from list()
      const results = await this.deleteMany(filePaths);

      // Continue if we got full batch (might be more)
      hasMore = objects.length >= 1000;
    }

    return true;
  }

  /**
   * Check if file exists
   */
  public async exists(location: string): Promise<boolean> {
    // No retry for exists - it should be fast and failure means non-existent
    try {
      const { HeadObjectCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new HeadObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================
  // URL Operations
  // ============================================================

  /**
   * Get a temporary presigned URL (alias for getPresignedUrl)
   */
  public async temporaryUrl(location: string, expiresIn = 3600): Promise<string> {
    return this.getPresignedUrl(location, { expiresIn });
  }

  /**
   * Get presigned URL for downloading
   */
  public async getPresignedUrl(location: string, options?: PresignedOptions): Promise<string> {
    return this.withRetry(async () => {
      const { GetObjectCommand } = S3Client;
      const { getSignedUrl } = S3Presigner;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new GetObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
      });

      return getSignedUrl(this.client, command, {
        expiresIn: options?.expiresIn || 3600,
      });
    }, "getPresignedUrl");
  }

  /**
   * Get presigned URL for uploading
   */
  public async getPresignedUploadUrl(
    location: string,
    options?: PresignedUploadOptions,
  ): Promise<string> {
    return this.withRetry(async () => {
      const { PutObjectCommand } = S3Client;
      const { getSignedUrl } = S3Presigner;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
      });

      return getSignedUrl(this.client, command, {
        expiresIn: options?.expiresIn || 3600,
      });
    }, "getPresignedUploadUrl");
  }

  // ============================================================
  // Metadata Operations
  // ============================================================

  /**
   * Get file info/metadata without downloading
   */
  public async metadata(location: string): Promise<StorageFileInfo> {
    return this.withRetry(async () => {
      const { HeadObjectCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new HeadObjectCommand({
        Bucket: this.options.bucket,
        Key: location,
      });

      const result = await this.client.send(command);
      const name = location.split("/").pop() || "";

      return {
        path: location,
        name,
        size: result.ContentLength || 0,
        isDirectory: false,
        lastModified: result.LastModified,
        mimeType: result.ContentType || this.guessMimeType(location),
        etag: result.ETag,
        storageClass: result.StorageClass,
      };
    }, "metadata");
  }

  /**
   * Get file size in bytes (shortcut for metadata().size)
   */
  public async size(location: string): Promise<number> {
    const info = await this.metadata(location);
    return info.size;
  }

  // ============================================================
  // File Operations
  // ============================================================

  /**
   * Copy file to a new location
   */
  public async copy(from: string, to: string): Promise<CloudStorageFileData> {
    return this.withRetry(async () => {
      const { CopyObjectCommand, HeadObjectCommand } = S3Client;

      // Apply storage prefix to both paths
      from = this.applyPrefix(from);
      to = this.applyPrefix(to);

      const command = new CopyObjectCommand({
        Bucket: this.options.bucket,
        CopySource: `${this.options.bucket}/${from}`,
        Key: to,
      });

      const result = await this.client.send(command);

      // Get file metadata
      const headCommand = new HeadObjectCommand({
        Bucket: this.options.bucket,
        Key: to,
      });
      const headResult = await this.client.send(headCommand);

      return {
        path: to,
        url: this.url(to),
        size: headResult.ContentLength || 0,
        hash: headResult.ETag?.replace(/"/g, "") || "",
        mimeType: headResult.ContentType || this.guessMimeType(to),
        driver: this.name,
        bucket: this.options.bucket!,
        region: this.options.region!,
        etag: result.CopyObjectResult?.ETag,
        versionId: result.VersionId,
      };
    }, "copy");
  }

  /**
   * Move file to a new location
   */
  public async move(from: string, to: string): Promise<CloudStorageFileData> {
    const file = await this.copy(from, to);
    await this.delete(from);
    return file;
  }

  /**
   * List files in a directory
   */
  public async list(directory: string, options?: ListOptions): Promise<StorageFileInfo[]> {
    return this.withRetry(async () => {
      const { ListObjectsV2Command } = S3Client;

      // Apply storage prefix
      directory = this.applyPrefix(directory);

      const command = new ListObjectsV2Command({
        Bucket: this.options.bucket,
        Prefix: directory,
        MaxKeys: options?.limit,
        ContinuationToken: options?.cursor,
        Delimiter: options?.recursive ? undefined : "/",
      });

      const result = await this.client.send(command);
      const files: StorageFileInfo[] = [];

      // Add files
      for (const object of result.Contents || []) {
        if (!object.Key) continue;

        files.push({
          path: object.Key,
          name: object.Key.split("/").pop() || "",
          size: object.Size || 0,
          isDirectory: false,
          lastModified: object.LastModified,
          etag: object.ETag,
          storageClass: object.StorageClass,
        });
      }

      // Add directories
      for (const prefix of result.CommonPrefixes || []) {
        if (!prefix.Prefix) continue;

        files.push({
          path: prefix.Prefix,
          name: prefix.Prefix.split("/").filter(Boolean).pop() || "",
          size: 0,
          isDirectory: true,
        });
      }

      return files;
    }, "list");
  }

  // ============================================================
  // Cloud-Specific Operations
  // ============================================================

  /**
   * Get bucket name
   */
  public getBucket(): string {
    return this.options.bucket!;
  }

  /**
   * Get region
   */
  public getRegion(): string {
    return this.options.region!;
  }

  /**
   * Set storage class (e.g., STANDARD, GLACIER, etc.)
   */
  public async setStorageClass(location: string, storageClass: string): Promise<void> {
    return this.withRetry(async () => {
      const { CopyObjectCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new CopyObjectCommand({
        Bucket: this.options.bucket,
        CopySource: `${this.options.bucket}/${location}`,
        Key: location,
        StorageClass: storageClass as any,
        MetadataDirective: "COPY",
      });

      await this.client.send(command);
    }, "setStorageClass");
  }

  /**
   * Set file visibility (public or private)
   */
  public async setVisibility(location: string, visibility: FileVisibility): Promise<void> {
    return this.withRetry(async () => {
      const { PutObjectAclCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new PutObjectAclCommand({
        Bucket: this.options.bucket,
        Key: location,
        ACL: visibility === "public" ? "public-read" : "private",
      });

      await this.client.send(command);
    }, "setVisibility");
  }

  /**
   * Get file visibility
   */
  public async getVisibility(location: string): Promise<FileVisibility> {
    return this.withRetry(async () => {
      const { GetObjectAclCommand } = S3Client;

      // Apply storage prefix
      location = this.applyPrefix(location);

      const command = new GetObjectAclCommand({
        Bucket: this.options.bucket,
        Key: location,
      });

      const result = await this.client.send(command);

      // Check if any grant allows public read
      const hasPublicRead = result.Grants?.some(
        (grant) =>
          grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers" &&
          grant.Permission === "READ",
      );

      return hasPublicRead ? "public" : "private";
    }, "getVisibility");
  }

  // ============================================================
  // Utilities
  // ============================================================

  /**
   * Calculate SHA-256 hash
   */
  protected calculateHash(buffer: Buffer): string {
    return crypto.createHash("sha256").update(new Uint8Array(buffer)).digest("hex");
  }

  /**
   * Guess MIME type from file extension
   */
  protected guessMimeType(location: string): string {
    return getMimeType(location);
  }
}
