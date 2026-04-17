import { env } from "@mongez/dotenv";
import { fileURLToPath } from "url";
import { Worker, type WorkerOptions } from "worker_threads";

/**
 * Options for creating a health check worker
 */
export type CreateWorkerOptions = WorkerOptions & {
  /**
   * Worker data to pass to the worker thread
   */
  workerData?: Record<string, unknown>;
};

/**
 * Create a worker that works in both dev (TypeScript) and production (JavaScript) environments.
 *
 * In development mode (DEV_SERVER_CORE env set), workers are loaded with tsx
 * to support TypeScript execution. In production, compiled .js files are used.
 *
 * @param workerPath - Relative path to worker file WITHOUT extension (e.g., "./workers/ts-health.worker")
 * @param baseUrl - The import.meta.url of the calling module (used to resolve relative paths)
 * @param options - Additional worker options
 * @returns A new Worker instance
 *
 * @example
 * ```typescript
 * // In FilesHealthcareManager
 * const worker = createWorker(
 *   "./workers/ts-health.worker",
 *   import.meta.url,
 *   { workerData: { cwd: process.cwd() } }
 * );
 * ```
 */
export function createWorker(
  workerPath: string,
  baseUrl: string,
  options?: CreateWorkerOptions,
): Worker {
  const isDevServerCore = env("DEV_SERVER_CORE");

  // In dev: .ts file with tsx loader
  // In prod: .js file (compiled)
  const extension = isDevServerCore ? ".ts" : ".js";
  const workerUrl = new URL(`${workerPath}${extension}`, baseUrl);
  const workerFilePath = fileURLToPath(workerUrl);

  const workerOptions: WorkerOptions = {
    ...options,
  };

  // Add tsx loader for TypeScript in dev environment
  if (isDevServerCore) {
    workerOptions.execArgv = [...(options?.execArgv || []), "--import", "tsx/esm"];
  }

  return new Worker(workerFilePath, workerOptions);
}
