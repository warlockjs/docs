import { ensureDirectoryAsync, fileExistsAsync } from "@mongez/fs";
import path from "node:path";
import { appPath } from "../../../../utils";

/**
 * Resolve module path
 * Returns absolute path to module directory
 */
export function resolveModulePath(module: string): string {
  return appPath(module);
}

/**
 * Resolve component path within a module
 * @param module - Module name (e.g., "users")
 * @param type - Component type (e.g., "controllers", "services")
 * @param name - Component name (e.g., "create-user")
 * @param extension - File extension (default: ".ts")
 */
export function resolveComponentPath(
  module: string,
  type: string,
  name: string,
  extension = ".ts",
): string {
  return path.join(resolveModulePath(module), type, `${name}${extension}`);
}

/**
 * Check if module exists
 */
export async function moduleExists(module: string): Promise<boolean> {
  return (await fileExistsAsync(resolveModulePath(module))) as boolean;
}

/**
 * Check if file exists
 */
export async function componentExists(
  module: string,
  type: string,
  name: string,
  extension = ".ts",
): Promise<boolean> {
  return (await fileExistsAsync(resolveComponentPath(module, type, name, extension))) as boolean;
}

/**
 * Ensure directory exists, create if missing
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await ensureDirectoryAsync(dirPath);
}

/**
 * Ensure component directory exists
 */
export async function ensureComponentDirectory(module: string, type: string): Promise<void> {
  const dirPath = path.join(resolveModulePath(module), type);
  await ensureDirectory(dirPath);
}
