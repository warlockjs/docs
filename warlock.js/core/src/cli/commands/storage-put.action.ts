import fs from "fs/promises";
import path from "path";
import { config } from "../../config";
import { storage } from "../../storage";
import type { CommandActionData } from "../types";

/**
 * Action for `warlock storage.put <localPath> [destination] [--driver <name>] [--concurrency <n>]`
 *
 * Uploads a local file or directory into any configured storage driver.
 * Auto-detects whether <localPath> is a file or directory and calls the
 * appropriate storage method.
 *
 * @example
 * # Upload entire uploads directory to R2 (root of bucket)
 * warlock storage.put ./uploads --driver r2
 *
 * @example
 * # Upload to a specific destination prefix
 * warlock storage.put ./uploads backups/2026 --driver r2
 *
 * @example
 * # Single file upload with custom concurrency
 * warlock storage.put ./public/logo.png assets/logo.png --driver s3
 */
export async function storagePutAction({ args, options }: CommandActionData): Promise<void> {
  const [localPath, destination = ""] = args;

  if (!localPath) {
    console.error("✖  Missing required argument: <localPath>");
    console.error("   Usage: warlock storage.put <localPath> [destination] [--driver <name>]");
    process.exit(1);
  }

  // Resolve to absolute path relative to CWD
  const absolutePath = path.resolve(process.cwd(), localPath);
  const driverName = options.driver as string | undefined;
  const concurrency = options.concurrency ? Number(options.concurrency) : 5;

  // Verify the local path exists
  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    console.error(`✖  Path not found: ${absolutePath}`);
    process.exit(1);
  }

  // Select the driver — use named driver or fall back to default
  const store = driverName ? storage.use(driverName) : storage;
  const driverLabel = driverName ?? config.get("storage.default");

  console.log(`\n  Driver    : ${driverLabel}`);
  console.log(`  Source    : ${absolutePath}`);
  console.log(`  Dest      : ${destination || "(root)"}\n`);

  if (stat.isDirectory()) {
    // ── Directory upload ────────────────────────────────────────────────────
    const result = await store.putDirectory(absolutePath, destination, {
      concurrency,
      // Skip hidden files (e.g. .DS_Store) by default
      filter: (_, rel) => !path.basename(rel).startsWith("."),
      onProgress: (done, total, file) => {
        process.stdout.write(`\r  Progress  : ${done}/${total}  ${file.path}`);
      },
    });

    // Clear the progress line and print summary
    process.stdout.write("\n");
    console.log(`\n  ✔  ${result.uploaded.length} file(s) uploaded`);

    if (result.failed.length > 0) {
      console.warn(`\n  ⚠  ${result.failed.length} file(s) failed:`);
      for (const { localPath: fp, error } of result.failed) {
        console.warn(`     - ${fp}: ${error.message}`);
      }
    }
  } else {
    // ── Single file upload ──────────────────────────────────────────────────
    // Destination is used as the storage path; if empty, fall back to filename
    const storagePath = destination || path.basename(absolutePath);

    console.log(`  Uploading : ${path.basename(absolutePath)} → ${storagePath}`);

    const file = await store.put(absolutePath, storagePath);

    console.log(`\n  ✔  Uploaded: ${file.url}`);
  }

  console.log();
}
