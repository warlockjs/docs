import { listFiles, unlinkAsync } from "@mongez/fs";
import { warlockPath } from "./paths";

/**
 * Clean up temporary files older than the specified age
 */
export async function cleanupTempFiles(maxAgeMinutes = 30) {
  const files = listFiles(warlockPath());
  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;

  const tempFiles = files.filter(file => file.endsWith(".tmp.js"));

  for (const file of tempFiles) {
    try {
      const filePath = warlockPath(file);
      const stats = await import("fs/promises").then(fs => fs.stat(filePath));

      if (now - stats.mtimeMs > maxAgeMs) {
        unlinkAsync(filePath);
      }
    } catch {
      // Ignore errors for individual files
    }
  }
}
