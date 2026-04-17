import { transform } from "esbuild";
import type { FileManager } from "./file-manager";
import { tsconfigManager } from "./tsconfig-manager";

/**
 * Using esbuild to transpile the given code
 * Uses external sourcemaps for better performance:
 * - Inline sourcemaps double file size and require base64 parsing on every import
 * - External sourcemaps keep files small and fast to parse
 * - Sourcemap files are written separately and only loaded when debugging
 */
export async function transpileFile(fileManager: FileManager) {
  return transpile(fileManager.source, fileManager.absolutePath);
}

function getFileLoader(filePath: string) {
  if (filePath.endsWith(".css")) return "css";
  if (filePath.endsWith(".tsx")) return "tsx";
  if (filePath.endsWith(".ts")) return "ts";
  return "file";
}

export async function transpile(sourceCode: string, filePath: string) {
  const { code: transpiled } = await transform(sourceCode, {
    loader: getFileLoader(filePath),
    format: "esm",
    sourcemap: "inline",
    target: "es2022",
    sourcefile: filePath,
    tsconfigRaw: tsconfigManager.tsconfig,
  });

  return transpiled;
}
