import { fileExistsAsync } from "@mongez/fs";
import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import type { Readable } from "stream";
import type { UploadedFile } from "../http";
import { StorageFile } from "./storage-file";
import type {
  DeleteManyResult,
  ListOptions,
  PutDirectoryOptions,
  PutDirectoryResult,
  PutOptions,
  ScopedStorageContract,
  StorageDriverContract,
  StorageDriverType,
  StorageFileInfo,
} from "./types";

/**
 * ScopedStorage - Base class for storage operations
 *
 * Wraps a storage driver and provides a consistent, developer-friendly API
 * that returns `StorageFile` instances instead of raw data objects.
 *
 * This class serves as the base for both direct driver usage and the
 * full `Storage` manager class.
 *
 * @example
 * ```typescript
 * // Using via storage.use()
 * const s3Storage = storage.use("s3");
 * const file = await s3Storage.put(buffer, "images/photo.jpg");
 *
 * // file is a StorageFile instance with rich API
 * console.log(file.name);       // "photo.jpg"
 * console.log(file.url);        // "https://..."
 * await file.copy("backup/photo.jpg");
 * ```
 */
export class ScopedStorage implements ScopedStorageContract {
  /**
   * The underlying storage driver instance
   * @internal
   */
  protected _driver: StorageDriverContract;

  /**
   * Create a new ScopedStorage instance
   *
   * @param driver - The storage driver to wrap
   */
  public constructor(driver: StorageDriverContract) {
    this._driver = driver;
  }

  // ============================================================
  // Properties
  // ============================================================

  /**
   * Get the driver name
   *
   * @returns The name identifier of the underlying driver (e.g., "local", "s3", "r2")
   */
  public get name(): StorageDriverType {
    return this.activeDriver.name;
  }

  /**
   * Get the default driver instance
   *
   * Use this for advanced operations that require direct driver access.
   *
   * @returns The raw storage driver
   */
  public get defaultDriver(): StorageDriverContract {
    return this._driver;
  }

  /**
   * Get the currently active driver
   *
   * Returns the driver being used for storage operations.
   * Can be overridden in subclasses for dynamic driver resolution (e.g., multi-tenant contexts).
   *
   * @returns The active storage driver
   */
  public get activeDriver(): StorageDriverContract {
    return this._driver;
  }

  // ============================================================
  // File Operations
  // ============================================================

  /**
   * Store a file in storage
   *
   * Accepts multiple input types and stores the file at the specified location.
   * Returns a `StorageFile` instance for further operations.
   *
   * @param file - File content as Buffer, string path, UploadedFile, or Readable stream
   * @param location - Destination path in storage (e.g., "uploads/images/photo.jpg")
   * @param options - Optional storage options
   * @returns StorageFile instance with cached metadata
   *
   * @example
   * ```typescript
   * // From buffer
   * const file = await storage.put(buffer, "documents/report.pdf");
   *
   * // From uploaded file
   * const file = await storage.put(uploadedFile, "avatars/user-123.jpg");
   *
   * // With options
   * const file = await storage.put(buffer, "images/photo.jpg", {
   *   mimeType: "image/jpeg",
   *   cacheControl: "max-age=31536000"
   * });
   * ```
   */
  public async put(
    file: UploadedFile | Buffer | string | Readable,
    location: string,
    options?: PutOptions,
  ): Promise<StorageFile> {
    const buffer = await this.toBuffer(file);
    const data = await this.activeDriver.put(buffer, location, options);
    return StorageFile.fromData(data, this.activeDriver);
  }

  /**
   * Store a file from a readable stream
   *
   * Optimized for large files - streams data directly without full buffering.
   * Ideal for file uploads, remote file fetching, or processing pipelines.
   *
   * @param stream - Readable stream of file content
   * @param location - Destination path in storage
   * @param options - Optional storage options
   * @returns StorageFile instance with cached metadata
   *
   * @example
   * ```typescript
   * import { createReadStream } from "fs";
   *
   * const stream = createReadStream("./large-video.mp4");
   * const file = await storage.putStream(stream, "videos/upload.mp4");
   * ```
   */
  public async putStream(
    stream: Readable,
    location: string,
    options?: PutOptions,
  ): Promise<StorageFile> {
    const data = await this.activeDriver.putStream(stream, location, options);
    return StorageFile.fromData(data, this.activeDriver);
  }

