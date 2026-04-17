import { warlockPath } from "../utils";

export const MANIFEST_PATH = warlockPath("manifest.json");

/**
 * Number of files to process in parallel per batch
 * Adjust this value to optimize performance vs memory usage
 * - Lower values (10-20): More stable, less memory, slower
 * - Higher values (100-200): Faster, more memory, potential instability
 * - Recommended: 50 for most projects
 */
export const FILE_PROCESSING_BATCH_SIZE = 500;
