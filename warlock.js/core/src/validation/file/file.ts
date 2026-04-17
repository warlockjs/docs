import { invalidRule, VALID_RULE, type SchemaRule } from "@warlock.js/seal";
import { UploadedFile } from "../../http";

/**
 * File rule - validates uploaded file
 */
export const fileRule: SchemaRule = {
  name: "file",
  defaultErrorMessage: "The :input must be a file",
  async validate(value: any, context) {
    if (value instanceof UploadedFile) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Image rule - validates uploaded image
 */
export const imageRule: SchemaRule = {
  name: "image",
  defaultErrorMessage: "The :input must be an image",
  async validate(value: any, context) {
    if (value instanceof UploadedFile && value.isImage) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * File extension rule - validates file extension
 */
export const fileExtensionRule: SchemaRule<{
  extensions: string | string[];
}> = {
  name: "fileExtension",
  errorMessage: "The :input must have one of the following extensions: :extensions",
  async validate(value: any, context) {
    let extensions = this.context.options.extensions;

    if (typeof extensions === "string") {
      extensions = [extensions];
    }

    if (extensions.includes(value.extension)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * File type rule - validates MIME type
 */
export const fileTypeRule: SchemaRule<{ mimeTypes: string | string[] }> = {
  name: "fileType",
  defaultErrorMessage: "The :input must be a :types file",
  async validate(value: any, context) {
    let mimeTypes = this.context.options.mimeTypes;

    if (typeof mimeTypes === "string") {
      mimeTypes = [mimeTypes];
    }

    if (mimeTypes.includes(value.mimeType)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
