import type { FileSizeOption, JsonSchemaResult, JsonSchemaTarget } from "@warlock.js/seal";
import {
  BaseValidator,
  maxFileSizeRule,
  maxHeightRule,
  maxWidthRule,
  minFileSizeRule,
  minHeightRule,
  minWidthRule,
  resolveFileSize,
  v,
} from "@warlock.js/seal";
import { UploadedFile } from "../../http";
import { fileExtensionRule, fileRule, fileTypeRule, imageRule } from "../file";

export const uploadedFileMetadataSchema = v.object({
  location: v.string().oneOf(["local", "cloud"]),
  width: v.int().positive(),
  height: v.int().positive(),
  size: v.int().positive(),
  mimeType: v.string(),
  extension: v.string(),
  name: v.string(),
});

/**
 * File validator class
 */
export class FileValidator extends BaseValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableRule(fileRule, errorMessage);
  }

  /**
   * Check if value is a File type
   */
  public matchesType(value: any): boolean {
    return value instanceof UploadedFile;
  }

  /** Value must be an image */
  public image(errorMessage?: string): FileValidator {
    return this.addRule(imageRule, errorMessage);
  }

  /** Accept specific file extensions */
  public accept(extensions: string | string[], errorMessage?: string): FileValidator {
    return this.addRule(fileExtensionRule, errorMessage, {
      extensions,
    });
  }

  /** Allow specific MIME types */
  public mimeType(mimeTypes: string | string[], errorMessage?: string): FileValidator {
    return this.addRule(fileTypeRule, errorMessage, {
      mimeTypes,
    });
  }

  /** Allow only pdf files */
  public pdf(errorMessage?: string): FileValidator {
    return this.mimeType("application/pdf", errorMessage);
  }

  /** Allow only excel files */
  public excel(errorMessage?: string): FileValidator {
    return this.mimeType(
      [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      errorMessage,
    );
  }

  /** Allow only word files */
  public word(errorMessage?: string): FileValidator {
    return this.mimeType(
      [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      errorMessage,
    );
  }

  /** Minimum file size */
  public minSize(size: number | FileSizeOption, errorMessage?: string): FileValidator {
    return this.addRule(minFileSizeRule, errorMessage, {
      minSize: resolveFileSize(size),
    });
  }

  /** @alias minSize */
  public min(size: number | FileSizeOption, errorMessage?: string): FileValidator {
    return this.minSize(size, errorMessage);
  }

  /** Maximum file size */
  public maxSize(size: number | FileSizeOption, errorMessage?: string): FileValidator {
    return this.addRule(maxFileSizeRule, errorMessage, {
      maxSize: resolveFileSize(size),
    });
  }

  /** @alias maxSize */
  public max(size: number, errorMessage?: string): FileValidator {
    return this.maxSize(size, errorMessage);
  }

  /** Minimum image width */
  public minWidth(width: number, errorMessage?: string): FileValidator {
    return this.addRule(minWidthRule, errorMessage, {
      minWidth: width,
    });
  }

  /** Maximum image width */
  public maxWidth(width: number, errorMessage?: string): FileValidator {
    return this.addRule(maxWidthRule, errorMessage, {
      maxWidth: width,
    });
  }

  /** Minimum image height */
  public minHeight(height: number, errorMessage?: string): FileValidator {
    return this.addRule(minHeightRule, errorMessage, {
      minHeight: height,
    });
  }

  /** Maximum image height */
  public maxHeight(height: number, errorMessage?: string): FileValidator {
    return this.addRule(maxHeightRule, errorMessage, {
      maxHeight: height,
    });
  }

  /**
   * Save the file and return it as a string
   */
  public saveTo(relativeDirectory: string): FileValidator {
    return this.addTransformer(async (file: UploadedFile) => {
      const output = await file.save(relativeDirectory);

      return output.path;
    });
  }

  /**
   * @inheritdoc
   *
   * File uploads are not natively representable in JSON Schema.
   * The output varies by target:
   * - `openapi-3.0`   → `{ type: "string", format: "binary" }` (standard for multipart/form-data uploads)
   * - `draft-2020-12` → `{ type: "string", contentEncoding: "binary" }`
   * - `draft-07`      → `{}` (no standard binary representation — permissive fallback)
   *
   * @example
   * ```ts
   * v.file().toJsonSchema("openapi-3.0")
   * // → { type: "string", format: "binary" }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    if (target === "openapi-3.0") {
      return { type: "string", format: "binary" };
    }

    if (target === "draft-2020-12") {
      return { type: "string", contentEncoding: "binary" };
    }

    // draft-07: no standard binary representation
    return {};
  }
}
