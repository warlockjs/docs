import type { MultipartFile } from "@fastify/multipart";
import { ensureDirectoryAsync } from "@mongez/fs";
import { Random } from "@mongez/reinforcements";
import crypto from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { Image } from "../image";
import { sanitizePath, uploadsPath } from "../utils/paths";

export class UploadedFile {
  /**
   * File buffered content
   */
  private bufferedFileContent?: Buffer;

  /**
   * Upload File Hash
   */
  public hash = "";

  /**
   * Save path for the file
   */
  protected savePath = "";

  /**
   * Determine if file is saved
   */
  protected isSaved = false;

  /**
   * Constructor
   */
  public constructor(private readonly fileData: MultipartFile) {
    //
  }

  /**
   * Get file name
   */
  public get name(): string {
    return sanitizePath(this.fileData.filename);
  }

  /**
   * Get file mime type
   */
  public get mimeType(): string {
    return this.fileData.mimetype;
  }

  /**
   * Get file extension
   */
  public get extension(): string {
    return path
      .extname(this.fileData.filename)
      .replace(".", "")
      .toLocaleLowerCase();
  }

  /**
   * Get file size in bytes
   */
  public async size(): Promise<number> {
    const file = await this.buffer();

    return file.length;
  }

  /**
   * Get file buffer
   */
  public async buffer(): Promise<Buffer> {
    if (this.bufferedFileContent) {
      return this.bufferedFileContent;
    }

    this.bufferedFileContent = await this.fileData.toBuffer();

    return this.bufferedFileContent;
  }

  /**
   * Check if file is an image
   */
  public get isImage(): boolean {
    return Boolean(this.mimeType.startsWith("image"));
  }

  /**
   * Get file width and height
   */
  public async dimensions(): Promise<{ width?: number; height?: number }> {
    return new Image(
      this.isSaved ? this.savePath : await this.buffer(),
    ).dimensions();
  }

  /**
   * Save file to the given path
   */
  public async saveTo(path: string) {
    return this.saveAs(path, this.name);
  }

  /**
   * Save the file to the given path with the given name
   *
   * Returns the relative file path
   */
  public async saveAs(path: string, name: string): Promise<string> {
    const relativeFilePath = await this.getSavePath(path, name);

    const fileContent = await this.buffer();

    try {
      await writeFile(this.savePath, fileContent);
    } catch (error: any) {
      throw new Error(`Failed to save file: ${error.message}`);
    }

    this.hash = crypto
      .createHash("sha256")
      .update(fileContent.toString())
      .digest("hex");

    this.isSaved = true;

    return relativeFilePath;
  }

  /**
   * Save the file to the given path with random generated name
   */
  public async save(path: string): Promise<string> {
    const name = Random.string(64) + "." + this.extension;

    return this.saveAs(path, name);
  }

  /**
   * Get save path for the given path and file name
   */
  public async getSavePath(
    filePath: string,
    fileName: string,
  ): Promise<string> {
    const uploadPath = uploadsPath(filePath);

    await ensureDirectoryAsync(uploadPath);

    const relativeFilePath = filePath + "/" + fileName;

    this.savePath = uploadsPath(relativeFilePath);

    return relativeFilePath;
  }

  /**
   * When called toJSON, convert it into base64
   */
  public async toJSON() {
    // convert it into base64
    return {
      name: this.name,
      mimeType: this.mimeType,
      extension: this.extension,
      size: await this.size(),
      isImage: this.isImage,
      dimensions: this.isImage ? await this.dimensions() : undefined,
      base64: (await this.buffer()).toString("base64"),
    };
  }
}