  /**
   * Store a file from a URL
   *
   * Downloads the file from the URL and stores it.
   *
   * @param url - URL to download from
   * @param location - Destination path in storage
   * @param options - Optional storage options
   * @returns StorageFile instance
   *
   * @example
   * ```typescript
   * const file = await storage.putFromUrl(
   *   "https://example.com/image.jpg",
   *   "images/downloaded.jpg"
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
      throw new Error(`Failed to fetch file from ${url}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return this.put(buffer, location, options);
  }

  /**
   * Store a file from base64 data URL
   *
   * @param dataUrl - Data URL (data:image/png;base64,iVBORw0KG...)
   * @param location - Destination path in storage
   * @param options - Optional storage options
   * @returns StorageFile instance
   *
   * @example
   * ```typescript
   * const file = await storage.putFromBase64(
   *   "data:image/png;base64,iVBORw0KGgoAAAANS...",
   *   "images/upload.png"
   * );
   * ```
   */
  public async putFromBase64(
    dataUrl: string,
    location: string,
    options?: PutOptions,
  ): Promise<StorageFile> {
    // Parse data URL: data:image/png;base64,iVBORw0KG...
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

    if (!matches) {
      throw new Error("Invalid base64 data URL format. Expected: data:mime/type;base64,<data>");
    }

    const [, mimeType, base64Data] = matches;
    const buffer = Buffer.from(base64Data, "base64");

    return this.put(buffer, location, {
      ...options,
      mimeType: options?.mimeType || mimeType,
    });
  }

  /**
   * Retrieve file contents as a Buffer
   *
   * Downloads the entire file into memory. For large files,
   * consider using `getStream()` instead.
   *
   * @param location - Path to the file in storage
   * @returns Buffer containing file contents
   * @throws Error if file not found
   *
   * @example
   * ```typescript
   * const buffer = await storage.get("documents/report.pdf");
   * const content = buffer.toString("utf-8");
   * ```
   */
  public async get(location: string): Promise<Buffer> {
    return this.activeDriver.get(location);
  }

  /**
   * Retrieve file contents as a readable stream
   *
   * Streams file data without loading entire file into memory.
   * Ideal for large files or when piping to a response.
   *
   * @param location - Path to the file in storage
   * @returns Readable stream of file contents
   * @throws Error if file not found
   *
   * @example
   * ```typescript
   * const stream = await storage.getStream("videos/large.mp4");
   * stream.pipe(response.raw);
   * ```
   */
  public async getStream(location: string): Promise<Readable> {
    return this.activeDriver.getStream(location);
  }

  /**
   * Delete a file from storage
   *
   * @param location - Path to the file, or a StorageFile instance
   * @returns `true` if deleted, `false` if file not found
   *
   * @example
   * ```typescript
   * // By path
   * await storage.delete("temp/old-file.txt");
   *
   * // From StorageFile instance
   * const file = await storage.put(buffer, "temp/file.txt");
   * await storage.delete(file);
   * ```
   */
  public async delete(location: string | StorageFile): Promise<boolean> {
    const path = typeof location === "string" ? location : location.path;
    return this.activeDriver.delete(path);
  }

  /**
   * Delete multiple files at once
   *
   * Performs batch deletion for efficiency. Returns results for each file
   * including success/failure status.
   *
   * @param locations - Array of file paths to delete
   * @returns Array of delete results with status for each file
   *
   * @example
   * ```typescript
   * const results = await storage.deleteMany([
   *   "temp/file1.txt",
   *   "temp/file2.txt",
   *   "temp/file3.txt"
   * ]);
   *
   * for (const result of results) {
   *   console.log(`${result.location}: ${result.deleted ? "deleted" : result.error}`);
   * }
   * ```
   */
  public async deleteMany(locations: string[]): Promise<DeleteManyResult[]> {
    return this.activeDriver.deleteMany(locations);
  }

  /**
   * Delete a directory
   *
   * @param directoryPath - Path to the directory
   */
  public async deleteDirectory(directoryPath: string): Promise<boolean> {
    return await this.activeDriver.deleteDirectory(directoryPath);
  }

  /**
   * Check if a file exists in storage
   *
   * @param location - Path to check
   * @returns `true` if file exists, `false` otherwise
   *
   * @example
   * ```typescript
   * if (await storage.exists("config/settings.json")) {
   *   const config = await storage.get("config/settings.json");
   * }
   * ```
   */
  public async exists(location: string): Promise<boolean> {
    return this.activeDriver.exists(location);
  }

