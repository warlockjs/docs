import { basename, dirname, extname } from "path";
import type { Readable } from "stream";
import type {
  CloudStorageDriverContract,
  CloudStorageFileData,
  FileVisibility,
  StorageDriverContract,
  StorageFileData,
  StorageFileInfo,
} from "./types";

/**
 * StorageFile class - OOP wrapper for storage file operations
 *
 * Provides a fluent interface for working with files in storage,
 * wrapping the underlying driver operations.
 *
 * @example
 * ```typescript
 * const file = await storage.put(buffer, "uploads/image.jpg");
 *
 * // Properties (sync, from cached data)
 * file.name        // "image.jpg"
 * file.extension   // "jpg"
 * file.path        // "uploads/image.jpg"
 * file.hash        // "sha256:abc123..."
 *
 * // Operations
 * await file.copy("uploads/backup.jpg")
 * await file.move("archive/image.jpg")
 * await file.delete()
 *
 * // Content
 * const buffer = await file.contents();
 * const stream = await file.stream();
 * ```
 */
export class StorageFile {
  /**
   * Relative file path
   */
  protected _path: string;

  /**
   * The driver instance
   */
  protected _driver: StorageDriverContract;

  /**
   * Cached file data (from put operations or lazy loaded)
   */
  protected _data?: StorageFileData;

  /**
   * Whether the file has been deleted
   */
  protected _deleted = false;

  /**
   * Create a new StorageFile instance
   *
   * @param path - Relative file path
   * @param driver - Driver instance
   * @param data - Optional initial data from put/copy operations
   */
  public constructor(path: string, driver: StorageDriverContract, data?: StorageFileData) {
    this._path = path;
    this._driver = driver;
    this._data = data;
  }

  // ============================================================
  // Properties
  // ============================================================

  /**
   * Get the relative file path
   */
  public get path(): string {
    return this._path;
  }

  /**
   * Get the file name (with extension)
   */
  public get name(): string {
    return basename(this._path);
  }

  /**
   * Get the file extension (without dot)
   */
  public get extension(): string {
    return extname(this._path).slice(1).toLowerCase();
  }

  /**
   * Get the directory path
   */
  public get directory(): string {
    return dirname(this._path);
  }

  /**
   * Get the driver name
   */
  public get driver(): string {
    return this._driver.name;
  }

  /**
   * Check if file has been deleted
   */
  public get isDeleted(): boolean {
    return this._deleted;
  }

  /**
   * Get public URL (sync if data cached, otherwise computed)
   */
  public get url(): string {
    this.ensureNotDeleted();
    return this._data?.url || this._driver.url(this._path);
  }

  /**
   * Get the absolute filesystem path (local driver only)
   */
  public get absolutePath(): string | undefined {
    this.ensureNotDeleted();
    if ("path" in this._driver && typeof this._driver.path === "function") {
      return this._driver.path(this._path);
    }

    return undefined;
  }

  /**
   * Get file hash (SHA-256, available from put operations)
   */
  public get hash(): string | undefined {
    return this._data?.hash;
  }

  // ============================================================
  // Data Methods (Lazy Loaded)
  // ============================================================

  /**
   * Get cached file data, or fetch it if not available
   */
  public async data(): Promise<StorageFileData> {
    this.ensureNotDeleted();
    if (!this._data) {
      // Fetch info and construct data
      const info = await this.metadata();
      this._data = {
        path: info.path,
        url: this._driver.url(this._path),
        size: info.size,
        hash: "", // Not available from metadata
        mimeType: info.mimeType || "application/octet-stream",
        driver: this._driver.name,
      };
    }
    return this._data;
  }

  /**
   * Get file size in bytes
   */
  public async size(): Promise<number> {
    const data = await this.data();
    return data.size;
  }

  /**
   * Get MIME type
   */
  public async mimeType(): Promise<string> {
    const data = await this.data();
    return data.mimeType;
  }

  /**
   * Get last modified date (fetches from driver)
   */
  public async lastModified(): Promise<Date | undefined> {
    this.ensureNotDeleted();
    const info = await this.metadata();
    return info.lastModified;
  }

  /**
   * Get ETag (cloud drivers, fetches from driver)
   */
  public async etag(): Promise<string | undefined> {
    this.ensureNotDeleted();
    const info = await this.metadata();
    return info.etag;
  }

  // ============================================================
  // Content Methods
  // ============================================================

  /**
   * Get file contents as Buffer
   */
  public async contents(): Promise<Buffer> {
    this.ensureNotDeleted();
    return this._driver.get(this._path);
  }

  /**
   * Get file contents as readable stream
   */
  public async stream(): Promise<Readable> {
    this.ensureNotDeleted();
    return this._driver.getStream(this._path);
  }

  /**
   * Get file contents as UTF-8 text
   */
  public async text(): Promise<string> {
    const buffer = await this.contents();
    return buffer.toString("utf-8");
  }

  /**
   * Get file contents as base64 string
   */
  public async base64(): Promise<string> {
    const buffer = await this.contents();
    return buffer.toString("base64");
  }

  /**
   * Get file contents as data URL
   */
  public async dataUrl(): Promise<string> {
    const [buffer, data] = await Promise.all([this.contents(), this.data()]);
    return `data:${data.mimeType};base64,${buffer.toString("base64")}`;
  }

  // ============================================================
  // URL Methods
  // ============================================================

  /**
   * Get a temporary signed URL
   *
   * @param expiresIn - Seconds until expiration (default: 3600)
   */
  public async temporaryUrl(expiresIn = 3600): Promise<string> {
    this.ensureNotDeleted();
    return this._driver.temporaryUrl(this._path, expiresIn);
  }

  // ============================================================
  // File Operations
  // ============================================================

