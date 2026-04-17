import {
  ensureDirectoryAsync,
  getJsonFileAsync,
  putJsonFileAsync,
  removeDirectoryAsync,
} from "@mongez/fs";
import path from "path";
import type { CacheDriver, CacheKey, FileCacheOptions } from "../types";
import { CacheConfigurationError } from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

export class FileCacheDriver
  extends BaseCacheDriver<FileCacheDriver, FileCacheOptions>
  implements CacheDriver<FileCacheDriver, FileCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "file";

  /**
   * {@inheritdoc}
   */
  public setOptions(options: FileCacheOptions) {
    if (!options.directory) {
      throw new CacheConfigurationError(
        "File driver requires 'directory' option to be configured.",
      );
    }

    return super.setOptions(options);
  }

  /**
   * Get the cache directory
   */
  public get directory() {
    const directory = this.options.directory;

    if (typeof directory === "function") {
      return directory();
    }

    throw new CacheConfigurationError(
      "Cache directory is not defined, please define it in the file driver options",
    );
  }

  /**
   * Get file name
   */
  public get fileName() {
    const fileName = this.options.fileName;

    if (typeof fileName === "function") {
      return fileName();
    }

    return "cache.json";
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    this.log("clearing", namespace);

    try {
      await removeDirectoryAsync(path.resolve(this.directory, namespace));

      this.log("cleared", namespace);
    } catch (error) {
      //
    }

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: CacheKey, value: any, ttl?: number) {
    key = this.parseKey(key);

    this.log("caching", key);

    const data = this.prepareDataForStorage(value, ttl);

    const fileDirectory = path.resolve(this.directory, key);

    await ensureDirectoryAsync(fileDirectory);

    await putJsonFileAsync(path.resolve(fileDirectory, this.fileName), data);

    this.log("cached", key);

    // Emit set event
    await this.emit("set", { key, value, ttl });

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: CacheKey) {
    const parsedKey = this.parseKey(key);

    this.log("fetching", parsedKey);

    const fileDirectory = path.resolve(this.directory, parsedKey);

    try {
      const value = await getJsonFileAsync(
        path.resolve(fileDirectory, this.fileName),
      );

      const result = await this.parseCachedData(parsedKey, value);

      if (result === null) {
        // Expired
        await this.emit("miss", { key: parsedKey });
      } else {
        // Emit hit event
        await this.emit("hit", { key: parsedKey, value: result });
      }

      return result;
    } catch (error) {
      this.log("notFound", parsedKey);
      // Emit miss event
      await this.emit("miss", { key: parsedKey });
      this.remove(key);
      return null;
    }
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: CacheKey) {
    const parsedKey = this.parseKey(key);
    this.log("removing", parsedKey);

    const fileDirectory = path.resolve(this.directory, parsedKey);

    try {
      await removeDirectoryAsync(fileDirectory);

      this.log("removed", parsedKey);
      // Emit removed event
      await this.emit("removed", { key: parsedKey });
    } catch (error) {
      //
    }
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.log("flushing");

    if (this.options.globalPrefix) {
      await this.removeNamespace("");
    } else {
      await removeDirectoryAsync(this.directory);
    }

    this.log("flushed");

    // Emit flushed event
    await this.emit("flushed");
  }

  /**
   * {@inheritdoc}
   */
  public async connect() {
    this.log("connecting");
    await ensureDirectoryAsync(this.directory);
    this.log("connected");
    await this.emit("connected");
  }
}
