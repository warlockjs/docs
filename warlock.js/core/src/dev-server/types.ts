export type LayerType = "FSR" | "HMR";
export type FileType =
  | "main"
  | "config"
  | "event"
  | "route"
  | "controller"
  | "service"
  | "model"
  | "other";

export type FileManifest = {
  absolutePath: string;
  relativePath: string;
  lastModified: number;
  hash: string;
  dependencies: string[];
  dependents: string[];
  version: number;
  type: FileType;
  layer: LayerType;
  cachePath: string;
};

/**
 * File processing state in the unified pipeline
 *
 * Lifecycle: idle → loading → parsed → transpiled → ready
 *
 * - `idle`: Initial state, no processing started
 * - `loading`: Reading source from disk
 * - `parsed`: Source loaded and imports discovered
 * - `transpiled`: TypeScript compiled to JavaScript
 * - `ready`: Fully processed and available for use
 * - `updating`: Being reprocessed after a change
 * - `deleted`: File has been removed from disk
 * - `error`: Processing failed
 */
export type FileState =
  | "idle"
  | "loading"
  | "parsed"
  | "transpiled"
  | "ready"
  | "error"
  | "updating"
  | "deleted";