  /**
   * Check if the file exists
   */
  public async exists(): Promise<boolean> {
    if (this._deleted) return false;
    return this._driver.exists(this._path);
  }

  /**
   * Copy the file to a new location
   *
   * @param destination - Destination path
   * @returns New StorageFile instance at destination
   */
  public async copy(destination: string): Promise<StorageFile> {
    this.ensureNotDeleted();
    const result = await this._driver.copy(this._path, destination);
    return new StorageFile(destination, this._driver, result);
  }

  /**
   * Move the file to a new location
   *
   * @param destination - Destination path
   * @returns This StorageFile instance with updated path
   */
  public async move(destination: string): Promise<this> {
    this.ensureNotDeleted();
    const result = await this._driver.move(this._path, destination);
    this._path = destination;
    this._data = result; // Update cached data
    return this;
  }

  /**
   * Rename the file (move within same directory)
   *
   * @param newName - New file name
   * @returns This StorageFile instance with updated path
   */
  public async rename(newName: string): Promise<this> {
    const newPath = this.directory === "." ? newName : `${this.directory}/${newName}`;
    return this.move(newPath);
  }

  /**
   * Delete the file
   *
   * @returns true if deleted, false if not found
   */
  public async delete(): Promise<boolean> {
    this.ensureNotDeleted();
    const result = await this._driver.delete(this._path);
    this._deleted = true;
    return result;
  }

  // ============================================================
  // Cloud-Specific Methods
  // ============================================================

  /**
   * Set file visibility (cloud drivers only)
   *
   * @param visibility - "public" or "private"
   * @throws Error if driver doesn't support visibility
   */
  public async setVisibility(visibility: FileVisibility): Promise<this> {
    this.ensureNotDeleted();

    if (!("setVisibility" in this._driver)) {
      throw new Error("setVisibility is only available for cloud storage drivers");
    }

    await (this._driver as CloudStorageDriverContract).setVisibility(this._path, visibility);
    return this;
  }

  /**
   * Get file visibility (cloud drivers only)
   *
   * @throws Error if driver doesn't support visibility
   */
  public async getVisibility(): Promise<FileVisibility> {
    this.ensureNotDeleted();

    if (!("getVisibility" in this._driver)) {
      throw new Error("getVisibility is only available for cloud storage drivers");
    }

    return (this._driver as CloudStorageDriverContract).getVisibility(this._path);
  }

  /**
   * Set storage class (cloud drivers only)
   *
   * @param storageClass - Storage class (e.g., "STANDARD", "GLACIER")
   * @throws Error if driver doesn't support storage class
   */
  public async setStorageClass(storageClass: string): Promise<this> {
    this.ensureNotDeleted();

    if (!("setStorageClass" in this._driver)) {
      throw new Error("setStorageClass is only available for cloud storage drivers");
    }

    await (this._driver as CloudStorageDriverContract).setStorageClass(this._path, storageClass);
    return this;
  }

  // ============================================================
  // Utilities
  // ============================================================

  /**
   * Ensure the file has not been deleted
   */
  protected ensureNotDeleted(): void {
    if (this._deleted) {
      throw new Error(`File "${this._path}" has been deleted`);
    }
  }

  /**
   * Create a StorageFile instance from StorageFileData
   *
   * @param data - Storage file data from put/copy/move operations
   * @param driver - Driver instance
   */
  public static fromData(
    data: StorageFileData | CloudStorageFileData,
    driver: StorageDriverContract,
  ): StorageFile {
    return new StorageFile(data.path, driver, data);
  }

  /**
   * Get file metadata
   */
  public async metadata(): Promise<StorageFileInfo> {
    this.ensureNotDeleted();
    return this._driver.metadata(this._path);
  }

  /**
   * Determine if this file is an image type
   */
  public async isImage() {
    const metadata = await this.metadata();
    return metadata.mimeType!.startsWith("image/");
  }

  /**
   * Determine if this file is a document type
   */
  public async isDocument() {
    const metadata = await this.metadata();
    return metadata.mimeType!.startsWith("application/");
  }

  /**
   * Determine if this file is a pdf type
   */
  public async isPdf() {
    const metadata = await this.metadata();
    return metadata.mimeType!.startsWith("application/pdf");
  }

  /**
   * Determine if this file is an excel file (any support excel file)
   */
  public async isExcel() {
    const metadata = await this.metadata();
    return (
      metadata.mimeType!.startsWith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ) || metadata.mimeType!.startsWith("application/vnd.ms-excel")
    );
  }

  /**
   * Determine if this file is a doc file
   */
  public async isDoc() {
    const metadata = await this.metadata();
    return (
      metadata.mimeType!.startsWith("application/msword") ||
      metadata.mimeType!.startsWith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )
    );
  }

  /**
   * Determine if this file is an audio type
   */
  public async isAudio() {
    const metadata = await this.metadata();
    return metadata.mimeType!.startsWith("audio/");
  }

  /**
   * Determine if this file is a video type
   */
  public async isVideo() {
    const metadata = await this.metadata();
    return metadata.mimeType!.startsWith("video/");
  }

  /**
   * Convert to plain object (returns cached data or constructs it)
   */
  public toJSON(): {
    path: string;
    name: string;
    extension: string;
    driver: string;
    url: string;
    hash?: string;
    size?: number;
    mimeType?: string;
  } {
    return {
      path: this._path,
      name: this.name,
      extension: this.extension,
      driver: this._driver.name,
      url: this._deleted ? "" : this.url,
      hash: this._data?.hash,
      size: this._data?.size,
      mimeType: this._data?.mimeType,
    };
  }

  /**
   * String representation
   */
  public toString(): string {
    return this._path;
  }
}
