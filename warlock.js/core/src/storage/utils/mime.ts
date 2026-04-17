/**
 * MIME type utilities
 *
 * This module wraps the mime package to avoid type conflicts
 * with @types/send which has its own @types/mime dependency.
 */
import mime from "mime";

/**
 * Get MIME type from file path or extension
 *
 * @param path - File path or extension
 * @returns MIME type or "application/octet-stream" if unknown
 */
export function getMimeType(path: string): string {
  return mime.getType(path) || "application/octet-stream";
}

/**
 * Common MIME type constants
 */
export const MimeTypes = {
  // Images
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",

  // Documents
  pdf: "application/pdf",
  txt: "text/plain",
  html: "text/html",
  css: "text/css",
  js: "application/javascript",
  json: "application/json",
  xml: "application/xml",

  // Archives
  zip: "application/zip",
  gzip: "application/gzip",

  // Media
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "audio/ogg",

  // Binary
  binary: "application/octet-stream",
} as const;
