import path from "node:path";

export class Path {
  /**
   * Convert the given absolute path to a relative path
   */
  public static toRelative(absolutePath: string) {
    return this.normalize(path.relative(process.cwd(), absolutePath));
  }

  /**
   * Get relative path of the given path
   */
  public static relative(relativePath: string) {
    return this.normalize(path.relative(process.cwd(), relativePath));
  }

  /**
   * Get normalized absolute path of the given path
   */
  public static toNormalizedAbsolute(relativePath: string) {
    return this.normalize(path.resolve(process.cwd(), relativePath));
  }

  /**
   * Get absolute path of the given path
   */
  public static toAbsolute(relativePath: string) {
    return this.normalize(path.resolve(process.cwd(), relativePath));
  }

  /**
   * Normalize the given path (convert backslashes to forward slashes)
   */
  public static normalize(filePath: string) {
    return filePath.replace(/\\/g, "/");
  }

  /**
   * Join paths and normalize
   */
  public static join(...paths: string[]) {
    return this.normalize(path.join(...paths));
  }

  /**
   * Get directory name of a path
   */
  public static dirname(filePath: string) {
    return this.normalize(path.dirname(filePath));
  }

  /**
   * Get base name of a path
   */
  public static basename(filePath: string, ext?: string) {
    return path.basename(filePath, ext);
  }

  /**
   * Get extension of a path
   */
  public static extname(filePath: string) {
    return path.extname(filePath);
  }
}
