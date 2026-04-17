import type { FileSizeOption } from "../types/file.types";

export function resolveFileSize(size: number | FileSizeOption): number {
  if (typeof size === "number") {
    return size;
  }

  switch (size.unit) {
    case "B":
      return size.size;
    case "KB":
      return size.size * 1024;
    case "MB":
      return size.size * 1024 * 1024;
    case "GB":
      return size.size * 1024 * 1024 * 1024;
  }
}

/**
 * Convert the given size to a human size
 * i.e 2MB, 0.5MB, 120KB, 1.5GB..etc
 */
export function humanizeSize(sizeInBits: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = sizeInBits;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Number.isInteger(size) ? size : size.toFixed(2)}${units[unitIndex]}`;
}