  /**
   * Copy a file to a new location
   *
   * Creates a copy of the file at the destination path.
   * The original file remains unchanged.
   *
   * @param from - Source path or StorageFile instance
   * @param to - Destination path
   * @returns StorageFile instance at the new location
   *
   * @example
   * ```typescript
   * // Copy by path
   * const backup = await storage.copy("documents/report.pdf", "backups/report.pdf");
   *
   * // Copy from StorageFile
   * const original = await storage.file("documents/report.pdf");
   * const backup = await storage.copy(original, "backups/report.pdf");
   * ```
   */
  public async copy(from: string | StorageFile, to: string): Promise<StorageFile> {
    const fromPath = typeof from === "string" ? from : from.path;
    const data = await this.activeDriver.copy(fromPath, to);
    return StorageFile.fromData(data, this.activeDriver);
  }

  /**
   * Move a file to a new location
   *
   * Moves the file to the destination path. The original file
   * is deleted after successful copy.
   *
   * @param from - Source path or StorageFile instance
   * @param to - Destination path
   * @returns StorageFile instance at the new location
   *
   * @example
   * ```typescript
   * // Move by path
   * const file = await storage.move("uploads/temp.jpg", "images/photo.jpg");
   *
   * // Move from StorageFile
   * const temp = await storage.file("uploads/temp.jpg");
   * const final = await storage.move(temp, "images/photo.jpg");
   * ```
   */
  public async move(from: string | StorageFile, to: string): Promise<StorageFile> {
    const fromPath = typeof from === "string" ? from : from.path;
    const data = await this.activeDriver.move(fromPath, to);
    return StorageFile.fromData(data, this.activeDriver);
  }

  /**
   * Copy an entire directory recursively
   *
   * Copies all files from the source directory to the destination directory,
   * preserving the directory structure.
   *
   * @param from - Source directory path
   * @param to - Destination directory path
   * @param options - Optional concurrency control
   * @returns Number of files copied
   *
   * @example
   * ```typescript
   * // Copy entire directory
   * const count = await storage.copyDirectory("uploads/temp", "uploads/final");
   * console.log(`Copied ${count} files`);
   *
   * // With concurrency limit
   * const count = await storage.copyDirectory("large-dir", "backup", {
   *   concurrency: 10
   * });
   * ```
   */
  public async copyDirectory(
    from: string,
    to: string,
    options?: { concurrency?: number },
  ): Promise<number> {
    const concurrency = options?.concurrency || 5;

    // List all files recursively
    const files = await this.list(from, { recursive: true });
    const filesToCopy = files.filter((f) => !f.isDirectory);

    // Copy files in batches for efficiency
    let copied = 0;
    for (let i = 0; i < filesToCopy.length; i += concurrency) {
      const batch = filesToCopy.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (file) => {
          // Calculate relative path and new destination
          const relativePath = file.path.substring(from.length).replace(/^\//, "");
          const newPath = `${to}/${relativePath}`;
          await this.copy(file.path, newPath);
          copied++;
        }),
      );
    }

