import config from "@mongez/config";
import { sha1 } from "@mongez/encryption";
import { fileExistsAsync } from "@mongez/fs";
import systemPath from "path";
import type { Request, Response } from "../../../http";
import type { ImageFormat } from "../../../image";
import { Image } from "../../../image";
import { cachePath, uploadsPath } from "../../../utils";

// Maximum dimensions to prevent memory issues
const MAX_DIMENSIONS = {
  width: 4096,
  height: 4096,
};

// Cache time in seconds (default is 1 year)
const DEFAULT_CACHE_TIME = 31536000;

/**
 * Set cache headers for the response
 */
function setCacheHeaders(response: Response, cacheTime: number): void {
  response.header("Cache-Control", `public, max-age=${cacheTime}`);
  response.header(
    "Expires",
    new Date(Date.now() + cacheTime * 1000).toUTCString(),
  );
}

/**
 * Generate cache key for image options
 */
function generateCacheKey(
  path: string,
  imageOptions: any,
  format?: ImageFormat,
): string {
  return sha1(
    JSON.stringify({
      imageOptions,
      path,
      format,
    }),
  );
}

/**
 * Process image with the given options
 */
async function processImage(
  fullPath: string,
  cacheFullPath: string,
  imageOptions: any,
  format?: ImageFormat,
  quality?: number,
): Promise<boolean> {
  try {
    const image = new Image(fullPath);

    // Apply resize if dimensions are provided
    if (imageOptions.width || imageOptions.height) {
      image.resize(imageOptions);
    }

    // Apply format if specified
    if (format) {
      image.format(format);
    }

    // Apply quality if specified
    if (quality) {
      image.quality(quality);
    }

    await image.save(cacheFullPath);
    return true;
  } catch (error) {
    console.error("Error processing image:", error);
    return false;
  }
}

/**
 * Get uploaded file with optional image processing
 */
export async function getUploadedFile(request: Request, response: Response) {
  const path = request.input("*");
  const fullPath = uploadsPath(path);

  // Get image processing parameters
  const height = request.int("h");
  const width = request.int("w");
  const quality = request.int("q", 100);
  const format: ImageFormat | undefined = request.input("f");

  // Set cache headers
  const cacheTime = config.get("uploads.cacheTime", DEFAULT_CACHE_TIME);
  setCacheHeaders(response, cacheTime);

  // If no image processing is needed, return the original file
  // Fastify will handle 404 if file doesn't exist
  if (!height && !width && !quality && !format) {
    return response.sendFile(fullPath);
  }

  // Apply dimension limits
  const imageOptions = {
    height: height ? Math.min(height, MAX_DIMENSIONS.height) : undefined,
    width: width ? Math.min(width, MAX_DIMENSIONS.width) : undefined,
    quality,
  };

  // Generate cache key and path
  const fileCachePathKey = generateCacheKey(path, imageOptions, format);
  const cacheFullPath = cachePath(
    `images/${fileCachePathKey}${systemPath.extname(path)}`,
  );

  // Set content disposition for inline display
  response.header("Content-Disposition", "inline");

  // First check if cached file exists - this is faster than checking original file
  if (await fileExistsAsync(cacheFullPath)) {
    return response.sendFile(cacheFullPath);
  }

  // Process the image - Fastify will handle 404 if original file doesn't exist
  const success = await processImage(
    fullPath,
    cacheFullPath,
    imageOptions,
    format,
    quality,
  );

  // Return processed file if successful, otherwise return original
  if (success) {
    return response.sendFile(cacheFullPath);
  }

  return response.sendFile(fullPath);
}
