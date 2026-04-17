import { createDirectoryAsync, removeDirectoryAsync } from "@mongez/fs";
import glob from "fast-glob";
import { srcPath, warlockPath } from "../utils";
import { Path } from "./path";

export async function createFreshWarlockDirectory() {
  const cacheDirectory = warlockPath("cache");
  try {
    await removeDirectoryAsync(cacheDirectory);
  } catch {
    // ignore
  }

  await createDirectoryAsync(cacheDirectory, { recursive: true });
}

/**
 * Get files from directory
 * @param directoryPath
 * @param pattern
 * @returns array of files full paths
 */
export async function getFilesFromDirectory(directoryPath = srcPath(), pattern = "**/*.{ts,tsx}") {
  const files = await glob(`${Path.normalize(directoryPath)}/${pattern}`, {
    absolute: true, // Return absolute paths
  });

  return files.map((file) => Path.normalize(file));
}

export async function getCertainFilesFromDirectory(directoryPath: string, filesNames: string[]) {
  let pattern = filesNames.length === 1 ? filesNames : `(${filesNames.join("|")})`;
  return getFilesFromDirectory(directoryPath, pattern + ".{ts,tsx}");
}

export function warlockCachePath(relativePath: string) {
  return `${warlockPath("cache")}/${relativePath}`;
}

/**
 * Compare two sets for equality
 */
export function areSetsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}