    return copied;
  }

  /**
   * Move an entire directory recursively
   *
   * Moves all files from the source directory to the destination directory,
   * then deletes the source directory.
   *
   * @param from - Source directory path
   * @param to - Destination directory path
   * @param options - Optional concurrency control
   * @returns Number of files moved
   *
   * @example
   * ```typescript
   * const count = await storage.moveDirectory("uploads/temp", "uploads/final");
   * console.log(`Moved ${count} files`);
   * ```
   */
  public async moveDirectory(
    from: string,
    to: string,
    options?: { concurrency?: number },
  ): Promise<number> {
    // Copy all files first
    const count = await this.copyDirectory(from, to, options);

    // Delete source directory
    await this.deleteDirectory(from);

    return count;
  }

  /**
   * Upload a local filesystem directory into storage
   *
   * Recursively walks the local directory, applies an optional filter, then
   * streams each file into storage. Uploads run in concurrent batches for
   * efficiency. Failures are collected — a single failed file never aborts
   * the entire operation (mirrors the contract of `deleteMany`).
   *
   * @param localDirPath  - Absolute path of the local directory to upload
   * @param destination   - Target prefix in storage (e.g. "uploads/assets")
   * @param options       - Concurrency, filter, progress callback, put options
   * @returns             - { uploaded, failed, total }
   *
   * @example
   * ```typescript
   * const result = await storage.putDirectory("./public/assets", "cdn/assets", {
   *   concurrency: 10,
   *   filter: (_, rel) => !rel.startsWith("."),
   *   onProgress: (done, total) => console.log(`${done}/${total}`),
   * });
   *
   * console.log(`Uploaded: ${result.uploaded.length}, Failed: ${result.failed.length}`);
   * ```
   */
  public async putDirectory(
    localDirPath: string,
    destination: string,
    options?: PutDirectoryOptions,
  ): Promise<PutDirectoryResult> {
    const concurrency = options?.concurrency ?? 5;

    // Collect all local file paths recursively
    const localFiles = await this.walkLocalDirectory(localDirPath);

    // Apply the user-supplied filter if any
    const filteredFiles = options?.filter
      ? localFiles.filter(({ absolute, relative }) => options.filter!(absolute, relative))
      : localFiles;

    const total = filteredFiles.length;
    const uploaded: StorageFile[] = [];
    const failed: Array<{ localPath: string; error: Error }> = [];
    let doneCount = 0;

    // Upload in concurrent batches
    for (let i = 0; i < filteredFiles.length; i += concurrency) {
      const batch = filteredFiles.slice(i, i + concurrency);

      await Promise.all(
        batch.map(async ({ absolute, relative }) => {
          const storagePath = `${destination.replace(/\/$/, "")}/${relative}`;

          try {
            const stream = createReadStream(absolute);
            const file = await this.putStream(stream, storagePath, options?.putOptions);
            uploaded.push(file);
            doneCount++;
            options?.onProgress?.(doneCount, total, file);
          } catch (err) {
            failed.push({
              localPath: absolute,
              error: err instanceof Error ? err : new Error(String(err)),
            });
          }
        }),
      );
    }

    return { uploaded, failed, total };
  }

  /**
   * Walk a local directory recursively and return all file paths
   *
   * @param dirPath - Absolute local directory path
   * @returns Array of { absolute, relative } file path pairs
   * @internal
   */
  private async walkLocalDirectory(
    dirPath: string,
    baseDir?: string,
  ): Promise<Array<{ absolute: string; relative: string }>> {
    const root = baseDir ?? dirPath;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: Array<{ absolute: string; relative: string }> = [];

    for (const entry of entries) {
      const absolute = path.join(dirPath, entry.name);
      const relative = path.relative(root, absolute).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        const nested = await this.walkLocalDirectory(absolute, root);
        results.push(...nested);
      } else if (entry.isFile()) {
        results.push({ absolute, relative });
      }
      // Symlinks are intentionally skipped
    }

    return results;
  }

  /**
   * Empty a directory without deleting the directory itself
   *
   * Deletes all files within the directory but preserves the directory structure.
   *
   * @param path - Directory path to empty
   * @returns Number of files deleted
   *
   * @example
   * ```typescript
   * const count = await storage.emptyDirectory("uploads/temp");
   * console.log(`Deleted ${count} files`);
   * ```
   */
  public async emptyDirectory(path: string): Promise<number> {
    // List all files in directory
    const files = await this.list(path, { recursive: true });
    const filePaths = files.filter((f) => !f.isDirectory).map((f) => f.path);

    if (filePaths.length === 0) {
      return 0;
    }

    // Delete all files
    await this.deleteMany(filePaths);

    return filePaths.length;
  }

  /**
   * List files in a directory
   *
   * Returns file information for all files in the specified directory.
   * Supports recursive listing and pagination.
   *
   * @param directory - Directory path (defaults to root)
   * @param options - List options (recursive, limit, cursor)
   * @returns Array of file information objects
   *
   * @example
   * ```typescript
   * // List all files in uploads
   * const files = await storage.list("uploads");
   *
   * // Recursive listing with limit
   * const files = await storage.list("uploads", {
   *   recursive: true,
   *   limit: 100
   * });
   * ```
   */
  public async list(directory?: string, options?: ListOptions): Promise<StorageFileInfo[]> {
    return this.activeDriver.list(directory || "", options);
  }

  // ============================================================
  // URL Operations
  // ============================================================

  /**
   * Get the public URL for a file
   *
   * Returns the URL where the file can be accessed. For local storage,
   * this is typically a path prefix. For cloud storage, this is the
   * bucket URL or CDN URL.
   *
   * @param location - File path
   * @returns Public URL string
   *
   * @example
   * ```typescript
   * const url = storage.url("images/photo.jpg");
   * // Local: "/uploads/images/photo.jpg"
   * // S3: "https://bucket.s3.amazonaws.com/images/photo.jpg"
   * ```
   */
  public url(location: string): string {
    return this.activeDriver.url(location);
  }

  /**
   * Get a temporary signed URL with expiration
   *
   * Creates a URL that provides temporary access to the file.
   * For cloud storage, this uses presigned URLs.
   * For local storage, this uses HMAC-signed tokens.
   *
   * @param location - File path
   * @param expiresIn - Seconds until URL expires (default: 3600)
   * @returns Signed URL string
   *
   * @example
   * ```typescript
   * // URL valid for 1 hour
   * const url = await storage.temporaryUrl("private/document.pdf");
   *
   * // URL valid for 24 hours
   * const url = await storage.temporaryUrl("private/document.pdf", 86400);
   * ```
   */
  public async temporaryUrl(location: string, expiresIn?: number): Promise<string> {
    return this.activeDriver.temporaryUrl(location, expiresIn);
  }

  // ============================================================
  // Metadata Operations
  // ============================================================

  /**
   * Get file metadata without downloading the file
   *
   * Retrieves information about a file including size, last modified date,
   * and MIME type without downloading the file contents.
   *
   * @param location - File path
   * @returns File information object
   * @throws Error if file not found
   *
   * @example
   * ```typescript
   * const info = await storage.metadata("documents/report.pdf");
   * console.log(`Size: ${info.size} bytes`);
   * console.log(`Type: ${info.mimeType}`);
   * console.log(`Modified: ${info.lastModified}`);
   * ```
   */
  public async metadata(location: string): Promise<StorageFileInfo> {
    return this.activeDriver.metadata(location);
  }

  /**
   * Get file size in bytes
   *
   * Shortcut for `metadata(location).size`.
   *
   * @param location - File path
   * @returns File size in bytes
   * @throws Error if file not found
   */
  public async size(location: string): Promise<number> {
    return this.activeDriver.size(location);
  }

  /**
   * Get a StorageFile instance for OOP-style operations
   *
   * Creates a `StorageFile` wrapper for the specified path,
   * allowing fluent method chaining for file operations.
   *
   * @param location - File path
   * @returns StorageFile instance
   *
   * @example
   * ```typescript
   * const file = await storage.file("uploads/image.jpg");
   *
   * // Properties
   * console.log(file.name);       // "image.jpg"
   * console.log(file.extension);  // "jpg"
   *
   * // Operations
   * await file.copy("backup/image.jpg");
   * await file.delete();
   * ```
   */
  public file(location: string): StorageFile {
    return new StorageFile(location, this.activeDriver);
  }

  // ============================================================
  // Utilities
  // ============================================================

  /**
   * Convert various input types to Buffer
   *
   * @param file - Input file in various formats
   * @returns Buffer containing file contents
   * @internal
   */
  protected async toBuffer(file: UploadedFile | Buffer | string | Readable): Promise<Buffer> {
    // Already a buffer
    if (Buffer.isBuffer(file)) {
      return file;
    }

    // Readable stream - collect into buffer
    if (this.isReadable(file)) {
      return this.streamToBuffer(file as Readable);
    }

    // String content
    if (typeof file === "string") {
      if (await fileExistsAsync(file)) {
        return fs.readFile(file);
      }

      return Buffer.from(file);
    }

    // UploadedFile
    return (file as UploadedFile).buffer();
  }

  /**
   * Check if value is a Readable stream
   *
   * @param value - Value to check
   * @returns True if value is a Readable stream
   * @internal
   */
  protected isReadable(value: unknown): value is Readable {
    return (
      typeof value === "object" &&
      value !== null &&
      "pipe" in value &&
      typeof (value as Readable).pipe === "function"
    );
  }

  /**
   * Convert a Readable stream to Buffer
   *
   * @param stream - Readable stream
   * @returns Buffer containing stream contents
   * @internal
   */
  protected async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks as unknown as Uint8Array[]);
  }

  /**
   * Prepend a prefix to a location path
   *
   * Useful for organizing files into directories.
   *
   * @param prefix - Prefix to add (e.g., "uploads")
   * @param location - Original location path
   * @returns Combined path with prefix
   *
   * @example
   * ```typescript
   * storage.prepend("uploads", "image.jpg"); // "uploads/image.jpg"
   * storage.prepend("uploads/", "/image.jpg"); // "uploads/image.jpg"
   * ```
   */
  public prepend(prefix: string, location: string): string {
    return `${prefix.replace(/\/$/, "")}/${location.replace(/^\//, "")}`;
  }

  /**
   * Append a suffix to a location path (before extension)
   *
   * Useful for creating variants of files (thumbnails, etc.).
   *
   * @param location - Original location path
   * @param suffix - Suffix to add before extension
   * @returns Path with suffix added before extension
   *
   * @example
   * ```typescript
   * storage.append("image.jpg", "_thumb"); // "image_thumb.jpg"
   * storage.append("document.pdf", "_v2"); // "document_v2.pdf"
   * ```
   */
  public append(location: string, suffix: string): string {
    const lastDot = location.lastIndexOf(".");
    if (lastDot === -1) {
      return `${location}${suffix}`;
    }
    return `${location.substring(0, lastDot)}${suffix}${location.substring(lastDot)}`;
  }
}
