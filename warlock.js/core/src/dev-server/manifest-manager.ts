import { fileExistsAsync, getJsonFileAsync, putFileAsync } from "@mongez/fs";
import { FileManager } from "./file-manager";
import type { FileManifest } from "./types";
import { MANIFEST_PATH } from "./flags";

/**
 * Manifest structure with metadata and files
 */
export type Manifest = {
  version: string;
  lastBuildTime: number;
  projectHash?: string;
  stats: {
    totalFiles: number;
    totalDependencies: number;
  };
  files: Record<string, FileManifest>;
};

export class ManifestManager {
  /**
   * Manifest data with metadata
   */
  private manifest: Manifest = {
    version: "1.0.0",
    lastBuildTime: Date.now(),
    stats: {
      totalFiles: 0,
      totalDependencies: 0,
    },
    files: {},
  };

  /**
   * Constructor
   */
  public constructor(private readonly files: Map<string, FileManager>) {}

  /**
   * Initialize manifest manager
   * @returns true if manifest exists, false otherwise
   */
  public async init(): Promise<boolean> {
    if (await fileExistsAsync(MANIFEST_PATH)) {
      this.manifest = await getJsonFileAsync(MANIFEST_PATH);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Save manifest to disk
   */
  public async save(): Promise<void> {
    // Update stats before saving
    this.manifest.stats.totalFiles = Object.keys(this.manifest.files).length;
    this.manifest.stats.totalDependencies = this.calculateTotalDependencies();
    this.manifest.lastBuildTime = Date.now();

    await putFileAsync(MANIFEST_PATH, JSON.stringify(this.manifest, null, 2));
  }

  /**
   * Get file manifest data
   */
  public getFile(filePath: string): FileManifest | undefined {
    return this.manifest.files[filePath];
  }

  /**
   * Check if file exists in manifest
   */
  public hasFile(filePath: string): boolean {
    return filePath in this.manifest.files;
  }

  /**
   * Set file manifest data
   */
  public setFile(filePath: string, fileManifest: FileManifest): void {
    this.manifest.files[filePath] = fileManifest;
  }

  /**
   * Remove file from manifest
   */
  public removeFile(filePath: string): void {
    delete this.manifest.files[filePath];
  }

  /**
   * Get all file paths in manifest
   */
  public getAllFilePaths(): string[] {
    return Object.keys(this.manifest.files);
  }

  /**
   * Get all file manifests
   */
  public getAllFiles(): Record<string, FileManifest> {
    return this.manifest.files;
  }

  /**
   * Get manifest metadata
   */
  public getMetadata() {
    return {
      version: this.manifest.version,
      lastBuildTime: this.manifest.lastBuildTime,
      projectHash: this.manifest.projectHash,
      stats: this.manifest.stats,
    };
  }

  /**
   * Calculate total dependencies across all files
   */
  private calculateTotalDependencies(): number {
    return Object.values(this.manifest.files).reduce(
      (total, file) => total + (file.dependencies?.length || 0),
      0,
    );
  }

  /**
   * Clear all files from manifest
   */
  public clear(): void {
    this.manifest.files = {};
    this.manifest.stats = {
      totalFiles: 0,
      totalDependencies: 0,
    };
  }
}
